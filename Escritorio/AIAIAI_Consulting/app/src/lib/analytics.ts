import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { atomicWriteJson } from "./atomic-write";
import { TokenDataSchema, AnalyticsSchema } from "./schemas";
import type { Analytics, AnalyticsWindow, TokenEntry } from "./schemas";

const ROOT = resolve(__dirname, "..", "..", "..");
const TOKENS_FILE = join(ROOT, "data", "tokens.json");
const ANALYTICS_FILE = join(ROOT, "data", "analytics.json");

/**
 * Generates pre-computed analytics from token data across 7d, 30d, and 90d windows.
 * This eliminates client-side calculation - Phase 7 charts just render static data.
 */
export async function generateAnalytics(): Promise<void> {
  try {
    // Read and validate token data
    let tokenData;
    try {
      const raw = readFileSync(TOKENS_FILE, "utf-8");
      tokenData = TokenDataSchema.parse(JSON.parse(raw));
    } catch (error) {
      // If tokens.json doesn't exist or has no entries, write empty analytics
      console.warn("No token data available - writing empty analytics");
      const emptyAnalytics: Analytics = {
        generatedAt: new Date().toISOString(),
        windows: {
          "7d": createEmptyWindow(),
          "30d": createEmptyWindow(),
          "90d": createEmptyWindow(),
        },
      };
      AnalyticsSchema.parse(emptyAnalytics);
      atomicWriteJson(ANALYTICS_FILE, emptyAnalytics);
      console.log("Analytics pre-computed for 7d, 30d, 90d windows (empty)");
      return;
    }

    const now = new Date();
    const today = formatDate(now);

    // Generate analytics for each window
    const windows = {
      "7d": calculateWindow(tokenData.entries, today, 7),
      "30d": calculateWindow(tokenData.entries, today, 30),
      "90d": calculateWindow(tokenData.entries, today, 90),
    };

    const analytics: Analytics = {
      generatedAt: now.toISOString(),
      windows,
    };

    // Validate and write
    AnalyticsSchema.parse(analytics);
    atomicWriteJson(ANALYTICS_FILE, analytics);

    console.log("Analytics pre-computed for 7d, 30d, 90d windows");
  } catch (error) {
    console.error("Failed to generate analytics:", error);
    throw error;
  }
}

/**
 * Calculates analytics for a time window.
 * @param entries - All token entries
 * @param today - Current date as YYYY-MM-DD
 * @param days - Number of days to look back
 */
function calculateWindow(
  entries: TokenEntry[],
  today: string,
  days: number
): AnalyticsWindow {
  // Calculate cutoff date
  const cutoffDate = new Date(today);
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoff = formatDate(cutoffDate);

  // Filter entries within window
  const windowEntries = entries.filter((entry) => entry.date >= cutoff);

  if (windowEntries.length === 0) {
    return createEmptyWindow();
  }

  // Calculate totals
  let totalCost = 0;
  let tokensIn = 0;
  let tokensOut = 0;
  const byModel: Record<
    string,
    { cost: number; tokensIn: number; tokensOut: number }
  > = {};

  for (const entry of windowEntries) {
    totalCost += entry.cost;
    tokensIn += entry.tokensIn;
    tokensOut += entry.tokensOut;

    // Group by model
    if (!byModel[entry.model]) {
      byModel[entry.model] = { cost: 0, tokensIn: 0, tokensOut: 0 };
    }
    byModel[entry.model].cost += entry.cost;
    byModel[entry.model].tokensIn += entry.tokensIn;
    byModel[entry.model].tokensOut += entry.tokensOut;
  }

  // Calculate burn rate (daily average cost)
  const burnRate = totalCost / days;

  return {
    totalCost,
    tokensIn,
    tokensOut,
    byModel,
    burnRate,
  };
}

/**
 * Creates an empty analytics window (all zeros).
 */
function createEmptyWindow(): AnalyticsWindow {
  return {
    totalCost: 0,
    tokensIn: 0,
    tokensOut: 0,
    byModel: {},
    burnRate: 0,
  };
}

/**
 * Formats a Date as YYYY-MM-DD.
 */
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

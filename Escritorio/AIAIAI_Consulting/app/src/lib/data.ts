import fs from "fs";
import path from "path";
import { z } from "zod";
import {
  ProjectSchema,
  TokenDataSchema,
  QualityEntrySchema,
  BudgetConfigSchema,
  AnalyticsSchema,
} from "./schemas";
import type {
  Project,
  TokenData,
  TokenEntry,
  QualityEntry,
  BudgetConfig,
  Analytics,
} from "./schemas";
import { atomicWriteJson } from "./atomic-write";

// Re-export types for backward compatibility
export type { Project, TokenData, TokenEntry, QualityEntry, BudgetConfig, Analytics };

const dataDir = path.join(process.cwd(), "..", "data");

/**
 * Reads and validates JSON data using a Zod schema.
 * @param filename - The filename relative to the data directory
 * @param schema - The Zod schema to validate against
 * @returns The validated and typed data
 * @throws Error if file doesn't exist or validation fails
 */
function readValidatedJson<T>(filename: string, schema: z.ZodType<T>): T {
  const filePath = path.join(dataDir, filename);
  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(raw);
  return schema.parse(parsed);
}

/**
 * Gets all projects with runtime validation.
 */
export function getProjects(): Project[] {
  return readValidatedJson("projects.json", z.array(ProjectSchema));
}

/**
 * Gets a single project by ID.
 */
export function getProjectById(id: string): Project | undefined {
  return getProjects().find((p) => p.id === id);
}

/**
 * Writes projects to disk using atomic write pattern.
 * Validates data before writing.
 */
export function writeProjects(projects: Project[]): void {
  const validated = z.array(ProjectSchema).parse(projects);
  const filePath = path.join(dataDir, "projects.json");
  atomicWriteJson(filePath, validated);
}

/**
 * Gets token data with runtime validation.
 */
export function getTokenData(): TokenData {
  return readValidatedJson("tokens.json", TokenDataSchema);
}

/**
 * Writes token data to disk using atomic write pattern.
 * Validates data before writing.
 */
export function writeTokenData(data: TokenData): void {
  const validated = TokenDataSchema.parse(data);
  const filePath = path.join(dataDir, "tokens.json");
  atomicWriteJson(filePath, validated);
}

/**
 * Gets quality metrics with runtime validation.
 */
export function getQuality(): QualityEntry[] {
  return readValidatedJson("quality.json", z.array(QualityEntrySchema));
}

/**
 * Gets quality metrics for a specific project.
 */
export function getQualityByProject(project: string): QualityEntry[] {
  return getQuality().filter((q) => q.project === project);
}

/**
 * Gets budget configuration with runtime validation.
 */
export function getBudgetConfig(): BudgetConfig {
  return readValidatedJson("config/budget.json", BudgetConfigSchema);
}

/**
 * Gets analytics data with runtime validation.
 */
export function getAnalytics(): Analytics {
  return readValidatedJson("analytics.json", AnalyticsSchema);
}

/**
 * Gets daily spend data grouped by model for charting.
 * @param days - Number of days to include (7, 30, or 90)
 * @returns Array of daily data points with date and per-model costs
 */
export function getDailySpendByModel(
  days: 7 | 30 | 90
): Array<Record<string, string | number>> {
  const tokenData = getTokenData();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoff = cutoffDate.toISOString().split("T")[0];

  // Filter entries within the time window
  const entries = tokenData.entries.filter((e) => e.date >= cutoff);

  // Group by date and model, summing costs
  const byDate: Record<string, Record<string, number>> = {};
  for (const entry of entries) {
    if (!byDate[entry.date]) {
      byDate[entry.date] = {};
    }
    // Shorten model name: "claude-opus-4-5" -> "opus45"
    const shortModel = entry.model
      .replace("claude-", "")
      .replace(/-(\d)/g, "$1");
    byDate[entry.date][shortModel] = (byDate[entry.date][shortModel] || 0) + entry.cost;
  }

  // Convert to array format suitable for Recharts
  return Object.entries(byDate)
    .map(([date, models]) => ({
      date,
      ...models,
    }))
    .sort((a, b) => (a.date as string).localeCompare(b.date as string));
}

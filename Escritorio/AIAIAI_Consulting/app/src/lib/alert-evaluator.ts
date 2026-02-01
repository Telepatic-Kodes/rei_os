import fs from "node:fs";
import path from "node:path";
import {
  AlertStateSchema,
  TokenDataSchema,
  AnalyticsSchema,
} from "./schemas";
import type { AlertResult, AlertState } from "./schemas";
import { loadAlertConfig } from "./alert-config";
import { atomicWriteJson } from "./atomic-write";

const ANALYTICS_PATH = path.join(process.cwd(), "..", "data", "analytics.json");
const TOKENS_PATH = path.join(process.cwd(), "..", "data", "tokens.json");
const STATE_PATH = path.join(process.cwd(), "..", "data", "alert-state.json");

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
}

function loadAlertState(): AlertState {
  try {
    const raw = fs.readFileSync(STATE_PATH, "utf-8");
    return AlertStateSchema.parse(JSON.parse(raw));
  } catch {
    return {
      firedAlerts: [],
      lastReset: new Date().toISOString(),
      month: currentMonth(),
    };
  }
}

function saveAlertState(state: AlertState): void {
  atomicWriteJson(STATE_PATH, state);
}

function getMonthlySpend(): { totalCost: number; byProject: Record<string, number> } {
  // Global spend from analytics 30d window
  let totalCost = 0;
  try {
    const raw = fs.readFileSync(ANALYTICS_PATH, "utf-8");
    const analytics = AnalyticsSchema.parse(JSON.parse(raw));
    totalCost = analytics.windows["30d"].totalCost;
  } catch {
    // No analytics available
  }

  // Per-project spend from tokens.json entries in current month
  const byProject: Record<string, number> = {};
  try {
    const raw = fs.readFileSync(TOKENS_PATH, "utf-8");
    const tokens = TokenDataSchema.parse(JSON.parse(raw));
    const monthPrefix = currentMonth();
    for (const entry of tokens.entries) {
      if (entry.date.startsWith(monthPrefix)) {
        byProject[entry.project] = (byProject[entry.project] ?? 0) + entry.cost;
      }
    }
  } catch {
    // No tokens available
  }

  return { totalCost, byProject };
}

function buildAlerts(
  totalCost: number,
  byProject: Record<string, number>,
  excludeKeys?: Set<string>
): AlertResult[] {
  const config = loadAlertConfig();
  const results: AlertResult[] = [];

  // Global threshold checks
  const sortedThresholds = [...config.globalThresholds].sort(
    (a, b) => a.percent - b.percent
  );
  for (const threshold of sortedThresholds) {
    const percentSpent = (totalCost / config.globalBudget) * 100;
    const alertKey = `global-${threshold.percent}`;
    if (percentSpent >= threshold.percent) {
      if (excludeKeys && excludeKeys.has(alertKey)) continue;
      const level = threshold.percent >= 90 ? "critical" : "warning";
      results.push({
        type: "global",
        level,
        message: `Global spend is at ${percentSpent.toFixed(1)}% of $${config.globalBudget} budget (${threshold.label ?? level})`,
        alertKey,
      });
    }
  }

  // Per-project limit checks
  for (const [projectName, limit] of Object.entries(config.perProjectLimits)) {
    if (limit <= 0) continue;
    const spent = byProject[projectName] ?? 0;
    const alertKey = `project-${projectName}-limit`;
    if (spent >= limit) {
      if (excludeKeys && excludeKeys.has(alertKey)) continue;
      results.push({
        type: "project",
        level: "critical",
        message: `Project "${projectName}" has spent $${spent.toFixed(2)}, exceeding $${limit} limit`,
        alertKey,
        projectName,
      });
    }
  }

  return results;
}

/**
 * Evaluates alerts and updates state (fire-once per month).
 * Returns only NEW alerts that haven't been fired this month.
 */
export async function evaluateAlerts(): Promise<AlertResult[]> {
  const state = loadAlertState();

  // Monthly reset
  const month = currentMonth();
  if (state.month !== month) {
    state.firedAlerts = [];
    state.month = month;
    state.lastReset = new Date().toISOString();
  }

  const { totalCost, byProject } = getMonthlySpend();
  const excludeKeys = new Set(state.firedAlerts);
  const results = buildAlerts(totalCost, byProject, excludeKeys);

  // Track newly fired alerts
  if (results.length > 0) {
    for (const r of results) {
      state.firedAlerts.push(r.alertKey);
    }
    saveAlertState(state);
  }

  return results;
}

/**
 * Returns all currently-crossed thresholds (for banner display).
 * Does NOT update state - pure read operation.
 */
export async function getActiveAlerts(): Promise<AlertResult[]> {
  const { totalCost, byProject } = getMonthlySpend();
  return buildAlerts(totalCost, byProject);
}

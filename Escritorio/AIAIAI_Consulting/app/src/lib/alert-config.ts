import fs from "node:fs";
import path from "node:path";
import { AlertConfigSchema } from "./schemas";
import type { AlertConfig } from "./schemas";
import { atomicWriteJson } from "./atomic-write";

const CONFIG_PATH = path.join(process.cwd(), "..", "data", "config", "alerts.json");

export const DEFAULT_ALERT_CONFIG: AlertConfig = {
  globalBudget: 200,
  globalThresholds: [
    { percent: 75, label: "Warning" },
    { percent: 90, label: "Critical" },
  ],
  perProjectLimits: {},
};

/**
 * Loads alert configuration from data/config/alerts.json.
 * Returns defaults if file is missing or invalid.
 */
export function loadAlertConfig(): AlertConfig {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
    const data = JSON.parse(raw);
    return AlertConfigSchema.parse(data);
  } catch {
    return { ...DEFAULT_ALERT_CONFIG };
  }
}

/**
 * Saves alert configuration to data/config/alerts.json.
 * Validates before writing.
 */
export function saveAlertConfig(config: AlertConfig): void {
  const validated = AlertConfigSchema.parse(config);
  atomicWriteJson(CONFIG_PATH, validated);
}

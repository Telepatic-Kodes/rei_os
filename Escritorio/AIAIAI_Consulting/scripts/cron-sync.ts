import { Cron } from "croner";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { runAllSyncs } from "../app/src/lib/sync-manager";
import { SyncConfigSchema } from "../app/src/lib/schemas";
import { evaluateAlerts } from "../app/src/lib/alert-evaluator";
import { sendDesktopNotification } from "./desktop-notifier";

const ROOT = resolve(__dirname, "..");
const CONFIG_FILE = join(ROOT, "data", "config", "sync.json");

// Load sync configuration
let intervalMinutes = 15; // Default

try {
  const configData = JSON.parse(readFileSync(CONFIG_FILE, "utf-8"));
  const config = SyncConfigSchema.parse(configData);
  intervalMinutes = config.intervalMinutes;
} catch (error) {
  console.warn(
    `Failed to load sync config, using default ${intervalMinutes}min:`,
    error instanceof Error ? error.message : String(error)
  );
}

// Create cron job with dynamic interval
// Cron pattern: */N * * * * = every N minutes
const cronPattern = `*/${intervalMinutes} * * * *`;

console.log(`Starting cron scheduler (interval: ${intervalMinutes} minutes)`);

const job = new Cron(cronPattern, async () => {
  console.log(`\n[${new Date().toISOString()}] Triggering scheduled sync...`);
  const result = await runAllSyncs();
  console.log(`Sync result:`, result);

  // Evaluate alerts after successful sync
  try {
    const alerts = await evaluateAlerts();
    for (const alert of alerts) {
      console.log("[ALERT]", alert.level, alert.message);
      sendDesktopNotification(alert);
    }
  } catch (error) {
    console.error(
      "[ALERT] Failed to evaluate alerts:",
      error instanceof Error ? error.message : String(error)
    );
  }
});

console.log(`Next sync scheduled for: ${job.nextRun()?.toISOString()}`);

// Graceful shutdown handlers
const shutdown = () => {
  console.log("\nReceived shutdown signal, stopping cron scheduler...");
  job.stop();
  console.log("Cron scheduler stopped gracefully");
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// Keep process alive
process.stdin.resume();

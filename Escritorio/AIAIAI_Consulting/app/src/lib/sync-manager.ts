import { execSync } from "node:child_process";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { atomicWriteJson } from "./atomic-write";
import { generateAnalytics } from "./analytics";
import { SyncStatusSchema } from "./schemas";
import type { SyncStatus } from "./schemas";

const ROOT = resolve(__dirname, "..", "..", "..");
const LOCK_FILE = join(ROOT, "data", ".sync-lock");
const STATUS_FILE = join(ROOT, "data", "sync-status.json");
const STALE_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour

/**
 * Orchestrates all sync scripts sequentially with lock file protection.
 * Returns status object for logging/monitoring.
 */
export async function runAllSyncs(): Promise<{
  status: "success" | "error" | "skipped";
  durationMs?: number;
  error?: string;
}> {
  // Check for existing lock file
  if (existsSync(LOCK_FILE)) {
    const lockContent = readFileSync(LOCK_FILE, "utf-8");
    const lockTime = new Date(lockContent).getTime();
    const now = Date.now();

    if (now - lockTime < STALE_THRESHOLD_MS) {
      // Lock is fresh - skip this run
      console.log("Sync already in progress (lock file exists) - skipping");
      return { status: "skipped" };
    } else {
      // Lock is stale (>1 hour old) - remove it
      console.warn(
        `Stale lock file detected (${Math.round((now - lockTime) / 1000 / 60)}min old) - removing`
      );
      unlinkSync(LOCK_FILE);
    }
  }

  // Write lock file
  writeFileSync(LOCK_FILE, new Date().toISOString(), "utf-8");
  const startTime = Date.now();

  try {
    // Run all three sync scripts sequentially
    console.log("Starting sync: tokens...");
    execSync("npx tsx scripts/sync-tokens.ts", {
      cwd: ROOT,
      stdio: "inherit",
    });

    console.log("Starting sync: quality...");
    execSync("npx tsx scripts/sync-quality.ts", {
      cwd: ROOT,
      stdio: "inherit",
    });

    console.log("Starting sync: projects...");
    execSync("npx tsx scripts/sync-projects.ts", {
      cwd: ROOT,
      stdio: "inherit",
    });

    // Generate pre-computed analytics from synced data
    console.log("Generating analytics...");
    await generateAnalytics();

    const durationMs = Date.now() - startTime;
    const status: SyncStatus = {
      lastSync: new Date().toISOString(),
      status: "success",
      durationMs,
    };

    // Validate and write status
    SyncStatusSchema.parse(status);
    atomicWriteJson(STATUS_FILE, status);

    console.log(`✓ All syncs completed in ${durationMs}ms`);
    return { status: "success", durationMs };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : String(error);

    const status: SyncStatus = {
      lastSync: new Date().toISOString(),
      status: "error",
      durationMs,
      error: errorMessage,
    };

    // Validate and write error status
    SyncStatusSchema.parse(status);
    atomicWriteJson(STATUS_FILE, status);

    console.error(`✗ Sync failed after ${durationMs}ms:`, errorMessage);
    return { status: "error", durationMs, error: errorMessage };
  } finally {
    // Always remove lock file
    if (existsSync(LOCK_FILE)) {
      unlinkSync(LOCK_FILE);
    }
  }
}

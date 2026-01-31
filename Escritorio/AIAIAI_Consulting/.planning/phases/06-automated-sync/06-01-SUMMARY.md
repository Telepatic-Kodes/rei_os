---
phase: 06
plan: 01
subsystem: automation
tags: [cron, sync, orchestration, background-jobs]
requires:
  - 05-01 # Atomic writes and JSONL infrastructure
  - 05-02 # Zod schemas and validation
provides:
  - Automated sync orchestration via cron
  - Lock file protection against concurrent syncs
  - Sync status tracking and persistence
  - Development workflow with parallel Next.js + cron
affects:
  - 06-02 # UI notifications will consume sync-status.json
  - 07-01 # Analytics will benefit from auto-refreshed data
tech-stack:
  added:
    - croner: Cron scheduler for Node.js
    - concurrently: Run multiple npm scripts in parallel
    - sonner: Toast notifications (installed for 06-02)
    - tsx: TypeScript execution for scripts
  patterns:
    - Background job orchestration with lock files
    - Graceful shutdown with SIGTERM/SIGINT handlers
    - Configurable intervals via JSON config
key-files:
  created:
    - app/src/lib/sync-manager.ts
    - scripts/cron-sync.ts
    - data/config/sync.json
  modified:
    - app/package.json
    - package.json
    - app/src/lib/schemas.ts
    - .gitignore
decisions:
  - what: "Cron runs as separate process, not embedded in Next.js"
    why: "Cleaner separation, runs in dev and prod, easier testing"
    phase: "06-01"
  - what: "Lock file with 1-hour stale threshold"
    why: "Prevents concurrent syncs, auto-recovers from crashes"
    phase: "06-01"
  - what: "Install croner at root, not in app/"
    why: "Scripts in scripts/ need access, root level simplifies import resolution"
    phase: "06-01"
  - what: "Use concurrently for dev workflow"
    why: "Single npm run dev starts both Next.js and cron together"
    phase: "06-01"
metrics:
  duration: "4 minutes"
  completed: "2026-01-31"
---

# Phase 6 Plan 01: Automated Sync Scheduler Summary

**One-liner:** Cron-based sync orchestrator with lock protection and status tracking using croner, running every 15 minutes by default.

## What Was Built

Background automation system that eliminates manual sync script execution.

**Core components:**

1. **SyncManager (`app/src/lib/sync-manager.ts`)**
   - `runAllSyncs()` orchestrator function
   - Executes all 3 sync scripts sequentially (tokens, quality, projects)
   - Lock file at `data/.sync-lock` prevents concurrent execution
   - Stale lock detection (>1 hour) with automatic removal
   - Status persistence to `data/sync-status.json`
   - Returns `{status, durationMs, error?}` for monitoring

2. **Cron Process (`scripts/cron-sync.ts`)**
   - Standalone Node process using croner library
   - Reads interval from `data/config/sync.json` (default: 15 minutes)
   - Graceful shutdown on SIGTERM/SIGINT
   - Logs next scheduled run time on startup

3. **Configuration**
   - `data/config/sync.json` with configurable `intervalMinutes`
   - SyncConfigSchema and SyncStatusSchema in schemas.ts
   - Default interval: 15 minutes

4. **Developer Workflow**
   - `npm run dev` now runs Next.js + cron concurrently
   - `npm run dev:next` for Next.js alone
   - `npm run cron` for cron process alone

## Tasks Completed

| Task | Commit  | Files                                                              |
| ---- | ------- | ------------------------------------------------------------------ |
| 1    | 354b6a2 | package.json, sync.json config, npm scripts                        |
| 2    | 2076dfb | sync-manager.ts, cron-sync.ts, schemas.ts, .gitignore, dependencies|

## Technical Implementation

**Lock File Protection:**
```typescript
// Check for existing lock
if (existsSync(LOCK_FILE)) {
  const lockTime = new Date(readFileSync(LOCK_FILE, "utf-8")).getTime();
  const age = Date.now() - lockTime;

  if (age < STALE_THRESHOLD_MS) {
    return { status: "skipped" }; // Fresh lock - skip
  } else {
    unlinkSync(LOCK_FILE); // Stale lock - remove
  }
}
```

**Sequential Sync Execution:**
```typescript
execSync("npx tsx scripts/sync-tokens.ts", { cwd: ROOT, stdio: "inherit" });
execSync("npx tsx scripts/sync-quality.ts", { cwd: ROOT, stdio: "inherit" });
execSync("npx tsx scripts/sync-projects.ts", { cwd: ROOT, stdio: "inherit" });
```

**Graceful Shutdown:**
```typescript
const shutdown = () => {
  console.log("Stopping cron scheduler...");
  job.stop();
  process.exit(0);
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed tsx as dev dependency**
- **Found during:** Task 2 verification
- **Issue:** Scripts run via `npx tsx` but tsx wasn't installed
- **Fix:** `npm install --save-dev tsx` in app/
- **Files modified:** app/package.json, app/package-lock.json
- **Commit:** 2076dfb (included in Task 2)

**2. [Rule 3 - Blocking] Installed croner at root level**
- **Found during:** Task 2 implementation
- **Issue:** cron-sync.ts in scripts/ couldn't import croner from app/node_modules
- **Fix:** `npm install croner` at root level for scripts to access
- **Files modified:** package.json, package-lock.json
- **Commit:** 2076dfb (included in Task 2)

**3. [Rule 1 - Bug] Fixed Cron constructor call**
- **Found during:** Task 2 verification
- **Issue:** `Cron(pattern, callback)` threw "cannot be invoked without 'new'"
- **Fix:** Changed to `new Cron(pattern, callback)`
- **Files modified:** scripts/cron-sync.ts
- **Commit:** 2076dfb (included in Task 2)

## Decisions Made

**Cron as separate process (not Next.js route handler):**
- Cleaner separation of concerns
- Runs in both dev and production
- Easier testing and monitoring
- Avoids coupling to Next.js lifecycle

**Lock file with 1-hour stale threshold:**
- Prevents concurrent syncs (race conditions)
- Auto-recovers from crashes (process killed without cleanup)
- Simple file-based coordination (no Redis/database needed)

**Concurrently for dev workflow:**
- Single command (`npm run dev`) starts both services
- Terminal output clearly labeled [0] and [1]
- Ctrl+C kills both processes gracefully

## Verification Results

All verification criteria passed:

1. ✓ `npm run cron` starts and logs interval + next run time
2. ✓ Lock file prevents concurrent execution (tested with manual lock)
3. ✓ `data/sync-status.json` written after sync completes
4. ✓ Ctrl+C gracefully stops cron (confirmed "stopped gracefully" message)
5. ✓ `npm run dev` starts both Next.js and cron concurrently

## Test Output Samples

**Cron startup:**
```
Starting cron scheduler (interval: 15 minutes)
Next sync scheduled for: 2026-01-31T01:15:00.000Z
```

**Sync execution:**
```
Starting sync: tokens...
ANTHROPIC_ADMIN_KEY or ANTHROPIC_ORG_ID not set — skipping token sync
Starting sync: quality...
Synced quality for 14 projects
Starting sync: projects...
Updated 14 projects, added 0 new projects
✓ All syncs completed in 6376ms
```

**Lock file protection:**
```
Sync already in progress (lock file exists) - skipping
Result: { status: 'skipped' }
```

**Stale lock detection:**
```
Stale lock file detected (72min old) - removing
```

## Next Phase Readiness

**For Phase 6 Plan 02 (UI Notifications):**
- sync-status.json available for reading sync state
- sonner already installed (added in this plan)
- SyncStatusSchema available for validation

**For Phase 7 (Analytics):**
- Automated sync ensures data freshness without manual intervention
- 15-minute default interval balances freshness vs. API load

**Known limitations:**
- Token sync requires `ANTHROPIC_ADMIN_KEY` and `ANTHROPIC_ORG_ID` env vars
- No retry logic on sync failure (status.error logged, but no auto-retry)
- Cron interval change requires process restart

## Files Created/Modified

**Created:**
- `app/src/lib/sync-manager.ts` (97 lines)
- `scripts/cron-sync.ts` (48 lines)
- `data/config/sync.json` (3 lines)

**Modified:**
- `app/package.json` (added scripts, dependencies)
- `package.json` (added croner)
- `app/src/lib/schemas.ts` (added SyncConfig and SyncStatus schemas)
- `.gitignore` (exclude sync-status.json and .sync-lock)

**Auto-generated (not tracked):**
- `data/sync-status.json` (created on first sync)
- `data/.sync-lock` (created/removed during sync)

## Dependencies Added

**Production:**
- `croner@9.1.0` (root) - Cron scheduler
- `sonner@2.0.7` (app) - Toast notifications (for 06-02)

**Development:**
- `concurrently@9.2.1` (app) - Parallel script execution
- `tsx@latest` (app) - TypeScript execution

## Lessons Learned

1. **Module resolution for scripts:** Scripts outside app/ need dependencies at root level or explicit path resolution
2. **Graceful shutdown is essential:** Without SIGTERM/SIGINT handlers, lock files could become stale on Ctrl+C
3. **Stale lock threshold matters:** 1 hour balances protection (prevent double-sync) vs. recovery (auto-cleanup after crash)
4. **Concurrently output clarity:** Process labels [0], [1] make parallel logs readable

## Success Criteria

✅ All criteria met:

- Background cron process runs all sync scripts automatically on 15-minute interval
- Lock file prevents concurrent sync execution with 1-hour stale detection
- Sync status persisted to `data/sync-status.json` after each run
- `npm run dev` starts both Next.js and cron via concurrently
- Graceful shutdown on SIGTERM/SIGINT

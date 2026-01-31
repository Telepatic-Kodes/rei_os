# Phase 6: Automated Sync - Research

**Researched:** 2026-01-30
**Domain:** Node.js cron scheduling, Next.js API routes, React UI patterns, analytics pre-computation
**Confidence:** HIGH

## Summary

Phase 6 eliminates manual script execution by adding a scheduled cron process that runs sync scripts automatically, a manual refresh button in the dashboard header, visible sync status, and pre-computed analytics. The codebase already has safe write infrastructure from Phase 5 (atomic writes, JSONL history, Zod validation), so this phase focuses on the orchestration layer and UI integration.

The standard approach is: (1) use **croner** as the cron scheduler running as a separate Node.js process (not inside Next.js), (2) create a Next.js API route handler for manual sync triggers, (3) add **sonner** toast notifications and status indicators with shadcn/ui components, (4) implement pre-computed analytics as static JSON files generated during each sync run, and (5) use a lock file pattern to prevent concurrent sync execution.

**Primary recommendation:** Run croner as a standalone Node.js process (separate from Next.js), use Next.js App Router POST route for manual sync, add sonner toasts for feedback, persist sync status as JSON file, and pre-compute all analytics during sync for zero client-side calculation.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| croner | 8.x | Cron scheduler for Node.js | Zero dependencies, TypeScript-first, works in Node 18+, has .stop() for graceful shutdown |
| Next.js App Router | 16.x (current) | API route handlers | App Router is the current Next.js paradigm, route.ts with POST handlers is standard |
| sonner | latest | Toast notifications | Official shadcn/ui recommendation (replaces deprecated Toast component), minimal API |
| zod | 4.x (installed) | Schema validation | Already in Phase 5, used for validating sync config and status files |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| concurrently | 9.x | Run multiple npm scripts | Optional: run `npm run dev` + cron process together in development |
| lucide-react | 0.563.0 (installed) | Icons for refresh button | Already installed, provides RefreshCw icon for button |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| croner | node-cron, node-schedule | Croner has zero deps, TypeScript-first, better API; others have external dependencies |
| Separate process | Next.js API route polling | Running cron inside Next.js couples deployment and doesn't work on serverless; separate process is cleaner |
| sonner | react-hot-toast, react-toastify | sonner is shadcn/ui's official choice, already integrated with project's design system |

**Installation:**
```bash
cd app && npm install croner sonner
# Optional for dev workflow:
npm install --save-dev concurrently
```

## Architecture Patterns

### Recommended Project Structure
```
app/
  src/
    app/
      api/
        sync/
          route.ts           # POST handler for manual sync
    components/
      ui/
        sonner.tsx           # Added via npx shadcn@latest add sonner
      sync-status.tsx        # Status indicator component
      sync-button.tsx        # Manual refresh button
    lib/
      sync-manager.ts        # Orchestrates all sync scripts
      analytics.ts           # Pre-computed analytics generator
scripts/
  cron-sync.ts              # Standalone cron process (runs croner)
  sync-tokens.ts            # Existing (from Phase 5)
  sync-quality.ts           # Existing (from Phase 5)
  sync-projects.ts          # Existing (from Phase 5)
data/
  config/
    sync.json               # Sync interval config (e.g., 15 minutes)
  sync-status.json          # Last sync time, success/error state
  analytics.json            # Pre-computed metrics (7d, 30d, 90d windows)
```

### Pattern 1: Standalone Cron Process
**What:** Run croner as a separate Node.js process, not embedded in Next.js.
**When to use:** Always for this project (user decision from v2.0 planning).
**Example:**
```typescript
// scripts/cron-sync.ts
import { Cron } from "croner";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runAllSyncs } from "../app/src/lib/sync-manager";

const configPath = join(__dirname, "..", "data", "config", "sync.json");
const config = JSON.parse(readFileSync(configPath, "utf-8"));
const interval = config.intervalMinutes ?? 15;

// Named job for graceful shutdown
const job = Cron(`*/${interval} * * * *`, { name: "sync-all" }, async () => {
  console.log(`[${new Date().toISOString()}] Running scheduled sync...`);
  await runAllSyncs();
});

// Graceful shutdown on SIGTERM/SIGINT
const shutdown = async (signal: string) => {
  console.log(`Received ${signal}, stopping cron...`);
  job.stop(); // Waits for running job to complete
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

console.log(`Cron started: sync every ${interval} minutes`);
```

### Pattern 2: Sync Manager with Lock File
**What:** Central orchestrator that runs all sync scripts sequentially and prevents concurrent execution.
**When to use:** Both manual sync (API route) and automatic sync (cron) call this.
**Example:**
```typescript
// app/src/lib/sync-manager.ts
import { existsSync, writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { atomicWriteJson } from "./atomic-write";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);
const ROOT = join(__dirname, "..", "..", "..");
const LOCK_FILE = join(ROOT, "data", ".sync-lock");
const STATUS_FILE = join(ROOT, "data", "sync-status.json");

export async function runAllSyncs(): Promise<void> {
  // Lock file pattern to prevent concurrent execution
  if (existsSync(LOCK_FILE)) {
    console.log("Sync already running, skipping...");
    return;
  }

  writeFileSync(LOCK_FILE, new Date().toISOString());

  try {
    const startTime = Date.now();
    const scripts = ["sync-tokens", "sync-quality", "sync-projects"];

    for (const script of scripts) {
      console.log(`Running ${script}...`);
      await execAsync(`npm run ${script}`, { cwd: ROOT });
    }

    // Generate pre-computed analytics
    const { generateAnalytics } = await import("./analytics");
    await generateAnalytics();

    // Write success status
    atomicWriteJson(STATUS_FILE, {
      lastSync: new Date().toISOString(),
      status: "success",
      durationMs: Date.now() - startTime,
    });

    console.log("All syncs completed successfully");
  } catch (error) {
    // Write error status
    atomicWriteJson(STATUS_FILE, {
      lastSync: new Date().toISOString(),
      status: "error",
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  } finally {
    // Always release lock
    if (existsSync(LOCK_FILE)) {
      unlinkSync(LOCK_FILE);
    }
  }
}
```

### Pattern 3: Next.js App Router POST Handler
**What:** API route that triggers manual sync and returns status.
**When to use:** Manual refresh button in dashboard header.
**Example:**
```typescript
// app/src/app/api/sync/route.ts
import { NextRequest, NextResponse } from "next/server";
import { runAllSyncs } from "@/lib/sync-manager";

export async function POST(request: NextRequest) {
  try {
    await runAllSyncs();
    return NextResponse.json({
      success: true,
      message: "Sync completed successfully",
    });
  } catch (error) {
    console.error("Manual sync failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
```

### Pattern 4: React Refresh Button with Sonner Toast
**What:** Button that calls sync API, shows loading state, and displays toast notification.
**When to use:** Dashboard header for manual sync trigger.
**Example:**
```typescript
// app/src/components/sync-button.tsx
"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function SyncButton() {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    toast("Syncing data...");

    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();

      if (data.success) {
        toast.success("Sync complete");
        window.location.reload(); // Reload to show updated data
      } else {
        toast.error(`Sync failed: ${data.error}`);
      }
    } catch (error) {
      toast.error("Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Button onClick={handleSync} disabled={syncing} variant="outline" size="sm">
      <RefreshCw className={syncing ? "animate-spin" : ""} />
      Refresh
    </Button>
  );
}
```

### Pattern 5: Pre-Computed Analytics Generation
**What:** Calculate all analytics during sync, write to static JSON file.
**When to use:** Every sync run (both manual and automatic).
**Example:**
```typescript
// app/src/lib/analytics.ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { atomicWriteJson } from "./atomic-write";
import { TokenDataSchema, type TokenEntry } from "./schemas";

const ROOT = join(__dirname, "..", "..", "..");
const TOKENS_FILE = join(ROOT, "data", "tokens.json");
const ANALYTICS_FILE = join(ROOT, "data", "analytics.json");

export async function generateAnalytics() {
  const tokenData = TokenDataSchema.parse(
    JSON.parse(readFileSync(TOKENS_FILE, "utf-8"))
  );

  const windows = [7, 30, 90]; // days
  const analytics = {
    generatedAt: new Date().toISOString(),
    windows: {} as Record<string, any>,
  };

  for (const days of windows) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().slice(0, 10);

    const filtered = tokenData.entries.filter((e) => e.date >= cutoffStr);

    const total = filtered.reduce((sum, e) => sum + e.cost, 0);
    const tokensIn = filtered.reduce((sum, e) => sum + e.tokensIn, 0);
    const tokensOut = filtered.reduce((sum, e) => sum + e.tokensOut, 0);

    // Per-model breakdown
    const byModel = filtered.reduce((acc, e) => {
      if (!acc[e.model]) acc[e.model] = { cost: 0, tokensIn: 0, tokensOut: 0 };
      acc[e.model].cost += e.cost;
      acc[e.model].tokensIn += e.tokensIn;
      acc[e.model].tokensOut += e.tokensOut;
      return acc;
    }, {} as Record<string, { cost: number; tokensIn: number; tokensOut: number }>);

    // Burn rate (daily average)
    const burnRate = days > 0 ? total / days : 0;

    analytics.windows[`${days}d`] = {
      totalCost: total,
      tokensIn,
      tokensOut,
      byModel,
      burnRate,
    };
  }

  atomicWriteJson(ANALYTICS_FILE, analytics);
  console.log("Analytics pre-computed for 7d, 30d, 90d windows");
}
```

### Pattern 6: Sync Status Display Component
**What:** Shows last sync time and success/error state from sync-status.json.
**When to use:** Dashboard header, next to refresh button.
**Example:**
```typescript
// app/src/components/sync-status.tsx
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { Badge } from "@/components/ui/badge";

export function SyncStatus() {
  const statusPath = join(process.cwd(), "..", "data", "sync-status.json");

  if (!existsSync(statusPath)) {
    return <Badge variant="secondary">Never synced</Badge>;
  }

  const status = JSON.parse(readFileSync(statusPath, "utf-8"));
  const lastSync = new Date(status.lastSync);
  const timeAgo = formatTimeAgo(lastSync);

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Badge variant={status.status === "success" ? "success" : "destructive"}>
        {status.status}
      </Badge>
      <span>Last sync: {timeAgo}</span>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
```

### Anti-Patterns to Avoid
- **Running cron inside Next.js:** Couples deployment, doesn't work on serverless (Vercel), hard to manage lifecycle. Always run as separate process.
- **No lock file:** Multiple sync processes can run concurrently, corrupting data or causing race conditions. Always use lock file pattern.
- **Client-side analytics calculation:** Recalculating trends/totals on every page load is slow and duplicates logic. Pre-compute during sync.
- **Polling for sync status:** Don't poll the API every N seconds for status. Read static `sync-status.json` on page load or after manual sync.
- **Hardcoded sync interval:** Config should be in JSON file (`data/config/sync.json`), not hardcoded in cron script.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cron expression parsing | Custom interval parser | croner library | Supports full Vixie-cron syntax + extensions (L for last day, # for nth weekday) |
| Toast notifications | Custom notification system | sonner | Official shadcn/ui component, minimal API, theme-aware |
| Concurrent execution prevention | Custom semaphore/mutex | Lock file + fs.existsSync | Standard Unix pattern, works across processes, simple and reliable |
| Process signals handling | Custom signal handlers | croner's .stop() method | Automatically waits for running job to complete before exit |
| Time window calculations | Manual date filtering | Filter by ISO date string comparison | Native string comparison works for YYYY-MM-DD format |

**Key insight:** The cron scheduling and toast notification problems are solved domains with zero-dependency libraries. Lock file pattern is a 5-line solution that's battle-tested across Unix systems for decades.

## Common Pitfalls

### Pitfall 1: Cron Process Not Starting in Development
**What goes wrong:** Developer runs `npm run dev` but cron process doesn't start, so auto-sync never happens.
**Why it happens:** Cron is a separate script, not automatically started with Next.js dev server.
**How to avoid:** Either (1) use `concurrently` to run both together: `"dev": "concurrently \"next dev\" \"tsx scripts/cron-sync.ts\""`, or (2) document separate `npm run cron` command and expect developers to run both. Recommendation: use concurrently for seamless dev experience.
**Warning signs:** Dashboard shows "Never synced" even after waiting 15+ minutes.

### Pitfall 2: Lock File Not Cleaned Up After Crash
**What goes wrong:** Sync script crashes, lock file remains, all future syncs skip execution.
**Why it happens:** Lock file created in try block, but crash happens before finally block executes.
**How to avoid:** Always use try/finally to ensure lock file cleanup. Additionally, check lock file age and force-remove if older than 1 hour (stale lock).
**Warning signs:** Sync status shows success but last sync time stops updating.

### Pitfall 3: Page Not Refreshing After Manual Sync
**What goes wrong:** User clicks refresh button, sync completes, but dashboard still shows old data.
**Why it happens:** Next.js doesn't automatically re-fetch data after sync. Static data is read at build/request time.
**How to avoid:** Use `window.location.reload()` after successful sync API call, or implement React state invalidation if using client-side data fetching.
**Warning signs:** Toast says "Sync complete" but numbers don't change.

### Pitfall 4: Analytics File Read on Every Request
**What goes wrong:** Every dashboard page load reads and parses analytics.json, causing I/O on every request.
**Why it happens:** Server component reads file directly instead of using Next.js caching.
**How to avoid:** This is actually FINE for this project's scale (single-user dashboard). Analytics file is small (~5KB) and reads are cached by OS. For multi-user, use Next.js `unstable_cache` or move to database.
**Warning signs:** Not a real issue at this scale, but watch for slow dashboard loads if analytics grows large.

### Pitfall 5: Sonner Toaster Not Added to Layout
**What goes wrong:** `toast()` function is called but no toast appears on screen.
**Why it happens:** `<Toaster />` component must be added to root layout for sonner to work.
**How to avoid:** After `npx shadcn@latest add sonner`, immediately add `<Toaster />` to `app/layout.tsx` before `{children}`.
**Warning signs:** No visual feedback when clicking refresh button, no console errors.

### Pitfall 6: Sync Config Not Created
**What goes wrong:** Cron script tries to read `data/config/sync.json`, file doesn't exist, script crashes.
**Why it happens:** Config file not created during Phase 6 setup.
**How to avoid:** Create `data/config/sync.json` with default `{ "intervalMinutes": 15 }` as part of task checklist. Include in git (not gitignored).
**Warning signs:** Cron process exits immediately with "ENOENT: no such file or directory".

## Code Examples

### Running Cron + Next.js Together in Development
```json
// package.json
{
  "scripts": {
    "dev": "concurrently \"next dev\" \"npm run cron\"",
    "cron": "tsx scripts/cron-sync.ts",
    "sync:manual": "npm run sync-tokens && npm run sync-quality && npm run sync-projects",
    "sync-tokens": "tsx scripts/sync-tokens.ts",
    "sync-quality": "tsx scripts/sync-quality.ts",
    "sync-projects": "tsx scripts/sync-projects.ts"
  }
}
```

### Stale Lock File Cleanup
```typescript
// Enhanced lock file pattern with stale lock detection
const LOCK_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

if (existsSync(LOCK_FILE)) {
  const lockTime = new Date(readFileSync(LOCK_FILE, "utf-8")).getTime();
  const age = Date.now() - lockTime;

  if (age > LOCK_MAX_AGE_MS) {
    console.warn(`Stale lock file detected (${Math.round(age / 1000 / 60)}m old), removing...`);
    unlinkSync(LOCK_FILE);
  } else {
    console.log("Sync already running, skipping...");
    return;
  }
}
```

### Reading Pre-Computed Analytics in Dashboard
```typescript
// app/src/app/page.tsx (Server Component)
import { readFileSync } from "node:fs";
import { join } from "node:path";

export default function Dashboard() {
  const analyticsPath = join(process.cwd(), "..", "data", "analytics.json");
  const analytics = JSON.parse(readFileSync(analyticsPath, "utf-8"));

  return (
    <div>
      <h2>7-Day Summary</h2>
      <p>Total cost: ${analytics.windows["7d"].totalCost.toFixed(2)}</p>
      <p>Burn rate: ${analytics.windows["7d"].burnRate.toFixed(2)}/day</p>

      <h2>30-Day Summary</h2>
      <p>Total cost: ${analytics.windows["30d"].totalCost.toFixed(2)}</p>
    </div>
  );
}
```

### Graceful Shutdown Integration
```typescript
// Complete cron script with all best practices
import { Cron } from "croner";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runAllSyncs } from "../app/src/lib/sync-manager";

const ROOT = join(__dirname, "..");
const configPath = join(ROOT, "data", "config", "sync.json");

// Read config with fallback
let intervalMinutes = 15;
try {
  const config = JSON.parse(readFileSync(configPath, "utf-8"));
  intervalMinutes = config.intervalMinutes ?? 15;
} catch (error) {
  console.warn("Could not read sync config, using default 15 minutes");
}

// Create named job for graceful shutdown
const job = Cron(
  `*/${intervalMinutes} * * * *`,
  { name: "sync-all" },
  async () => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Running scheduled sync...`);

    try {
      await runAllSyncs();
      console.log(`[${timestamp}] Sync completed`);
    } catch (error) {
      console.error(`[${timestamp}] Sync failed:`, error);
    }
  }
);

// Graceful shutdown handler
const shutdown = async (signal: string) => {
  console.log(`Received ${signal}, stopping cron gracefully...`);
  job.stop(); // Waits for current execution to complete
  console.log("Cron stopped, exiting");
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

console.log(`✓ Cron scheduler started (interval: ${intervalMinutes} minutes)`);
console.log(`  Next run: ${job.nextRun()?.toISOString()}`);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| node-cron, node-schedule | croner | croner 8.x (2024) | Zero dependencies vs ~50 transitive deps; better TypeScript support |
| Pages Router API routes | App Router route.ts | Next.js 13+ (stable in 14) | Web standard Request/Response APIs, better type inference |
| Custom toast components | sonner | 2024-2025 | Official shadcn/ui recommendation, deprecated old Toast component |
| Real-time analytics calculation | Pre-computed analytics | Established pattern | Frontend just renders, all logic in sync scripts |

**Deprecated/outdated:**
- **shadcn/ui Toast component:** Deprecated in favor of sonner (as of 2024)
- **Running background jobs inside Next.js:** Never recommended, but community now strongly discourages it with serverless deployments
- **node-cron:** Still maintained, but croner is newer with better design

## Open Questions

1. **Concurrency handling strategy**
   - What we know: Lock file prevents concurrent execution, "skip" strategy is simplest
   - What's unclear: Should we queue manual sync if auto-sync is running, or just skip?
   - Recommendation: Skip for v2.0 (simpler). User can retry after a few seconds. Add queuing in v3.0 if needed.

2. **Sync status persistence detail level**
   - What we know: Need last sync time and success/error state
   - What's unclear: Should we track per-script status or just overall?
   - Recommendation: Overall status for v2.0 (simpler UI). Individual script status adds complexity without clear user value.

3. **Development workflow: single command vs dual terminal**
   - What we know: Can use `concurrently` to run both Next.js and cron together
   - What's unclear: Better DX to run one `npm run dev` or keep them separate?
   - Recommendation: Use `concurrently` for `npm run dev` (single command), but also keep `npm run cron` separate for debugging. Developers expect `npm run dev` to start everything.

4. **Analytics file structure**
   - What we know: Need 7d, 30d, 90d windows with totals, trends, per-model breakdown
   - What's unclear: Single `analytics.json` with all windows, or separate files per window?
   - Recommendation: Single file with nested structure. File is small (~5-10KB), reading once is faster than multiple file reads.

5. **Auto-refresh after manual sync**
   - What we know: Data updates after sync, but Next.js doesn't auto-refresh
   - What's unclear: Use `window.location.reload()` or React state invalidation?
   - Recommendation: `window.location.reload()` for v2.0 (simplest). Full page reload ensures all data is fresh. React state invalidation is overkill for a dashboard that's not frequently refreshed.

## Sources

### Primary (HIGH confidence)
- [croner npm package](https://www.npmjs.com/package/croner) - Installation, API, TypeScript support
- [croner GitHub repository](https://github.com/Hexagon/croner) - .stop() method, graceful shutdown, named jobs
- [Next.js App Router Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers) - POST handler, request.json()
- [shadcn/ui Sonner component](https://ui.shadcn.com/docs/components/sonner) - Installation via `npx shadcn@latest add sonner`, usage
- Codebase analysis: `app/src/lib/schemas.ts`, `scripts/sync-tokens.ts`, `app/package.json` (Zod 4.x installed)
- Phase 5 research: `05-RESEARCH.md` - Atomic writes, JSONL history, Zod validation patterns

### Secondary (MEDIUM confidence)
- [LogRocket: Comparing best Node.js schedulers](https://blog.logrocket.com/comparing-best-node-js-schedulers/) - croner vs alternatives
- [Medium: Shadcn/ui React Series — Part 19 Sonner](https://medium.com/@rivainasution/shadcn-ui-react-series-part-19-sonner-modern-toast-notifications-done-right-903757c5681f) - January 2026, sonner best practices
- [Wisp CMS: Next.js 15 API GET & POST examples](https://www.wisp.blog/blog/nextjs-15-api-get-and-post-request-examples) - TypeScript POST handler patterns
- [Cronitor: How to prevent duplicate cron executions](https://cronitor.io/guides/how-to-prevent-duplicate-cron-executions) - Lock file pattern
- [DEV: Understanding flock in Linux cron jobs](https://dev.to/mochafreddo/understanding-the-use-of-flock-in-linux-cron-jobs-preventing-concurrent-script-execution-3c5h) - Alternative to manual lock file
- [Node.js graceful shutdown guides](https://dev.to/yusadolat/nodejs-graceful-shutdown-a-beginners-guide-40b6) - SIGTERM/SIGINT handling patterns
- [concurrently npm package](https://www.npmjs.com/package/concurrently) - Running multiple npm scripts in parallel
- [GitHub discussion: Running background jobs with Next.js](https://github.com/vercel/next.js/discussions/33989) - Community consensus on separate processes

### Tertiary (LOW confidence)
- WebSearch results for pre-computed analytics patterns - General concepts, not specific implementation guidance
- WebSearch results for time window aggregation - General patterns, applicable but not domain-specific

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - croner, Next.js App Router, sonner all have official documentation and are current best practices
- Architecture: HIGH - patterns derived from official docs and verified against existing Phase 5 infrastructure
- Pitfalls: HIGH - identified from official docs (sonner Toaster requirement), community patterns (lock file), and v2.0 planning decision (separate process)

**Research date:** 2026-01-30
**Valid until:** 2026-04-30 (cron scheduling is stable; Next.js and shadcn/ui evolve but breaking changes are rare)

# Architecture Patterns

**Domain:** Local dashboard — automated sync, analytics, budget alerts
**Researched:** 2026-01-30
**Confidence:** HIGH (based on direct codebase analysis + known Next.js patterns)

## Current Architecture Snapshot

```
data/*.json  <--reads--  app/src/lib/data.ts  <--calls--  Server Components (pages)
                  |                                            |
            writeProjects()                              Client Components
                  ^                                      (TokenChart, KanbanBoard)
                  |
       API Route (PATCH /api/projects/status)

scripts/sync-*.ts  -->  writes data/*.json directly (run manually via tsx)
```

Key characteristics:
- **Synchronous `fs.readFileSync`** in `data.ts` — no async, no caching
- **Flat JSON files** — no time-series, no history, single snapshot per file
- **No background processes** — sync scripts run manually
- **No notification system** — no alerts, no toast, no browser notifications
- **Custom bar chart** — hand-rolled CSS bars in TokenChart, no charting library

## Recommended Architecture (After Milestone)

```
                          node-cron (in-process)
                                |
                          SyncManager
                          /    |    \
                sync-projects  sync-tokens  sync-quality
                          \    |    /
                       data/*.json (current snapshots)
                       data/history/*.jsonl (append-only logs)
                                |
                         lib/data.ts (extended)
                          /         \
                   Server Components   API Routes
                     /        \          \
              TrendChart    AlertBanner   /api/sync (manual trigger)
             (recharts)    (budget)      /api/alerts/config
                                         |
                                   Browser Notification API
                                   (requested from client)
```

## Integration Points with Existing Code

### 1. `lib/data.ts` — Extend, Don't Replace

Current `readJson`/`writeJson` pattern stays. Add alongside:

| New Function | Purpose |
|---|---|
| `appendHistory(type, entry)` | Append timestamped entry to `data/history/{type}.jsonl` |
| `getHistory(type, days)` | Read last N days from JSONL file |
| `getAlertConfig()` | Read `data/alerts.json` |
| `writeAlertConfig(config)` | Write alert thresholds |

**Why JSONL for history:** Append-only, no need to parse entire file to add entries. Each line is a self-contained JSON object with a timestamp. Simple `fs.appendFileSync`. For reads, stream line-by-line or read all + filter.

### 2. `scripts/sync-*.ts` — Wrap in SyncManager

Current scripts write directly to JSON. Keep that behavior but:
- Extract core logic into importable functions (not just CLI scripts)
- Add history-append call after each sync
- Return result object (success/fail, data summary) for alert evaluation

### 3. `TokenChart` — Replace with Recharts

Current hand-rolled CSS bars are fine for simple display but cannot do:
- Line charts for trends
- Multi-series comparison
- Tooltips, zoom, responsive resize

**Use Recharts** because: React-native, composable, works with Server Components via client wrapper, lightweight (~40KB gzipped), no D3 dependency issues.

### 4. New API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/sync` | POST | Trigger manual sync, return results |
| `/api/sync/status` | GET | Last sync time + status |
| `/api/alerts/config` | GET/PUT | Read/write alert thresholds |
| `/api/history/[type]` | GET | Query historical data with date range |

### 5. Sidebar — Add Alert Indicator

Existing `sidebar.tsx` gets a small notification dot/count when active alerts exist. Minimal change: read alert state from a JSON file, render badge.

## New Components Needed

| Component | Type | Purpose |
|---|---|---|
| `SyncManager` | Server-side module | node-cron scheduler, runs sync functions on interval |
| `TrendChart` | Client Component | Recharts-based line/area chart for historical data |
| `AlertBanner` | Client Component | Top-of-page banner when budget threshold crossed |
| `SyncStatusBar` | Client Component | Shows last sync time + manual refresh button |
| `AlertConfigForm` | Client Component | Set budget thresholds (% warning, % critical) |
| `NotificationProvider` | Client Component | Wraps app, requests Browser Notification permission |

## Modified Components

| Component | Change |
|---|---|
| `lib/data.ts` | Add history read/write, alert config functions |
| `layout.tsx` | Add NotificationProvider wrapper, AlertBanner |
| `sidebar.tsx` | Add alert indicator dot |
| `TokenChart` | Replace with Recharts version OR keep and add separate TrendChart |
| `page.tsx` (home) | Add SyncStatusBar, show trend sparklines |

## Data Flow Changes

### Current: Flat Snapshots
```
sync script runs -> overwrites data/tokens.json -> next page load reads new data
```

### New: Snapshots + History
```
SyncManager cron fires
  -> runs sync function
  -> overwrites data/tokens.json (snapshot, same as before)
  -> appends to data/history/tokens.jsonl: {"timestamp":"...","entries":[...],"totalCost":95.8}
  -> evaluates alert rules against data/alerts.json thresholds
  -> if threshold crossed: writes data/alerts-active.json
  -> Next.js revalidates (or client polls /api/sync/status)
```

### History File Format (JSONL)

```jsonl
{"ts":"2026-01-30T10:00:00Z","totalCost":95.80,"entryCount":18,"topProject":"amd","topCost":26.20}
{"ts":"2026-01-31T10:00:00Z","totalCost":102.30,"entryCount":20,"topProject":"amd","topCost":28.40}
```

Store **aggregated summaries**, not raw data duplicates. Keep JSONL files small. One line per sync run.

### Alert Evaluation Flow

```
After each sync:
  currentSpend = sum(tokens.entries.cost)
  budget = tokens.budget.monthly
  percent = currentSpend / budget * 100

  if percent >= config.critical (default 90%):
    -> write alert to alerts-active.json
    -> trigger desktop notification via API route + client polling
  elif percent >= config.warning (default 75%):
    -> write warning to alerts-active.json
```

## Cron Strategy: node-cron In-Process

**Use `node-cron` running inside a Next.js custom server or instrumentation hook.**

Why not system crontab:
- Solo dev, local machine — no need for system-level scheduling
- Easier to configure, start/stop with the app
- Can access the same `lib/data.ts` functions directly

Implementation: Next.js `instrumentation.ts` (stable in Next.js 15+). Runs once on server startup. Register cron jobs there.

```typescript
// instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startSyncScheduler } = await import('./lib/sync-manager');
    startSyncScheduler(); // sets up node-cron jobs
  }
}
```

Default schedule: every 6 hours. Configurable via `data/sync-config.json`.

## Desktop Notifications Strategy

Browser Notification API (not Electron, not OS-level):
1. Client component requests permission on first visit
2. Client polls `/api/sync/status` every 60s (or uses Server-Sent Events)
3. When new alert detected, fires `new Notification("Budget Alert", ...)`

Simple, no dependencies, works in Chrome/Firefox/Edge.

## Suggested Build Order

Based on dependency analysis:

1. **History infrastructure** — JSONL read/write in `lib/data.ts`, `data/history/` directory
2. **SyncManager + cron** — `instrumentation.ts`, node-cron, wrap existing sync scripts
3. **History recording** — After each sync, append summary to JSONL
4. **Trend charts** — Install Recharts, build TrendChart component, add to pages
5. **Alert config + evaluation** — Alert thresholds JSON, evaluation after sync
6. **Alert UI** — AlertBanner, sidebar dot, AlertConfigForm
7. **Desktop notifications** — NotificationProvider, polling, browser Notification API
8. **Manual sync button** — POST /api/sync route, SyncStatusBar component

Rationale: History must exist before charts can display anything. Cron must work before alerts can fire. Charts are independent of alerts. Notifications come last because they depend on the entire alert pipeline.

## Anti-Patterns to Avoid

### Do NOT Add a Database
SQLite or PostgreSQL is overkill. JSONL append-only files handle the time-series need perfectly for a solo-dev local dashboard. The entire history for a year of daily syncs is ~365 lines = trivially small.

### Do NOT Use WebSockets
Polling every 60s or using `router.refresh()` is sufficient. WebSocket adds complexity (connection management, reconnection) for zero real benefit at this scale.

### Do NOT Store Full Snapshots in History
Appending entire `tokens.json` content on every sync creates massive history files. Store aggregated summaries only.

### Do NOT Use a Separate Backend Process
Keep everything in the Next.js process. A separate Node.js daemon for cron adds deployment complexity, IPC concerns, and race conditions on JSON file writes.

## Sources

- Direct codebase analysis (HIGH confidence)
- Next.js instrumentation.ts: stable since Next.js 15, documented in official docs (HIGH confidence)
- node-cron: mature package, 3M+ weekly npm downloads (HIGH confidence)
- Recharts: most popular React charting library, ~5M weekly npm downloads (HIGH confidence)
- Browser Notification API: W3C standard, supported in all modern browsers (HIGH confidence)

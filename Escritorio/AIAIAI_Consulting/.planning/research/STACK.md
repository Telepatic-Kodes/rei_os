# Technology Stack — Milestone 2: Automation, Analytics & Alerts

**Project:** AIAIAI Consulting Dashboard
**Researched:** 2026-01-30
**Scope:** Stack additions for cron sync, time-series charts, budget alerts, desktop notifications
**Confidence:** MEDIUM (web search unavailable; based on training data through May 2025 + package.json verification)

## Current Stack (Verified from package.json)

| Technology | Version | Notes |
|------------|---------|-------|
| Next.js | 16.1.6 | App Router, Server Components |
| React | 19.2.3 | |
| TypeScript | ^5 | |
| Tailwind CSS | ^4 | v4 with @tailwindcss/postcss |
| shadcn/ui | (Radix primitives) | card, progress, separator, tabs |
| lucide-react | ^0.563.0 | Icons |
| Data layer | JSON files | projects.json, tokens.json, quality.json |

## Recommended Stack Additions

### 1. Cron/Scheduling: `croner`

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| croner | ^9.0 | In-process cron scheduling | Pure ESM, zero deps, runs in Node.js process. No external daemon needed. |

**Why croner over alternatives:**

| Option | Verdict | Reason |
|--------|---------|--------|
| **croner** | RECOMMENDED | Modern, ESM-native, zero dependencies, TypeScript types built-in, supports cron expressions and intervals. Active maintenance. |
| node-cron | NO | CJS-first, heavier, less maintained. Works but croner is strictly better for modern ESM/TS projects. |
| cron (npm) | NO | Older API, CJS. Same story as node-cron. |
| System crontab | NO | Requires OS-level config, not portable, harder to manage from app code. |
| PM2 cron | MAYBE | If already using PM2 for process management. Overkill for a solo-dev local dashboard. |

**Integration approach:** Create a lightweight `sync-scheduler.ts` that imports existing sync scripts and runs them on a cron schedule. Start it alongside `next dev` or as a separate `npm run sync:watch` script using `tsx`.

```typescript
// sync-scheduler.ts
import { Cron } from "croner";

// Run every 30 minutes
const job = new Cron("*/30 * * * *", async () => {
  // Call existing sync scripts
});
```

**Important:** This runs as a separate Node.js process, NOT inside Next.js middleware or API routes. Next.js is not designed to run persistent background tasks.

### 2. Charting: `recharts`

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| recharts | ^2.15 | Time-series line/area/bar charts | React-native, composable, excellent for dashboards. Most popular React charting lib. |

**Why recharts over alternatives:**

| Option | Verdict | Reason |
|--------|---------|--------|
| **recharts** | RECOMMENDED | Built on D3, but React-declarative API. Composable components (`<LineChart>`, `<AreaChart>`). Lightweight for the features needed. Massive ecosystem. Works with Server Components (render in Client Components). |
| tremor | NO | Full dashboard component library — conflicts with existing shadcn/ui setup. Opinionated styling clashes with Tailwind v4 customizations. |
| nivo | MAYBE | More chart types, but heavier bundle. Better for complex visualizations. Overkill for trend lines and budget bars. |
| chart.js + react-chartjs-2 | NO | Canvas-based (not SVG), harder to style with Tailwind, less React-idiomatic. |
| visx | NO | Low-level D3 wrapper. Too much boilerplate for simple trend charts. |
| lightweight-charts (TradingView) | NO | Financial-specific. Wrong domain. |

**Integration approach:** Create `"use client"` chart components that receive data as props from Server Components. JSON time-series data read server-side, passed down.

```typescript
// TokenTrendChart.tsx
"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
```

### 3. Time-Series Data Storage: Append-only JSON with daily snapshots

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Node.js fs (built-in) | - | Read/write JSON snapshots | Already using JSON files. No new dependency needed. |

**Why NOT add a database:**

The project uses JSON files and is a local solo-dev dashboard. Adding SQLite or PostgreSQL for time-series data would be overengineering. Instead:

- **Pattern:** One JSON file per metric type with daily entries appended
- **Structure:** `data/history/tokens-history.json`, `data/history/quality-history.json`
- **Format:** Array of `{ date: "2026-01-30", ...snapshot }` entries
- **Retention:** Keep 90 days, prune older entries on each sync

```json
// data/history/tokens-history.json
[
  { "date": "2026-01-28", "totalSpent": 142.50, "byProject": { ... } },
  { "date": "2026-01-29", "totalSpent": 148.20, "byProject": { ... } }
]
```

**When to reconsider:** If data exceeds ~10MB or queries become complex, migrate to SQLite via `better-sqlite3`. Not expected at $200/month budget scale.

### 4. Budget Alerts & Desktop Notifications: Web Notifications API (built-in)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Notification API (browser) | - | Desktop toast notifications | Built into all modern browsers. Zero dependencies. |
| node-notifier | ^10 | OS-native notifications from Node.js process | For cron-triggered alerts (server-side). Cross-platform. |

**Why this split approach:**

- **Browser tab open:** Use the Web Notifications API directly. Zero deps.
- **Background sync process:** Use `node-notifier` to trigger OS-native notifications when thresholds are crossed during automated sync.

| Option | Verdict | Reason |
|--------|---------|--------|
| **Web Notifications API** | RECOMMENDED (browser) | Built-in, no library needed. `new Notification("Budget Alert", { body: "..." })` |
| **node-notifier** | RECOMMENDED (server) | Triggers native OS notifications from Node.js. Works on Linux/macOS/Windows. |
| Electron | NO | Would require rewriting the entire app. Massive overengineering. |
| web-push / service workers | NO | Designed for PWAs with push servers. Overkill for a local app. |
| react-toastify / sonner | MAYBE (in-app) | Good for in-app toast notifications while browsing. Consider `sonner` as it pairs well with shadcn/ui. |

**Additional recommendation for in-app toasts:**

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| sonner | ^2.0 | In-app toast notifications | shadcn/ui officially integrates with sonner. Styled with Tailwind. |

### 5. Alert Threshold System: No library needed

Pure TypeScript logic. Define thresholds in a config JSON file:

```json
// data/config/alerts.json
{
  "budgetAlerts": [
    { "threshold": 0.8, "level": "warning", "message": "80% of monthly budget used" },
    { "threshold": 0.95, "level": "critical", "message": "95% of monthly budget used" }
  ],
  "qualityAlerts": [
    { "metric": "codeReviewCoverage", "below": 0.7, "level": "warning" }
  ]
}
```

No library needed. Simple comparisons in TypeScript.

## Complete Addition Summary

### Install (production dependencies)

```bash
cd /home/tomas/Escritorio/AIAIAI_Consulting/app
npm install recharts sonner croner
```

### Install (for sync process, if separate)

```bash
npm install node-notifier
npm install -D @types/node-notifier
```

### Total new dependencies: 4

| Package | Size (approx) | Purpose |
|---------|---------------|---------|
| recharts | ~400KB | Charts |
| sonner | ~20KB | In-app toasts |
| croner | ~15KB | Cron scheduling |
| node-notifier | ~50KB | OS notifications from Node |

### What NOT to add

| Technology | Why Not |
|------------|---------|
| PostgreSQL / SQLite | JSON files sufficient at this scale |
| Redis | No pub/sub or caching needs for local app |
| Bull / BullMQ | Job queues need Redis. Croner is enough for simple scheduling. |
| Prisma / Drizzle | No database to ORM |
| D3.js directly | Recharts wraps D3 with React API. Direct D3 is too low-level. |
| tremor | Conflicts with existing shadcn/ui component system |
| Electron | Massive scope change for desktop notifications that the browser API handles |
| Service Workers / PWA | Overengineered for a local dashboard |

## Integration Points with Existing Stack

| New Capability | Integrates With | How |
|----------------|-----------------|-----|
| croner scheduling | Existing sync scripts (project-sync, token-sync, quality-sync) | Imports and calls them on schedule |
| recharts | Server Components data reading | Server Component reads JSON, passes to `"use client"` chart component |
| sonner | shadcn/ui layout | `<Toaster />` in root layout, trigger from alert checks |
| node-notifier | Sync scheduler process | Called when threshold comparison triggers during sync |
| History JSON files | Existing data/*.json | Sync scripts append snapshot after each run |

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| croner | MEDIUM | Well-known in Node ecosystem. Verify latest version with `npm info croner` before installing. |
| recharts | MEDIUM | Most popular React chart lib. v2.x stable. Verify React 19 compatibility. |
| sonner | MEDIUM | shadcn/ui officially recommends it. Verify v2 compatibility with Next.js 16. |
| node-notifier | MEDIUM | Mature library. Verify Linux support on developer's system. |
| JSON time-series pattern | HIGH | Simple file I/O, no external dependency risk. |
| Web Notifications API | HIGH | Browser standard, no library needed. |

## Verification Steps Before Installing

```bash
# Check latest versions and React 19 peer dep compatibility
npm info croner version
npm info recharts version peerDependencies
npm info sonner version peerDependencies
npm info node-notifier version
```

## Sources

- package.json at `/home/tomas/Escritorio/AIAIAI_Consulting/app/package.json` (verified)
- Training data (May 2025) for library comparisons — marked MEDIUM confidence
- Web Notifications API: MDN Web Docs (stable browser standard)
- Note: WebSearch was unavailable during this research session. Version numbers should be verified with `npm info` before installation.

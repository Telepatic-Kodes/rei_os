# Project Research Summary

**Project:** AIAIAI Consulting Dashboard — Milestone 2
**Domain:** Local solo-consultant monitoring dashboard (automation, analytics, alerts)
**Researched:** 2026-01-30
**Confidence:** MEDIUM-HIGH

## Executive Summary

This milestone adds automation, analytics, and budget alerting to an existing local Next.js dashboard backed by JSON files. The project serves a single consultant tracking AI token spend across ~14 projects with a $200/month budget. The existing stack (Next.js 16, React 19, TypeScript, Tailwind v4, shadcn/ui) is solid and requires only 4 new dependencies: croner (scheduling), recharts (charts), sonner (toasts), and node-notifier (OS notifications).

The recommended approach keeps the JSON-file architecture and avoids database migration entirely. Time-series data should use append-only JSONL files partitioned monthly, with aggregated summaries rather than raw data duplication. The cron scheduler should run as a separate Node.js process outside Next.js -- this is the single most important architectural decision. Running cron inside Next.js (via instrumentation.ts or API routes) will cause missed syncs, double-fires, and zombie timers on HMR restarts.

The primary risks are JSON file corruption from concurrent writes (solved with atomic rename pattern), unbounded file growth (solved with monthly partitioning), and over-engineering the alert system (solved by keeping it to a simple threshold check). All risks have straightforward mitigations that should be implemented in the first phase before any automation touches data files.

## Key Findings

### Recommended Stack

Only 4 new packages needed. The existing stack requires zero changes.

- **croner** (~15KB): Cron scheduling -- modern ESM-native, zero deps, TypeScript built-in. Runs in separate Node process.
- **recharts** (~400KB): Time-series charts -- React-declarative API over D3, composable, works as client components receiving server-side data.
- **sonner** (~20KB): In-app toast notifications -- officially recommended by shadcn/ui, Tailwind-styled.
- **node-notifier** (~50KB): OS-level desktop notifications from the cron process when browser is closed.

What NOT to add: database (PostgreSQL/SQLite), WebSockets, service workers, Electron, tremor, job queues (Bull/BullMQ).

### Expected Features

**Must have (table stakes):**
- Cron-based auto-sync wrapping existing sync scripts
- Manual sync button with last-synced timestamp
- Sync status indicator (success/error badge)
- Monthly spend summary with budget progress bar
- Per-project token spend over time (line chart)
- Global budget threshold alert (80%/95%) with visual banner

**Should have (differentiators):**
- Burn rate projection ("you will hit budget on Jan 24")
- Per-project budget limits
- Cost-per-model breakdown (opus vs sonnet)
- Desktop notifications via Browser Notification API

**Defer (v2+):**
- Quality/velocity trend tracking (needs data accumulation time)
- Weekly email/summary digest
- Per-project alerting rules

### Architecture Approach

The architecture follows a strict separation: Next.js reads data, external scripts write data. A standalone SyncManager process runs croner on a schedule, calls existing sync functions, writes snapshots to `data/*.json`, appends summaries to `data/history/*.jsonl`, and evaluates alert thresholds. Next.js Server Components read JSON files and pass data to client chart/alert components.

**Major components:**
1. **SyncManager** (separate Node process) -- croner scheduler, runs sync functions, appends history, evaluates alerts
2. **lib/data.ts extensions** -- `appendHistory()`, `getHistory()`, `getAlertConfig()` alongside existing read/write
3. **TrendChart** (recharts client component) -- line/area charts for historical spend data
4. **AlertBanner + NotificationProvider** (client components) -- visual alerts and browser notification permission
5. **API routes** -- `/api/sync` (manual trigger), `/api/sync/status`, `/api/alerts/config`

### Critical Pitfalls

1. **JSON file corruption on concurrent write** -- Use atomic write pattern: write to temp file, then `fs.renameSync()`. Keep `.bak` copies. Single-writer pattern per file.
2. **Cron inside Next.js process** -- HMR kills timers, schedules double-fire. Run cron as separate Node process, never inside `app/` or `src/`.
3. **Unbounded JSON file growth** -- Partition history files monthly (`tokens-2026-01.jsonl`). Store aggregated summaries only, not raw data.
4. **Breaking existing data shape** -- Add new files for new data, never restructure existing JSON. Define TypeScript interfaces + Zod validation.
5. **Over-engineering alerts** -- Keep it to `if (spend > budget * 0.8) notify()`. No queues, no escalation chains, no rules engine.

## Implications for Roadmap

### Phase 1: Data Infrastructure and Safety

**Rationale:** Everything depends on safe, structured data storage. Must be done before any automation writes to files.
**Delivers:** Atomic write utilities, JSONL history infrastructure, data directory structure (`data/live/`, `data/history/`), `.gitignore` for auto-generated data, TypeScript interfaces for all JSON schemas, Zod validation on data load.
**Addresses:** Data foundation for all subsequent features.
**Avoids:** Pitfalls #1 (corruption), #2 (unbounded growth), #6 (breaking data shape), #7 (git tracking noise).

### Phase 2: Automated Sync

**Rationale:** Core pain point -- eliminating manual script runs. Depends on Phase 1 safety infrastructure.
**Delivers:** SyncManager as separate Node process with croner, idempotent sync scripts, history recording after each sync, `npm run sync:watch` command, manual sync API route + UI button, sync status indicator.
**Uses:** croner package, existing sync scripts (refactored to importable functions).
**Avoids:** Pitfalls #3 (cron inside Next.js), #8 (timezone), #9 (idempotency).

### Phase 3: Analytics and Charts

**Rationale:** Requires history data from Phase 2 to have accumulated. Independent of alerting.
**Delivers:** Recharts-based TrendChart component, per-project spend over time, monthly spend summary with budget bar, cost-per-model breakdown. Pre-computed analytics in sync scripts, displayed by simple client components.
**Uses:** recharts package, JSONL history data from Phase 2.
**Avoids:** Pitfall #10 (client-side computation).

### Phase 4: Budget Alerts and Notifications

**Rationale:** Depends on sync pipeline (Phase 2) for threshold evaluation. Charts (Phase 3) provide context for alert values.
**Delivers:** Alert threshold config (`data/config/alerts.json`), alert evaluation after each sync, AlertBanner component, sidebar notification dot, sonner in-app toasts, Browser Notification API permission flow, node-notifier for OS notifications from cron process, burn rate projection.
**Uses:** sonner, node-notifier, Browser Notification API.
**Avoids:** Pitfalls #4 (over-engineering), #5 (wrong notification approach).

### Phase Ordering Rationale

- Data safety must come first because automation will write to files continuously
- Sync before charts because charts need historical data to display
- Charts before alerts because understanding spend visually informs alert threshold design
- Each phase delivers standalone value: Phase 1 = safer data, Phase 2 = no manual work, Phase 3 = visibility, Phase 4 = protection

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2:** Verify croner and node-notifier compatibility with current Node.js version. Test HMR behavior with separate process.

Phases with standard patterns (skip research-phase):
- **Phase 1:** Standard file I/O patterns, TypeScript interfaces, Zod validation. Well-documented.
- **Phase 3:** Recharts is extensively documented with React examples. Straightforward integration.
- **Phase 4:** Browser Notification API is a W3C standard. Sonner has shadcn/ui integration docs.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Library versions need `npm info` verification (no web search available). React 19 + Next.js 16 compatibility unverified for recharts/sonner. |
| Features | HIGH | Well-understood domain. Feature list derived from direct codebase analysis. |
| Architecture | HIGH | Based on concrete project structure analysis. Next.js patterns well-established. |
| Pitfalls | HIGH | Based on direct codebase analysis and known JSON/Node.js failure modes. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **React 19 compatibility:** Verify recharts and sonner work with React 19 before installing. Run `npm info recharts peerDependencies`.
- **Next.js 16 instrumentation.ts:** ARCHITECTURE.md suggests using it for cron, but PITFALLS.md warns against cron inside Next.js. Resolution: use separate process (PITFALLS recommendation wins -- it is the safer approach).
- **JSONL vs JSON for history:** STACK.md recommends JSON arrays, ARCHITECTURE.md recommends JSONL. Resolution: use JSONL (append-friendly, no full-file parse needed for writes).
- **croner vs node-cron:** STACK.md recommends croner, FEATURES/ARCHITECTURE mention node-cron. Resolution: use croner (ESM-native, zero deps, better for modern TS projects).

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis: `app/package.json`, `data/tokens.json`, `app/src/` routes and components
- Node.js `fs.renameSync` atomicity: Node.js official documentation
- Browser Notification API: W3C standard, MDN Web Docs
- Next.js App Router patterns: official documentation

### Secondary (MEDIUM confidence)
- Library comparisons (recharts, croner, sonner, node-notifier): based on training data through May 2025
- Version numbers: need verification via `npm info` before installation

---
*Research completed: 2026-01-30*
*Ready for roadmap: yes*

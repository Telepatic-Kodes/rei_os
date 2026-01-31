# Roadmap: AIAIAI Consulting

## Milestones

- ✅ **v1.0 Operational Dashboard** — Phases 1-4 (shipped 2026-01-30)
- 🚧 **v2.0 Analytics, Automation & Alerts** — Phases 5-8 (in progress)

## Phases

<details>
<summary>✅ v1.0 Operational Dashboard (Phases 1-4) — SHIPPED 2026-01-30</summary>

- [x] Phase 1: Foundation & Dashboard — 17 requirements delivered
- [x] Phase 2: Kanban Board — PROJ-03, PROJ-04
- [x] Phase 3: Data Persistence & Detail Pages — PROJ-05, INFR-04, INFR-05
- [x] Phase 4: Auto-sync & Integrations — TOKN-04, QUAL-03

See: `.planning/milestones/v1.0-ROADMAP.md` for full details.

</details>

### 🚧 v2.0 Analytics, Automation & Alerts (In Progress)

**Milestone Goal:** Make the dashboard self-updating with historical analytics and proactive budget alerts so nothing needs manual checking.

- [x] **Phase 5: Data Infrastructure & Safety** — Safe, typed data foundation for automated writes
- [x] **Phase 6: Automated Sync** — Eliminate manual script execution with scheduled and on-demand sync
- [x] **Phase 7: Analytics & Charts** — Visual token spend trends and budget projections
- [ ] **Phase 8: Budget Alerts & Notifications** — Proactive warnings before budget overruns

## Phase Details

### Phase 5: Data Infrastructure & Safety
**Goal**: All data files are safely writable by automated processes with typed schemas and history support
**Depends on**: Phase 4 (existing sync scripts)
**Requirements**: INFR-01, INFR-02, INFR-03, AUTO-04, AUTO-05
**Success Criteria** (what must be TRUE):
  1. JSONL history files exist with monthly rotation (e.g., `tokens-2026-01.jsonl`) and old months do not grow unboundedly
  2. Every JSON and JSONL data shape has a corresponding TypeScript interface and can be validated at load time
  3. Auto-generated data files are gitignored while seed/config data remains tracked
  4. Running any sync script twice in a row produces identical data files (idempotent)
  5. A simulated concurrent write does not corrupt JSON files (atomic temp-file + rename pattern works)
**Plans**: 2 plans

Plans:
- [x] 05-01-PLAN.md — Zod schemas, atomic write utilities, JSONL history infrastructure, budget config extraction
- [x] 05-02-PLAN.md — Refactor data.ts with validation, update sync scripts, gitignore setup

### Phase 6: Automated Sync
**Goal**: Dashboard data stays current without manual intervention, with visible sync status
**Depends on**: Phase 5 (safe write infrastructure)
**Requirements**: AUTO-01, AUTO-02, AUTO-03, ANLT-01, ANLT-05
**Success Criteria** (what must be TRUE):
  1. A background cron process automatically runs all sync scripts on a configurable interval without user action
  2. Clicking a refresh button in the dashboard header triggers an immediate sync and shows updated data
  3. The dashboard displays when the last sync occurred and whether it succeeded or failed
  4. Each sync run appends a daily snapshot to JSONL history files (append-only log)
  5. Analytics values (totals, trends, averages) are pre-computed during sync and served as static JSON to the frontend
**Plans**: 3 plans

Plans:
- [x] 06-01-PLAN.md — SyncManager orchestrator + croner cron process + sync config
- [x] 06-02-PLAN.md — Manual sync API route, refresh button, sync status indicator in dashboard header
- [x] 06-03-PLAN.md — Pre-computed analytics generator and JSONL history integration

### Phase 7: Analytics & Charts
**Goal**: Users can see token spend trends, cost breakdowns, and budget projections at a glance
**Depends on**: Phase 6 (historical data from sync)
**Requirements**: ANLT-02, ANLT-03, ANLT-04
**Success Criteria** (what must be TRUE):
  1. Each project page shows a line chart of token spend over the past 7 and 30 days
  2. A cost-per-model view breaks down spending between opus and sonnet (and any other models)
  3. A burn rate indicator shows the projected date when the monthly $200 budget will be exhausted
**Plans**: 2 plans

Plans:
- [x] 07-01-PLAN.md — Recharts integration, data helpers, spend trend chart, analytics page
- [x] 07-02-PLAN.md — Cost-per-model breakdown chart and burn rate projection card

### Phase 8: Budget Alerts & Notifications
**Goal**: Users are proactively warned before budget overruns through multiple notification channels
**Depends on**: Phase 6 (sync pipeline for threshold evaluation), Phase 7 (charts provide spend context)
**Requirements**: ALRT-01, ALRT-02, ALRT-03, ALRT-04, ALRT-05
**Success Criteria** (what must be TRUE):
  1. When global spend crosses 75% or 90% of $200 (configurable), an alert banner appears at the top of the dashboard
  2. Each project can have its own budget limit set via a JSON config file, and crossing it triggers an alert
  3. Desktop notifications (via node-notifier) fire from the cron process when thresholds are breached, even if the browser is closed
  4. Browser Notification API alerts appear when the dashboard tab is open and a threshold is crossed
  5. Alert thresholds and per-project limits are editable in a single config file without code changes
**Plans**: TBD

Plans:
- [ ] 08-01: Alert config, threshold evaluation, and dashboard banner
- [ ] 08-02: Desktop and browser notifications

## Progress

**Execution Order:** 5 -> 6 -> 7 -> 8

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation & Dashboard | v1.0 | 1/1 | Complete | 2026-01-29 |
| 2. Kanban Board | v1.0 | 1/1 | Complete | 2026-01-29 |
| 3. Data Persistence | v1.0 | 3/3 | Complete | 2026-01-30 |
| 4. Auto-sync | v1.0 | 2/2 | Complete | 2026-01-30 |
| 5. Data Infrastructure & Safety | v2.0 | 2/2 | Complete | 2026-01-31 |
| 6. Automated Sync | v2.0 | 3/3 | Complete | 2026-01-31 |
| 7. Analytics & Charts | v2.0 | 2/2 | Complete | 2026-01-31 |
| 8. Budget Alerts & Notifications | v2.0 | 0/2 | Not started | - |

---
*Roadmap created: 2026-01-30*
*Last updated: 2026-01-31 after Phase 7 execution*

# Requirements: AIAIAI Consulting

**Defined:** 2026-01-30
**Core Value:** One place to see the status, cost, and health of every project — so nothing falls through the cracks

## v2.0 Requirements

Requirements for milestone v2.0: Analytics, Automation & Alerts.

### Automation

- [x] **AUTO-01**: Cron scheduler runs all sync scripts automatically on configurable interval
- [x] **AUTO-02**: Manual refresh button in dashboard header triggers sync on demand
- [x] **AUTO-03**: Sync status indicator shows last sync time and success/error state
- [x] **AUTO-04**: Sync scripts use atomic writes (temp file + rename) to prevent JSON corruption
- [x] **AUTO-05**: Sync scripts are idempotent (running twice produces same result)

### Analytics

- [x] **ANLT-01**: Historical data stored as JSONL append-only logs with daily snapshots
- [x] **ANLT-02**: Per-project token spend line chart showing trends over days/weeks
- [x] **ANLT-03**: Cost-per-model breakdown (opus vs sonnet spending)
- [x] **ANLT-04**: Burn rate projection showing predicted budget exhaustion date
- [x] **ANLT-05**: Analytics pre-computed in sync scripts, not calculated client-side

### Alerts

- [x] **ALRT-01**: Global budget threshold alerts at configurable levels (default 75%, 90%)
- [x] **ALRT-02**: Per-project budget limits configurable via JSON config
- [x] **ALRT-03**: Alert banner displayed in dashboard when thresholds crossed
- [x] **ALRT-04**: Desktop notifications via node-notifier when sync detects threshold breach
- [x] **ALRT-05**: Browser Notification API for in-app alerts when tab is open

### Infrastructure

- [x] **INFR-01**: JSONL history files with monthly rotation to prevent unbounded growth
- [x] **INFR-02**: TypeScript interfaces for all data shapes (history, alerts, config)
- [x] **INFR-03**: Auto-generated data files gitignored, seed data tracked separately

## Future Requirements

Deferred to v3.0+.

- **GHUB-01**: GitHub integration for commit/PR stats per project
- **GHUB-02**: Cross-project comparison views and rankings
- **ANLT-06**: Quality score trends over time (coverage, lighthouse)
- **ANLT-07**: Velocity tracking (sessions per day/week)
- **ANLT-08**: Weekly summary digest auto-generated as markdown

## Out of Scope

| Feature | Reason |
|---------|--------|
| Database backend (SQLite/PostgreSQL) | JSON + JSONL sufficient at this scale |
| WebSocket real-time sync | Polling + manual refresh sufficient for local dashboard |
| External notification services (Slack, Pushover) | node-notifier + browser notifications cover solo use |
| Complex alerting rules engine | Two threshold levels sufficient for $200/month budget |
| Multi-user auth/RBAC | Solo consultant |
| Service workers / PWA push | Overkill for localhost |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFR-01 | Phase 5 | Complete |
| INFR-02 | Phase 5 | Complete |
| INFR-03 | Phase 5 | Complete |
| AUTO-04 | Phase 5 | Complete |
| AUTO-05 | Phase 5 | Complete |
| AUTO-01 | Phase 6 | Complete |
| AUTO-02 | Phase 6 | Complete |
| AUTO-03 | Phase 6 | Complete |
| ANLT-01 | Phase 6 | Complete |
| ANLT-05 | Phase 6 | Complete |
| ANLT-02 | Phase 7 | Complete |
| ANLT-03 | Phase 7 | Complete |
| ANLT-04 | Phase 7 | Complete |
| ALRT-01 | Phase 8 | Complete |
| ALRT-02 | Phase 8 | Complete |
| ALRT-03 | Phase 8 | Complete |
| ALRT-04 | Phase 8 | Complete |
| ALRT-05 | Phase 8 | Complete |

**Coverage:**
- v2.0 requirements: 18 total
- Mapped to phases: 18/18
- Unmapped: 0

---
*Requirements defined: 2026-01-30*
*Last updated: 2026-01-31 after Phase 8 completion — all v2.0 requirements complete*

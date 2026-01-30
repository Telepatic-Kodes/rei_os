# Requirements: AIAIAI Consulting

**Defined:** 2026-01-30
**Core Value:** One place to see the status, cost, and health of every project — so nothing falls through the cracks

## v2.0 Requirements

Requirements for milestone v2.0: Analytics, Automation & Alerts.

### Automation

- [ ] **AUTO-01**: Cron scheduler runs all sync scripts automatically on configurable interval
- [ ] **AUTO-02**: Manual refresh button in dashboard header triggers sync on demand
- [ ] **AUTO-03**: Sync status indicator shows last sync time and success/error state
- [ ] **AUTO-04**: Sync scripts use atomic writes (temp file + rename) to prevent JSON corruption
- [ ] **AUTO-05**: Sync scripts are idempotent (running twice produces same result)

### Analytics

- [ ] **ANLT-01**: Historical data stored as JSONL append-only logs with daily snapshots
- [ ] **ANLT-02**: Per-project token spend line chart showing trends over days/weeks
- [ ] **ANLT-03**: Cost-per-model breakdown (opus vs sonnet spending)
- [ ] **ANLT-04**: Burn rate projection showing predicted budget exhaustion date
- [ ] **ANLT-05**: Analytics pre-computed in sync scripts, not calculated client-side

### Alerts

- [ ] **ALRT-01**: Global budget threshold alerts at configurable levels (default 75%, 90%)
- [ ] **ALRT-02**: Per-project budget limits configurable via JSON config
- [ ] **ALRT-03**: Alert banner displayed in dashboard when thresholds crossed
- [ ] **ALRT-04**: Desktop notifications via node-notifier when sync detects threshold breach
- [ ] **ALRT-05**: Browser Notification API for in-app alerts when tab is open

### Infrastructure

- [ ] **INFR-01**: JSONL history files with monthly rotation to prevent unbounded growth
- [ ] **INFR-02**: TypeScript interfaces for all data shapes (history, alerts, config)
- [ ] **INFR-03**: Auto-generated data files gitignored, seed data tracked separately

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
| INFR-01 | — | Pending |
| INFR-02 | — | Pending |
| INFR-03 | — | Pending |
| AUTO-01 | — | Pending |
| AUTO-02 | — | Pending |
| AUTO-03 | — | Pending |
| AUTO-04 | — | Pending |
| AUTO-05 | — | Pending |
| ANLT-01 | — | Pending |
| ANLT-02 | — | Pending |
| ANLT-03 | — | Pending |
| ANLT-04 | — | Pending |
| ANLT-05 | — | Pending |
| ALRT-01 | — | Pending |
| ALRT-02 | — | Pending |
| ALRT-03 | — | Pending |
| ALRT-04 | — | Pending |
| ALRT-05 | — | Pending |

**Coverage:**
- v2.0 requirements: 18 total
- Mapped to phases: 0 (pending roadmap)
- Unmapped: 18 ⚠️

---
*Requirements defined: 2026-01-30*
*Last updated: 2026-01-30 after initial definition*

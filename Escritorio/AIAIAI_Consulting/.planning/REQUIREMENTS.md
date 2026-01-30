# Requirements: AIAIAI Consulting

**Defined:** 2026-01-30
**Core Value:** One place to see the status, cost, and health of every project

## v1 Requirements

### Dashboard

- [x] **DASH-01**: Home page shows summary stats (total projects, active, budget usage)
- [x] **DASH-02**: Token consumption bar chart on home page
- [x] **DASH-03**: Project list with status, progress, and stack badges
- [x] **DASH-04**: Sidebar navigation across all views
- [x] **DASH-05**: Dark mode UI

### Projects

- [x] **PROJ-01**: Projects page shows all projects grouped by status
- [x] **PROJ-02**: Project cards display name, client, progress, stack, dates
- [x] **PROJ-03**: Kanban board with 3 status columns (active/paused/completed)
- [x] **PROJ-04**: Drag & drop projects between kanban columns
- [x] **PROJ-05**: Persist kanban state changes to projects.json

### Tokens

- [x] **TOKN-01**: Token consumption page with monthly budget display
- [x] **TOKN-02**: Per-project token breakdown table
- [x] **TOKN-03**: Budget usage percentage and remaining display
- [ ] **TOKN-04**: Auto-sync token data from Anthropic API

### Quality

- [x] **QUAL-01**: Quality metrics page with per-project cards
- [x] **QUAL-02**: Test coverage, lighthouse score, open issues, tech debt display
- [ ] **QUAL-03**: Auto-collect quality metrics from project CI/tests

### Infrastructure

- [x] **INFR-01**: Monorepo structure with projects/ directory
- [x] **INFR-02**: JSON-based data layer (projects, tokens, quality)
- [x] **INFR-03**: Claude Code configuration (CLAUDE.md, agents, MCP)
- [x] **INFR-04**: Auto-sync project metadata from git/package.json
- [x] **INFR-05**: Per-project detail pages with history

## v2 Requirements

### Automation

- **AUTO-01**: Webhook/cron to refresh project data periodically
- **AUTO-02**: Automated quality scoring pipeline
- **AUTO-03**: Token budget alerts via email/notification

### Analytics

- **ANLT-01**: Historical trends for token consumption
- **ANLT-02**: Project velocity tracking (tasks completed over time)
- **ANLT-03**: Cost per project analysis

### Integration

- **INTG-01**: GitHub integration for commit/PR stats
- **INTG-02**: Anthropic API for real token usage
- **INTG-03**: Lighthouse CI integration

## Out of Scope

| Feature | Reason |
|---------|--------|
| Multi-user auth | Solo consultant, no need |
| Cloud deployment | Local dashboard sufficient |
| Real-time collaboration | Single user |
| Mobile app | Desktop browser primary |
| Billing/invoicing | Handled externally |
| Database backend | JSON sufficient for current scale |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DASH-01 | Phase 1 | Complete |
| DASH-02 | Phase 1 | Complete |
| DASH-03 | Phase 1 | Complete |
| DASH-04 | Phase 1 | Complete |
| DASH-05 | Phase 1 | Complete |
| PROJ-01 | Phase 1 | Complete |
| PROJ-02 | Phase 1 | Complete |
| PROJ-03 | Phase 2 | Complete |
| PROJ-04 | Phase 2 | Complete |
| PROJ-05 | Phase 3 | Complete |
| TOKN-01 | Phase 1 | Complete |
| TOKN-02 | Phase 1 | Complete |
| TOKN-03 | Phase 1 | Complete |
| TOKN-04 | Phase 4 | Pending |
| QUAL-01 | Phase 1 | Complete |
| QUAL-02 | Phase 1 | Complete |
| QUAL-03 | Phase 4 | Pending |
| INFR-01 | Phase 1 | Complete |
| INFR-02 | Phase 1 | Complete |
| INFR-03 | Phase 1 | Complete |
| INFR-04 | Phase 3 | Complete |
| INFR-05 | Phase 3 | Complete |

**Coverage:**
- v1 requirements: 22 total
- Mapped to phases: 22
- Complete: 20
- Pending: 2
- Unmapped: 0 ✓

---
*Requirements defined: 2026-01-30*
*Last updated: 2026-01-30 after GSD initialization*

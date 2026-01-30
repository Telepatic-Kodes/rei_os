# Roadmap: AIAIAI Consulting

**Created:** 2026-01-30
**Milestone:** v1.0 — Operational Dashboard

## Phase Overview

| Phase | Name | Status | Requirements |
|-------|------|--------|-------------|
| 1 | Foundation & Dashboard | ✓ Complete | DASH-01..05, PROJ-01..02, TOKN-01..03, QUAL-01..02, INFR-01..03 |
| 2 | Kanban Board | ✓ Complete | PROJ-03, PROJ-04 |
| 3 | Data Persistence & Detail Pages | ✓ Complete | PROJ-05, INFR-04, INFR-05 |
| 4 | Auto-sync & Integrations | ○ Pending | TOKN-04, QUAL-03 |

## Phase Details

### Phase 1: Foundation & Dashboard ✓

**Goal:** Build the core dashboard with all monitoring views and organize the monorepo.

**Success criteria:**
- Next.js app runs with home, projects, tokens, quality pages
- 14 projects organized under projects/
- JSON data layer serves all views
- Claude Code fully configured

**Status:** Complete — all 17 requirements delivered.

### Phase 2: Kanban Board ✓

**Goal:** Add interactive kanban view for visual project management.

**Success criteria:**
- Kanban page with 3 status columns
- Drag & drop moves projects between columns
- Sidebar navigation includes kanban link

**Status:** Complete — PROJ-03, PROJ-04 delivered.

### Phase 3: Data Persistence & Detail Pages ✓

**Goal:** Make the dashboard read-write and add per-project deep views.

**Requirements:**
- [x] **PROJ-05**: Persist kanban drag & drop to projects.json (API route + fs write)
- [x] **INFR-04**: Auto-sync project metadata from git log, package.json
- [x] **INFR-05**: Per-project detail page with timeline, commits, metrics history

**Success criteria:**
- Kanban changes persist across page refresh
- Project data auto-updates from actual project directories
- Each project has a /projects/[id] detail page

**Status:** Complete — PROJ-05, INFR-04, INFR-05 delivered.

### Phase 4: Auto-sync & Integrations

**Goal:** Connect to external data sources for real metrics.

**Requirements:**
- [ ] **TOKN-04**: Fetch real token usage from Anthropic API
- [ ] **QUAL-03**: Auto-collect quality metrics (test coverage, lighthouse)

**Success criteria:**
- Token page shows real Anthropic API usage data
- Quality metrics auto-populate from project CI/test output

---

**Progress:** █████████░ 91% (20/22 requirements complete)

*Roadmap created: 2026-01-30*
*Last updated: 2026-01-30 after GSD initialization*

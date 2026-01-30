# AIAIAI Consulting

## What This Is

Monorepo hub for an AI consulting practice that centralizes 14+ client and internal projects, with a Next.js dashboard for monitoring development progress, token consumption, and code quality. Includes interactive kanban board, per-project detail pages, and automated sync scripts for real-time data from git, Anthropic API, and CI pipelines.

## Core Value

One place to see the status, cost, and health of every project — so nothing falls through the cracks.

## Requirements

### Validated

- ✓ Dashboard home with summary stats, token chart, project list — v1.0
- ✓ Projects page grouped by status (active/paused/completed) — v1.0
- ✓ Token consumption tracking with per-project breakdown — v1.0
- ✓ Quality metrics page (coverage, lighthouse, issues, tech debt) — v1.0
- ✓ Kanban board with drag & drop between status columns — v1.0
- ✓ Sidebar navigation across all views — v1.0
- ✓ 14 projects physically organized under projects/ — v1.0
- ✓ JSON-based data layer (projects.json, tokens.json, quality.json) — v1.0
- ✓ Claude Code config (CLAUDE.md, 8 agents, MCP servers) — v1.0
- ✓ Kanban persistence via PATCH API with optimistic UI — v1.0
- ✓ Auto-sync project data from git stats and package.json — v1.0
- ✓ Token consumption API integration (Anthropic Admin API) — v1.0
- ✓ Per-project detail pages with timeline and metrics history — v1.0
- ✓ Quality metrics auto-collection (coverage, lighthouse, TODO/FIXME) — v1.0

### Active

- [ ] Alerts/notifications when budget thresholds are crossed
- [ ] Historical trends for token consumption
- [ ] Project velocity tracking (tasks completed over time)
- [ ] Cost per project analysis
- [ ] GitHub integration for commit/PR stats
- [ ] Webhook/cron to refresh project data periodically

### Out of Scope

- Multi-user auth — solo consultant, no need
- Cloud deployment — local dashboard is sufficient for now
- Real-time collaboration — single user
- Mobile app — desktop browser is primary usage
- Billing/invoicing — handled externally
- Database backend — JSON sufficient for current scale

## Context

- 14 projects span: real estate (rei-os, inmobiliariapp), media (remotion-system, my-remotion-video), AI tools (claude-workspace, topic-intelligence), pricing (pricing-radar), music (guitarrap), personal (personal-os, sueno-andino), advertising (money-ads)
- Mix of active development, paused, and completed projects
- Token budget: $200/month across all projects
- Stack: Next.js 16, React 19, TypeScript, Tailwind v4, shadcn/ui
- v1.0 shipped: 1,792 LOC TypeScript, 26 commits, 4 phases

## Constraints

- **Stack**: Next.js + shadcn/ui — already built, maintain consistency
- **Data**: JSON files for now — no database until complexity warrants it
- **Budget**: $200/month token budget across all projects
- **Solo**: Single developer/consultant — no team workflows needed

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Monorepo with projects/ subdirectory | Centralize all work, easy navigation | ✓ Good |
| JSON files over database | Simplicity, no infra needed, git-trackable | ✓ Good |
| Next.js Server Components for data | No API layer needed, direct fs reads | ✓ Good |
| HTML5 drag & drop over libraries | No extra dependencies for simple kanban | ✓ Good |
| shadcn/ui component library | Consistent design, copy-paste customizable | ✓ Good |
| Optimistic UI with revert on failure | Instant feedback, consistent with server state | ✓ Good |
| __dirname over import.meta.dirname | tsx CJS compatibility | ✓ Good |
| Graceful exit 0 without credentials | No CI failures in environments without API keys | ✓ Good |
| Session-based merge for token sync | Separates automated from manual entries | ✓ Good |
| techDebt from coverage+lighthouse thresholds | Simple derivation, no external deps | ✓ Good |

---
*Last updated: 2026-01-30 after v1.0 milestone*

# AIAIAI Consulting

## What This Is

Monorepo hub for an AI consulting practice that centralizes 14+ client and internal projects, with a self-updating Next.js dashboard for monitoring development progress, token consumption, code quality, and budget health. Includes interactive kanban board, per-project detail pages, automated cron sync, historical analytics with Recharts visualizations, and proactive budget alerts via dashboard banners, desktop notifications, and browser Notification API.

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

- ✓ Automated data sync via cron + manual refresh button — v2.0
- ✓ Per-project token spend trends over time (days/weeks) — v2.0
- ✓ Budget alerts with per-project limits and global monthly cap — v2.0
- ✓ Desktop notifications for threshold breaches — v2.0
- ✓ Cost per project analysis — v2.0

### Active

(None — v3.0 planning needed)

### Deferred (v3.0+)

- GitHub integration for commit/PR stats
- Cross-project comparison views and rankings
- Quality score trends over time (coverage, lighthouse)
- Weekly summary digest auto-generated as markdown

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
- Stack: Next.js 16, React 19, TypeScript, Tailwind v4, shadcn/ui, Zod, croner, Recharts 3.7.0, node-notifier, sonner
- v1.0 shipped: 1,792 LOC TypeScript, 26 commits, 4 phases (2026-01-30)
- v2.0 shipped: 8,650 LOC TypeScript (cumulative), 39 commits, 4 phases (2026-02-01)
- Total development time: 4 days (2026-01-29 → 2026-02-01)

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
| Zod for runtime validation | Catch data corruption at load time, not runtime | ✓ Good |
| Atomic writes (tmp+rename) | Prevent JSON corruption on concurrent access | ✓ Good |
| Cron as separate Node process | Avoid Next.js lifecycle issues, clean separation | ✓ Good |
| croner for scheduling | Lightweight, ESM-native, no heavy dependencies | ✓ Good |
| Recharts 3.7.0 | React 19 compatible, maintained, good TypeScript support | ✓ Good |
| Fire-once alert pattern | Prevents notification spam, tracks per month | ✓ Good |
| Two alert functions (evaluate vs getActive) | Separate state mutation from read-only queries | ✓ Good |
| Path resolution with ".." escape | Next.js cwd=/app but data at root, need `path.join(process.cwd(), "..", "data")` | ✓ Good |

## Milestones Shipped

- **v1.0 Operational Dashboard** — shipped 2026-01-30 (4 phases, 5 plans)
- **v2.0 Analytics, Automation & Alerts** — shipped 2026-01-31 (4 phases, 9 plans)

See `.planning/MILESTONES.md` for full details.

---
*Last updated: 2026-02-01 after v2.0 milestone completion and archival*

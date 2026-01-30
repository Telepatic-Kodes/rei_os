# Phase 5: Data Infrastructure & Safety - Context

**Gathered:** 2026-01-30
**Status:** Ready for planning

<domain>
## Phase Boundary

All data files are safely writable by automated processes with typed schemas and history support. This phase creates the foundation that Phase 6 (automated sync) will build on. No UI changes, no sync automation — just safe, typed, organized data.

</domain>

<decisions>
## Implementation Decisions

### History file structure
- Track everything: token spend, quality scores, and project metadata (status changes)
- Claude's discretion on file organization (JSONL per metric per month vs single file), granularity (daily vs per-sync), and retention policy
- Research should consider what charting needs downstream (Phase 7) to inform the right granularity

### Data directory layout
- Claude's discretion on how to separate tracked vs auto-generated data
- Claude's discretion on where alert/budget config lives (data/config/ vs root)
- Must work cleanly with existing code that reads from data/*.json — no breaking changes to current dashboard

### Sync idempotency rules
- Claude's discretion on dedup key (date+project+session vs date+project)
- Claude's discretion on partial failure handling (save what succeeded vs all-or-nothing)
- Must consider: existing tokens.json already has date + project + session fields

### Write safety approach
- Claude's discretion on backup strategy (.bak files vs atomic-only)
- Claude's discretion on corruption recovery (restore from backup vs empty state + warn)
- Atomic writes (temp file + rename) are the baseline — required regardless of backup strategy

### Claude's Discretion
User gave full flexibility on all implementation details for this phase. Key constraint: don't break existing dashboard functionality. All architectural choices are open as long as they're safe and typed.

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. User trusts Claude's judgment on this infrastructure phase.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 05-data-infrastructure*
*Context gathered: 2026-01-30*

# Phase 6: Automated Sync - Context

**Gathered:** 2026-01-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Eliminate manual script execution. Dashboard data stays current via a scheduled cron process and on-demand manual refresh, with visible sync status in the UI. History recording and pre-computed analytics are generated during each sync run. No charting UI (Phase 7) or alerting (Phase 8).

</domain>

<decisions>
## Implementation Decisions

### Sync scheduling
- Auto-sync every 15 minutes (configurable via JSON config, not hardcoded)
- Sync interval stored in config file (e.g., `data/config/sync.json`)
- Cron runs as separate Node process, NOT inside Next.js (research decision from v2.0 planning)

### Refresh UX
- Manual refresh button in the dashboard header (top-right area)
- Feedback: spinning button icon during sync + toast notification with result
- Toast shows "Syncing..." then "Sync complete" or error message

### Sync status display
- Status indicator in the dashboard header, next to the refresh button
- Shows last sync time and success/error state

### Pre-computed analytics
- Full analytics computed during each sync: totals, trends, per-model breakdown, burn rate
- Three time windows: 7 days, 30 days, 90 days
- Pre-computed data served as static JSON to the frontend (no client-side calculation)
- This prepares everything Phase 7 (charts) needs to just render

### Claude's Discretion
- Overlap handling when sync is already running (skip vs queue)
- Whether cron starts with `npm run dev` or as separate command
- Data refresh approach after manual sync (auto-refresh vs page reload)
- Error UX specifics (toast, badge, or both)
- Sync status detail level (simple vs per-script)
- Sync status persistence (file on disk vs session-only)
- Pre-computed analytics file structure (single file vs per-metric)

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. User trusts Claude's judgment on all implementation details marked as "You decide."

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 06-automated-sync*
*Context gathered: 2026-01-31*

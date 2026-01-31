# Phase 8: Budget Alerts & Notifications - Context

**Gathered:** 2026-01-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Proactive warnings before budget overruns through multiple notification channels: dashboard alert banners, desktop notifications (node-notifier from cron), and browser Notification API. Includes a settings UI page for editing thresholds and per-project limits. Does NOT include email/Slack integrations or budget forecasting beyond existing burn rate.

</domain>

<decisions>
## Implementation Decisions

### Alert banner design
- Banners show for BOTH global and per-project threshold breaches
- Claude's Discretion: dismissibility (persistent vs dismissible-per-session), position (top of page vs below header), severity styling (distinct colors for 75%/90% or same style with different text)

### Notification behavior
- Claude's Discretion: fire once per threshold crossing vs cooldown-based repeats
- Claude's Discretion: browser notification permission prompt timing (first load vs on-alert)
- Claude's Discretion: desktop notification actions (info-only vs open dashboard link)
- Claude's Discretion: browser check strategy (sync events only vs periodic polling)

### Config file structure
- Per-project budget limits keyed by project NAME (consistent with Phase 5 dedup-by-name pattern)
- Claude's Discretion: extend budget-config.json vs separate alerts-config.json
- Claude's Discretion: hot reload on next sync vs require restart
- Settings UI page in dashboard for editing thresholds and per-project limits (not just JSON file editing)

### Alert evaluation timing
- Claude's Discretion: evaluate every sync run vs only on spend change
- Claude's Discretion: alert history logging (JSONL audit trail vs current-state-only)
- Claude's Discretion: monthly reset behavior (auto-clear on 1st vs manual dismiss)
- Claude's Discretion: always-visible budget status indicator vs show-only-when-breached

</decisions>

<specifics>
## Specific Ideas

- User wants a Settings UI page for editing alert config — not just raw JSON file editing
- Per-project alerts should also trigger dashboard banners (not just global budget)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-budget-alerts*
*Context gathered: 2026-01-30*

# Feature Landscape: Automation, Analytics & Alerts

**Domain:** Solo-consultant monitoring dashboard (local-only, JSON-backed)
**Researched:** 2026-01-30
**Confidence:** HIGH (well-understood domain patterns, simple local stack)

## Table Stakes

Features that are expected behavior for any dashboard with "automated sync + alerts."

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|-------------|------------|--------------|-------|
| **Cron-based auto-sync** | The whole point -- stop running scripts manually | Low | Existing sync scripts | node-cron or system crontab. Run sync every N minutes while app is running |
| **Manual sync button** | User must be able to force-refresh on demand | Low | Existing sync scripts | Button in UI header/toolbar, shows last-synced timestamp |
| **Sync status indicator** | "When was data last updated?" is the first question | Low | Auto-sync | Timestamp + success/error badge in header |
| **Monthly spend summary with budget bar** | Already partially exists. Must show remaining vs used clearly | Low | tokens.json | Progress bar: $X of $200 used, $Y remaining, Z days left |
| **Per-project token spend over time** | Line/bar chart showing cost per project across dates | Medium | tokens.json history | Group entries by project + date, render with existing chart lib |
| **Global budget threshold alert** | "You've used 80% of your monthly budget" | Low | tokens.json + budget field | Compare sum(entries.cost) vs budget.monthly. Trigger at 75%, 90%, 100% |
| **Visual alert in dashboard** | Banner/toast when threshold exceeded | Low | Budget calculation | Red banner at top of page. Persistent until dismissed or budget resets |

## Differentiators

Features that go beyond basic expectations. Valuable for a solo consultant but not strictly required.

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|------------------|------------|--------------|-------|
| **Per-project budget limits** | Set individual caps ($30 for project X, $50 for project Y) | Medium | Budget config, tokens.json | Needs new config structure in JSON. Not all projects need limits |
| **Burn rate projection** | "At current pace, you'll hit budget on Jan 24" | Medium | Historical data (7+ days) | Linear regression on daily spend. Very useful for $200 cap |
| **Desktop notifications (Notification API)** | Get alerted even when tab is in background | Low | Budget alerts | Browser Notification API. Requires one-time permission grant. 10 lines of code |
| **Cost-per-model breakdown** | See opus vs sonnet spending separately | Low | tokens.json already has model field | Useful since opus costs ~5x more. Helps optimize model selection |
| **Quality score trends over time** | quality metrics improving or degrading per project? | Medium | quality.json + historical snapshots | Requires storing quality snapshots over time (currently single-point) |
| **Velocity tracking** | Sessions per day/week, tokens per session trending up or down | Medium | tokens.json history | Derived metric. Useful for spotting overwork or stalled projects |
| **Weekly email/summary digest** | Auto-generated markdown summary of the week | Medium | All data sources | Could generate a .md file weekly. Useful for client billing |

## Anti-Features

Things to deliberately NOT build. Common over-engineering traps for dashboards like this.

| Anti-Feature | Why Avoid | What to Do Instead |
|-------------|-----------|-------------------|
| **Real-time WebSocket sync** | Overkill for JSON files updated every few minutes. Adds complexity for zero benefit on a solo tool | Polling every 5 min via cron + manual refresh button |
| **Database migration (PostgreSQL)** | 14 projects, ~20 entries/month. JSON files will work fine for years. DB adds operational burden | Keep JSON. Only reconsider if entries exceed 10K rows |
| **User authentication** | Local-only dashboard for one person. Auth is pure waste | No auth. If ever exposed to network, use basic HTTP auth at reverse proxy level |
| **Notification service (Pushover, Slack, etc.)** | External dependency for a local tool. Browser Notification API is free and sufficient | Browser Notification API only. Zero external dependencies |
| **Complex alerting rules engine** | Solo consultant does not need "if X and Y then Z" rules. Two thresholds (75%, 90%) are enough | Hardcoded thresholds with a simple config. No rules UI |
| **Multi-user roles/permissions** | One user. Zero need for RBAC | Skip entirely |
| **Historical data warehouse / time-series DB** | Append-only JSON log is sufficient at this scale. InfluxDB/TimescaleDB is absurd for 20 entries/month | Append entries to tokens.json. One file per month if size becomes concern |
| **OAuth token refresh for API integrations** | No external APIs needed. Data comes from local sync scripts | Keep sync scripts as-is. They already work |

## Feature Dependencies

```
Existing sync scripts
    |
    +---> Cron auto-sync (wraps existing scripts in scheduler)
    |         |
    |         +---> Sync status indicator (last run time + result)
    |         |
    |         +---> Manual sync button (triggers same scripts)
    |
tokens.json (already exists, has date + project + cost + model)
    |
    +---> Per-project spend over time (group + chart)
    |
    +---> Budget threshold calculation
    |         |
    |         +---> Visual alert banner (in-app)
    |         |
    |         +---> Desktop notification (Browser Notification API)
    |         |
    |         +---> Burn rate projection (linear extrapolation)
    |
    +---> Cost-per-model breakdown (group by model field)
    |
    +---> Per-project budget limits (new config field)
              |
              +---> Per-project alerts (compare per-project sum vs limit)
```

## MVP Recommendation

For the automation/analytics/alerts milestone, prioritize in this order:

1. **Cron auto-sync + manual refresh + status indicator** -- eliminates the daily pain point immediately
2. **Global budget alert (75%/90%/100%)** with visual banner -- protects the $200/month cap
3. **Per-project spend over time chart** -- the core analytics value
4. **Desktop notifications** -- trivial to add once alerts exist (Browser Notification API)
5. **Burn rate projection** -- high value, moderate effort

Defer to later:
- **Per-project budget limits**: Needs UX for setting limits per project. Do after core alerts work.
- **Quality/velocity trends**: Requires historical snapshots that don't exist yet. Needs data accumulation time.
- **Weekly digest**: Nice-to-have. Build after core features are solid.

## Implementation Notes

### Auto-sync approach
For a local Next.js app, two viable options:
1. **node-cron inside Next.js API route** -- runs while dev server is up. Simple. Use `node-cron` package.
2. **System crontab** -- runs independently of app. More robust but separate from codebase.

Recommend option 1 (node-cron) because: app is always running during work hours, keeps everything in one codebase, no system-level configuration needed.

### Historical data structure
Current tokens.json is already append-friendly (entries array with dates). No schema change needed for time-series charts -- just group existing entries by date/project.

For quality trends, will need to start snapshotting quality.json periodically (e.g., daily append to a quality-history.json).

### Desktop notifications
Browser Notification API requires:
1. One-time `Notification.requestPermission()` call
2. `new Notification(title, { body, icon })` when threshold crossed
3. Works in all modern browsers, no external service needed

### Budget calculation
Simple: `entries.filter(e => e.date starts with current month).reduce(sum cost)` vs `budget.monthly`. Already have all data needed in tokens.json.

## Sources

- Existing codebase analysis (tokens.json structure, app routes)
- Browser Notification API: standard Web API, well-documented on MDN
- node-cron: standard Node.js scheduling library
- Domain knowledge: monitoring dashboard patterns are well-established

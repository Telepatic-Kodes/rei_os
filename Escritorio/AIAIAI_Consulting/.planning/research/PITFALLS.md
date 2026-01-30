# Domain Pitfalls

**Domain:** Automation, analytics, and alerting for a local Next.js dashboard with JSON storage
**Researched:** 2026-01-30
**Confidence:** HIGH (based on concrete project structure analysis)

## Critical Pitfalls

Mistakes that cause rewrites or data loss.

### Pitfall 1: JSON File Corruption on Concurrent Write

**What goes wrong:** A cron job writes to `tokens.json` while the Next.js dev server reads it (or another sync script writes). JSON files have no locking mechanism. A partial write produces invalid JSON, and the entire file becomes unreadable. With ~20 entries today this is survivable; with months of time-series data it is catastrophic.

**Why it happens:** JSON is read-all/write-all. There is no append mode. Every write rewrites the entire file. Two processes writing simultaneously produce garbage.

**Consequences:** Complete data loss of the file contents. No rollback possible.

**Prevention:**
- Write to a temp file, then `fs.renameSync()` (atomic on same filesystem)
- Never write directly to the source file
- Keep a `.bak` copy before each write
- Single writer pattern: only one process writes to each file

**Detection:** Wrap every `JSON.parse()` in try/catch. If parse fails, restore from `.bak`.

**Phase:** Must be solved in the very first automation phase, before any cron job touches data files.

---

### Pitfall 2: Unbounded JSON File Growth

**What goes wrong:** Time-series data (daily token usage, cost trends) appended to a single JSON file grows indefinitely. At ~500 bytes/entry and daily entries across 14 projects, you get ~2.5 MB/year. Seems small, but `JSON.parse()` loads the entire file into memory every read. After 2-3 years the dashboard slows noticeably, and the file becomes painful to edit manually.

**Why it happens:** JSON has no built-in pagination or archival. Developers start with "just append" and never add rotation.

**Consequences:** Slow dashboard loads, large memory spikes on parse, git diffs become useless if files are tracked.

**Prevention:**
- One JSON file per month: `tokens-2026-01.json`, `tokens-2026-02.json`
- Or one file per year with monthly aggregation
- Keep a `tokens-current.json` (current month) and `tokens-archive/` directory
- Dashboard reads only current + relevant archive files

**Detection:** If any JSON file exceeds 500KB, it needs splitting.

**Phase:** Design the file structure BEFORE adding time-series tracking. Retrofitting is painful.

---

### Pitfall 3: Cron Jobs Inside Next.js Process

**What goes wrong:** Developers use `node-cron` or `setInterval` inside a Next.js API route or server component to run scheduled sync. The Next.js dev server restarts on file changes (HMR), killing the scheduler. In production, `next start` can be killed/restarted. The cron state is lost, schedules double-fire or never fire.

**Why it happens:** It feels natural to keep everything in one process. Next.js is not designed to be a long-running daemon.

**Consequences:** Missed syncs, duplicate syncs, zombie timers after HMR, unreliable automation.

**Prevention:**
- Use system-level cron (`crontab -e`) or systemd timers for scheduling
- Sync scripts should be standalone Node.js scripts in a `scripts/` directory
- Next.js only reads the data files; it never runs the automation
- Alternative: a simple `pm2` managed script separate from Next.js

**Detection:** If you find `setInterval`, `node-cron`, or `cron` imported inside `app/` or `src/`, it is wrong.

**Phase:** First automation phase. Architecture decision: Next.js reads, external scripts write.

---

## Moderate Pitfalls

Mistakes that cause delays or tech debt.

### Pitfall 4: Over-Engineering Budget Alerts

**What goes wrong:** Developer builds a notification queue, alert deduplication, escalation chains, configurable thresholds per project, Slack/email/SMS integrations. For a solo consultant with a $200/month budget this is absurd. Weeks of work for a feature that could be a simple threshold check.

**Why it happens:** Alert systems in production environments are complex. Developers copy those patterns without considering the scale.

**Prevention:**
- Start with: `if (monthlySpend > budget * 0.8) { notify() }`
- One threshold (80%), one notification method (desktop notification)
- Store alert state in a single `alerts-state.json`: `{ "lastAlertDate": "2026-01-28", "acknowledged": true }`
- Add complexity only when the simple version proves insufficient

**Detection:** If the alert system has more than 50 lines of code, it is over-engineered for this use case.

**Phase:** Budget alerts phase. Keep it dead simple.

---

### Pitfall 5: Desktop Notifications That Do Not Work Locally

**What goes wrong:** Developer implements Web Push API (requires HTTPS, service worker, push server) or tries `new Notification()` from a server component. None of these work for a local dev-mode dashboard.

**Why it happens:** Web notification tutorials assume deployed web apps. Local dashboards have different constraints.

**Consequences:** Wasted time implementing push infrastructure that is unnecessary for `localhost:3000`.

**Prevention:**
- For in-browser: `Notification.requestPermission()` + `new Notification()` works on localhost without HTTPS
- For system-level (when browser is closed): use `node-notifier` npm package from the cron script
- Do NOT set up service workers, push servers, or web-push libraries
- The cron script can call `node-notifier` directly when a threshold is crossed

**Detection:** If you see `web-push`, `firebase-messaging`, or service worker registration for notifications, it is wrong for this use case.

**Phase:** Alerting phase. Decide upfront: browser-open notifications (Web Notification API) vs system notifications (`node-notifier`). For a solo consultant, `node-notifier` from the cron script is the right answer.

---

### Pitfall 6: Breaking Existing Dashboard by Changing Data Shape

**What goes wrong:** Adding time-series fields or restructuring `tokens.json` for analytics breaks existing dashboard components that depend on the current shape. The existing pages (kanban, projects, quality, tokens) stop rendering.

**Why it happens:** No schema validation. Components read raw JSON and assume structure.

**Consequences:** Regression in working features. Debugging why the dashboard broke after "just adding a field."

**Prevention:**
- Define a TypeScript interface for each JSON file shape
- Add new files for new data (e.g., `analytics/daily-summary.json`) rather than restructuring existing files
- If you must change existing shape, add fields (never remove/rename) and update all consumers in the same commit
- Add a simple Zod schema validation on data load

**Detection:** Run the existing dashboard (`npm run dev`) after every data structure change. If it breaks, you changed the wrong thing.

**Phase:** Before any analytics work. Define interfaces first, then build on them.

---

### Pitfall 7: Git-Tracking Frequently Changing JSON Data

**What goes wrong:** Time-series data files change daily. If tracked in git, every commit has a large JSON diff. Git history becomes noisy. `git status` always shows dirty files. Merge conflicts on JSON files are miserable.

**Why it happens:** The current `tokens.json` is tracked (or at least in the repo). This works for static/seed data but not for auto-generated data.

**Prevention:**
- `.gitignore` all auto-generated/synced data files
- Track only seed/example data: `data/tokens.example.json`
- Or keep a `data/seed/` (tracked) and `data/live/` (gitignored) directory
- Sync scripts write to `data/live/`, dashboard reads from `data/live/` with fallback to `data/seed/`

**Detection:** If `git status` shows data file changes after every sync run, fix the gitignore.

**Phase:** First phase. Set up the data directory structure before automation writes to it.

---

## Minor Pitfalls

Annoying but fixable.

### Pitfall 8: Cron Schedule Timezone Confusion

**What goes wrong:** System cron uses UTC. Developer expects `America/Santiago` (UTC-3/-4 depending on DST). Daily sync at "midnight" runs at 3 AM or 4 AM local time. Budget alerts trigger based on wrong day boundaries.

**Prevention:**
- Set `TZ=America/Santiago` in crontab or use `CRON_TZ=America/Santiago` prefix
- Or compute in UTC and convert for display
- Document the timezone in a comment next to every cron entry

**Phase:** Automation setup phase.

---

### Pitfall 9: No Idempotency in Sync Scripts

**What goes wrong:** Sync script runs twice (cron fires twice, manual + cron overlap). Data gets duplicated -- double entries for the same date/session in `tokens.json`.

**Prevention:**
- Each sync run checks for existing entries before appending (deduplicate by date + project + session)
- Or use a `last-sync.json` lockfile with timestamp
- Idempotent writes: running the same sync twice produces the same result

**Phase:** Automation phase. Build idempotency into every sync script from day one.

---

### Pitfall 10: Analytics Calculations in the Client

**What goes wrong:** Dashboard computes 30-day rolling averages, trend lines, and budget projections in React components on every render. With 14 projects and months of data, this causes visible lag and unnecessary complexity in components.

**Prevention:**
- Pre-compute analytics in the sync/cron script and write results to `analytics/summary.json`
- Dashboard components just read and display pre-computed values
- Keeps components simple and fast

**Phase:** Analytics phase. Compute in scripts, display in dashboard.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Data structure setup | #2 Unbounded growth, #6 Breaking existing shape, #7 Git tracking | Design file layout and gitignore FIRST |
| Cron/automation | #1 File corruption, #3 Cron inside Next.js, #8 Timezone, #9 Idempotency | External scripts with atomic writes |
| Analytics/trends | #10 Client-side computation, #2 Data growth | Pre-compute in scripts, monthly file rotation |
| Budget alerts | #4 Over-engineering, #5 Wrong notification approach | Simple threshold + `node-notifier` |
| Integration with existing dashboard | #6 Data shape changes | TypeScript interfaces, additive changes only |

## Sources

- Direct analysis of project structure: `data/tokens.json`, `app/src/app/` routes
- Node.js `fs.renameSync` atomicity: Node.js documentation (well-established behavior)
- `node-notifier` package: widely used for cross-platform desktop notifications from Node.js
- Web Notification API on localhost: works without HTTPS on localhost (browser exception)

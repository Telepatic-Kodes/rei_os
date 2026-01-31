# Phase 8: Budget Alerts & Notifications - Research

**Researched:** 2026-01-30
**Domain:** Budget threshold monitoring, multi-channel notifications (desktop, browser, dashboard banners), alert configuration UI
**Confidence:** HIGH

## Summary

Phase 8 implements a multi-layered budget alert system with three notification channels: dashboard alert banners (persistent visual warnings), desktop notifications via node-notifier (from cron process), and browser Notification API (in-tab alerts). The system evaluates both global budget thresholds (75%, 90% of $200 monthly) and per-project limits against spend data from analytics.json, triggering alerts through appropriate channels.

The standard stack builds on existing infrastructure: node-notifier for cross-platform desktop notifications, shadcn/ui Alert component for dashboard banners, browser Notification API for in-app alerts, and Zod-validated JSON config files for threshold management. A settings UI page allows editing thresholds and per-project limits without code changes.

Key architectural decisions center on alert fatigue prevention (cooldown patterns, fire-once vs batch), config hot reload timing, and alert evaluation strategy. Research shows modern best practices favor equipment-specific baselines, time-based batching for non-urgent alerts, and user control over notification preferences to maintain engagement without overwhelming users.

**Primary recommendation:** Implement fire-once-per-threshold pattern with alert state tracking in JSON, evaluate alerts on every sync run, use shadcn/ui Alert component for dismissible banners, and provide comprehensive settings UI for threshold configuration. Desktop notifications fire from cron (when tab closed), browser notifications fire from client-side polling (when tab open).

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| node-notifier | ^11.0.0+ | Desktop notifications from Node.js | Most popular cross-platform notification library (macOS, Windows, Linux), 10k+ GitHub stars, active maintenance, supports all platforms with native fallbacks |
| shadcn/ui Alert | latest | Dashboard alert banners | Official shadcn/ui component, accessibility built-in, Tailwind-styled, dismissible pattern support, consistent with existing UI |
| browser Notification API | Native | In-browser notifications | Web standard API, no dependencies, universal browser support (Chrome, Firefox, Safari), permission-based security |
| Zod | ^4.3.6 (installed) | Config validation | Already in stack (Phase 5), runtime type safety for alert config, excellent error messages |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sonner | ^2.0.7 (installed) | Toast notifications | Success/error feedback for settings save, already integrated in Phase 6 |
| lucide-react | ^0.563.0 (installed) | Alert icons | AlertTriangle, AlertCircle, X (close) icons for banners |
| croner | ^9.1.0 (installed) | Cron scheduling | Already running sync process where desktop notifications fire |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| node-notifier | node-toasted-notifier | Fork with more features but less stable, smaller community |
| shadcn/ui Alert | Custom component | More control but loses accessibility, a11y testing, dismissibility patterns |
| Notification API | Service Worker notifications | Required for mobile but adds complexity, overkill for desktop dashboard |
| JSON config files | Database tables | More flexible but breaks v2.0 decision, requires migration, overkill for simple config |

**Installation:**
```bash
npm install node-notifier@^11.0.0
# shadcn/ui, sonner, zod, croner already installed
```

## Architecture Patterns

### Recommended Project Structure
```
app/src/
├── lib/
│   ├── alert-evaluator.ts      # Threshold evaluation logic
│   ├── alert-config.ts          # Load/validate alert config
│   └── schemas.ts               # Add alert schemas (extend existing)
├── components/
│   ├── alert-banner.tsx         # Dashboard banner component
│   ├── budget-settings-form.tsx # Settings UI for thresholds
│   └── ui/alert.tsx             # shadcn/ui Alert (if not exists)
├── app/
│   ├── settings/page.tsx        # Settings page with budget config
│   └── layout.tsx               # Add AlertBanner at top level
scripts/
├── desktop-notifier.ts          # Desktop notification helper
└── cron-sync.ts                 # Call alert evaluator + desktop notifier
data/
├── config/
│   └── alerts.json              # Alert thresholds + per-project limits
└── alert-state.json             # Alert fire tracking (prevent spam)
```

### Pattern 1: Alert Evaluation on Sync

**What:** Evaluate budget thresholds after analytics generation, trigger notifications based on crossed thresholds and previous alert state.

**When to use:** Every sync run to ensure timely alerts, even if spend hasn't changed (monthly reset detection).

**Example:**
```typescript
// Source: Research synthesis from alert evaluation patterns
// In lib/alert-evaluator.ts

import { readFileSync } from "node:fs";
import { AlertConfigSchema, AnalyticsSchema } from "./schemas";
import { atomicWriteJson } from "./atomic-write";

export async function evaluateAlerts(): Promise<AlertResult[]> {
  // Load current analytics
  const analytics = AnalyticsSchema.parse(
    JSON.parse(readFileSync("data/analytics.json", "utf-8"))
  );

  // Load alert config
  const config = AlertConfigSchema.parse(
    JSON.parse(readFileSync("data/config/alerts.json", "utf-8"))
  );

  // Load previous alert state (which thresholds already fired)
  let previousState: AlertState;
  try {
    previousState = AlertStateSchema.parse(
      JSON.parse(readFileSync("data/alert-state.json", "utf-8"))
    );
  } catch {
    previousState = { firedAlerts: [], lastReset: new Date().toISOString() };
  }

  const results: AlertResult[] = [];
  const monthlySpend = analytics.windows["30d"].totalCost;

  // Evaluate global thresholds
  for (const threshold of config.globalThresholds) {
    const percentSpent = (monthlySpend / config.globalBudget) * 100;
    const alertKey = `global-${threshold.percent}`;

    if (percentSpent >= threshold.percent && !previousState.firedAlerts.includes(alertKey)) {
      results.push({
        type: "global",
        level: threshold.percent >= 90 ? "critical" : "warning",
        message: `Global budget ${threshold.percent}% reached ($${monthlySpend.toFixed(2)}/${config.globalBudget})`,
        alertKey,
      });
    }
  }

  // Evaluate per-project limits (similar pattern)
  // ...

  // Update alert state with newly fired alerts
  const newState: AlertState = {
    firedAlerts: [...previousState.firedAlerts, ...results.map(r => r.alertKey)],
    lastReset: previousState.lastReset,
  };
  atomicWriteJson("data/alert-state.json", newState);

  return results;
}
```

### Pattern 2: Desktop Notifications from Cron

**What:** Fire cross-platform desktop notifications from the cron process when alerts are detected, even if browser is closed.

**When to use:** After alert evaluation in cron-sync.ts, for critical budget warnings.

**Example:**
```typescript
// Source: Context7 /mikaelbr/node-notifier + research synthesis
// In scripts/desktop-notifier.ts

import notifier from "node-notifier";
import path from "node:path";

export function sendDesktopNotification(alert: AlertResult): void {
  const iconPath = path.join(__dirname, "..", "app", "public", "alert-icon.png");

  notifier.notify({
    title: alert.level === "critical" ? "⚠️ Critical Budget Alert" : "⚠ Budget Warning",
    message: alert.message,
    icon: iconPath,
    sound: true, // macOS/Windows only
    wait: false, // Don't wait for user action
    timeout: 10, // Expire after 10 seconds
  });
}

// In scripts/cron-sync.ts (after generateAnalytics)
import { evaluateAlerts } from "../app/src/lib/alert-evaluator";
import { sendDesktopNotification } from "./desktop-notifier";

const alerts = await evaluateAlerts();
for (const alert of alerts) {
  sendDesktopNotification(alert);
  console.log(`Desktop notification sent: ${alert.message}`);
}
```

### Pattern 3: Browser Notifications with Permission

**What:** Request browser notification permission on user action, fire notifications from client-side when tab is open and thresholds crossed.

**When to use:** Settings page "Enable Browser Alerts" button, then check on sync status updates.

**Example:**
```typescript
// Source: MDN Notification API + research best practices
// In components/budget-settings-form.tsx

"use client";
import { useState } from "react";

export function BrowserNotificationToggle() {
  const [permission, setPermission] = useState(Notification.permission);

  const requestPermission = async () => {
    // MUST be triggered by user gesture (button click)
    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === "granted") {
      toast.success("Browser notifications enabled");
    } else {
      toast.error("Notification permission denied");
    }
  };

  return (
    <div>
      <p>Status: {permission}</p>
      {permission === "default" && (
        <Button onClick={requestPermission}>
          Enable Browser Notifications
        </Button>
      )}
    </div>
  );
}

// In app/layout.tsx or alert checker component
function checkAndNotify() {
  if (Notification.permission === "granted") {
    fetch("/api/alert-status")
      .then(res => res.json())
      .then(data => {
        if (data.hasActiveAlerts) {
          new Notification("Budget Alert", {
            body: data.alertMessage,
            icon: "/alert-icon.png",
          });
        }
      });
  }
}
```

### Pattern 4: Dismissible Alert Banner with shadcn/ui

**What:** Persistent alert banner at top of dashboard showing active budget warnings, dismissible per-session with state tracking.

**When to use:** Global layout wrapper, visible on all pages when alerts are active.

**Example:**
```tsx
// Source: shadcn/ui Alert component + research synthesis
// In components/alert-banner.tsx

"use client";
import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AlertBanner() {
  const [alerts, setAlerts] = useState<AlertResult[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    // Fetch active alerts from API
    fetch("/api/alert-status")
      .then(res => res.json())
      .then(data => setAlerts(data.alerts || []));
  }, []);

  const visibleAlerts = alerts.filter(
    alert => !dismissed.includes(alert.alertKey)
  );

  if (visibleAlerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {visibleAlerts.map(alert => (
        <Alert
          key={alert.alertKey}
          variant={alert.level === "critical" ? "destructive" : "default"}
          className="relative"
        >
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            {alert.level === "critical" ? "Critical Budget Alert" : "Budget Warning"}
          </AlertTitle>
          <AlertDescription>{alert.message}</AlertDescription>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-6 w-6"
            onClick={() => setDismissed([...dismissed, alert.alertKey])}
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      ))}
    </div>
  );
}
```

### Pattern 5: Budget Settings Form with Zod Validation

**What:** Settings page UI for editing global thresholds and per-project budget limits with form validation and JSON persistence.

**When to use:** /settings page, accessible from sidebar navigation.

**Example:**
```tsx
// Source: React best practices + Zod validation pattern from Phase 5
// In components/budget-settings-form.tsx

"use client";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const FormSchema = z.object({
  globalBudget: z.number().min(1),
  globalThresholds: z.array(z.object({
    percent: z.number().min(1).max(100),
  })),
  perProjectLimits: z.record(z.string(), z.number().min(0)),
});

export function BudgetSettingsForm({ initialData }) {
  const [formData, setFormData] = useState(initialData);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);

    try {
      // Validate with Zod
      const validated = FormSchema.parse(formData);

      // Save to API
      const response = await fetch("/api/settings/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });

      if (!response.ok) throw new Error("Failed to save");

      toast.success("Budget settings saved");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(`Validation error: ${error.errors[0].message}`);
      } else {
        toast.error("Failed to save settings");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
      {/* Form fields for global budget, thresholds, per-project limits */}
      <Button type="submit" disabled={saving}>
        {saving ? "Saving..." : "Save Settings"}
      </Button>
    </form>
  );
}
```

### Anti-Patterns to Avoid

- **Notification spam:** Never fire the same alert repeatedly without cooldown. Use alert state tracking to fire each threshold once until monthly reset.
- **Blocking permission prompts:** Don't request browser notification permission on page load. MUST be user-initiated (button click). Browsers will block auto-prompts.
- **Client-side threshold calculation:** Don't recalculate analytics in browser. Alert evaluation happens server-side (sync process), client just displays results.
- **Hardcoded thresholds:** Never hardcode budget limits in components. Always load from validated JSON config.
- **Silent failures:** When notification permission denied or node-notifier fails, log clearly but don't crash sync process.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Desktop notifications | Custom native OS integrations | node-notifier | Handles macOS, Windows, Linux differences, fallback strategies, icon/sound support |
| Alert banners | Custom toast/banner component | shadcn/ui Alert | Accessibility (screen readers, focus management), dismissibility, consistent styling |
| Browser notifications | Custom notification queue system | Native Notification API | Browser-level permission model, OS integration, mobile support via service workers |
| Config hot reload | Custom file watchers | Read on every sync | Simpler, fewer edge cases, sync interval already provides "hot reload" timing |
| Threshold calculation | Inline percentage checks | Dedicated evaluator module | Testable, reusable across notification channels, clear business logic separation |

**Key insight:** Notification systems have complex edge cases (permission states, platform differences, accessibility, spam prevention). Use battle-tested libraries and web standards rather than custom implementations. The cross-platform notification problem was solved years ago by node-notifier and browser Notification API.

## Common Pitfalls

### Pitfall 1: Alert Fatigue from Redundant Notifications

**What goes wrong:** Firing the same alert on every sync run (every 15 minutes) creates notification spam. Users dismiss/ignore alerts, defeating their purpose.

**Why it happens:** Alert evaluation returns "threshold crossed" continuously once budget exceeds limit, not just on the crossing event.

**How to avoid:**
- Implement alert state tracking in `alert-state.json` with fired alert keys
- Fire each threshold alert once per month
- Reset fired alerts on monthly boundary (1st of month)
- Research shows every repeat notification reduces attention by ~30%

**Warning signs:**
- Same desktop notification appearing every 15 minutes
- Users complaining about "too many alerts"
- Alert banners reappearing after dismissal on page refresh

**Source:** [Datadog: Alert Fatigue Best Practices](https://www.datadoghq.com/blog/best-practices-to-prevent-alert-fatigue/), [Splunk: Preventing Alert Fatigue](https://www.splunk.com/en_us/blog/learn/alert-fatigue.html)

### Pitfall 2: Browser Notification Permission Denied Silently

**What goes wrong:** Requesting notification permission without user gesture causes browser to auto-deny. Permission state becomes "denied" permanently (or until manual browser settings reset).

**Why it happens:** Modern browsers (Firefox 72+, Safari 12.1+) block permission requests not triggered by user interaction to prevent spam.

**How to avoid:**
- Only call `Notification.requestPermission()` inside button click handler
- Check `Notification.permission` before showing "Enable" button
- If denied, show message: "Notifications blocked. Enable in browser settings."
- Never auto-request on page load

**Warning signs:**
- Permission prompt never appears when calling requestPermission()
- `Notification.permission` returns "denied" without user interaction
- Console errors about blocked permission requests

**Source:** [MDN: Using the Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API/Using_the_Notifications_API), [MDN: Push API Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Push_API/Best_Practices)

### Pitfall 3: node-notifier Fails Silently on Linux Without notify-send

**What goes wrong:** Desktop notifications don't appear on Linux systems without libnotify/notify-send installed. No error thrown, notification simply disappears.

**Why it happens:** node-notifier uses notify-send on Linux, which isn't always pre-installed (depends on desktop environment).

**How to avoid:**
- Wrap notifier.notify() in try/catch
- Log notification attempts with timestamps for debugging
- Document Linux dependency (notify-send) in setup instructions
- Consider fallback message in terminal if notification fails
- Don't make desktop notifications critical path - alerts still appear in dashboard

**Warning signs:**
- Desktop notifications work on macOS/Windows but not Linux
- No error in logs but notifications missing
- Users report "alerts not working" on Linux

**Source:** [node-notifier README: Linux dependencies](https://github.com/mikaelbr/node-notifier/blob/master/README.md)

### Pitfall 4: Monthly Reset Logic Missing Day Boundary

**What goes wrong:** Alert state resets mid-month instead of on the 1st, or doesn't reset at all. Alerts stop firing even after new month begins.

**Why it happens:** Comparing timestamps instead of calendar months, or forgetting to implement reset logic entirely.

**How to avoid:**
```typescript
// Compare month/year strings, not timestamps
function shouldResetAlerts(lastReset: string): boolean {
  const lastResetDate = new Date(lastReset);
  const now = new Date();

  // Format as YYYY-MM for comparison
  const lastMonth = `${lastResetDate.getFullYear()}-${String(lastResetDate.getMonth() + 1).padStart(2, '0')}`;
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  return lastMonth !== currentMonth;
}

// Reset logic in alert evaluator
if (shouldResetAlerts(previousState.lastReset)) {
  previousState.firedAlerts = [];
  previousState.lastReset = new Date().toISOString();
}
```

**Warning signs:**
- Alerts fire once then never again
- Alerts reset randomly mid-month
- New month starts but 75% alert doesn't re-fire after being dismissed in previous month

### Pitfall 5: Config Changes Not Reflected Until Restart

**What goes wrong:** User edits alert thresholds in settings UI, clicks save, but new thresholds don't apply until server restart.

**Why it happens:** Config loaded once at module import time, cached in memory. File changes don't trigger reload.

**How to avoid:**
- Read config files fresh on every sync run (not at module import)
- If caching needed, reload config at start of each sync execution
- Settings API endpoint writes to JSON, but cron process reads it fresh every 15 min
- This provides "eventual hot reload" - changes apply within one sync interval
- Don't over-optimize with file watchers - sync interval is fast enough

**Warning signs:**
- Settings save succeeds but alerts don't change behavior
- Need to restart Next.js dev server or cron process for config changes
- Users confused why new thresholds aren't working immediately

## Code Examples

Verified patterns from official sources:

### Creating Alert Config Schema (Zod)
```typescript
// Source: Zod documentation + Phase 5 schema pattern
// In app/src/lib/schemas.ts (extend existing file)

export const AlertThresholdSchema = z.object({
  percent: z.number().min(0).max(100),
  label: z.string().optional(),
});

export const AlertConfigSchema = z.object({
  globalBudget: z.number().min(1),
  globalThresholds: z.array(AlertThresholdSchema),
  perProjectLimits: z.record(z.string(), z.number().min(0)), // key = project name
});

export const AlertStateSchema = z.object({
  firedAlerts: z.array(z.string()), // alertKey[] that have fired
  lastReset: z.string(), // ISO timestamp of last monthly reset
});

export type AlertConfig = z.infer<typeof AlertConfigSchema>;
export type AlertState = z.infer<typeof AlertStateSchema>;
```

### Loading Alert Config with Defaults
```typescript
// Source: Node.js fs patterns + Zod validation
// In app/src/lib/alert-config.ts

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { AlertConfigSchema } from "./schemas";
import type { AlertConfig } from "./schemas";
import { atomicWriteJson } from "./atomic-write";

const CONFIG_PATH = join(__dirname, "..", "..", "..", "data", "config", "alerts.json");

const DEFAULT_CONFIG: AlertConfig = {
  globalBudget: 200,
  globalThresholds: [
    { percent: 75, label: "Warning" },
    { percent: 90, label: "Critical" },
  ],
  perProjectLimits: {},
};

export function loadAlertConfig(): AlertConfig {
  try {
    if (!existsSync(CONFIG_PATH)) {
      // Write default config on first run
      atomicWriteJson(CONFIG_PATH, DEFAULT_CONFIG);
      console.log("Created default alert config");
      return DEFAULT_CONFIG;
    }

    const raw = readFileSync(CONFIG_PATH, "utf-8");
    return AlertConfigSchema.parse(JSON.parse(raw));
  } catch (error) {
    console.error("Failed to load alert config, using defaults:", error);
    return DEFAULT_CONFIG;
  }
}
```

### API Endpoint for Settings Save
```typescript
// Source: Next.js App Router API pattern
// In app/src/app/api/settings/alerts/route.ts

import { NextResponse } from "next/server";
import { AlertConfigSchema } from "@/lib/schemas";
import { atomicWriteJson } from "@/lib/atomic-write";
import { join } from "node:path";

const CONFIG_PATH = join(process.cwd(), "data", "config", "alerts.json");

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate with Zod
    const validated = AlertConfigSchema.parse(body);

    // Write to JSON config file
    atomicWriteJson(CONFIG_PATH, validated);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save alert config:", error);
    return NextResponse.json(
      { success: false, error: "Validation failed" },
      { status: 400 }
    );
  }
}

export async function GET() {
  try {
    const { loadAlertConfig } = await import("@/lib/alert-config");
    const config = loadAlertConfig();
    return NextResponse.json(config);
  } catch (error) {
    console.error("Failed to load alert config:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load config" },
      { status: 500 }
    );
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Email alerts only | Multi-channel (desktop, browser, dashboard) | 2020+ | Users see alerts even when not checking email, faster response |
| Static thresholds | User-configurable per-project limits | 2023+ | Flexibility for different project budgets, no code changes needed |
| Continuous alert firing | Fire-once with state tracking | 2024+ | Reduces alert fatigue, improves user engagement with warnings |
| Client-side permission on load | User-gesture-required prompts | 2022 (Firefox 72, Safari 12.1) | Browser security policy, prevents auto-spam |
| Custom notification systems | Standard APIs + libraries | 2018+ | Cross-platform compatibility, accessibility, less maintenance |

**Deprecated/outdated:**
- **Auto-requesting notification permissions on page load:** Blocked by modern browsers (Firefox 72+, Safari 12.1+). Must be user-initiated.
- **Service Worker notifications for desktop apps:** Needed for mobile push, but overkill for desktop dashboard. Direct Notification API simpler.
- **Polling for config changes:** File watchers add complexity. Reading config on each sync run (every 15 min) provides sufficient "hot reload" UX.
- **Custom banner components:** shadcn/ui Alert provides accessibility, dismissibility, and consistent styling. No need to rebuild.

## Open Questions

Things that couldn't be fully resolved:

1. **Per-project spend calculation from analytics.json**
   - What we know: analytics.json has byModel aggregation, but not byProject
   - What's unclear: Does Phase 7 already calculate per-project spend, or do we need to add it?
   - Recommendation: Check tokens.json structure. If it has project field per entry, aggregate per-project spend in alert evaluator. If not, add to analytics.json generation in Phase 7 follow-up task.

2. **Alert dismissal persistence strategy**
   - What we know: Per-session dismissal in browser state (localStorage)
   - What's unclear: Should dismissed alerts stay hidden across sessions until monthly reset?
   - Recommendation: Start with session-only dismissal (simpler, less intrusive). If users request persistent dismissal, add to alert-state.json in follow-up.

3. **Monthly reset timing (UTC vs local time)**
   - What we know: Server runs in UTC, users might be in different timezones
   - What's unclear: Should monthly reset happen at UTC midnight 1st, or user's local timezone?
   - Recommendation: Use UTC consistently with server. Document that "monthly" means calendar month UTC. Most business analytics tools work this way.

4. **Alert priority when multiple thresholds crossed**
   - What we know: Both 75% and 90% could be crossed simultaneously on first check
   - What's unclear: Show both banners, or only the highest severity?
   - Recommendation: Show all crossed thresholds (separate banners). User needs to know they're at 90%, not just "over budget".

## Sources

### Primary (HIGH confidence)

- [/mikaelbr/node-notifier](https://github.com/mikaelbr/node-notifier) - Desktop notification API, platform-specific options, events
- [/emilkowalski/sonner](https://context7.com/emilkowalski/sonner/llms.txt) - Toast notification configuration, styling patterns
- [MDN: Using the Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API/Using_the_Notifications_API) - Browser Notification API, permission model, constructor options, best practices
- [shadcn/ui Alert Component](https://ui.shadcn.com/docs/components/alert) - Alert banner implementation, variants, accessibility
- [Material UI Alert](https://mui.com/material-ui/react-alert/) - Alert severity patterns, design system approach
- [Shopify Polaris Banner](https://polaris-react.shopify.com/components/feedback-indicators/banner) - Critical/warning banner patterns, accessibility

### Secondary (MEDIUM confidence)

- [Datadog: Alert Fatigue Best Practices](https://www.datadoghq.com/blog/best-practices-to-prevent-alert-fatigue/) - Cooldown patterns, threshold tuning, silencing strategies
- [Splunk: Preventing Alert Fatigue](https://www.splunk.com/en_us/blog/learn/alert-fatigue.html) - Alert batching, digest approaches, threshold configuration
- [SigNoz: Alert Evaluation Patterns](https://signoz.io/docs/alerts-management/user-guides/understanding-alert-evaluation-patterns/) - At-least-once vs all-time patterns, average evaluation
- [Infracost: Budget Alerts](https://www.infracost.io/glossary/budget-alerts/) - Cloud budget alert systems, predictive monitoring
- [Actual Budget: Budget Banners PR](https://github.com/actualbudget/actual/pull/4643) - Real-world budget alert banner implementation
- [Usersnap: Browser Notification Best Practices](https://usersnap.com/blog/browser-notifications-best-practices/) - Notification timing, content guidelines, user control
- [shadcn/ui Banner](https://www.shadcn.io/components/layout/banner) - Dismissible banner pattern with TypeScript

### Tertiary (LOW confidence)

- [WebSearch: React budget settings form patterns] - General React best practices, no specific threshold editing patterns found
- [WebSearch: JSON hot reload Node.js] - General hot reload strategies (nodemon, ts-node-dev), not config-specific

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - node-notifier, shadcn/ui, Notification API are industry standards with official docs
- Architecture: HIGH - Patterns verified with Context7, MDN, and existing codebase patterns from Phase 5-7
- Pitfalls: HIGH - Alert fatigue research from Datadog/Splunk, browser permission blocking documented in MDN

**Research date:** 2026-01-30
**Valid until:** 2026-04-30 (90 days for stable web standards/libraries, longer for notification APIs)

**Key verification notes:**
- All notification APIs verified against official sources (MDN, GitHub READMEs)
- Alert fatigue patterns from 2024-2026 research (current best practices)
- shadcn/ui Alert component exists and is officially documented
- Zod validation pattern consistent with Phase 5 implementation
- Browser Notification API permission requirements verified as enforced (Firefox 72+, Safari 12.1+)

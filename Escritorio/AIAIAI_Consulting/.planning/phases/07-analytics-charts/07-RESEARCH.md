# Phase 7: Analytics & Charts - Research

**Researched:** 2026-01-30
**Domain:** React 19 + Recharts for time-series dashboards and budget analytics
**Confidence:** HIGH

## Summary

Phase 7 builds on the analytics pre-computation from Phase 6-03, which generates `data/analytics.json` with 7d/30d/90d time windows containing aggregated metrics. This phase creates interactive charts to visualize token spend trends, cost-per-model breakdowns, and burn rate projections using Recharts, the industry-standard React charting library.

The project already has React 19.2.3, Next.js 16, and a proven pattern of custom bar charts (see `TokenChart` component). Research confirms Recharts 3.7.0 officially supports React 19 with full compatibility. The analytics data structure is perfectly suited for Recharts' declarative API: nested objects map directly to multiple Line/Area components, and time-series data (daily entries) fits the LineChart model.

Key architectural pattern: Server Components read `analytics.json` and pass data to Client Components wrapping Recharts. This follows the established pattern in existing projects (inmobiliariapp) and leverages Next.js 16 App Router strengths. Charts are responsive via ResponsiveContainer with min-height constraints, following best practices from shadcn/ui chart integration patterns.

**Primary recommendation:** Install recharts 3.7.0, create reusable chart components following the existing TokenChart pattern but with Recharts primitives, and build a dedicated analytics page showing: (1) multi-line spend chart with 7d/30d toggles, (2) bar chart for model cost breakdown, and (3) burn rate projection card with days-until-exhaustion calculation.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | 3.7.0 | React charting library | Industry standard for React dashboards. Declarative API, SVG-based, 165+ code examples in Context7. React 19 officially supported. |
| React | 19.2.3 | UI framework | Already installed. Recharts peer dep: ^16.8.0 \|\| ^17.0.0 \|\| ^18.0.0 \|\| ^19.0.0 |
| Next.js | 16.1.6 | App Router framework | Server Components for data reading, Client Components for interactivity |
| TypeScript | ^5 | Type safety | Recharts has built-in TypeScript definitions |
| Tailwind CSS | ^4 | Styling | Chart container styling, responsive breakpoints |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | Latest | Date formatting | Already in package.json if needed for date axis labels |
| lucide-react | ^0.563.0 | Icons | Already installed - use for chart legends and UI elements |
| Zod | ^4.3.6 | Runtime validation | Already in use - analytics data already validated via AnalyticsSchema |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| recharts | Chart.js + react-chartjs-2 | Canvas-based (not SVG), harder to style with Tailwind, less React-idiomatic |
| recharts | nivo | Heavier bundle (400KB+), more chart types but overkill for line/bar charts |
| recharts | tremor | Full dashboard library that conflicts with shadcn/ui. Too opinionated. |
| recharts | visx (Airbnb) | Low-level D3 wrapper, too much boilerplate for simple time-series charts |
| recharts | Victory | Smaller community, less maintained, fewer examples |

**Installation:**
```bash
cd /home/tomas/Escritorio/AIAIAI_Consulting/app
npm install recharts
# Note: Version 3.7.0 supports React 19 out of the box - no overrides needed
```

## Architecture Patterns

### Recommended Project Structure
```
app/src/
├── app/
│   ├── tokens/
│   │   └── page.tsx              # Existing tokens page
│   └── analytics/
│       └── page.tsx              # NEW: Analytics dashboard with charts
├── components/
│   ├── token-chart.tsx           # Existing custom bar chart (keep for reference)
│   ├── analytics/                # NEW: Chart components directory
│   │   ├── spend-trend-chart.tsx # Line chart for 7d/30d spend trends
│   │   ├── model-breakdown-chart.tsx # Bar chart for cost-per-model
│   │   ├── burn-rate-card.tsx    # Burn rate projection display
│   │   └── chart-legend.tsx      # Shared legend component (optional)
│   └── ui/                       # Existing shadcn/ui components
└── lib/
    ├── data.ts                   # Existing data reader
    ├── analytics.ts              # Existing analytics generator (Phase 6-03)
    └── schemas.ts                # Existing Zod schemas with AnalyticsSchema
```

### Pattern 1: Server Component Data Reading with Client Chart
**What:** Next.js 16 App Router pattern - Server Component reads analytics.json, Client Component renders chart
**When to use:** All chart pages requiring data from JSON files
**Example:**
```typescript
// app/analytics/page.tsx (Server Component)
import { getAnalytics } from "@/lib/data";
import { SpendTrendChart } from "@/components/analytics/spend-trend-chart";

export default function AnalyticsPage() {
  const analytics = getAnalytics(); // Server-side file read

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
      <SpendTrendChart data={analytics.windows} />
    </div>
  );
}
```

**Client component:**
```typescript
// components/analytics/spend-trend-chart.tsx
"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Analytics } from "@/lib/schemas";

interface Props {
  data: Analytics["windows"];
}

export function SpendTrendChart({ data }: Props) {
  const { "7d": sevenDay, "30d": thirtyDay } = data;

  // Transform analytics window into time-series points
  // (analytics.json has aggregated totals, not daily data)
  // For daily breakdown, you'll need to read tokens.json or history

  return (
    <Card>
      <CardHeader>
        <CardTitle>Token Spend Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            {/* Chart implementation */}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

### Pattern 2: Time-Series Data Transformation
**What:** Convert analytics.json aggregates and tokens.json entries into chart-friendly daily points
**When to use:** Building trend charts that show data over time (not just totals)
**Example:**
```typescript
// lib/data.ts - Add helper function
export function getDailySpendData(days: 7 | 30 | 90) {
  const tokenData = getTokenData();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoff = cutoffDate.toISOString().split("T")[0];

  // Filter entries within window
  const entries = tokenData.entries.filter(e => e.date >= cutoff);

  // Group by date and sum costs
  const byDate: Record<string, { date: string; cost: number }> = {};
  for (const entry of entries) {
    if (!byDate[entry.date]) {
      byDate[entry.date] = { date: entry.date, cost: 0 };
    }
    byDate[entry.date].cost += entry.cost;
  }

  // Return sorted array of points
  return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
}
```

**Usage in chart:**
```typescript
"use client";
import { LineChart, Line, ... } from "recharts";

export function SpendTrendChart({ initialWindow = "7d" }) {
  const [window, setWindow] = useState(initialWindow);
  const data = getDailySpendData(window === "7d" ? 7 : 30);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Spend Trend</CardTitle>
          <div className="flex gap-2">
            <button onClick={() => setWindow("7d")}>7D</button>
            <button onClick={() => setWindow("30d")}>30D</button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="cost" stroke="hsl(var(--chart-1))" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

### Pattern 3: Cost-Per-Model Breakdown (Bar Chart)
**What:** Horizontal bar chart showing spending by model (opus vs sonnet)
**When to use:** Comparing categorical data with costs
**Example:**
```typescript
// Source: Context7 recharts examples + project patterns
"use client";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

export function ModelBreakdownChart({ data }: { data: Analytics["windows"]["7d"] }) {
  const chartData = Object.entries(data.byModel).map(([model, stats]) => ({
    model: model.replace("claude-", ""), // Shorten model name
    cost: stats.cost,
    tokens: stats.tokensIn + stats.tokensOut,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost by Model</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis dataKey="model" type="category" width={100} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="cost" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

### Pattern 4: Burn Rate Projection Card
**What:** Display burn rate with projected budget exhaustion date
**When to use:** Budget monitoring dashboards
**Example:**
```typescript
// components/analytics/burn-rate-card.tsx
"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Analytics } from "@/lib/schemas";

interface Props {
  analytics: Analytics;
  budget: number; // Monthly budget from tokens.json
}

export function BurnRateCard({ analytics, budget }: Props) {
  const window = analytics.windows["30d"];
  const burnRate = window.burnRate; // Daily average from analytics.json
  const spent = window.totalCost;
  const remaining = budget - spent;

  // Project days until budget exhausted
  const daysUntilExhaustion = burnRate > 0 ? Math.floor(remaining / burnRate) : Infinity;
  const exhaustionDate = new Date();
  exhaustionDate.setDate(exhaustionDate.getDate() + daysUntilExhaustion);

  // Determine severity
  const severity = daysUntilExhaustion < 7 ? "critical" : daysUntilExhaustion < 15 ? "warning" : "normal";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Burn Rate</span>
          <Badge variant={severity === "critical" ? "destructive" : severity === "warning" ? "outline" : "secondary"}>
            {severity === "critical" ? "High" : severity === "warning" ? "Moderate" : "Normal"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Daily Average</p>
          <p className="text-2xl font-bold">${burnRate.toFixed(2)}/day</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Budget Exhaustion</p>
          <p className="text-lg font-semibold">
            {daysUntilExhaustion === Infinity
              ? "Never (no spending)"
              : `${daysUntilExhaustion} days (${exhaustionDate.toLocaleDateString()})`
            }
          </p>
        </div>
        <div className="pt-2 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Spent (30d)</span>
            <span className="font-medium">${spent.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Remaining</span>
            <span className="font-medium">${remaining.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Anti-Patterns to Avoid
- **Client-side analytics calculation:** Don't recalculate burnRate or byModel aggregations in components. Use pre-computed analytics.json from Phase 6-03.
- **Forgetting "use client":** Recharts components require hooks and browser APIs. Always add "use client" directive to chart components.
- **Missing min-height on ResponsiveContainer:** Recharts won't render without explicit height. Use `height={300}` or parent with min-h-[300px].
- **Rendering 1000+ data points:** Recharts slows down with large datasets. Aggregate data (daily, not per-session) for performance.
- **Hardcoded colors:** Use CSS variables from Tailwind (hsl(var(--chart-1))) for theme compatibility.
- **Eager chart rendering on server:** Recharts is client-only. Server Components can prepare data but not render charts directly.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Interactive line charts | Custom SVG paths with D3 | Recharts LineChart | Handles tooltip positioning, axis scaling, legend, responsiveness, animations. Edge cases: negative values, sparse data, missing dates. |
| Responsive chart sizing | Manual resize listeners + useEffect | ResponsiveContainer from recharts | Handles window resize, debouncing, aspect ratio constraints, parent size changes. Works in flex/grid containers. |
| Chart tooltips | Custom hover state + positioned div | Recharts Tooltip | Handles cursor tracking, multi-series data display, value formatting, boundary detection (doesn't overflow viewport). |
| Axis label formatting | Manual string manipulation | Recharts XAxis/YAxis props | Handles tick generation, label rotation, overflow truncation, number formatting, date parsing. |
| Burn rate formula | Manual date math and aggregation | Pre-computed burnRate from analytics.json | Already calculated in Phase 6-03. Handles edge cases: partial months, zero spending days, timezone issues. |
| Multi-model comparison | Custom grouped bars or stacks | Recharts BarChart with multiple Bar components | Handles stacking, grouping, legend generation, color assignment, bar width calculation. |

**Key insight:** Chart libraries exist because visualizations have dozens of edge cases (empty data, single data point, negative values, long labels, mobile sizing, accessibility). Recharts solves these systematically with 9 years of production usage.

## Common Pitfalls

### Pitfall 1: React 19 Peer Dependency Warnings
**What goes wrong:** npm install recharts shows peer dependency warnings about react-is
**Why it happens:** Package managers check peer deps strictly; recharts internally uses react-is which must match React version
**How to avoid:**
- Use npm 8+ or yarn 3+ which handle peer deps better
- Recharts 3.7.0 officially supports React 19 - warnings are informational, not blocking
- If errors occur, add to package.json: `"overrides": { "react-is": "^19.0.0" }`
**Warning signs:** Installation fails with ERESOLVE, or runtime errors about React version mismatch
**Source:** https://github.com/recharts/recharts/issues/4558 and https://x.com/sebsilbermann/status/1795417336809136441

### Pitfall 2: Analytics.json Has Aggregates, Not Time-Series Points
**What goes wrong:** Trying to pass analytics.windows["7d"] directly to LineChart expecting daily data points
**Why it happens:** analytics.json stores totalCost and burnRate (aggregates), not day-by-day breakdown
**How to avoid:**
- For trend charts, read tokens.json entries and group by date (see Pattern 2)
- Use analytics.json for summary cards (total cost, burn rate) not line charts
- Or extend analytics.json to include `dailyBreakdown: Array<{date, cost}>` in Phase 7 if needed
**Warning signs:** LineChart renders as single point or empty, console errors about missing dataKey
**Source:** Inspected data/analytics.json structure, analytics.ts implementation

### Pitfall 3: Recharts Performance with 100+ Daily Points
**What goes wrong:** Chart rendering becomes laggy when showing 90-day daily data (90 points)
**Why it happens:** Recharts recalculates all SVG paths on every render; XAxis label generation is expensive
**How to avoid:**
- Limit initial view to 7 days, make 30d/90d opt-in via toggle
- Use React.memo on chart components to prevent unnecessary re-renders
- Keep data transformation outside component (useMemo or server-side)
- Use `type="monotone"` on Line (smoother) vs "linear" (more calculations)
**Warning signs:** Chart takes >300ms to render, UI freezes when toggling time windows
**Source:** https://recharts.github.io/en-US/guide/performance/ (Recharts docs)

### Pitfall 4: Forgetting to Format Dates on X-Axis
**What goes wrong:** X-axis shows "2026-01-30" full ISO dates, overlapping and unreadable
**Why it happens:** Recharts renders dataKey value as-is without formatting
**How to avoid:**
- Add `tickFormatter` to XAxis: `<XAxis dataKey="date" tickFormatter={(val) => val.slice(5)} />` (shows MM-DD)
- For longer windows, use date-fns: `tickFormatter={(val) => format(new Date(val), "MMM dd")}`
- Rotate labels if needed: `angle={-45} textAnchor="end"`
**Warning signs:** Overlapping date labels, horizontal scrolling on mobile
**Source:** Recharts XAxis API docs, common dashboard patterns

### Pitfall 5: Burn Rate Calculation with Partial Month Data
**What goes wrong:** Burn rate shows inflated values early in the month (e.g., day 3 shows $150/day but real rate is $50/day)
**Why it happens:** analytics.ts divides totalCost by window size (30 days), not actual days with spending
**How to avoid:**
- Current implementation (totalCost / days) is correct for projection - it assumes spending continues
- For "actual burn rate", calculate: totalCost / (number of unique dates in entries)
- Display both if needed: "Projected: $X/day (if spending continues)" vs "Actual: $Y/day (average of active days)"
**Warning signs:** Burn rate changes drastically day-to-day early in period
**Source:** Burn rate best practices from https://www.scoro.com/blog/project-burn-rate/

## Code Examples

Verified patterns from official sources:

### Multi-Line Chart with Model Comparison
```typescript
// Source: Context7 recharts /recharts/recharts - Multi-line example
"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface DataPoint {
  date: string;
  opus: number;
  sonnet: number;
}

export function ModelComparisonChart({ data }: { data: DataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="date"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          tickFormatter={(val) => val.slice(5)} // Show MM-DD
        />
        <YAxis
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          tickFormatter={(val) => `$${val}`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))"
          }}
          formatter={(value: number) => `$${value.toFixed(2)}`}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="opus"
          name="Claude Opus 4.5"
          stroke="hsl(var(--chart-1))"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="sonnet"
          name="Claude Sonnet 4.5"
          stroke="hsl(var(--chart-2))"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

### Responsive Container with Height Constraints
```typescript
// Source: Context7 recharts /recharts/recharts - ResponsiveContainer example
import { ResponsiveContainer, LineChart } from "recharts";

// Percentage-based height (requires parent with explicit height)
<div className="h-[400px]">
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data}>{/* ... */}</LineChart>
  </ResponsiveContainer>
</div>

// Fixed height (recommended for cards)
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data}>{/* ... */}</LineChart>
</ResponsiveContainer>

// Aspect ratio constraint (width-based height)
<ResponsiveContainer width="100%" aspect={2}>
  <LineChart data={data}>{/* ... */}</LineChart>
</ResponsiveContainer>

// With resize callback and debounce
<ResponsiveContainer
  width="100%"
  height={300}
  debounce={300}
  onResize={(width, height) => console.log(`Resized to ${width}x${height}`)}
>
  <LineChart data={data}>{/* ... */}</LineChart>
</ResponsiveContainer>
```

### Data Transformation Helper
```typescript
// lib/data.ts - Transform tokens.json entries into chart-ready data
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { TokenDataSchema } from "./schemas";

export function getDailySpendByModel(days: 7 | 30 | 90) {
  const ROOT = resolve(__dirname, "..", "..", "..");
  const TOKENS_FILE = join(ROOT, "data", "tokens.json");

  const raw = readFileSync(TOKENS_FILE, "utf-8");
  const tokenData = TokenDataSchema.parse(JSON.parse(raw));

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoff = cutoffDate.toISOString().split("T")[0];

  const entries = tokenData.entries.filter(e => e.date >= cutoff);

  // Group by date, sum costs per model
  const byDate: Record<string, Record<string, number>> = {};
  for (const entry of entries) {
    if (!byDate[entry.date]) byDate[entry.date] = {};
    byDate[entry.date][entry.model] = (byDate[entry.date][entry.model] || 0) + entry.cost;
  }

  // Convert to array of {date, opus, sonnet, ...}
  return Object.entries(byDate)
    .map(([date, models]) => ({
      date,
      ...models,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
```

### Complete Analytics Page Layout
```typescript
// app/analytics/page.tsx
import { getAnalytics, getTokenData } from "@/lib/data";
import { SpendTrendChart } from "@/components/analytics/spend-trend-chart";
import { ModelBreakdownChart } from "@/components/analytics/model-breakdown-chart";
import { BurnRateCard } from "@/components/analytics/burn-rate-card";
import { StatCard } from "@/components/stat-card";

export default function AnalyticsPage() {
  const analytics = getAnalytics();
  const tokenData = getTokenData();
  const window30d = analytics.windows["30d"];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Analytics Dashboard</h1>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="30-Day Spend" value={`$${window30d.totalCost.toFixed(2)}`} />
        <StatCard title="Daily Burn Rate" value={`$${window30d.burnRate.toFixed(2)}/day`} />
        <StatCard title="Tokens (30d)" value={`${((window30d.tokensIn + window30d.tokensOut) / 1000000).toFixed(1)}M`} />
        <StatCard title="Models" value={Object.keys(window30d.byModel).length.toString()} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SpendTrendChart />
        <BurnRateCard analytics={analytics} budget={tokenData.budget.monthly} />
      </div>

      <ModelBreakdownChart data={window30d} />
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Chart.js (canvas) | Recharts (SVG) | 2015-2020 | Better accessibility, Tailwind integration, React composition |
| D3.js direct manipulation | Recharts declarative API | 2015-present | React-friendly, less boilerplate, maintainable |
| Client-side metric calculation | Pre-computed analytics.json | Phase 6-03 (2026) | Zero runtime calculation, faster page loads, consistent data |
| Custom burn rate formulas | Standardized projection methods | 2024-2026 | Industry-aligned metrics (totalCost/days for projection) |
| Recharts 2.x | Recharts 3.x | 2023-2024 | React 19 support, TypeScript improvements, better tree-shaking |
| Manual responsive listeners | ResponsiveContainer | Since recharts 1.0 | Automatic resize handling, debounce built-in |

**Deprecated/outdated:**
- **victory-charts:** Less maintained, smaller community than Recharts in 2026
- **react-vis (Uber):** Archived in 2021, no longer maintained
- **Plotly.js in React:** Heavy bundle size (3MB+), overkill for simple dashboards
- **Google Charts:** Requires external script, not React-native, licensing concerns

## Open Questions

Things that couldn't be fully resolved:

1. **Daily breakdown data structure**
   - What we know: analytics.json has aggregates (totalCost, burnRate), not daily points
   - What's unclear: Should analytics.json be extended with `dailyBreakdown: Array<{date, cost}>` or should charts read tokens.json directly?
   - Recommendation: For Phase 7, read tokens.json directly in helper functions (Pattern 2). If performance becomes an issue, extend analytics.json in a future iteration.

2. **Per-project analytics support**
   - What we know: analytics.json is global across all projects
   - What's unclear: Do users want per-project burn rate and spend charts?
   - Recommendation: Start with global charts (requirement ANLT-02 says "per-project" but analytics.json is global). If needed, add project filter dropdown that recalculates on client side by filtering tokens.json entries.

3. **Historical trend comparison**
   - What we know: Current analytics shows 7d/30d/90d windows from present
   - What's unclear: Do users want to compare "this week vs last week" or "this month vs last month"?
   - Recommendation: Not in requirements (ANLT-02/03/04). Mark as future enhancement. Current design supports it (could generate previous windows in analytics.json).

4. **Chart export functionality**
   - What we know: Recharts supports SVG export, recharts-to-png exists for PNG export
   - What's unclear: Is chart export needed for reporting?
   - Recommendation: Not in requirements. Can add in Phase 8+ if requested. Library exists (recharts-to-png) so low implementation risk.

## Sources

### Primary (HIGH confidence)
- Context7 recharts documentation: /recharts/recharts - https://context7.com/recharts/recharts/llms.txt
- Recharts official npm package: https://www.npmjs.com/package/recharts - Version 3.7.0 peer dependencies verified
- Recharts GitHub releases: https://github.com/recharts/recharts/releases - React 19 support confirmed
- Project analytics.ts implementation: /home/tomas/Escritorio/AIAIAI_Consulting/app/src/lib/analytics.ts
- Project schemas.ts: /home/tomas/Escritorio/AIAIAI_Consulting/app/src/lib/schemas.ts (AnalyticsSchema)
- Existing TokenChart component: /home/tomas/Escritorio/AIAIAI_Consulting/app/src/components/token-chart.tsx
- inmobiliariapp enhanced-chart.tsx: Working Recharts implementation with React 19

### Secondary (MEDIUM confidence)
- React 19 compatibility: https://x.com/sebsilbermann/status/1795417336809136441 - Sebastian Silbermann (Recharts maintainer) confirming React 19 support
- Recharts React 19 issue: https://github.com/recharts/recharts/issues/4558 - Community discussion and resolution
- Recharts performance guide: https://recharts.github.io/en-US/guide/performance/
- Burn rate best practices: https://www.scoro.com/blog/project-burn-rate/
- Budget projection patterns: https://www.rocketlane.com/blogs/calculating-project-burn-rate
- Recharts time-series patterns: https://medium.com/swlh/data-visualisation-in-react-part-i-an-introduction-to-recharts-33249e504f50

### Tertiary (LOW confidence - marked for validation)
- Recharts vs alternatives comparison: https://technostacks.com/blog/react-chart-libraries/ (2026 rankings)
- Dashboard charting libraries: https://embeddable.com/blog/javascript-charting-libraries (general overview)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Recharts 3.7.0 React 19 support verified via npm info and Context7 docs
- Architecture: HIGH - Patterns sourced from Context7 official examples and working inmobiliariapp implementation
- Pitfalls: HIGH - Derived from Recharts official performance docs, React 19 migration issues, and analytics.json structure inspection
- Burn rate formula: HIGH - Verified in analytics.ts implementation, cross-referenced with industry standards

**Research date:** 2026-01-30
**Valid until:** 2026-03-01 (30 days - Recharts is stable, React 19 patterns well-established)

---
phase: 07-analytics-charts
plan: 02
subsystem: ui
tags: [recharts, analytics, charts, burn-rate, budget]

# Dependency graph
requires:
  - phase: 07-01
    provides: SpendTrendChart component and Recharts setup
  - phase: 06-03
    provides: Analytics generation with byModel breakdown and burnRate
provides:
  - ModelBreakdownChart showing cost per model as horizontal bar chart
  - BurnRateCard with budget exhaustion projection and severity indicators
  - Complete analytics dashboard with all three chart sections
affects: [08-budget-alerts]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Horizontal BarChart with Cell components for per-bar colors"
    - "Burn rate severity thresholds: critical (<7d), warning (<15d), normal (>=15d)"
    - "7d/30d window toggle pattern reused from SpendTrendChart"

key-files:
  created:
    - app/src/components/analytics/model-breakdown-chart.tsx
    - app/src/components/analytics/burn-rate-card.tsx
  modified:
    - app/src/app/analytics/page.tsx

key-decisions:
  - "ModelBreakdownChart uses horizontal layout for better model name readability"
  - "Burn rate calculated from 30d window only (more stable than 7d)"
  - "Severity colors use dark-mode compatible classes"
  - "Analytics page layout: 2-column grid (SpendTrend + BurnRate), then full-width ModelBreakdown"

patterns-established:
  - "Bar charts use Cell components for individual bar colors from MODEL_COLORS array"
  - "Budget cards show both projection (days until exhaustion) and current state (spent/remaining)"
  - "Progress bars capped at 100% even if budget exceeded"

# Metrics
duration: 2min
completed: 2026-01-31
---

# Phase 7 Plan 2: Model Breakdown & Burn Rate Summary

**Complete analytics dashboard with cost-per-model breakdown bar chart, burn rate projection with severity indicators, and integrated 3-chart layout**

## Performance

- **Duration:** 2 minutes
- **Started:** 2026-01-31T02:04:49Z
- **Completed:** 2026-01-31T02:07:01Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Model breakdown bar chart showing cost distribution across Claude models (Opus 4.5 vs Sonnet 4.5)
- Burn rate projection card with budget exhaustion date and severity-based color indicators
- Complete analytics page with all three chart sections integrated

## Task Commits

Each task was committed atomically:

1. **Task 1: Create model breakdown bar chart** - `4adc0bd` (feat)
2. **Task 2: Create burn rate card and wire into analytics page** - `b93d5d2` (feat)

## Files Created/Modified
- `app/src/components/analytics/model-breakdown-chart.tsx` - Horizontal bar chart showing cost per model with 7d/30d toggle
- `app/src/components/analytics/burn-rate-card.tsx` - Budget burn rate projection with exhaustion date, severity indicator, and progress bar
- `app/src/app/analytics/page.tsx` - Updated layout with 2-column grid (SpendTrend + BurnRate) and full-width ModelBreakdown

## Decisions Made
- ModelBreakdownChart uses horizontal layout (layout="vertical" in Recharts) for better readability of model names
- Burn rate calculation uses 30d window exclusively for more stable projections
- Severity thresholds set at <7 days (critical), <15 days (warning), >=15 days (normal)
- Analytics page reorganized: summary stats at top, then 2-column grid with SpendTrend and BurnRate, then full-width ModelBreakdown
- Model names shortened and formatted (e.g., "claude-opus-4-5" -> "Opus 4.5")

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all components integrated smoothly with existing data structures.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for Phase 8 (Budget Alerts):**
- Analytics dashboard complete with all three chart sections
- Burn rate calculation and severity logic available for alert triggers
- Budget exhaustion date projection ready for notification system

**Key data available for alerts:**
- `daysUntilExhaustion` from burn rate calculation
- `severity` indicator (critical/warning/normal)
- Daily burn rate from 30d window
- Budget spent/remaining values

---
*Phase: 07-analytics-charts*
*Completed: 2026-01-31*

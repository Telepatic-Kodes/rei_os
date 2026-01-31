---
phase: 05-data-infrastructure
plan: 01
subsystem: infra
tags: [zod, validation, atomic-writes, jsonl, data-safety]

# Dependency graph
requires:
  - phase: 04-auto-sync
    provides: Token sync scripts that will use these utilities in next plans
provides:
  - Zod schemas for all data shapes with runtime validation
  - Atomic write utilities (tmp+rename pattern for JSON, safe append for JSONL)
  - JSONL history infrastructure with monthly rotation and 6-month retention
  - Extracted budget config to data/config/budget.json
affects: [05-02-safe-data-layer, 06-automated-sync, 07-analytics, all future data operations]

# Tech tracking
tech-stack:
  added: [zod]
  patterns: [atomic-writes, monthly-jsonl-rotation, schema-validation, tmp-rename-pattern]

key-files:
  created:
    - app/src/lib/schemas.ts
    - app/src/lib/atomic-write.ts
    - app/src/lib/jsonl.ts
    - data/config/budget.json
    - data/history/.gitkeep
  modified: []

key-decisions:
  - "Zod for runtime validation instead of TypeScript-only types"
  - "Tmp+rename pattern for full-file writes, direct append for JSONL (OS-level atomic)"
  - "Monthly rotation for JSONL files with YYYY-MM naming convention"
  - "Default 6-month retention period for history cleanup"
  - "Budget config extracted to separate file for future multi-project support"

patterns-established:
  - "Atomic writes: All data writes use atomicWriteJson or atomicWriteJsonl"
  - "Schema validation: All JSON loading validates with Zod schemas"
  - "JSONL naming: {metric}-YYYY-MM.jsonl in data/history/{metric}/"
  - "History cleanup: cleanupOldHistory maintains retention policy"

# Metrics
duration: 3min
completed: 2026-01-31
---

# Phase 5 Plan 1: Data Infrastructure & Safety Summary

**Zod schemas with runtime validation, atomic write utilities using tmp+rename, and JSONL history with monthly rotation**

## Performance

- **Duration:** 3min
- **Started:** 2026-01-31T00:02:25Z
- **Completed:** 2026-01-31T00:05:23Z
- **Tasks:** 2/2 completed
- **Files modified:** 5 created

## Accomplishments

- Zod schemas for all data shapes (Project, TokenEntry, TokenData, QualityEntry, BudgetConfig, HistoryEntry)
- Atomic write functions eliminate risk of corrupt files on crash (tmp+rename for JSON, append for JSONL)
- JSONL history infrastructure with monthly rotation (tokens-2026-01.jsonl pattern)
- Automatic cleanup of history files older than 6 months
- Budget configuration extracted to data/config/budget.json

## Task Commits

Each task was committed atomically:

1. **Task 1: Zod schemas and atomic write utilities** - `136e8bc` (feat)
   - Created app/src/lib/schemas.ts with 6 Zod schemas
   - Created app/src/lib/atomic-write.ts with atomicWriteJson and atomicWriteJsonl
   - All schemas match existing TypeScript interfaces from data.ts

2. **Task 2: JSONL history utilities and budget config** - `98b9b0b` (feat)
   - Created app/src/lib/jsonl.ts with rotation and cleanup utilities
   - Created data/history/{tokens,quality,projects} directory structure
   - Extracted budget config from tokens.json to data/config/budget.json

**Plan metadata:** (will be committed after SUMMARY creation)

## Files Created/Modified

- `app/src/lib/schemas.ts` - Zod schemas for all data shapes with validateJson helper
- `app/src/lib/atomic-write.ts` - atomicWriteJson (tmp+rename) and atomicWriteJsonl (append)
- `app/src/lib/jsonl.ts` - Monthly rotation, read/append, list, cleanup utilities
- `data/config/budget.json` - Extracted budget configuration (monthly: 200, currency: USD)
- `data/history/.gitkeep` - History directory structure with tokens/quality/projects subdirs

## Decisions Made

1. **Zod over other validation libraries** - Native TypeScript integration, excellent error messages, established in ecosystem
2. **Tmp+rename for JSON, direct append for JSONL** - Full-file writes need atomicity via rename. Single-line JSONL appends under 4KB are atomic at OS level.
3. **Monthly rotation with YYYY-MM naming** - Enables efficient time-based queries and cleanup without parsing file contents
4. **6-month default retention** - Balances disk space with debugging/audit needs. Configurable via cleanupOldHistory parameter.
5. **Budget in separate file** - Prepares for future multi-project budget tracking. Keeps tokens.json focused on entries.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**1. Zod TypeScript error on ZodError.errors property**
- **During:** Task 1 TypeScript compilation
- **Issue:** Used `error.errors` instead of `error.issues` for ZodError
- **Resolution:** Changed to `error.issues` with explicit `z.ZodIssue` type annotation
- **Impact:** None - fixed before commit

No other issues encountered. All verification checks passed on first attempt.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for Phase 5 Plan 2 (Safe Data Layer):**
- Schemas ready to validate all data loads
- Atomic write functions ready to replace unsafe writeFileSync calls
- JSONL utilities ready for history tracking

**Dependencies satisfied:**
- Plan 05-02 will refactor data.ts to use these utilities
- All subsequent sync and analytics work builds on safe data foundation

**No blockers or concerns.**

---
*Phase: 05-data-infrastructure*
*Completed: 2026-01-31*

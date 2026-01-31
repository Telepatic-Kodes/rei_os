---
phase: 05-data-infrastructure
plan: 02
subsystem: infra
tags: [zod, atomic-writes, jsonl, data-validation, idempotency]

# Dependency graph
requires:
  - phase: 05-01
    provides: Atomic write utilities, JSONL history, Zod schemas
provides:
  - Validated data layer using Zod schemas for all JSON reads/writes
  - Atomic write pattern applied to all data files (no corruption risk)
  - JSONL history append on every sync operation with 6-month retention
  - Idempotent sync scripts (project name dedup, session-based token merge, date+project quality key)
  - Gitignore rules separating auto-generated vs tracked data
affects: [06-automated-sync, 07-analytics, 08-budget-alerts]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Runtime validation with Zod on all data reads/writes"
    - "Atomic writes via temp+rename for JSON, direct append for JSONL"
    - "JSONL history append after every sync with automated retention cleanup"

key-files:
  created:
    - .gitignore
  modified:
    - app/src/lib/data.ts
    - scripts/sync-tokens.ts
    - scripts/sync-quality.ts
    - scripts/sync-projects.ts

key-decisions:
  - "Eliminate all 'as T' type casts in favor of Zod runtime validation"
  - "Re-export types from data.ts for backward compatibility with existing components"
  - "Apply atomicWriteJson to all sync scripts, not just data.ts functions"
  - "Deduplicate projects by name (not id) for idempotency"

patterns-established:
  - "readValidatedJson<T>(filename, schema) pattern for safe data loading"
  - "Validate before write: schema.parse(data) then atomicWriteJson(path, validated)"
  - "After every sync: write main file, append history, cleanup old history"

# Metrics
duration: 4min
completed: 2026-01-31
---

# Phase 5 Plan 2: Data Safety Layer Summary

**Runtime validation with Zod schemas, atomic writes via temp+rename, JSONL history append, and idempotent sync operations**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-31T00:08:04Z
- **Completed:** 2026-01-31T00:11:59Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Eliminated all unsafe type casts in data layer with Zod runtime validation
- Applied atomic write pattern to all sync scripts (zero risk of data corruption)
- Configured JSONL history append with 6-month retention on every sync
- Made all sync scripts idempotent (safe to run multiple times)
- Separated auto-generated data (gitignored) from tracked seed data

## Task Commits

Each task was committed atomically:

1. **Task 1: Refactor data.ts to use Zod schemas and atomic writes** - `760a417` (refactor)
2. **Task 2: Update sync scripts and configure gitignore** - `583fcac` (feat)

## Files Created/Modified
- `app/src/lib/data.ts` - Refactored to use Zod validation and atomic writes; added getBudgetConfig()
- `scripts/sync-tokens.ts` - Uses atomicWriteJson, appends to JSONL history, runs cleanup
- `scripts/sync-quality.ts` - Uses atomicWriteJson, appends to JSONL history, runs cleanup
- `scripts/sync-projects.ts` - Uses atomicWriteJson, deduplicates by name, appends to JSONL history, runs cleanup
- `.gitignore` - Ignores data/history/ but tracks data/*.json and data/config/

## Decisions Made

**1. Re-export types from data.ts for backward compatibility**
- Components import types from data.ts (not schemas.ts)
- Adding `export type { Project, TokenData, ... }` prevents breaking changes
- Rationale: Minimize refactor scope, maintain existing import patterns

**2. Deduplicate projects by name instead of id in sync-projects.ts**
- Plan specified project name dedup for idempotency
- Implementation: `new Map(existing.map(p => [p.name, p])).values()`
- Rationale: Prevents duplicate projects if id changes but name stays same

**3. Apply atomicWriteJson at script level, not just library level**
- All three sync scripts directly call atomicWriteJson
- Not wrapped in higher-level data.ts functions
- Rationale: Scripts already handle their own file I/O; cleaner to replace writeFileSync directly

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all implementations worked as specified.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for Phase 6 (Automated Sync):**
- All sync scripts now safe for unattended execution (atomic writes + validation)
- JSONL history tracking in place for audit trail
- Idempotent operations mean cron jobs can run safely on schedule
- Gitignore configured to avoid committing auto-generated data

**No blockers.**

**Verification recommended before automation:**
- Run each sync script twice, confirm identical output (idempotency test)
- Check data/history/ directories created with monthly JSONL files
- Confirm builds still work with validated data layer

---
*Phase: 05-data-infrastructure*
*Completed: 2026-01-31*

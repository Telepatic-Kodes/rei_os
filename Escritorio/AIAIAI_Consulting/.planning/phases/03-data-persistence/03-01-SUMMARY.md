---
phase: "03-data-persistence"
plan: "01"
subsystem: "kanban-persistence"
tags: ["api-route", "json-persistence", "optimistic-ui", "drag-drop"]
dependency-graph:
  requires: ["02-kanban"]
  provides: ["PATCH /api/projects/status", "writeProjects", "getProjectById"]
  affects: ["03-02", "03-03"]
tech-stack:
  added: []
  patterns: ["optimistic UI with revert", "Next.js API route handler"]
key-files:
  created:
    - "app/src/app/api/projects/status/route.ts"
  modified:
    - "app/src/lib/data.ts"
    - "app/src/components/kanban-board.tsx"
decisions:
  - id: "D-0301-01"
    decision: "Optimistic UI with revert on failure"
    rationale: "Instant feedback; revert keeps UI consistent with server state"
metrics:
  duration: "~5 min"
  completed: "2026-01-30"
---

# Phase 03 Plan 01: Kanban Status Persistence Summary

**One-liner:** PATCH API route persists kanban drag-drop status changes to projects.json with optimistic UI and error revert.

## What Was Done

### Task 1: writeProjects + PATCH API route
- Added `writeProjects(projects)` to `data.ts` -- writes JSON with pretty-print + trailing newline
- Added `getProjectById(id)` helper
- Created `/api/projects/status` PATCH endpoint with full validation:
  - Validates `id` is a non-empty string
  - Validates `status` is one of `active | paused | completed`
  - Returns 400 with descriptive error for invalid requests
  - Updates project in-place and writes back to disk

### Task 2: KanbanBoard API integration
- Made `handleDrop` async
- Captures original items before optimistic update
- Calls `fetch PATCH` after optimistic `setItems`
- Reverts to original items on `!res.ok` or network error

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | 73dbb6c | feat(03-01): add writeProjects and PATCH API route for project status |
| 2 | b33872c | feat(03-01): wire kanban drop to persist status via API |

## Deviations from Plan

None -- plan executed exactly as written.

## Verification

- `npx tsc --noEmit` passed after both tasks
- All three must-have truths satisfied:
  1. Dragging persists to projects.json via PATCH endpoint
  2. Refresh shows updated status (server reads from file)
  3. Invalid requests return 400 with error message

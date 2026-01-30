---
phase: 03-data-persistence
plan: 02
subsystem: data-sync
tags: [typescript, cli, git, automation]
dependency-graph:
  requires: [03-01]
  provides: [sync-projects-script, npm-sync-command]
  affects: [03-03]
tech-stack:
  added: []
  patterns: [cli-script, execFileSync, fs-read-write]
key-files:
  created:
    - scripts/sync-projects.ts
    - package.json
  modified:
    - data/projects.json
decisions:
  - id: dec-0302-1
    decision: "Use __dirname instead of import.meta.dirname for tsx CJS compatibility"
    why: "tsx runs in CJS mode where import.meta.dirname is undefined"
metrics:
  duration: "~1 min"
  completed: 2026-01-30
---

# Phase 03 Plan 02: Sync Projects Script Summary

**One-liner:** CLI script that reads git log and package.json from each project dir to update projects.json with real data.

## What Was Done

### Task 1: Create sync-projects script
- Created `scripts/sync-projects.ts` (137 lines)
- Reads `data/projects.json`, scans `projects/` subdirectories
- For each matching project: updates `lastCommit` (git log), `stack` (package.json deps mapped to friendly names), `description` (package.json)
- New dirs not in JSON get default entries with titlecase names
- Uses `execFileSync` (not execSync) for security
- Graceful handling of non-git dirs and missing package.json via try/catch
- Commit: `3c8ed58`

### Task 2: Add npm script
- Created root `package.json` with `"sync": "npx tsx scripts/sync-projects.ts"`
- Verified `npm run sync` outputs "Updated 14 projects, added 0 new projects"
- Commit: `800d59a`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed import.meta.dirname undefined in tsx**
- **Found during:** Task 1 verification
- **Issue:** `import.meta.dirname` is undefined when tsx runs in CJS mode
- **Fix:** Replaced with `__dirname` which is available in tsx CJS context
- **Files modified:** scripts/sync-projects.ts

## Verification

- `npx tsx scripts/sync-projects.ts` runs successfully, outputs summary
- `npm run sync` works identically
- Non-git dirs and missing package.json handled without crashes
- projects.json updated with real git dates and stack data

## Next Phase Readiness

Ready for 03-03 (detail pages or further data persistence work). The sync script provides fresh project data on demand.

---
phase: "04"
plan: "02"
subsystem: data-sync
tags: [quality, coverage, lighthouse, todo, typescript]
dependency-graph:
  requires: []
  provides: [sync-quality-script, quality-json-auto-sync, sync-all-command]
  affects: []
tech-stack:
  added: []
  patterns: [file-scanning, metric-aggregation, merge-preserve-external]
key-files:
  created: [scripts/sync-quality.ts]
  modified: [package.json, data/quality.json]
decisions:
  - id: D-0402-01
    summary: "techDebt derivation: both >80 = low, both >50 = medium, both 0 = none, else high"
metrics:
  duration: "~3min"
  completed: "2026-01-30"
---

# Phase 04 Plan 02: Sync Quality Data Summary

**Automated quality.json sync from project coverage, lighthouse, and TODO/FIXME counts**

## What Was Done

### Task 1: Create sync-quality.ts script
- Scans all 14 directories in projects/
- Parses coverage/coverage-summary.json for test coverage (Istanbul format)
- Parses lighthouse-report.json or .lighthouseci/*.json for performance scores
- Counts TODO/FIXME in .ts/.tsx/.js files (max 3 dirs deep, skips node_modules, caps at 200 files)
- Derives techDebt from coverage + lighthouse thresholds
- Merges results: replaces scanned projects, keeps external entries
- Writes data/quality.json with pretty-printed JSON

### Task 2: Wire npm scripts
- Added `sync:quality` script
- Added `sync:all` that chains sync-projects, sync-tokens, and sync-quality

## Commits

| Hash | Message |
|------|---------|
| 2f88020 | feat(04-02): add sync-quality.ts script |
| 90b36cb | chore(04-02): wire sync:quality and sync:all npm scripts |

## Decisions Made

**D-0402-01:** techDebt derivation logic uses simple threshold rules: both metrics >80 = "low", both >50 = "medium", both zero = "none" (no data), otherwise "high".

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- `npx tsx scripts/sync-quality.ts` runs without error, processes 14 projects
- `npm run sync:quality` works
- `npm run sync:all` chains all three sync scripts successfully
- data/quality.json is valid JSON with all 14 project entries

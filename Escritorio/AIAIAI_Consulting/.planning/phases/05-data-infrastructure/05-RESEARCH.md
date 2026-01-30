# Phase 5: Data Infrastructure & Safety - Research

**Researched:** 2026-01-30
**Domain:** Node.js file I/O, JSONL history, TypeScript data validation
**Confidence:** HIGH

## Summary

This phase adds safe write patterns, JSONL history tracking, and TypeScript validation to the existing JSON-file-based data layer. The codebase currently uses synchronous `fs.readFileSync`/`fs.writeFileSync` with no atomic writes, no history, no validation, and duplicated interfaces between `app/src/lib/data.ts` and each sync script.

The standard approach is: (1) create a shared `lib/io.ts` with atomic write (write to temp file + `fs.renameSync`) and JSONL append utilities, (2) create JSONL history files organized as `data/history/{metric}/YYYY-MM.jsonl`, (3) consolidate all TypeScript interfaces into a single `lib/schemas.ts` with runtime validation via Zod, and (4) update `.gitignore` to exclude auto-generated files while tracking seed/config data.

**Primary recommendation:** Build a thin `writeJsonAtomic()` and `appendJsonl()` utility layer, consolidate interfaces with Zod schemas, and organize history as one JSONL file per metric per month.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zod | 3.x | Runtime schema validation | Already used in sibling projects (guitarrap, amd), TypeScript-first, zero deps |
| node:fs | built-in | File I/O | Already used everywhere, no external deps needed |
| node:os | built-in | tmpdir for atomic writes | Cross-platform temp file creation |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tsx | existing | Run TypeScript scripts | Already in project for sync scripts |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Zod | Manual type guards | Zod gives runtime validation + type inference; type guards are error-prone |
| write-file-atomic (npm) | Custom atomic write | npm package adds dependency for 10 lines of code; hand-roll is fine here |

**Installation:**
```bash
cd app && npm install zod
```

## Architecture Patterns

### Recommended Data Directory Structure
```
data/
  config/
    budget.json          # tracked - manual config
  tokens.json            # tracked - seed/current snapshot
  projects.json          # tracked - seed/current snapshot
  quality.json           # tracked - seed/current snapshot
  history/
    tokens/
      2026-01.jsonl      # gitignored - auto-generated
      2026-02.jsonl
    quality/
      2026-01.jsonl
    projects/
      2026-01.jsonl
```

### Pattern 1: Atomic JSON Write
**What:** Write to temp file in same directory, then rename (atomic on POSIX and Windows NTFS).
**When to use:** Every JSON write operation.
**Example:**
```typescript
import { writeFileSync, renameSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { randomUUID } from "node:crypto";

export function writeJsonAtomic<T>(filePath: string, data: T): void {
  const dir = dirname(filePath);
  mkdirSync(dir, { recursive: true });
  const tmp = join(dir, `.tmp-${randomUUID()}.json`);
  try {
    writeFileSync(tmp, JSON.stringify(data, null, 2) + "\n", "utf-8");
    renameSync(tmp, filePath);
  } catch (err) {
    // Clean up temp file on failure
    try { require("node:fs").unlinkSync(tmp); } catch {}
    throw err;
  }
}
```

### Pattern 2: JSONL Append with Monthly Rotation
**What:** Append one JSON object per line to a monthly file. New month = new file automatically.
**When to use:** Every history record (tokens, quality, projects).
**Example:**
```typescript
import { appendFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";

export function appendJsonl<T>(baseDir: string, metric: string, record: T): void {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const dir = join(baseDir, "history", metric);
  mkdirSync(dir, { recursive: true });
  const filePath = join(dir, `${monthKey}.jsonl`);
  appendFileSync(filePath, JSON.stringify(record) + "\n", "utf-8");
}
```

### Pattern 3: Idempotent Sync with Dedup Key
**What:** Use `date + project` as dedup key for quality/projects, `date + project + session` for tokens.
**When to use:** Every sync script to prevent duplicate entries.
**Example:**
```typescript
function dedup(entries: TokenEntry[]): TokenEntry[] {
  const seen = new Map<string, TokenEntry>();
  for (const e of entries) {
    const key = `${e.date}|${e.project}|${e.session}`;
    seen.set(key, e); // last write wins
  }
  return Array.from(seen.values());
}
```

### Pattern 4: Zod Schemas with Type Inference
**What:** Define Zod schemas, infer TypeScript types from them. Single source of truth.
**When to use:** All data shapes.
**Example:**
```typescript
import { z } from "zod";

export const TokenEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  project: z.string().min(1),
  session: z.string().min(1),
  tokensIn: z.number().int().nonneg(),
  tokensOut: z.number().int().nonneg(),
  cost: z.number().nonneg(),
  model: z.string().min(1),
});
export type TokenEntry = z.infer<typeof TokenEntrySchema>;

export const TokenDataSchema = z.object({
  budget: z.object({ monthly: z.number(), currency: z.string() }),
  entries: z.array(TokenEntrySchema),
});
export type TokenData = z.infer<typeof TokenDataSchema>;
```

### Anti-Patterns to Avoid
- **Direct writeFileSync to data files:** Always use atomic write utility. A crash mid-write corrupts the file.
- **Duplicating interfaces across files:** Currently `data.ts` and each sync script define their own interfaces. Consolidate into one shared schema file.
- **Growing JSONL files forever:** Without monthly rotation, history files grow unboundedly. Always use YYYY-MM partitioning.
- **Appending to JSON arrays:** JSON files must be fully rewritten. Use JSONL for append-only patterns.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Schema validation | Manual type guards or `as T` casts | Zod schemas | Runtime safety, type inference, error messages |
| Atomic writes | Direct writeFileSync | temp + rename pattern | 10 lines, but must be correct (cleanup on failure, same-dir temp) |
| Date formatting | Custom date math | `toISOString().slice(0, 10)` and `.slice(0, 7)` | Already used in codebase, consistent |

**Key insight:** The atomic write and JSONL utilities are simple enough to hand-roll (no npm package needed), but they MUST be centralized in one utility file, not duplicated across scripts.

## Common Pitfalls

### Pitfall 1: Cross-Device Rename Failure
**What goes wrong:** `fs.renameSync` fails if temp file is on a different filesystem/mount than target.
**Why it happens:** Using `os.tmpdir()` which may be on a different partition.
**How to avoid:** Always create temp file in the SAME directory as the target file.
**Warning signs:** `EXDEV: cross-device link not permitted` error.

### Pitfall 2: JSONL Parse Failure on Trailing Newline
**What goes wrong:** Splitting JSONL by `\n` produces an empty string at the end, `JSON.parse("")` throws.
**Why it happens:** Every append adds `\n` after the JSON, so the file ends with `\n`.
**How to avoid:** Filter empty lines when reading: `lines.filter(line => line.trim() !== "")`.

### Pitfall 3: Breaking Existing Dashboard Reads
**What goes wrong:** Moving or renaming `data/tokens.json` breaks `app/src/lib/data.ts` which reads from `../data/`.
**Why it happens:** Refactoring data layout without updating all consumers.
**How to avoid:** Keep `data/tokens.json`, `data/projects.json`, `data/quality.json` exactly where they are. History files go in a NEW `data/history/` subdirectory. The existing JSON files remain the "current state" snapshot.

### Pitfall 4: Git Tracking Auto-Generated History
**What goes wrong:** Every sync creates git noise with hundreds of JSONL lines.
**Why it happens:** History files not in .gitignore.
**How to avoid:** Add `data/history/` to root `.gitignore`. Seed data (`data/*.json`) stays tracked.

### Pitfall 5: Concurrent Append Interleaving
**What goes wrong:** Two processes appending to same JSONL file can interleave partial lines.
**Why it happens:** `appendFileSync` is not guaranteed atomic for large writes on all platforms.
**How to avoid:** Keep each JSON line under 8KB (well under the PIPE_BUF limit on Linux). All our records are tiny (~200 bytes). For this project's scale, this is a non-issue.

## Code Examples

### Reading JSONL History for Charting (Phase 7 downstream)
```typescript
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

export function readJsonlHistory<T>(
  baseDir: string,
  metric: string,
  months?: string[] // e.g. ["2026-01", "2026-02"]
): T[] {
  const dir = join(baseDir, "history", metric);
  if (!existsSync(dir)) return [];

  const files = months
    ? months.map((m) => `${m}.jsonl`)
    : readdirSync(dir).filter((f) => f.endsWith(".jsonl")).sort();

  const records: T[] = [];
  for (const file of files) {
    const filePath = join(dir, file);
    if (!existsSync(filePath)) continue;
    const content = readFileSync(filePath, "utf-8");
    const lines = content.split("\n").filter((l) => l.trim() !== "");
    for (const line of lines) {
      records.push(JSON.parse(line) as T);
    }
  }
  return records;
}
```

### Safe JSON Read with Validation
```typescript
import { readFileSync } from "node:fs";
import { z } from "zod";

export function readJsonValidated<T>(filePath: string, schema: z.ZodType<T>): T {
  const raw = readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw);
  return schema.parse(data); // throws ZodError with details on invalid data
}
```

### Sync Script Pattern (Updated with Safety)
```typescript
// Pattern for updating sync scripts to use atomic writes + history
import { writeJsonAtomic, appendJsonl } from "../lib/io";
import { TokenDataSchema } from "../lib/schemas";

// 1. Read and validate existing
const existing = readJsonValidated(DATA_FILE, TokenDataSchema);

// 2. Merge new data (idempotent)
const merged = dedup([...existing.entries, ...fetched]);

// 3. Write atomically
writeJsonAtomic(DATA_FILE, { ...existing, entries: merged });

// 4. Append to history
for (const entry of fetched) {
  appendJsonl(DATA_DIR, "tokens", entry);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `as T` type assertions | Zod runtime validation | Zod 3.x (stable since 2022) | Catches data corruption at load time |
| Direct writeFileSync | Atomic temp+rename | Always been best practice | Prevents corruption on crash |
| Single growing JSON | JSONL with monthly rotation | Common pattern | Bounded file sizes, append-friendly |

**Deprecated/outdated:**
- Nothing specific; the patterns here are stable Node.js fundamentals.

## Open Questions

1. **Budget config extraction**
   - What we know: `tokens.json` has `budget: { monthly: 200, currency: "USD" }` embedded
   - What's unclear: Whether to extract to `data/config/budget.json` now or later
   - Recommendation: Extract now to `data/config/budget.json`, cleaner separation of config vs data. Update `data.ts` to read from new location.

2. **History retention policy**
   - What we know: Monthly JSONL rotation prevents single-file growth
   - What's unclear: How many months to keep (6? 12? forever?)
   - Recommendation: Keep all for now (files are tiny). Add a cleanup utility later if needed. Each month of tokens data is ~30 lines * 200 bytes = ~6KB.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `app/src/lib/data.ts`, `scripts/sync-*.ts`, `data/*.json`
- Node.js fs documentation: `renameSync` atomicity guarantees on POSIX
- Zod library: already used in sibling projects within the monorepo

### Secondary (MEDIUM confidence)
- JSONL format: newline-delimited JSON is a well-established convention (jsonlines.org)
- PIPE_BUF atomicity for small appends: POSIX guarantee for writes <= 4096 bytes

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all Node.js built-ins + Zod already in monorepo
- Architecture: HIGH - patterns derived directly from existing codebase analysis
- Pitfalls: HIGH - identified from actual code patterns in current sync scripts

**Research date:** 2026-01-30
**Valid until:** 2026-03-30 (stable infrastructure patterns)

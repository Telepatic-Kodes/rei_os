import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, resolve, extname } from "node:path";
import { atomicWriteJson } from "../app/src/lib/atomic-write";
import { appendJsonl, cleanupOldHistory } from "../app/src/lib/jsonl";
import { QualityEntrySchema } from "../app/src/lib/schemas";
import type { QualityEntry } from "../app/src/lib/schemas";

const ROOT = resolve(__dirname, "..");
const PROJECTS_DIR = join(ROOT, "projects");
const DATA_FILE = join(ROOT, "data", "quality.json");
const HISTORY_DIR = join(ROOT, "data", "history");

function parseCoverage(projectDir: string): { frontend: number; backend: number } {
  const summaryPath = join(projectDir, "coverage", "coverage-summary.json");
  if (!existsSync(summaryPath)) return { frontend: 0, backend: 0 };

  try {
    const data = JSON.parse(readFileSync(summaryPath, "utf-8"));
    const pct = data?.total?.lines?.pct ?? 0;
    return { frontend: pct, backend: pct };
  } catch {
    return { frontend: 0, backend: 0 };
  }
}

function parseLighthouse(projectDir: string): number {
  // Check direct file first
  const directPath = join(projectDir, "lighthouse-report.json");
  if (existsSync(directPath)) {
    try {
      const data = JSON.parse(readFileSync(directPath, "utf-8"));
      const score = data?.categories?.performance?.score;
      return typeof score === "number" ? Math.round(score * 100) : 0;
    } catch {
      /* fall through */
    }
  }

  // Check .lighthouseci directory
  const lhciDir = join(projectDir, ".lighthouseci");
  if (existsSync(lhciDir)) {
    try {
      const files = readdirSync(lhciDir).filter((f) => f.endsWith(".json"));
      for (const file of files) {
        try {
          const data = JSON.parse(readFileSync(join(lhciDir, file), "utf-8"));
          const score = data?.categories?.performance?.score;
          if (typeof score === "number") return Math.round(score * 100);
        } catch {
          continue;
        }
      }
    } catch {
      /* fall through */
    }
  }

  return 0;
}

function countTodoFixme(projectDir: string): number {
  const extensions = new Set([".ts", ".tsx", ".js"]);
  let count = 0;
  let filesScanned = 0;
  const MAX_FILES = 200;

  function walk(dir: string, depth: number): void {
    if (depth > 3 || filesScanned >= MAX_FILES) return;

    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }

    for (const entry of entries) {
      if (filesScanned >= MAX_FILES) return;
      if (entry === "node_modules" || entry === ".git" || entry === "dist" || entry === "build") continue;

      const fullPath = join(dir, entry);
      try {
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          walk(fullPath, depth + 1);
        } else if (stat.isFile() && extensions.has(extname(entry))) {
          filesScanned++;
          try {
            const content = readFileSync(fullPath, "utf-8");
            const matches = content.match(/\bTODO\b|\bFIXME\b/g);
            if (matches) count += matches.length;
          } catch {
            /* skip unreadable files */
          }
        }
      } catch {
        continue;
      }
    }
  }

  walk(projectDir, 0);
  return count;
}

function deriveTechDebt(
  coverage: { frontend: number; backend: number },
  lighthouse: number
): "none" | "low" | "medium" | "high" {
  const avgCoverage = (coverage.frontend + coverage.backend) / 2;

  // Both zero means no data - "none"
  if (avgCoverage === 0 && lighthouse === 0) return "none";

  // Both above 80 - low debt
  if (avgCoverage > 80 && lighthouse > 80) return "low";

  // Both above 50 - medium
  if (avgCoverage > 50 && lighthouse > 50) return "medium";

  return "high";
}

// Load existing entries
const existing: QualityEntry[] = existsSync(DATA_FILE)
  ? JSON.parse(readFileSync(DATA_FILE, "utf-8"))
  : [];

// Build map for deduplication (key: project+date for idempotency)
const entryMap = new Map(
  existing.map((e) => [`${e.project}:${e.date}`, e])
);

// Get scanned project directory names
const dirs = readdirSync(PROJECTS_DIR).filter((d) => {
  try {
    return statSync(join(PROJECTS_DIR, d)).isDirectory();
  } catch {
    return false;
  }
});

const scannedIds = new Set(dirs);
const today = new Date().toISOString().slice(0, 10);

// Process each project directory
const newEntries: QualityEntry[] = [];
for (const dirname of dirs) {
  const projectDir = join(PROJECTS_DIR, dirname);
  const coverage = parseCoverage(projectDir);
  const lighthouse = parseLighthouse(projectDir);
  const openIssues = countTodoFixme(projectDir);
  const techDebt = deriveTechDebt(coverage, lighthouse);

  const entry: QualityEntry = {
    project: dirname,
    date: today,
    testCoverage: coverage,
    lighthouseScore: lighthouse,
    openIssues,
    techDebt,
  };

  const key = `${dirname}:${today}`;
  entryMap.set(key, entry);
  newEntries.push(entry);
}

// Build final array: all entries (including old + new)
const result = Array.from(entryMap.values());

// Atomic write to main data file
atomicWriteJson(DATA_FILE, result);

// Append new entries to JSONL history
newEntries.forEach((entry) => {
  appendJsonl(HISTORY_DIR, "quality", entry);
});

// Cleanup old history (6-month retention)
cleanupOldHistory(HISTORY_DIR, "quality");

// Print summary
const scanned = dirs.length;
const external = result.filter((e) => !scannedIds.has(e.project)).length;
console.log(`Synced quality for ${scanned} projects (${external} external kept)`);
for (const entry of result) {
  const cov = `coverage: ${entry.testCoverage.frontend}/${entry.testCoverage.backend}`;
  const lh = `lighthouse: ${entry.lighthouseScore}`;
  const issues = `issues: ${entry.openIssues}`;
  console.log(`  ${entry.project}: ${cov}, ${lh}, ${issues}, debt: ${entry.techDebt}`);
}

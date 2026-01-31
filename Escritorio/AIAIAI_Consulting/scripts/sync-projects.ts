import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { atomicWriteJson } from "../app/src/lib/atomic-write";
import { appendJsonl, cleanupOldHistory } from "../app/src/lib/jsonl";
import { ProjectSchema } from "../app/src/lib/schemas";
import type { Project } from "../app/src/lib/schemas";

const ROOT = resolve(__dirname, "..");
const PROJECTS_DIR = join(ROOT, "projects");
const DATA_FILE = join(ROOT, "data", "projects.json");
const HISTORY_DIR = join(ROOT, "data", "history");

// Friendly name mapping for common npm packages
const STACK_MAP: Record<string, string> = {
  react: "React",
  next: "Next.js",
  tailwindcss: "Tailwind",
  typescript: "TypeScript",
  vite: "Vite",
  prisma: "Prisma",
  zustand: "Zustand",
  convex: "Convex",
  tone: "Tone.js",
  sqlite3: "SQLite",
  "better-sqlite3": "SQLite",
  vue: "Vue",
  express: "Express",
  fastapi: "FastAPI",
  remotion: "Remotion",
  "framer-motion": "Framer Motion",
  zod: "Zod",
};

function titleCase(s: string): string {
  return s
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getLastCommit(dir: string): string | null {
  try {
    const result = execFileSync("git", ["log", "-1", "--format=%Y-%m-%d"], {
      cwd: dir,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return result.trim() || null;
  } catch {
    return null;
  }
}

function getStackFromPackageJson(dir: string): string[] {
  const pkgPath = join(dir, "package.json");
  if (!existsSync(pkgPath)) return [];

  try {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    };
    const seen = new Set<string>();
    const stack: string[] = [];

    for (const dep of Object.keys(allDeps)) {
      const friendly = STACK_MAP[dep];
      if (friendly && !seen.has(friendly)) {
        seen.add(friendly);
        stack.push(friendly);
      }
    }
    return stack.slice(0, 5);
  } catch {
    return [];
  }
}

function getDescriptionFromPackageJson(dir: string): string | null {
  const pkgPath = join(dir, "package.json");
  if (!existsSync(pkgPath)) return null;

  try {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    return pkg.description && pkg.description.trim() ? pkg.description.trim() : null;
  } catch {
    return null;
  }
}

// Load existing projects
const existing: Project[] = JSON.parse(readFileSync(DATA_FILE, "utf-8"));
const projectMap = new Map(existing.map((p) => [p.id, p]));

// Scan project directories
const dirs = readdirSync(PROJECTS_DIR).filter((d) => {
  try {
    return statSync(join(PROJECTS_DIR, d)).isDirectory();
  } catch {
    return false;
  }
});

let updated = 0;
let added = 0;
const newEntries: Project[] = [];

for (const dirname of dirs) {
  const projectDir = join(PROJECTS_DIR, dirname);
  const project = projectMap.get(dirname);

  if (project) {
    // Update existing project
    const lastCommit = getLastCommit(projectDir);
    if (lastCommit) project.lastCommit = lastCommit;

    const stack = getStackFromPackageJson(projectDir);
    if (stack.length > 0) project.stack = stack;

    const desc = getDescriptionFromPackageJson(projectDir);
    if (desc) project.description = desc;

    updated++;
  } else {
    // New project not in projects.json
    const lastCommit = getLastCommit(projectDir) || "";
    const stack = getStackFromPackageJson(projectDir);
    const desc = getDescriptionFromPackageJson(projectDir) || "";
    const today = new Date().toISOString().slice(0, 10);

    const newProject: Project = {
      id: dirname,
      name: titleCase(dirname),
      client: "Interno",
      status: "active",
      progress: 0,
      startDate: today,
      deadline: "",
      stack,
      lastCommit,
      tasksTotal: 0,
      tasksDone: 0,
      description: desc,
    };

    existing.push(newProject);
    newEntries.push(newProject);
    added++;
  }
}

// Deduplicate by project name (idempotency requirement)
const deduped = Array.from(
  new Map(existing.map((p) => [p.name, p])).values()
);

// Atomic write to main data file
atomicWriteJson(DATA_FILE, deduped);

// Append new entries to JSONL history
newEntries.forEach((entry) => {
  appendJsonl(HISTORY_DIR, "projects", entry);
});

// Cleanup old history (6-month retention)
cleanupOldHistory(HISTORY_DIR, "projects");

console.log(`Updated ${updated} projects, added ${added} new projects`);

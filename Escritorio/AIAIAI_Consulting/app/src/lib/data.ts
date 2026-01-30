import fs from "fs";
import path from "path";

export interface Project {
  id: string;
  name: string;
  client: string;
  status: "active" | "paused" | "completed";
  progress: number;
  startDate: string;
  deadline: string;
  stack: string[];
  lastCommit: string;
  tasksTotal: number;
  tasksDone: number;
  description: string;
}

export interface TokenEntry {
  date: string;
  project: string;
  session: string;
  tokensIn: number;
  tokensOut: number;
  cost: number;
  model: string;
}

export interface TokenData {
  budget: { monthly: number; currency: string };
  entries: TokenEntry[];
}

export interface QualityEntry {
  project: string;
  date: string;
  testCoverage: { frontend: number; backend: number };
  lighthouseScore: number;
  openIssues: number;
  techDebt: "none" | "low" | "medium" | "high";
}

const dataDir = path.join(process.cwd(), "..", "data");

function readJson<T>(filename: string): T {
  const filePath = path.join(dataDir, filename);
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

export function getProjects(): Project[] {
  return readJson<Project[]>("projects.json");
}

export function getProjectById(id: string): Project | undefined {
  return getProjects().find((p) => p.id === id);
}

export function writeProjects(projects: Project[]): void {
  const filePath = path.join(dataDir, "projects.json");
  fs.writeFileSync(filePath, JSON.stringify(projects, null, 2) + "\n", "utf-8");
}

export function getTokenData(): TokenData {
  return readJson<TokenData>("tokens.json");
}

export function writeTokenData(data: TokenData): void {
  const filePath = path.join(dataDir, "tokens.json");
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

export function getQuality(): QualityEntry[] {
  return readJson<QualityEntry[]>("quality.json");
}

export function getQualityByProject(project: string): QualityEntry[] {
  return getQuality().filter((q) => q.project === project);
}

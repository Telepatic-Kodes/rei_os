import fs from "fs";
import path from "path";
import { z } from "zod";
import {
  ProjectSchema,
  TokenDataSchema,
  QualityEntrySchema,
  BudgetConfigSchema,
} from "./schemas";
import type {
  Project,
  TokenData,
  TokenEntry,
  QualityEntry,
  BudgetConfig,
} from "./schemas";
import { atomicWriteJson } from "./atomic-write";

// Re-export types for backward compatibility
export type { Project, TokenData, TokenEntry, QualityEntry, BudgetConfig };

const dataDir = path.join(process.cwd(), "..", "data");

/**
 * Reads and validates JSON data using a Zod schema.
 * @param filename - The filename relative to the data directory
 * @param schema - The Zod schema to validate against
 * @returns The validated and typed data
 * @throws Error if file doesn't exist or validation fails
 */
function readValidatedJson<T>(filename: string, schema: z.ZodType<T>): T {
  const filePath = path.join(dataDir, filename);
  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(raw);
  return schema.parse(parsed);
}

/**
 * Gets all projects with runtime validation.
 */
export function getProjects(): Project[] {
  return readValidatedJson("projects.json", z.array(ProjectSchema));
}

/**
 * Gets a single project by ID.
 */
export function getProjectById(id: string): Project | undefined {
  return getProjects().find((p) => p.id === id);
}

/**
 * Writes projects to disk using atomic write pattern.
 * Validates data before writing.
 */
export function writeProjects(projects: Project[]): void {
  const validated = z.array(ProjectSchema).parse(projects);
  const filePath = path.join(dataDir, "projects.json");
  atomicWriteJson(filePath, validated);
}

/**
 * Gets token data with runtime validation.
 */
export function getTokenData(): TokenData {
  return readValidatedJson("tokens.json", TokenDataSchema);
}

/**
 * Writes token data to disk using atomic write pattern.
 * Validates data before writing.
 */
export function writeTokenData(data: TokenData): void {
  const validated = TokenDataSchema.parse(data);
  const filePath = path.join(dataDir, "tokens.json");
  atomicWriteJson(filePath, validated);
}

/**
 * Gets quality metrics with runtime validation.
 */
export function getQuality(): QualityEntry[] {
  return readValidatedJson("quality.json", z.array(QualityEntrySchema));
}

/**
 * Gets quality metrics for a specific project.
 */
export function getQualityByProject(project: string): QualityEntry[] {
  return getQuality().filter((q) => q.project === project);
}

/**
 * Gets budget configuration with runtime validation.
 */
export function getBudgetConfig(): BudgetConfig {
  return readValidatedJson("config/budget.json", BudgetConfigSchema);
}

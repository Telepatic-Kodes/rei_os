import { z } from "zod";

/**
 * Zod schemas for all data shapes in the AIAIAI Consulting system.
 * These schemas provide runtime validation and type safety for JSON data.
 */

// Project schema
export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  client: z.string(),
  status: z.enum(["active", "paused", "completed"]),
  progress: z.number().min(0).max(100),
  startDate: z.string(),
  deadline: z.string(),
  stack: z.array(z.string()),
  lastCommit: z.string(),
  tasksTotal: z.number().int().min(0),
  tasksDone: z.number().int().min(0),
  description: z.string(),
});

// Token entry schema
export const TokenEntrySchema = z.object({
  date: z.string(),
  project: z.string(),
  session: z.string(),
  tokensIn: z.number().int().min(0),
  tokensOut: z.number().int().min(0),
  cost: z.number().min(0),
  model: z.string(),
});

// Budget config schema
export const BudgetConfigSchema = z.object({
  monthly: z.number().min(0),
  currency: z.string(),
});

// Token data schema (top-level tokens.json structure)
export const TokenDataSchema = z.object({
  budget: BudgetConfigSchema,
  entries: z.array(TokenEntrySchema),
});

// Quality entry schema
export const QualityEntrySchema = z.object({
  project: z.string(),
  date: z.string(),
  testCoverage: z.object({
    frontend: z.number().min(0).max(100),
    backend: z.number().min(0).max(100),
  }),
  lighthouseScore: z.number().min(0).max(100),
  openIssues: z.number().int().min(0),
  techDebt: z.enum(["none", "low", "medium", "high"]),
});

// JSONL history entry schema
export const HistoryEntrySchema = z.object({
  timestamp: z.string(),
  type: z.enum(["tokens", "quality", "projects"]),
  data: z.unknown(),
});

// Export inferred TypeScript types
export type Project = z.infer<typeof ProjectSchema>;
export type TokenEntry = z.infer<typeof TokenEntrySchema>;
export type BudgetConfig = z.infer<typeof BudgetConfigSchema>;
export type TokenData = z.infer<typeof TokenDataSchema>;
export type QualityEntry = z.infer<typeof QualityEntrySchema>;
export type HistoryEntry = z.infer<typeof HistoryEntrySchema>;

/**
 * Validates data against a Zod schema.
 * @param schema - The Zod schema to validate against
 * @param data - The data to validate
 * @returns The validated and typed data
 * @throws Error with descriptive message if validation fails
 */
export function validateJson<T>(schema: z.ZodType<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map(
        (err: z.ZodIssue) => `${err.path.join(".")}: ${err.message}`
      );
      throw new Error(`Validation failed:\n${messages.join("\n")}`);
    }
    throw error;
  }
}

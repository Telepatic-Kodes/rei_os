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
  // Workflow fields (optional for MVP)
  healthScore: z.number().min(0).max(100).optional(),
  lastActivity: z.string().optional(), // ISO date
  velocity: z.number().optional(), // Tasks per week
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

// Sync config schema
export const SyncConfigSchema = z.object({
  intervalMinutes: z.number().min(1).max(1440),
});

// Sync status schema
export const SyncStatusSchema = z.object({
  lastSync: z.string(),
  status: z.enum(["success", "error"]),
  durationMs: z.number().optional(),
  error: z.string().optional(),
});

// Analytics window schema (7d, 30d, 90d)
export const AnalyticsWindowSchema = z.object({
  totalCost: z.number(),
  tokensIn: z.number(),
  tokensOut: z.number(),
  byModel: z.record(
    z.string(),
    z.object({
      cost: z.number(),
      tokensIn: z.number(),
      tokensOut: z.number(),
    })
  ),
  burnRate: z.number(), // daily average cost
});

// Analytics schema (pre-computed metrics)
export const AnalyticsSchema = z.object({
  generatedAt: z.string(),
  windows: z.object({
    "7d": AnalyticsWindowSchema,
    "30d": AnalyticsWindowSchema,
    "90d": AnalyticsWindowSchema,
  }),
});

// Alert threshold schema
export const AlertThresholdSchema = z.object({
  percent: z.number().min(0).max(100),
  label: z.string().optional(),
});

// Alert configuration schema
export const AlertConfigSchema = z.object({
  globalBudget: z.number().min(1),
  globalThresholds: z.array(AlertThresholdSchema),
  perProjectLimits: z.record(z.string(), z.number().min(0)),
});

// Alert state schema (tracks fired alerts per month)
export const AlertStateSchema = z.object({
  firedAlerts: z.array(z.string()),
  lastReset: z.string(),
  month: z.string(),
});

// Alert result schema
export const AlertResultSchema = z.object({
  type: z.enum(["global", "project"]),
  level: z.enum(["warning", "critical"]),
  message: z.string(),
  alertKey: z.string(),
  projectName: z.string().optional(),
});

// Next action schema (workflow guidance)
export const NextActionSchema = z.object({
  id: z.string(),
  priority: z.enum(["critical", "high", "medium", "low"]),
  category: z.enum(["development", "testing", "quality", "deployment"]),
  title: z.string(),
  description: z.string(),
  estimatedDays: z.number().optional(),
  agentSuggestion: z.string().optional(), // Command Center agent name
});

// Export inferred TypeScript types
export type Project = z.infer<typeof ProjectSchema>;
export type TokenEntry = z.infer<typeof TokenEntrySchema>;
export type BudgetConfig = z.infer<typeof BudgetConfigSchema>;
export type TokenData = z.infer<typeof TokenDataSchema>;
export type QualityEntry = z.infer<typeof QualityEntrySchema>;
export type HistoryEntry = z.infer<typeof HistoryEntrySchema>;
export type SyncConfig = z.infer<typeof SyncConfigSchema>;
export type SyncStatus = z.infer<typeof SyncStatusSchema>;
export type AnalyticsWindow = z.infer<typeof AnalyticsWindowSchema>;
export type Analytics = z.infer<typeof AnalyticsSchema>;
export type AlertThreshold = z.infer<typeof AlertThresholdSchema>;
export type AlertConfig = z.infer<typeof AlertConfigSchema>;
export type AlertState = z.infer<typeof AlertStateSchema>;
export type AlertResult = z.infer<typeof AlertResultSchema>;
export type NextAction = z.infer<typeof NextActionSchema>;

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

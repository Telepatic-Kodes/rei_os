import { z, ZodError } from "zod";

/**
 * Form validation utilities for settings and forms
 * Uses Zod for runtime validation
 */

// Alert config schema
export const budgetSchema = z.object({
  globalBudget: z.number().min(1, "Budget must be at least $1"),
  globalThresholds: z.array(
    z.object({
      percent: z.number().min(0, "Min 0%").max(100, "Max 100%"),
      label: z.string().optional(),
    })
  ),
  perProjectLimits: z.record(
    z.string().min(1, "Project name required"),
    z.number().min(0, "Limit must be positive")
  ),
});

export type BudgetConfig = z.infer<typeof budgetSchema>;

/**
 * Validate form data against schema
 * Returns validation result with success flag and errors
 */
export function validateForm<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Extract errors from ZodError
  const errorMessages = result.error.issues.map(
    (issue) => `${issue.path.join(".")}: ${issue.message}`
  );

  return {
    success: false,
    errors: errorMessages,
  };
}

/**
 * Format Zod errors into field-level error map
 */
export function formatZodErrors(error: ZodError): Record<string, string> {
  const formatted: Record<string, string> = {};
  error.issues.forEach((issue) => {
    const path = issue.path.join(".");
    formatted[path] = issue.message;
  });
  return formatted;
}

/**
 * Validate specific fields in a form
 * Useful for real-time validation on blur
 */
export function validateField<T>(
  schema: z.ZodSchema<T>,
  fieldPath: string,
  value: unknown
): { valid: true } | { valid: false; error: string } {
  try {
    // Extract the specific field schema from the object
    const fieldSchema = getFieldSchema(schema, fieldPath);
    if (!fieldSchema) {
      return { valid: true }; // Can't validate unknown fields
    }

    fieldSchema.parse(value);
    return { valid: true };
  } catch (error) {
    if (error instanceof ZodError) {
      return { valid: false, error: error.issues[0]?.message || "Validation failed" };
    }
    return { valid: false, error: "Validation failed" };
  }
}

/**
 * Helper to extract field schema from object schema
 * Limited implementation - works for simple cases
 */
function getFieldSchema(schema: z.ZodSchema, path: string): z.ZodSchema | null {
  // For simple object schemas, access the shape
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape;
    if (shape && typeof shape === 'object' && path in shape) {
      return shape[path as keyof typeof shape] as z.ZodSchema;
    }
  }
  return null;
}

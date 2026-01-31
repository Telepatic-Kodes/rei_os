import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

/**
 * JSONL history utilities with monthly rotation and retention cleanup.
 * JSONL format: one JSON object per line, enabling efficient append-only operations.
 */

/**
 * Generates the path for a monthly-rotated JSONL file.
 * @param baseDir - Base directory for history files (e.g., "data/history")
 * @param metric - Metric name (e.g., "tokens", "quality", "projects")
 * @param date - Date to use for month calculation (defaults to now)
 * @returns Path like "data/history/tokens/tokens-2026-01.jsonl"
 */
export function getMonthlyPath(
  baseDir: string,
  metric: string,
  date: Date = new Date()
): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const filename = `${metric}-${year}-${month}.jsonl`;
  return path.join(baseDir, metric, filename);
}

/**
 * Appends an entry to a monthly-rotated JSONL file.
 * Creates directory structure if needed.
 * @param baseDir - Base directory for history files
 * @param metric - Metric name
 * @param entry - Data to append as a JSONL line
 * @param date - Date for rotation (defaults to now)
 */
export function appendJsonl(
  baseDir: string,
  metric: string,
  entry: unknown,
  date?: Date
): void {
  const filePath = getMonthlyPath(baseDir, metric, date);

  // Ensure directory exists
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });

  // Append JSON line
  const line = JSON.stringify(entry) + "\n";
  fs.appendFileSync(filePath, line, "utf-8");
}

/**
 * Reads and parses a JSONL file with schema validation.
 * @param filePath - Path to JSONL file
 * @param schema - Zod schema for validation
 * @returns Array of validated entries
 */
export function readJsonl<T>(filePath: string, schema: z.ZodType<T>): T[] {
  // Return empty array if file doesn't exist
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n").filter((line) => line.trim() !== "");

  return lines.map((line, index) => {
    try {
      const data = JSON.parse(line);
      return schema.parse(data);
    } catch (error) {
      throw new Error(
        `JSONL parse error at line ${index + 1}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  });
}

/**
 * Lists all JSONL files for a given metric, sorted chronologically.
 * @param baseDir - Base directory for history files
 * @param metric - Metric name
 * @returns Array of file paths sorted by filename (chronological)
 */
export function listHistoryFiles(baseDir: string, metric: string): string[] {
  const metricDir = path.join(baseDir, metric);

  if (!fs.existsSync(metricDir)) {
    return [];
  }

  const files = fs.readdirSync(metricDir);
  return files
    .filter((file) => file.endsWith(".jsonl"))
    .sort()
    .map((file) => path.join(metricDir, file));
}

/**
 * Cleans up JSONL history files older than the retention period.
 * @param baseDir - Base directory for history files
 * @param metric - Metric name
 * @param keepMonths - Number of months to retain (default: 6)
 * @returns Array of deleted file paths
 */
export function cleanupOldHistory(
  baseDir: string,
  metric: string,
  keepMonths: number = 6
): string[] {
  const files = listHistoryFiles(baseDir, metric);
  const deleted: string[] = [];

  // Calculate cutoff date
  const now = new Date();
  const cutoff = new Date(now.getFullYear(), now.getMonth() - keepMonths, 1);

  for (const filePath of files) {
    const filename = path.basename(filePath);

    // Extract YYYY-MM from filename like "tokens-2026-01.jsonl"
    const match = filename.match(/(\d{4})-(\d{2})\.jsonl$/);
    if (!match) continue;

    const [, year, month] = match;
    const fileDate = new Date(parseInt(year), parseInt(month) - 1, 1);

    // Delete if older than cutoff
    if (fileDate < cutoff) {
      fs.unlinkSync(filePath);
      deleted.push(filePath);
    }
  }

  return deleted;
}

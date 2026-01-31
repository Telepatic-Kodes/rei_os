import fs from "node:fs";
import path from "node:path";

/**
 * Atomic write utilities using temp file + rename pattern.
 * This ensures that writes never leave corrupt files, even if the process crashes mid-write.
 */

/**
 * Atomically writes JSON data to a file.
 * Uses temp file + rename pattern to ensure atomicity.
 * @param filePath - The target file path
 * @param data - The data to serialize as JSON
 */
export function atomicWriteJson(filePath: string, data: unknown): void {
  const tmpPath = `${filePath}.tmp.${process.pid}`;

  try {
    // Write to temporary file with 2-space indentation and trailing newline
    const content = JSON.stringify(data, null, 2) + "\n";
    fs.writeFileSync(tmpPath, content, "utf-8");

    // Atomic rename (overwrites destination if it exists)
    fs.renameSync(tmpPath, filePath);
  } catch (error) {
    // Clean up temp file on error
    try {
      fs.unlinkSync(tmpPath);
    } catch {
      // Ignore cleanup errors
    }
    throw error;
  }
}

/**
 * Atomically appends a line to a JSONL file.
 * Note: Single-line appends under 4KB are already atomic at the OS level,
 * so we use direct appendFileSync without temp+rename.
 * Creates parent directories if needed.
 * @param filePath - The JSONL file path
 * @param line - The data to append as a single JSON line
 */
export function atomicWriteJsonl(filePath: string, line: unknown): void {
  // Ensure parent directory exists
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });

  // Append JSON line with newline
  const content = JSON.stringify(line) + "\n";
  fs.appendFileSync(filePath, content, "utf-8");
}

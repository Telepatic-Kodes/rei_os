import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { atomicWriteJson } from "../app/src/lib/atomic-write";
import { appendJsonl, cleanupOldHistory } from "../app/src/lib/jsonl";
import { TokenDataSchema, TokenEntrySchema } from "../app/src/lib/schemas";
import type { TokenData, TokenEntry } from "../app/src/lib/schemas";

const ROOT = resolve(__dirname, "..");
const DATA_FILE = join(ROOT, "data", "tokens.json");
const HISTORY_DIR = join(ROOT, "data", "history");

const ADMIN_KEY = process.env.ANTHROPIC_ADMIN_KEY;
const ORG_ID = process.env.ANTHROPIC_ORG_ID;

if (!ADMIN_KEY || !ORG_ID) {
  console.log("ANTHROPIC_ADMIN_KEY or ANTHROPIC_ORG_ID not set — skipping token sync");
  process.exit(0);
}

async function main() {
  const url = `https://api.anthropic.com/v1/organizations/${ORG_ID}/usage`;

  const res = await fetch(url, {
    headers: {
      "x-api-key": ADMIN_KEY!,
      "anthropic-version": "2023-06-01",
    },
  });

  if (!res.ok) {
    console.error(`API error: ${res.status} ${res.statusText}`);
    process.exit(1);
  }

  const body = await res.json() as { data?: Array<{
    date?: string;
    input_tokens?: number;
    output_tokens?: number;
    cost_usd?: number;
    model?: string;
  }> };

  const fetched: TokenEntry[] = (body.data ?? []).map((item) => ({
    date: item.date ?? new Date().toISOString().slice(0, 10),
    project: "api-usage",
    session: "auto-sync",
    tokensIn: item.input_tokens ?? 0,
    tokensOut: item.output_tokens ?? 0,
    cost: item.cost_usd ?? 0,
    model: item.model ?? "unknown",
  }));

  // Load and validate existing data
  const existing: TokenData = TokenDataSchema.parse(
    JSON.parse(readFileSync(DATA_FILE, "utf-8"))
  );

  // Keep manual entries, replace auto-sync entries (idempotent dedup)
  const manual = existing.entries.filter((e) => e.session !== "auto-sync");
  existing.entries = [...manual, ...fetched];

  // Atomic write to main data file
  atomicWriteJson(DATA_FILE, existing);

  // Append new entries to JSONL history
  fetched.forEach((entry) => {
    appendJsonl(HISTORY_DIR, "tokens", entry);
  });

  // Cleanup old history (6-month retention)
  cleanupOldHistory(HISTORY_DIR, "tokens");

  console.log(`Synced ${fetched.length} token entries (kept ${manual.length} manual entries)`);
}

main().catch((err) => {
  console.error("sync-tokens failed:", err);
  process.exit(1);
});

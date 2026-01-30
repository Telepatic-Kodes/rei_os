import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(__dirname, "..");
const DATA_FILE = join(ROOT, "data", "tokens.json");

interface TokenEntry {
  date: string;
  project: string;
  session: string;
  tokensIn: number;
  tokensOut: number;
  cost: number;
  model: string;
}

interface TokenData {
  budget: { monthly: number; currency: string };
  entries: TokenEntry[];
}

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

  // Load existing data
  const existing: TokenData = JSON.parse(readFileSync(DATA_FILE, "utf-8"));

  // Keep manual entries, replace auto-sync entries
  const manual = existing.entries.filter((e) => e.session !== "auto-sync");
  existing.entries = [...manual, ...fetched];

  writeFileSync(DATA_FILE, JSON.stringify(existing, null, 2) + "\n");
  console.log(`Synced ${fetched.length} token entries (kept ${manual.length} manual entries)`);
}

main().catch((err) => {
  console.error("sync-tokens failed:", err);
  process.exit(1);
});

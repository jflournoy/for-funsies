#!/usr/bin/env node
/**
 * Append rows to GSD-LEDGER.md.
 *
 * Ported from the original CommonJS `scripts/gsd_ledger.js` to TypeScript
 * following the repository's move to `"type": "module"` and TS-only source.
 * The CLI contract is unchanged — see the usages in the issue.
 *
 * Usage:
 *   npm run ledger -- --pr <n> --contributor <handle> --issue <n> --amount <n> --kind <kind> \
 *     [--proposer <handle>] [--denomination GSD|USD] [--notes <text>]
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { parseLedger, type LedgerEntry } from "./ledger.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
// dist/js/gsd_ledger.js -> repo root (two levels up)
const LEDGER_PATH = resolve(__dirname, "..", "..", "GSD-LEDGER.md");

const VALID_KINDS = new Set<string>([
  "bounty",
  "proposal",
  "proposal-shipped",
  "implementation",
]);

function fail(msg: string): never {
  process.stderr.write(`Error: ${msg}\n`);
  process.exit(1);
}

function today(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function buildRow(
  num: number,
  date: string,
  contributor: string,
  kind: string,
  pr: string,
  issue: string,
  amount: string,
  denomination: string,
  notes: string,
): string {
  return `| ${num} | ${date} | ${contributor} | \`${kind}\` | ${pr} | ${issue} | ${amount} | ${denomination} | ${notes} |`;
}

interface InsertPositions {
  insertAt: number;
  placeholderIdx: number;
}

/**
 * Find where new rows go. Newest entries sit at the bottom of the table, so we
 * insert right after the separator (or replace the `_(none yet…)_` placeholder
 * when it is still present). The ledger is append-only: we never touch existing
 * rows.
 */
function findInsertPositions(lines: string[]): InsertPositions {
  let headerFound = false;
  let separatorFound = false;
  let insertAt = -1;
  let placeholderIdx = -1;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i]!.trim();

    if (!headerFound && trimmed.startsWith("| # |")) {
      headerFound = true;
      continue;
    }
    if (headerFound && !separatorFound && trimmed.startsWith("|---")) {
      separatorFound = true;
      insertAt = i + 1;
      continue;
    }
    if (separatorFound && trimmed.startsWith("|")) {
      if (trimmed.startsWith("| _(") || /^\|\s*_\(/.test(trimmed)) {
        placeholderIdx = i;
      }
      insertAt = i + 1;
    }
  }

  if (insertAt === -1) {
    fail("Could not find the ledger table in GSD-LEDGER.md");
  }

  return { insertAt, placeholderIdx };
}

function appendRows(lines: string[], newRows: string[]): string[] {
  const { insertAt, placeholderIdx } = findInsertPositions(lines);

  if (placeholderIdx !== -1) {
    lines.splice(placeholderIdx, 1, ...newRows);
  } else {
    lines.splice(insertAt, 0, ...newRows);
  }

  return lines;
}

interface LedgerCliArgs {
  pr: number;
  contributor: string;
  issue: number;
  amount: string;
  kind: string;
  proposer?: string;
  denomination?: string;
  notes?: string;
}

function main(): void {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      pr: { type: "string" },
      contributor: { type: "string" },
      issue: { type: "string" },
      amount: { type: "string" },
      kind: { type: "string" },
      proposer: { type: "string" },
      denomination: { type: "string" },
      notes: { type: "string" },
      format: { type: "string" },
    },
    strict: true,
  });

  // The --format json flag is a standalone mode: read, parse, output JSON.
  if (values.format === "json") {
    const content = readFileSync(LEDGER_PATH, "utf-8");
    const entries = parseLedger(content);
    const json = entries.map((e) => ({
      row: e.index,
      date: e.date,
      contributor: e.contributor,
      kind: e.kind,
      pr: e.pr,
      issue: e.issue,
      amount: e.amount,
      denomination: e.denomination,
      notes: e.notes,
    }));
    process.stdout.write(JSON.stringify(json, null, 2) + "\n");
    return;
  }

  const pr = values.pr;
  const contributor = values.contributor;
  const issue = values.issue;
  const amount = values.amount;
  const kind = values.kind;
  const proposer = values.proposer;
  const denomination = values.denomination ?? "GSD";
  const notes = values.notes ?? "";

  if (!pr) fail("--pr is required");
  if (!contributor) fail("--contributor is required");
  if (!issue) fail("--issue is required");
  if (!amount) fail("--amount is required");
  if (!kind) fail("--kind is required");

  if (!VALID_KINDS.has(kind)) {
    fail(`--kind must be one of: ${[...VALID_KINDS].join(", ")}`);
  }

  if (denomination !== "GSD" && denomination !== "USD") {
    fail("--denomination must be GSD or USD");
  }

  const content = readFileSync(LEDGER_PATH, "utf-8");
  const lines = content.split("\n");
  // Drop trailing blank lines so we control the final newline.
  while (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }

  // Reuse the shared parser for the authoritative row shape and numbering.
  const existingEntries: LedgerEntry[] = parseLedger(content);
  const lastNum =
    existingEntries.length > 0
      ? Math.max(...existingEntries.map((r) => r.index))
      : 0;

  const date = today();
  const newRows: string[] = [];

  newRows.push(
    buildRow(lastNum + 1, date, contributor, kind, pr, issue, amount, denomination, notes),
  );

  if (proposer) {
    newRows.push(
      buildRow(
        lastNum + 2,
        date,
        proposer,
        "proposal-shipped",
        pr,
        issue,
        "2",
        "GSD",
        `Proposer of PR #${pr}`,
      ),
    );
  }

  const updated = appendRows([...lines], newRows);
  writeFileSync(LEDGER_PATH, updated.join("\n") + "\n", "utf-8");

  process.stdout.write(`Appended ${newRows.length} row(s) to GSD-LEDGER.md\n`);
}

main();
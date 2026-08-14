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
  "correction",
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

/** Validate a date cell is a structurally valid ISO yyyy-mm-dd date. */
function isValidIsoDate(value: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return false;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12) return false;
  const daysInMonth = new Date(year, month, 0).getDate();
  return day >= 1 && day <= daysInMonth;
}

/**
 * Validate the structural integrity of the ledger: sequential row numbers
 * starting from 1, valid ISO dates, positive amounts, kinds in the allowed
 * set, and no deleted or reordered rows. Prints the first violation to stderr
 * and exits 1 on failure; stays silent and exits 0 on success.
 */
function validateLedger(content: string): void {
  // Parse the raw table ourselves rather than reusing parseLedger: parseLedger
  // silently skips malformed rows, but a validator must flag them.
  const rows: Array<{ line: number; cells: string[] }> = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i]!.trim();
    if (!trimmed.startsWith("|")) continue;
    const cells = trimmed.slice(1, -1).split("|").map((c) => c.trim());
    // Only treat 9-column rows with a numeric first cell as ledger entries.
    const index = Number.parseInt(cells[0] ?? "", 10);
    if (cells.length !== 9 || !Number.isFinite(index)) continue;
    rows.push({ line: i + 1, cells });
  }

  // An empty ledger is structurally valid.
  if (rows.length === 0) {
    process.stdout.write("Ledger is valid\n");
    return;
  }

  // 1. Row numbers must be sequential starting from 1, with no deletion/reorder.
  for (let i = 0; i < rows.length; i++) {
    const expected = i + 1;
    const actual = Number.parseInt(rows[i]!.cells[0]!, 10);
    if (actual !== expected) {
      process.stderr.write(
        `Row ${expected} is missing — expected #${expected} but found #${actual}\n`,
      );
      process.exit(1);
    }
  }

  for (const row of rows) {
    const [num, date, , kind, , , amount] = row.cells;

    // 2. Dates must be valid ISO format.
    if (!isValidIsoDate(date!)) {
      process.stderr.write(`Row ${num} has an invalid date: ${date}\n`);
      process.exit(1);
    }

    // 3. Amounts must be positive numbers (correction rows may be negative).
    const amountNum = Number.parseFloat(amount!);
    const kindCleanInner = kind!.replace(/`/g, "");
    if (!Number.isFinite(amountNum)) {
      process.stderr.write(`Row ${num} has a non-numeric amount: ${amount}\n`);
      process.exit(1);
    }
    if (kindCleanInner !== "correction" && amountNum <= 0) {
      process.stderr.write(`Row ${num} has a non-positive amount: ${amount}\n`);
      process.exit(1);
    }

    // 4. Kinds must be in the allowed set (strip backticks like the parser).
    const kindClean = kind!.replace(/`/g, "");
    if (!VALID_KINDS.has(kindClean)) {
      process.stderr.write(
        `Row ${num} has an invalid kind: ${kindClean} (expected one of: ${[...VALID_KINDS].join(", ")})\n`,
      );
      process.exit(1);
    }
  }

  process.stdout.write("Ledger is valid\n");
}

/**
 * Print per-contributor totals, broken down by award kind.
 * Originally PR #20 (waterWang), from accepted proposal #7 (Kasuki354).
 */
function printSummary(entries: readonly LedgerEntry[]): void {
  const KINDS = ["bounty", "proposal", "proposal-shipped", "implementation", "correction"] as const;

  const totals = new Map<string, Map<string, number>>();
  for (const e of entries) {
    if (e.denomination.toUpperCase() !== "GSD") continue;
    const row = totals.get(e.contributor) ?? new Map<string, number>();
    row.set(e.kind, (row.get(e.kind) ?? 0) + (Number.parseFloat(e.amount) || 0));
    totals.set(e.contributor, row);
  }

  const nameWidth = Math.max(11, ...[...totals.keys()].map((n) => n.length));
  const cols = [...KINDS, "Total"];
  const widths = cols.map((c) => Math.max(c.length, 6));

  const line = (cells: readonly string[]): string =>
    " " +
    cells
      .map((c, i) => c.padEnd(i === 0 ? nameWidth : (widths[i - 1] ?? 6)))
      .join(" | ") +
    " ";

  process.stdout.write(line(["Contributor", ...cols]) + "\n");
  process.stdout.write(
    line([
      "-".repeat(nameWidth),
      ...cols.map((_, i) => "-".repeat(widths[i] ?? 6)),
    ]) + "\n",
  );

  for (const [name, row] of totals) {
    const perKind = KINDS.map((k) => String(row.get(k) ?? 0));
    const total = [...row.values()].reduce((a, b) => a + b, 0);
    process.stdout.write(line([name, ...perKind, String(total)]) + "\n");
  }
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
      validate: { type: "boolean" },
      format: { type: "string" },
      summary: { type: "boolean" },
    },
    strict: true,
  });

  // The --validate flag is a standalone mode: read, check, report, exit.
  if (values.validate) {
    const content = readFileSync(LEDGER_PATH, "utf-8");
    validateLedger(content);
    return;
  }

  // --format json: dump the parsed ledger as structured data. (#5, PR #19)
  if (values.format !== undefined) {
    if (values.format !== "json") {
      fail("--format currently supports only: json");
    }
    const entries = parseLedger(readFileSync(LEDGER_PATH, "utf-8"));
    process.stdout.write(JSON.stringify(entries, null, 2) + "\n");
    return;
  }

  // --summary: per-contributor totals broken down by award kind. (#7, PR #20)
  if (values.summary) {
    printSummary(parseLedger(readFileSync(LEDGER_PATH, "utf-8")));
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
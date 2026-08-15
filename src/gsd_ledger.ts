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
  "participation",
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

interface AwardSpec {
  lastNum: number;
  date: string;
  contributor: string;
  kind: string;
  pr: string;
  issue: string;
  amount: string;
  denomination: string;
  notes: string;
  proposer?: string | undefined;
}

/** Build and append one (or two, with a proposer) award rows, then write. */
function writeAward(spec: AwardSpec, baseLines: string[]): void {
  const newRows: string[] = [
    buildRow(
      spec.lastNum + 1,
      spec.date,
      spec.contributor,
      spec.kind,
      spec.pr,
      spec.issue,
      spec.amount,
      spec.denomination,
      spec.notes,
    ),
  ];

  if (spec.proposer && spec.proposer !== spec.contributor) {
    newRows.push(
      buildRow(
        spec.lastNum + 2,
        spec.date,
        spec.proposer,
        "proposal-shipped",
        spec.pr,
        spec.issue,
        "2",
        "GSD",
        `Proposer of PR #${spec.pr}`,
      ),
    );
  }

  const updated = appendRows([...baseLines], newRows);
  writeFileSync(LEDGER_PATH, updated.join("\n") + "\n", "utf-8");
  process.stdout.write(`Appended ${newRows.length} row(s) to GSD-LEDGER.md\n`);
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
  close?: boolean;
  winner?: boolean;
  runnerUpAmount?: string;
  corrects?: number;
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

    // 3. Amounts must be positive numbers.
    const amountNum = Number.parseFloat(amount!);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
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
  const KINDS = ["bounty", "proposal", "proposal-shipped", "implementation"] as const;

  const totals = new Map<string, Map<string, number>>();
  for (const e of entries) {
    if (e.denomination.toUpperCase() !== "GSD") continue;
    const row = totals.get(e.contributor) ?? new Map<string, number>();
    if (e.kind === "correction") {
      // A correction reverses a prior award for this contributor: subtract.
      row.set("correction", (row.get("correction") ?? 0) + (Number.parseFloat(e.amount) || 0));
    } else {
      row.set(e.kind, (row.get(e.kind) ?? 0) + (Number.parseFloat(e.amount) || 0));
    }
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
    // correction subtracts from the contributor's net total.
    const corrected = row.get("correction") ?? 0;
    const total =
      [...row.entries()].reduce(
        (acc, [k, v]) => (k === "correction" ? acc - v : acc + v),
        0,
      );
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
      close: { type: "boolean" },
      winner: { type: "boolean" },
      "runner-up-amount": { type: "string" },
      corrects: { type: "string" },
    },
    strict: true,
  });

  // Shared inputs + ledger state. Computed once up front so the --corrects,
  // --close, and plain-append paths below all have them in scope.
  const pr = values.pr;
  const contributor = values.contributor;
  const issue = values.issue;
  const amount = values.amount;
  const kind = values.kind;
  const proposer = values.proposer;
  const denomination = values.denomination ?? "GSD";
  const notes = values.notes ?? "";

  const content = readFileSync(LEDGER_PATH, "utf-8");
  const lines = content.split("\n");
  while (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }
  const existingEntries: LedgerEntry[] = parseLedger(content);
  const lastNum =
    existingEntries.length > 0
      ? Math.max(...existingEntries.map((r) => r.index))
      : 0;
  const date = today();

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

  // --corrects N: append-only correction. Supersedes a mistaken row instead of
  // rewriting it (the ledger is append-only by design). The correction row
  // names the contributor whose award it reverses and the amount to subtract,
  // so contributor totals reflect the correction without ever deleting history.
  if (values.corrects !== undefined) {
    const rowNum = Number.parseInt(values.corrects, 10);
    if (!Number.isFinite(rowNum) || rowNum <= 0) {
      fail("--corrects requires a positive row number");
    }
    if (!contributor) fail("--contributor is required for a correction (who is being corrected)");
    if (!amount) fail("--amount is required for a correction (how much to reverse)");
    const correctionNotes =
      notes || `Correction: supersedes row ${rowNum} — award reversed for @${contributor}.`;
    return writeAward({
      lastNum,
      date,
      contributor,
      kind: "correction",
      pr: pr ?? "0",
      issue: issue ?? "0",
      amount,
      denomination,
      notes: correctionNotes,
      proposer: undefined,
    }, lines);
  }

  // ---- Bounty-aware close mode (issue #43) ----
  // A bounty pays out ONCE per issue, not once per PR. When several PRs close
  // the same bountied issue (a competition, or near-simultaneous merges), only
  // the designated winner earns the full `bounty`; other serious entries earn a
  // smaller `participation` amount. We never guess: the caller states whether
  // this PR is the winner via --winner. A second full-value write is refused
  // loudly rather than dropping an award silently.
  if (values.close) {
    if (!issue) fail("--issue is required in --close mode");
    if (!pr) fail("--pr is required in --close mode");
    if (!contributor) fail("--contributor is required in --close mode");
    if (!amount) fail("--amount is required in --close mode");

    const existing = parseLedger(content);
    const awardForIssue = (k: string) =>
      existing.find((e) => e.issue === String(issue) && e.kind === k);

    if (values.winner) {
      const prior = awardForIssue("bounty");
      if (prior) {
        // Idempotent: the winner is already recorded — nothing to do.
        if (prior.pr === String(pr) && prior.contributor === contributor) {
          process.stdout.write(
            `Issue #${issue} already has its bounty award (row ${prior.index}); nothing to record.\n`,
          );
          return;
        }
        // Someone else already holds the bounty for this issue. Refuse to
        // double-pay; the human must issue a correction if this is wrong.
        fail(
          `Issue #${issue} already has a bounty award (row ${prior.index}, ${prior.contributor}). ` +
            `Refusing to write a second full-value row. If this PR is the correct winner, ` +
            `supersede with --corrects ${prior.index}.`,
        );
      }
      // Winner path: write the full bounty row (+ proposer row if given).
      return writeAward({
        lastNum,
        date,
        contributor,
        kind: "bounty",
        pr: String(pr),
        issue: String(issue),
        amount,
        denomination,
        notes: notes || `Winning entry for #${issue}`,
        proposer,
      }, lines);
    }

    // Non-winner close: a serious-but-losing entry. It earns `participation`,
    // not the bounty amount. If a participation row already exists for this PR,
    // it is idempotent (nothing to record) rather than a silent no-op failure.
    const priorPart = existing.find(
      (e) => e.issue === String(issue) && e.kind === "participation" && e.pr === String(pr),
    );
    if (priorPart) {
      process.stdout.write(
        `Issue #${issue} PR #${pr} already has a participation award (row ${priorPart.index}); nothing to record.\n`,
      );
      return;
    }
    const partAmount = values["runner-up-amount"] ?? "1";
    return writeAward({
      lastNum,
      date,
      contributor,
      kind: "participation",
      pr: String(pr),
      issue: String(issue),
      amount: partAmount,
      denomination,
      notes: notes || `Serious entry for #${issue}`,
      proposer: undefined,
    }, lines);
  }

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
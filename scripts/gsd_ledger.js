#!/usr/bin/env node
/**
 * Author: RawNuke
 * Copyright (c) 2026 RawNuke. All rights reserved.
 *
 * Append rows to GSD-LEDGER.md.
 * Usage: node scripts/gsd_ledger.js --pr <n> --contributor <handle> --issue <n> --amount <n> --kind <kind> [--proposer <handle>] [--denomination GSD|USD] [--notes <text>]
 */

const fs = require("node:fs");
const path = require("node:path");

const LEDGER_PATH = path.resolve(__dirname, "..", "GSD-LEDGER.md");

const VALID_KINDS = new Set([
  "bounty",
  "proposal",
  "proposal-shipped",
  "implementation",
]);

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const key = argv[i];
    if (!key.startsWith("--")) continue;
    const val = argv[i + 1];
    if (val === undefined || val.startsWith("--")) {
      args[key.slice(2)] = true;
    } else {
      args[key.slice(2)] = val;
      i++;
    }
  }
  return args;
}

function fail(msg) {
  process.stderr.write(`Error: ${msg}\n`);
  process.exit(1);
}

function readLedger() {
  return fs.readFileSync(LEDGER_PATH, "utf-8");
}

function writeLedger(content) {
  fs.writeFileSync(LEDGER_PATH, content, "utf-8");
}

function today() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseExistingRows(lines) {
  const rows = [];
  let inTable = false;
  let headerFound = false;
  let separatorFound = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!headerFound && trimmed.startsWith("| # |")) {
      headerFound = true;
      continue;
    }
    if (headerFound && !separatorFound && trimmed.startsWith("|---")) {
      separatorFound = true;
      inTable = true;
      continue;
    }
    if (!inTable) continue;
    if (!trimmed.startsWith("|")) break;

    const cells = line.split("|").map((c) => c.trim()).filter(Boolean);
    if (cells.length === 0) break;

    const num = cells[0];
    if (num.startsWith("_(") || num === "" || isNaN(parseInt(num, 10))) {
      continue;
    }

    rows.push({
      num: parseInt(num, 10),
      date: cells[1] || "",
      contributor: cells[2] || "",
      kind: cells[3] || "",
      pr: cells[4] || "",
      issue: cells[5] || "",
      amount: cells[6] || "",
      denomination: cells[7] || "",
      notes: cells[8] || "",
    });
  }

  return rows;
}

function buildRow(num, date, contributor, kind, pr, issue, amount, denomination, notes) {
  return `| ${num} | ${date} | ${contributor} | \`${kind}\` | ${pr} | ${issue} | ${amount} | ${denomination} | ${notes} |`;
}

function appendRows(lines, newRows) {
  let headerFound = false;
  let separatorFound = false;
  let insertAt = -1;
  let placeholderIdx = -1;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

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

  if (placeholderIdx !== -1) {
    lines.splice(placeholderIdx, 1, ...newRows);
  } else {
    lines.splice(insertAt, 0, ...newRows);
  }

  return lines;
}

function main() {
  const args = parseArgs(process.argv);

  const pr = args.pr;
  const contributor = args.contributor;
  const issue = args.issue;
  const amount = args.amount;
  const kind = args.kind;
  const proposer = args.proposer;
  const denomination = args.denomination || "GSD";
  const notes = args.notes || "";

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

  const content = readLedger();
  const lines = content.split("\n");
  while (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }
  const existingRows = parseExistingRows(lines);
  const lastNum = existingRows.length > 0
    ? Math.max(...existingRows.map((r) => r.num))
    : 0;

  const date = today();
  const newRows = [];

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

  const updated = appendRows(lines, newRows);
  writeLedger(updated.join("\n") + "\n");

  process.stdout.write(
    `Appended ${newRows.length} row(s) to GSD-LEDGER.md\n`,
  );
}

main();

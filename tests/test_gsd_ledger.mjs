// End-to-end tests for the ledger tool that bounty #1 asks for.
//
// The tool is exercised as a black box against a scratch ledger file
// (--ledger), so nothing here touches the real, append-only GSD-LEDGER.md.
// Node's built-in test runner and assert are used: zero dependencies, so CI
// stays on `npm ci --ignore-scripts` with no new installs.

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CLI = join(ROOT, "dist", "js", "gsd_ledger.js");

const TEMPLATE = `# The GSD Ledger

| # | Date | Contributor | Kind | PR | Issue | Amount | Denomination | Notes |
|---|------|-------------|------|----|-------|--------|--------------|-------|
`;

function freshLedger() {
  const dir = mkdtempSync(join(tmpdir(), "gsd-ledger-"));
  const file = join(dir, "GSD-LEDGER.md");
  writeFileSync(file, TEMPLATE, "utf-8");
  return { dir, file };
}

function run(file, args) {
  return execFileSync("node", [CLI, "--ledger", file, ...args], {
    encoding: "utf-8",
  });
}

function dataRows(content) {
  return content.split("\n").filter((line) => /^\|\s*\d+\s*\|/.test(line));
}

test("appends one correctly formatted bounty row", () => {
  const { dir, file } = freshLedger();
  try {
    run(file, [
      "--pr", "9",
      "--contributor", "@alice",
      "--issue", "8",
      "--amount", "1",
      "--kind", "bounty",
    ]);

    const rows = dataRows(readFileSync(file, "utf-8"));
    assert.equal(rows.length, 1);
    assert.match(
      rows[0],
      /^\| 1 \| \d{4}-\d{2}-\d{2} \| @alice \| `bounty` \| \[#9\]\(https:\/\/github\.com\/jflournoy\/for-funsies\/pull\/9\) \| \[#8\]\(https:\/\/github\.com\/jflournoy\/for-funsies\/issues\/8\) \| 1 \| GSD \|  \|$/,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("--proposer writes the second, proposal-shipped row", () => {
  const { dir, file } = freshLedger();
  try {
    run(file, [
      "--pr", "10",
      "--contributor", "@bob",
      "--issue", "5",
      "--amount", "2",
      "--kind", "implementation",
      "--proposer", "@carol",
    ]);

    const rows = dataRows(readFileSync(file, "utf-8"));
    assert.equal(rows.length, 2, "implementer row + proposer row");
    assert.match(rows[0], /^\| 1 \|.*@bob \| `implementation` \|/);
    assert.match(rows[1], /^\| 2 \|.*@carol \| `proposal-shipped` \|.*\| 2 \| GSD \| Proposer of PR #10 \|$/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("append-only: an existing row is never rewritten", () => {
  const { dir, file } = freshLedger();
  try {
    run(file, [
      "--pr", "11",
      "--contributor", "@alice",
      "--issue", "4",
      "--amount", "3",
      "--kind", "bounty",
    ]);
    const firstRow = dataRows(readFileSync(file, "utf-8"))[0];

    run(file, [
      "--pr", "12",
      "--contributor", "@dave",
      "--issue", "7",
      "--amount", "2",
      "--kind", "bounty",
    ]);

    const rows = dataRows(readFileSync(file, "utf-8"));
    assert.equal(rows.length, 2);
    assert.equal(rows[0], firstRow, "row 1 stayed byte-identical");
    assert.match(rows[1], /^\| 2 \|.*@dave/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("re-running the same PR is a no-op (no double payout)", () => {
  const { dir, file } = freshLedger();
  try {
    const args = [
      "--pr", "13",
      "--contributor", "@alice",
      "--issue", "4",
      "--amount", "3",
      "--kind", "bounty",
    ];
    run(file, args);
    const before = readFileSync(file, "utf-8");
    const out = run(file, args);
    const after = readFileSync(file, "utf-8");

    assert.match(out, /already in the ledger/);
    assert.equal(after, before, "second run changes nothing");
    assert.equal(dataRows(after).length, 1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("USD denomination is recorded and surfaced by --summary", () => {
  const { dir, file } = freshLedger();
  try {
    run(file, [
      "--pr", "14",
      "--contributor", "@alice",
      "--issue", "4",
      "--amount", "3",
      "--kind", "bounty",
    ]);
    run(file, [
      "--pr", "15",
      "--contributor", "@bob",
      "--issue", "6",
      "--amount", "5",
      "--kind", "bounty",
      "--denomination", "USD",
    ]);

    const rows = dataRows(readFileSync(file, "utf-8"));
    assert.equal(rows.length, 2);
    assert.match(rows[1], /\| USD \|/);

    const summary = run(file, ["--summary"]);
    assert.match(summary, /@alice/, "GSD contributor listed");
    assert.match(summary, /USD awards:/, "USD section present");
    assert.match(summary, /@bob/, "USD contributor listed");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("--validate accepts a ledger this tool just wrote", () => {
  const { dir, file } = freshLedger();
  try {
    run(file, [
      "--pr", "16",
      "--contributor", "@alice",
      "--issue", "4",
      "--amount", "1",
      "--kind", "bounty",
      "--proposer", "@carol",
    ]);
    const out = run(file, ["--validate"]);
    assert.match(out, /Ledger is valid/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

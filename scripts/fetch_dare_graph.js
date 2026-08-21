#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const repository = process.env.GITHUB_REPOSITORY ?? "jflournoy/for-funsies";
const token = process.env.GITHUB_TOKEN;
const output = process.argv[2] ?? ".build/dare-relay.json";

if (!token) {
  console.error("GITHUB_TOKEN is required to fetch the DARE relay graph.");
  process.exit(1);
}

async function api(path) {
  const response = await fetch(`https://api.github.com/repos/${repository}/${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.json();
}

async function pages(path) {
  const rows = [];
  for (let page = 1; page <= 5; page += 1) {
    const batch = await api(`${path}${path.includes("?") ? "&" : "?"}per_page=100&page=${page}`);
    rows.push(...batch);
    if (batch.length < 100) break;
  }
  return rows;
}

function references(body) {
  const found = new Set();
  for (const match of String(body ?? "").matchAll(/(?:^|[^A-Za-z0-9])#([1-9][0-9]*)\b/g)) {
    found.add(Number(match[1]));
  }
  return [...found];
}

function closingReferences(body) {
  const found = new Set();
  const pattern = /\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#([1-9][0-9]*)\b/gi;
  for (const match of String(body ?? "").matchAll(pattern)) found.add(Number(match[1]));
  return [...found];
}

function cellNumber(cell) {
  const match = String(cell ?? "").match(/(?:#|\/)([1-9][0-9]*)\b/)
    ?? String(cell ?? "").match(/^([1-9][0-9]*)$/);
  return match ? Number(match[1]) : null;
}

async function ledgerAnswers() {
  const pairs = new Map();
  try {
    const ledger = await readFile("GSD-LEDGER.md", "utf8");
    for (const line of ledger.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("|")) continue;
      const cells = trimmed.slice(1, -1).split("|").map((cell) => cell.trim());
      if (cells.length !== 9 || !Number.isFinite(Number.parseInt(cells[0], 10))) continue;
      const pr = cellNumber(cells[4]);
      const issue = cellNumber(cells[5]);
      if (pr && issue) pairs.set(issue, pr);
    }
  } catch {
    // A repository without a ledger still gets the API-derived graph.
  }
  return pairs;
}

const [issueRows, pullRows] = await Promise.all([
  pages("issues?state=all&labels=bounty"),
  pages("pulls?state=all"),
]);

const dares = issueRows
  .filter((issue) => !issue.pull_request && /\bDARE(?:\s+[0-9]+)?\b/i.test(issue.title))
  .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
const dareByNumber = new Map(dares.map((issue) => [issue.number, issue]));
const answers = new Map();
const edges = [];
const pullByNumber = new Map(pullRows.map((pull) => [pull.number, pull]));

for (const [issueNumber, pullNumber] of await ledgerAnswers()) {
  const pull = pullByNumber.get(pullNumber);
  if (dareByNumber.has(issueNumber) && pull?.merged_at) answers.set(issueNumber, pull);
}

for (const pull of pullRows.filter((row) => row.merged_at)) {
  const closed = closingReferences(pull.body).filter((number) => dareByNumber.has(number));
  for (const sourceNumber of closed) {
    answers.set(sourceNumber, pull);
  }
}

for (const [sourceNumber, pull] of answers) {
  const source = dareByNumber.get(sourceNumber);
  if (!source) continue;
  for (const targetNumber of references(pull.body)) {
    const target = dareByNumber.get(targetNumber);
    if (!target || targetNumber === sourceNumber) continue;
    if (Date.parse(target.created_at) <= Date.parse(source.created_at)) continue;
    edges.push({ from: sourceNumber, to: targetNumber, pr: pull.number });
  }
}

const nodes = dares.map((issue) => {
  const answer = answers.get(issue.number);
  return {
    number: issue.number,
    title: issue.title,
    url: issue.html_url,
    state: answer ? "answered" : "open",
    createdAt: issue.created_at,
    ...(answer ? { pr: answer.number, prUrl: answer.html_url } : {}),
  };
});

await mkdir(dirname(output), { recursive: true });
await writeFile(output, JSON.stringify({ source: "github", nodes, edges }, null, 2) + "\n", "utf8");
console.log(`Wrote ${nodes.length} DARE nodes and ${edges.length} relay edges to ${output}.`);

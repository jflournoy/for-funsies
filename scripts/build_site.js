#!/usr/bin/env node
/**
 * Assemble dist/ for GitHub Pages.
 *
 * `tsc` has already emitted dist/js. This copies the static shell, the
 * ledger the page reads at runtime, and generates pre-rendered award detail
 * pages and a contributors view.
 *
 * No bundler, no dependencies.
 */

import { cp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname } from "node:path";

const DIST = "dist";
const OWNER = "jflournoy";
const REPO = "for-funsies";
const GITHUB_BASE = `https://github.com/${OWNER}/${REPO}`;

// ── Ledger parsing (mirrors src/ledger.ts, but no DOM dependency) ────────

const COLUMNS = 9;
const AWARD_KINDS = new Set(["bounty", "proposal", "proposal-shipped", "implementation"]);

function stripLink(cell) {
  const m = /^\[([^\]]*)\]\([^)]*\)$/.exec(cell.trim());
  return (m ? m[1] : cell).trim();
}

function parseLedger(markdown) {
  const entries = [];
  for (const line of markdown.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) continue;
    const cells = trimmed.slice(1, -1).split("|").map((c) => c.trim());
    if (cells.length !== COLUMNS) continue;
    const index = Number.parseInt(stripLink(cells[0] ?? ""), 10);
    if (!Number.isFinite(index)) continue;
    const kind = stripLink(cells[3] ?? "").replace(/`/g, "");
    if (!AWARD_KINDS.has(kind)) continue;
    entries.push({
      index,
      date: stripLink(cells[1] ?? ""),
      contributor: stripLink(cells[2] ?? ""),
      kind,
      pr: stripLink(cells[4] ?? ""),
      prLink: extractLink(cells[4] ?? ""),
      issue: stripLink(cells[5] ?? ""),
      issueLink: extractLink(cells[5] ?? ""),
      amount: stripLink(cells[6] ?? ""),
      denomination: stripLink(cells[7] ?? ""),
      notes: stripLink(cells[8] ?? ""),
    });
  }
  return entries;
}

function extractLink(cell) {
  const m = /^\[([^\]]*)\]\(([^)]*)\)$/.exec(cell.trim());
  return m ? m[2] : null;
}

// ── HTML helpers (safe — no template injection) ──────────────────────────

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function pageShell(title, bodyContent, extraMeta = "") {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${esc(title)} — for-funsies</title>
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; base-uri 'none'; form-action 'none'; object-src 'none'"
    />
    <link rel="stylesheet" href="./style.css" />
    ${extraMeta}
  </head>
  <body>
    <header>
      <h1><a href="./" class="header-link">The GSD Ledger</a></h1>
      <nav class="nav-links">
        <a href="./">Ledger</a>
        <a href="./contributors.html">Contributors</a>
      </nav>
    </header>
    <main>
      ${bodyContent}
    </main>
    <footer>
      <p>
        GSD is a joke currency with no monetary value and no redemption
        mechanism. <strong>USD is also a joke currency</strong> — here it means
        Unsung Sycophant Dividend, not the United States dollar. It is not
        pegged to one and cannot be exchanged for one. There is no real money
        here and none is implied.
      </p>
      <p>
        <a href="${GITHUB_BASE}">Source</a> ·
        <a href="${GITHUB_BASE}/issues?q=is%3Aissue+is%3Aopen+label%3Abounty">Open bounties</a>
      </p>
    </footer>
  </body>
</html>`;
}

// ── Page generators ──────────────────────────────────────────────────────

function awardPage(entry) {
  const prHtml = entry.prLink
    ? `<a href="${esc(entry.prLink)}">${esc(entry.pr)}</a>`
    : esc(entry.pr);
  const issueHtml = entry.issueLink
    ? `<a href="${esc(entry.issueLink)}">${esc(entry.issue)}</a>`
    : esc(entry.issue);
  const contributorLink = `./contributors.html#${esc(entry.contributor)}`;

  const body = `
      <div class="detail-card">
        <p class="back-link"><a href="./">&larr; Back to Ledger</a></p>
        <h2>Award #${esc(String(entry.index))}</h2>
        <table class="detail-table">
          <tr><th>Date</th><td>${esc(entry.date)}</td></tr>
          <tr><th>Contributor</th><td><a href="${contributorLink}">${esc(entry.contributor)}</a></td></tr>
          <tr><th>Kind</th><td>${esc(entry.kind)}</td></tr>
          <tr><th>PR</th><td>${prHtml}</td></tr>
          <tr><th>Issue</th><td>${issueHtml}</td></tr>
          <tr><th>Amount</th><td>${esc(entry.amount)} ${esc(entry.denomination)}</td></tr>
          <tr><th>Notes</th><td>${esc(entry.notes)}</td></tr>
        </table>
      </div>`;
  return pageShell(`Award #${entry.index}`, body);
}

function contributorsPage(entries) {
  // Aggregate by contributor
  const map = new Map();
  for (const e of entries) {
    if (!map.has(e.contributor)) {
      map.set(e.contributor, { contributor: e.contributor, awards: [], totalGsd: 0 });
    }
    const c = map.get(e.contributor);
    c.awards.push(e);
    if (e.denomination.toUpperCase() === "GSD") {
      c.totalGsd += Number.parseFloat(e.amount) || 0;
    }
  }
  const sorted = [...map.values()].sort((a, b) => b.totalGsd - a.totalGsd);

  let rows = "";
  for (const c of sorted) {
    let awards = "";
    for (const a of c.awards) {
      awards += `<li><a href="./award-${a.index}.html">#${a.index}</a> — ${esc(a.kind)}, ${esc(a.amount)} ${esc(a.denomination)}${a.notes ? `: ${esc(a.notes)}` : ""}</li>`;
    }
    const contributorId = esc(c.contributor);
    const targetId = `c-${contributorId.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
    rows += `<tr id="${targetId}">
      <td><strong>${esc(c.contributor)}</strong></td>
      <td class="num">${c.totalGsd.toFixed(2)} GSD</td>
      <td>${c.awards.length}</td>
      <td><ul class="award-list">${awards}</ul></td>
    </tr>`;
  }

  const body = `
      <p class="back-link"><a href="./">&larr; Back to Ledger</a></p>
      <h2>Contributors</h2>
      ${entries.length === 0 ? '<p class="empty">No awards yet. Be the first!</p>' : `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Contributor</th>
              <th>Total GSD</th>
              <th>Awards</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>`}`;
  return pageShell("Contributors", body);
}

// ── Main ─────────────────────────────────────────────────────────────────

async function main() {
  await mkdir(DIST, { recursive: true });

  // Copy static site files
  if (existsSync("site")) {
    await cp("site", DIST, { recursive: true });
  }

  // Copy the ledger for runtime loading
  if (existsSync("GSD-LEDGER.md")) {
    await cp("GSD-LEDGER.md", `${DIST}/GSD-LEDGER.md`);
  }

  // Parse the ledger and generate pages
  const ledgerRaw = await readFile("GSD-LEDGER.md", "utf-8");
  const entries = parseLedger(ledgerRaw);

  if (entries.length > 0) {
    // Generate award detail pages
    for (const entry of entries) {
      const filename = `award-${entry.index}.html`;
      const html = awardPage(entry);
      await writeFile(`${DIST}/${filename}`, html, "utf-8");
    }

    // Generate contributors page
    const html = contributorsPage(entries);
    await writeFile(`${DIST}/contributors.html`, html, "utf-8");
  }

  const files = await readdir(DIST, { recursive: true });
  console.log(`Built ${DIST}/ with ${files.length} entries${entries.length > 0 ? ` (${entries.length} award pages + contributors page)` : "."}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
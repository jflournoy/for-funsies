#!/usr/bin/env node
/**
 * Assemble dist/ for GitHub Pages.
 *
 * `tsc` has already emitted dist/js. This copies the static shell and the
 * ledger the page reads at runtime. No bundler, no dependencies.
 *
 * Extended for #9: generates per-award detail pages and a contributors view.
 */

import { cp, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const DIST = "dist";

/** Escape HTML special characters to prevent XSS in generated pages. */
function esc(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Extract text and URL from a markdown link cell like [#3](https://...). */
function linkCell(cell) {
  const trimmed = cell.trim();
  const m = /^\[([^\]]*)\]\(([^)]*)\)$/.exec(trimmed);
  if (m) return { text: m[1], url: m[2] };
  return { text: trimmed, url: null };
}

/** Parse GSD-LEDGER.md into structured entries. */
function parseLedger(md) {
  const entries = [];
  for (const line of md.split("\n")) {
    const t = line.trim();
    if (!t.startsWith("|")) continue;
    const cells = t.slice(1, -1).split("|").map((c) => c.trim());
    if (cells.length !== 9) continue;
    const idx = parseInt(linkCell(cells[0]).text, 10);
    if (!Number.isFinite(idx)) continue;
    const pr = linkCell(cells[4]);
    const issue = linkCell(cells[5]);
    entries.push({
      index: idx,
      date: linkCell(cells[1]).text,
      contributor: linkCell(cells[2]).text,
      kind: linkCell(cells[3]).text.replace(/`/g, ""),
      prText: pr.text,
      prUrl: pr.url,
      issueText: issue.text,
      issueUrl: issue.url,
      amount: linkCell(cells[6]).text,
      denomination: linkCell(cells[7]).text,
      notes: linkCell(cells[8]).text,
    });
  }
  return entries;
}

const CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; base-uri 'none'; form-action 'none'; object-src 'none'";

function awardPage(e) {
  const prLink = e.prUrl
    ? `<a href="${esc(e.prUrl)}">${esc(e.prText)}</a>`
    : esc(e.prText);
  const issueLink = e.issueUrl
    ? `<a href="${esc(e.issueUrl)}">${esc(e.issueText)}</a>`
    : esc(e.issueText);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Award #${e.index} — GSD Ledger</title>
  <meta http-equiv="Content-Security-Policy" content="${CSP}" />
  <link rel="stylesheet" href="../style.css" />
</head>
<body>
  <header>
    <h1>Award #${e.index}</h1>
    <p><a href="../index.html">← Back to ledger</a></p>
  </header>
  <main>
    <dl class="award-detail">
      <dt>Contributor</dt><dd>${esc(e.contributor)}</dd>
      <dt>Kind</dt><dd>${esc(e.kind)}</dd>
      <dt>Amount</dt><dd>${esc(e.amount)} ${esc(e.denomination)}</dd>
      <dt>Date</dt><dd>${esc(e.date)}</dd>
      <dt>Pull Request</dt><dd>${prLink}</dd>
      <dt>Issue</dt><dd>${issueLink}</dd>
      <dt>Notes</dt><dd>${esc(e.notes)}</dd>
    </dl>
  </main>
  <footer>
    <p><a href="../contributors.html">View all contributors</a></p>
  </footer>
</body>
</html>
`;
}

function contributorsPage(entries) {
  const map = {};
  for (const e of entries) {
    if (e.denomination.toUpperCase() !== "GSD") continue;
    if (!map[e.contributor]) map[e.contributor] = { total: 0, awards: [] };
    map[e.contributor].total += parseFloat(e.amount) || 0;
    map[e.contributor].awards.push(e.index);
  }
  const sorted = Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  const rows = sorted.map(([name, d]) =>
    `        <tr><td>${esc(name)}</td><td>${d.total}</td><td>${d.awards.map((i) => `<a href="./award/${i}.html">#${i}</a>`).join(", ")}</td></tr>`
  ).join("\n");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Contributors — GSD Ledger</title>
  <meta http-equiv="Content-Security-Policy" content="${CSP}" />
  <link rel="stylesheet" href="./style.css" />
</head>
<body>
  <header>
    <h1>Contributors</h1>
    <p><a href="./index.html">← Back to ledger</a></p>
  </header>
  <main>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Contributor</th><th>Total GSD</th><th>Awards</th></tr></thead>
        <tbody>
${rows}
        </tbody>
      </table>
    </div>
  </main>
</body>
</html>
`;
}

async function main() {
  await mkdir(DIST, { recursive: true });

  if (existsSync("site")) {
    await cp("site", DIST, { recursive: true });
  }

  if (existsSync("GSD-LEDGER.md")) {
    await cp("GSD-LEDGER.md", `${DIST}/GSD-LEDGER.md`);

    // Generate award detail pages and contributors view (#9)
    const md = await readFile("GSD-LEDGER.md", "utf-8");
    const entries = parseLedger(md);

    await mkdir(`${DIST}/award`, { recursive: true });
    for (const e of entries) {
      await writeFile(`${DIST}/award/${e.index}.html`, awardPage(e), "utf-8");
    }

    await writeFile(`${DIST}/contributors.html`, contributorsPage(entries), "utf-8");

    console.log(`Generated ${entries.length} award pages and contributors view.`);
  }

  const files = await readdir(DIST, { recursive: true });
  console.log(`Built ${DIST}/ with ${files.length} entries.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

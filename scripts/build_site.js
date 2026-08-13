#!/usr/bin/env node
/**
 * Assemble dist/ for GitHub Pages.
 *
 * `tsc` has already emitted dist/js. This copies the static shell and the
 * ledger the page reads at runtime, generates pre-rendered award detail
 * pages and a contributors view, then generates the generative garden SVG
 * from the repository's own commit history.
 *
 * No bundler, no dependencies.
 */

import { cp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { dirname } from "node:path";

import { renderGarden, buildSnapshot } from "../dist/js/garden.js";
import { safeUrl } from "../dist/js/ledger.js";

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
      prLink: safeUrl(cells[4] ?? ""),
      issue: stripLink(cells[5] ?? ""),
      issueLink: safeUrl(cells[5] ?? ""),
      amount: stripLink(cells[6] ?? ""),
      denomination: stripLink(cells[7] ?? ""),
      notes: stripLink(cells[8] ?? ""),
    });
  }
  return entries;
}

// URL sanitizing lives in src/ledger.ts (safeUrl) so the build and the
// runtime share one allowlist. It also rejects control characters and
// whitespace, which can smuggle a scheme past a plain prefix check.

// ── HTML helpers (safe — no template injection) ──────────────────────────

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Footer links are built from GITHUB_BASE, a module constant — no ledger data
// reaches them. Assembled here so the marker sits on a code line rather than
// inside the emitted HTML.
const SOURCE_LINK = `<a href="${GITHUB_BASE}">Source</a>`; // xss-ok: constant
const BOUNTIES_LINK = `<a href="${GITHUB_BASE}/issues?q=is%3Aissue+is%3Aopen+label%3Abounty">Open bounties</a>`; // xss-ok: constant

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
        <a href="./pulse.html">Pulse</a>
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
        ${SOURCE_LINK} ·
        ${BOUNTIES_LINK}
      </p>
    </footer>
  </body>
</html>`;
}

// ── Page generators ──────────────────────────────────────────────────────

function awardPage(entry) {
  // prLink/issueLink are already safeUrl() output (null unless they match the
  // repository origin), so the ternary falls back to plain text for anything
  // an agent smuggled in. The trailing marker tells check_xss.py the value on
  // this line is sanitized upstream.
  const prHtml = entry.prLink
    ? `<a href="${esc(entry.prLink)}">${esc(entry.pr)}</a>` // xss-ok: safeUrl at parse
    : esc(entry.pr);
  const issueHtml = entry.issueLink
    ? `<a href="${esc(entry.issueLink)}">${esc(entry.issue)}</a>` // xss-ok: safeUrl at parse
    : esc(entry.issue);
  // Relative same-site anchor, not a ledger URL.
  const contributorLink = `./contributors.html#${esc(entry.contributor)}`; // xss-ok: relative
  const contributorHtml = `<a href="${contributorLink}">${esc(entry.contributor)}</a>`; // xss-ok: relative

  const body = `
      <div class="detail-card">
        <p class="back-link"><a href="./">&larr; Back to Ledger</a></p>
        <h2>Award #${esc(String(entry.index))}</h2>
        <table class="detail-table">
          <tr><th>Date</th><td>${esc(entry.date)}</td></tr>
          <tr><th>Contributor</th><td>${contributorHtml}</td></tr>
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

// ── Pulse page ─────────────────────────────────────────────────────────

const PULSE_BUILDS = 3;

function shortHash(hash) {
  return hash.slice(0, 7);
}

function mergePrFromSubject(subject) {
  const m = /Merge pull request #(\d+)/.exec(subject);
  return m ? m[1] : null;
}

function gitHubLink(path) {
  return `${GITHUB_BASE}/${path}`;
}

function pulsePage(entries, commits) {
  // Take the most recent PULSE_BUILDS commits as "builds"
  const builds = commits.slice(0, PULSE_BUILDS);

  // Build number = total commits (matches garden caption)
  const buildNum = builds.length > 0 ? commits.length : 0;

  // Total GSD from the ledger
  let totalGsd = 0;
  const contributorSet = new Set();
  for (const e of entries) {
    contributorSet.add(e.contributor);
    if (e.denomination.toUpperCase() === "GSD") {
      totalGsd += Number.parseFloat(e.amount) || 0;
    }
  }
  const totalContributors = contributorSet.size;

  // Newest GSD award (last entry in the ledger)
  const newestAward = entries.length > 0 ? entries[entries.length - 1] : null;

  // Detect ledger-lag: compare the most recent merge commit date with the
  // newest ledger entry date. If the merge is newer, the award may not
  // exist yet in this build.
  let ledgerLag = false;
  let newestMergeCommit = null;
  for (const c of commits) {
    if (mergePrFromSubject(c.subject)) {
      newestMergeCommit = c;
      break;
    }
  }
  if (newestMergeCommit && newestAward) {
    // Compare dates: if the merge commit is newer than the last award,
    // the ledger hasn't caught up yet.
    ledgerLag = new Date(newestMergeCommit.date) > new Date(newestAward.date);
  }

  // Build the timeline rows — one per recent build
  let timelineRows = "";
  for (let i = 0; i < builds.length; i++) {
    const c = builds[i];
    if (!c) continue;
    const pr = mergePrFromSubject(c.subject);
    const hashShort = shortHash(c.hash);
    const hashLink = `<a href="${gitHubLink("commit/" + c.hash)}">${esc(hashShort)}</a>`; // xss-ok: gitHubLink wraps GITHUB_BASE constant
    const dateShort = esc(c.date.slice(0, 10));

    // Find the newest award that matches this build's PR
    const matchingAward = pr ? entries.find(e => e.pr === pr) : null;

    // What happened in this build: merge PR or award or something else
    let action = "";
    if (pr) {
      action = `Merged PR #${esc(pr)}`;
    } else if (c.subject.startsWith("\u{1F4D2}")) {
      action = esc(c.subject.slice(0, 60));
    } else {
      action = esc(c.subject.slice(0, 60));
    }

    // Contributor link for this build
    const contributor = matchingAward
      ? `<a href="./contributors.html#c-${esc(matchingAward.contributor).replace(/[^a-zA-Z0-9_-]/g, "_")}">${esc(matchingAward.contributor)}</a>`
      : esc(c.author);

    // Award link
    const awardLink = matchingAward
      ? `<a href="./award-${matchingAward.index}.html">${esc(matchingAward.amount)} ${esc(matchingAward.denomination)}</a>`
      : '<span class="muted">pending</span>';

    // Star count (commits in this build window — simplified to total stars)
    const starCount = builds.length - i;

    timelineRows += `<tr>
      <td class="num">${esc(String(buildNum - builds.length + 1 + i))}</td>
      <td>${hashLink}</td>
      <td>${dateShort}</td>
      <td>${action}</td>
      <td>${contributor}</td>
      <td>${awardLink}</td>
      <td class="num">${starCount}</td>
    </tr>`;
  }

  // Newest merged PR section
  let newestPRHtml = "";
  if (newestMergeCommit) {
    const pr = mergePrFromSubject(newestMergeCommit.subject);
    newestPRHtml = `
      <div class="pulse-card">
        <h3>Newest merged PR</h3>
        <p><a href="${gitHubLink("pull/" + pr)}">PR #${esc(pr)}</a></p> // xss-ok: gitHubLink wraps GITHUB_BASE constant
        <p class="meta">${esc(newestMergeCommit.author)} — ${esc(newestMergeCommit.date.slice(0, 10))}</p>
        <p class="meta">${esc(newestMergeCommit.subject.slice(0, 120))}</p>
      </div>`;
  } else {
    newestPRHtml = '<div class="pulse-card"><h3>Newest merged PR</h3><p class="muted">No merge commits found.</p></div>';
  }

  // Newest GSD award section
  let newestAwardHtml = "";
  if (newestAward) {
    const awardContributorLink = `<a href="./contributors.html#c-${esc(newestAward.contributor).replace(/[^a-zA-Z0-9_-]/g, "_")}">${esc(newestAward.contributor)}</a>`;
    newestAwardHtml = `
      <div class="pulse-card">
        <h3>Newest GSD award</h3>
        <p><a href="./award-${newestAward.index}.html">Award #${esc(String(newestAward.index))}</a></p>
        <p class="meta">${awardContributorLink} — ${esc(newestAward.amount)} ${esc(newestAward.denomination)}</p>
        <p class="meta">${esc(newestAward.kind)}${newestAward.notes ? `: ${esc(newestAward.notes)}` : ""}</p>
      </div>`;
  } else {
    newestAwardHtml = '<div class="pulse-card"><h3>Newest GSD award</h3><p class="muted">No awards yet.</p></div>';
  }

  // What's new section
  let whatsNewHtml = "";
  if (entries.length > 0) {
    // Count new contributors: those whose first appearance is in the recent entries
    const recentEntries = entries.slice(-PULSE_BUILDS);
    const firstSeen = new Map();
    for (const e of entries) {
      if (!firstSeen.has(e.contributor)) {
        firstSeen.set(e.contributor, e.index);
      }
    }
    const newContributors = [...contributorSet].filter(c => {
      const first = firstSeen.get(c);
      return first && recentEntries.some(e => e.index === first);
    });

    whatsNewHtml = `
      <div class="pulse-card">
        <h3>What\u2019s new since the previous build</h3>
        <ul class="pulse-whatsnew">
          <li><strong>${esc(String(totalContributors))}</strong> contributors total</li>
          <li><strong>${esc(String(entries.length))}</strong> awards issued</li>
          <li><strong>${totalGsd.toFixed(2)}</strong> GSD in circulation</li>
          <li><strong>${esc(String(newContributors.length))}</strong> new contributor(s): ${newContributors.length > 0 ? newContributors.map(c => `<a href="./contributors.html#c-${esc(c).replace(/[^a-zA-Z0-9_-]/g, "_")}">${esc(c)}</a>`).join(", ") : "none"}</li>
          <li><strong>${esc(String(commits.length))}</strong> stars in the garden</li>
        </ul>
      </div>`;
  } else {
    whatsNewHtml = '<div class="pulse-card"><h3>What\u2019s new</h3><p class="muted">No data yet.</p></div>';
  }

  // Ledger-lag decision
  let lagNotice = "";
  if (ledgerLag) {
    const pr = mergePrFromSubject(newestMergeCommit.subject);
    lagNotice = `
      <div class="pulse-warning">
        <strong>Note:</strong> The ledger is written by a workflow <em>after</em> the merge that triggers
        a build. The newest PR (PR #${esc(pr)}) was merged after
        the last awarded row, so the corresponding award may not appear until the
        next build. The "Newest GSD award" shown above is the most recent <em>known</em> award.
      </div>`;
  }

  const body = `
      <p class="back-link"><a href="./">&larr; Back to Ledger</a></p>
      <h2>Pulse</h2>
      <p class="tagline">What changed since the last build, and the two before it.</p>

      ${lagNotice}

      <div class="pulse-grid">
        ${newestPRHtml}
        ${newestAwardHtml}
        ${whatsNewHtml}
      </div>

      <h3>Build timeline</h3>
      <p class="meta">Build N → @handle → award → star</p>
      ${builds.length === 0 ? '<p class="empty">No builds yet.</p>' : `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Build</th>
              <th>Commit</th>
              <th>Date</th>
              <th>Action</th>
              <th>Contributor</th>
              <th>Award</th>
              <th class="num">&#9733;</th>
            </tr>
          </thead>
          <tbody>
            ${timelineRows}
          </tbody>
        </table>
      </div>`}`;
  return pageShell("Pulse", body);
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

  // ── Generative garden ────────────────────────────────────────────────
  // Derive the garden from real repository data: commit history + ledger.
  // This is deterministic per commit, so the garden grows as the repo does
  // and two consecutive builds are never identical.

  const commits = [];
  try {
    const log = execSync("git log '--format=%H|%an|%aI|%s' --max-count=200", {
      encoding: "utf-8",
      timeout: 10_000,
    });
    for (const line of log.trim().split("\n")) {
      const parts = line.split("|");
      if (parts.length >= 4) {
        commits.push({ hash: parts[0], author: parts[1], date: parts[2], subject: parts.slice(3).join("|") });
      }
    }
  } catch {
    // git unavailable (e.g. detached build) — garden will be empty but
    // the page still renders. A single dummy commit keeps the field alive.
    commits.push({ hash: "no-repo", author: "build", date: new Date().toISOString(), subject: "no-repo" });
  }

  // Extract contributor handles from the GSD ledger — real repo data.
  const contributors = new Set();
  try {
    const ledger = readFileSync("GSD-LEDGER.md", "utf-8");
    for (const line of ledger.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("|")) continue;
      const cells = trimmed.slice(1, -1).split("|").map((c) => c.trim());
      const cell = cells[2]; // Contributor column
      if (cell && cell.startsWith("@")) {
        contributors.add(cell.replace(/^@/, ""));
      }
    }
  } catch {
    // no ledger yet — fine
  }

  const snapshot = buildSnapshot(commits, [...contributors]);
  const svg = renderGarden(snapshot);
  await writeFile(`${DIST}/garden.svg`, svg, "utf-8");
  console.log("Generated garden.svg: " + snapshot.build + " builds, " + commits.length + " commits, " + contributors.size + " contributors.");

  // Generate pulse page
  const pulseHtml = pulsePage(entries, commits);
  await writeFile(`${DIST}/pulse.html`, pulseHtml, "utf-8");
  console.log("Generated pulse.html: " + commits.length + " recent builds shown.");

  const files = await readdir(DIST, { recursive: true });
  console.log(`Built ${DIST}/ with ${files.length} entries${entries.length > 0 ? ` (${entries.length} award pages + contributors page + pulse page)` : "."}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
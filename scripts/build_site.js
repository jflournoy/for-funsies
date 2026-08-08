#!/usr/bin/env node
/**
 * Assemble dist/ for GitHub Pages.
 *
 * `tsc` has already emitted dist/js. This copies the static shell, the
 * ledger the page reads at runtime, and pre-generates one HTML page per
 * award plus a contributors page. No bundler, no dependencies.
 *
 * The generated pages are static shells â they contain no ledger data.
 * All agent-authored content reaches the DOM at runtime via textContent
 * in the compiled TypeScript modules, never as inline HTML.
 */

import { cp, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const DIST = "dist";

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "base-uri 'none'",
  "form-action 'none'",
  "object-src 'none'",
].join("; ");

/** Count award rows in the ledger so we know how many pages to generate. */
async function countAwards(ledgerPath) {
  if (!existsSync(ledgerPath)) return 0;
  const markdown = await readFile(ledgerPath, "utf-8");
  let count = 0;
  for (const line of markdown.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) continue;
    const cells = trimmed.slice(1, -1).split("|").map((c) => c.trim());
    if (cells.length !== 9) continue;
    const index = Number.parseInt(cells[0], 10);
    if (Number.isFinite(index)) count = Math.max(count, index);
  }
  return count;
}

function awardShell(num) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Award #${num} â GSD Ledger</title>
    <meta http-equiv="Content-Security-Policy" content="${CSP}" />
    <link rel="stylesheet" href="../style.css" />
  </head>
  <body>
    <header>
      <h1>Award #${num}</h1>
      <p class="tagline"><a href="../index.html">&larr; Back to ledger</a></p>
    </header>
    <main>
      <p id="status">Loading awardâ¦</p>
      <div id="award-detail"></div>
    </main>
    <footer>
      <p>
        <a href="../index.html">Ledger</a> &middot;
        <a href="../contributors.html">Contributors</a> &middot;
        <a href="https://github.com/jflournoy/for-funsies">Source</a>
      </p>
    </footer>
    <script type="module" src="../js/award.js"></script>
  </body>
</html>
`;
}

function contributorsShell() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Contributors â GSD Ledger</title>
    <meta http-equiv="Content-Security-Policy" content="${CSP}" />
    <link rel="stylesheet" href="./style.css" />
  </head>
  <body>
    <header>
      <h1>Contributors</h1>
      <p class="tagline">
        Every contributor, their total GSD, and their awards.
        <a href="./index.html">&larr; Back to ledger</a>
      </p>
    </header>
    <main>
      <p id="status">Loading contributorsâ¦</p>
      <div id="contributors-list"></div>
    </main>
    <footer>
      <p>
        <a href="./index.html">Ledger</a> &middot;
        <a href="https://github.com/jflournoy/for-funsies">Source</a>
      </p>
    </footer>
    <script type="module" src="./js/contributors.js"></script>
  </body>
</html>
`;
}

async function main() {
  await mkdir(DIST, { recursive: true });

  if (existsSync("site")) {
    await cp("site", DIST, { recursive: true });
  }

  // The page fetches the ledger at runtime, so it must be published too.
  if (existsSync("GSD-LEDGER.md")) {
    await cp("GSD-LEDGER.md", `${DIST}/GSD-LEDGER.md`);
  }

  // Pre-generate one static page per award. Each page is a shell that
  // loads its data at runtime via textContent â see src/award.ts.
  const ledgerPath = "GSD-LEDGER.md";
  const awardCount = await countAwards(ledgerPath);
  const awardsDir = `${DIST}/awards`;
  await mkdir(awardsDir, { recursive: true });
  for (let i = 1; i <= awardCount; i++) {
    await writeFile(`${awardsDir}/${i}.html`, awardShell(i), "utf-8");
  }

  // Pre-generate the contributors page shell.
  await writeFile(`${DIST}/contributors.html`, contributorsShell(), "utf-8");

  const files = await readdir(DIST, { recursive: true });
  console.log(`Built ${DIST}/ with ${files.length} entries (${awardCount} award pages).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

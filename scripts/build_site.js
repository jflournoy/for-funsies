#!/usr/bin/env node
/**
 * Assemble dist/ for GitHub Pages.
 *
 * `tsc` has already emitted dist/js. This copies the static shell and the
 * ledger the page reads at runtime. No bundler, no dependencies.
 */

import { cp, mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";

const DIST = "dist";

async function main() {
  await mkdir(DIST, { recursive: true });

  if (existsSync("site")) {
    await cp("site", DIST, { recursive: true });
  }

  // The page fetches the ledger at runtime, so it must be published too.
  if (existsSync("GSD-LEDGER.md")) {
    await cp("GSD-LEDGER.md", `${DIST}/GSD-LEDGER.md`);
  }

  const files = await readdir(DIST, { recursive: true });
  console.log(`Built ${DIST}/ with ${files.length} entries.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

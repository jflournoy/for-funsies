#!/usr/bin/env node
/**
 * Assemble dist/ for GitHub Pages.
 *
 * `tsc` has already emitted dist/js. This copies the static shell and the
 * ledger the page reads at runtime, then generates the generative garden
 * SVG from the repository's own commit history. No bundler, no dependencies.
 */

import { cp, mkdir, readdir, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";

import { renderGarden, buildSnapshot } from "../dist/js/garden.js";

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

  // ── Generative garden ────────────────────────────────────────────────
  // Derive the garden from real repository data: commit history + ledger.
  // This is deterministic per commit, so the garden grows as the repo does
  // and two consecutive builds are never identical.

  const commits = [];
  try {
    const log = execSync("git log '--format=%H|%an|%aI' --max-count=200", {
      encoding: "utf-8",
      timeout: 10_000,
    });
    for (const line of log.trim().split("\n")) {
      const parts = line.split("|");
      if (parts.length >= 3) {
        commits.push({ hash: parts[0], author: parts[1], date: parts[2] });
      }
    }
  } catch {
    // git unavailable (e.g. detached build) — garden will be empty but
    // the page still renders. A single dummy commit keeps the field alive.
    commits.push({ hash: "no-repo", author: "build", date: new Date().toISOString() });
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

  const files = await readdir(DIST, { recursive: true });
  console.log(`Built ${DIST}/ with ${files.length} entries.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

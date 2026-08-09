/**
 * Entry point for the published board at
 * https://jflournoy.github.io/for-funsies/
 *
 * Fetches the ledger markdown, parses it, and renders it. All agent-authored
 * text goes to the page as text nodes; see src/ledger.ts.
 */

import { parseLedger, renderLedger, renderStats, totalGsd } from "./ledger.js";

const LEDGER_URL = "./GSD-LEDGER.md";

async function main(): Promise<void> {
  const tbody = document.querySelector<HTMLElement>("#ledger-body");
  const total = document.querySelector<HTMLElement>("#total-gsd");
  const status = document.querySelector<HTMLElement>("#status");
  const stats = document.querySelector<HTMLElement>("#ledger-stats");
  if (!tbody || !total || !status || !stats) return;

  try {
    const response = await fetch(LEDGER_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const entries = parseLedger(await response.text());
    renderLedger(entries, tbody);
    renderStats(entries, stats);
    total.textContent = String(totalGsd(entries));

    status.textContent =
      entries.length === 0
        ? "The ledger is empty. The first row is worth 1 GSD and is unclaimed."
        : `${entries.length} award${entries.length === 1 ? "" : "s"} issued.`;
  } catch (error) {
    status.textContent = `Could not load the ledger: ${
      error instanceof Error ? error.message : "unknown error"
    }`;
  }
}

void main();

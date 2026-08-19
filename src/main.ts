/**
 * Entry point for the published board at
 * https://jflournoy.github.io/for-funsies/
 *
 * Fetches the ledger markdown, parses it, and renders it. All agent-authored
 * text goes to the page as text nodes; see src/ledger.ts.
 */

import { parseLedger, totalGsd } from "./ledger.js";
import type { LedgerEntry } from "./ledger.js";
import { initGarden } from "./garden-client.js";

const LEDGER_URL = "./GSD-LEDGER.md";
const GITHUB_BASE = "https://github.com/jflournoy/for-funsies";
const SIGNAL_MODES = ["ripple", "tilt", "orbit", "quiet"] as const;
const SIGNAL_PHRASES = [
  "the newest commit hums back",
  "the ledger briefly remembers gravity",
  "recent activity has excellent timing",
  "the board pretends this was normal",
] as const;

function hashSignal(value: string): number {
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function latestCommitHash(): string {
  const data = document.querySelector<HTMLElement>("#garden-data");
  if (!data?.textContent) return "empty-board";
  try {
    const snapshot: unknown = JSON.parse(data.textContent);
    if (
      typeof snapshot === "object" &&
      snapshot !== null &&
      "latestHash" in snapshot &&
      typeof snapshot.latestHash === "string"
    ) {
      return snapshot.latestHash;
    }
  } catch {
    // A malformed snapshot should not disable the rest of the board.
  }
  return "empty-board";
}

function initActivitySignal(entries: LedgerEntry[]): void {
  const button = document.querySelector<HTMLButtonElement>("#activity-signal");
  const whisper = document.querySelector<HTMLElement>("#activity-whisper");
  if (!button || !whisper) return;

  const latestEntry = entries.at(-1);
  const seedSource = latestEntry
    ? `${latestEntry.index}:${latestEntry.kind}:${latestEntry.contributor}`
    : latestCommitHash();
  const seed = hashSignal(seedSource);
  let ping = 0;
  let settleTimer: number | undefined;

  button.addEventListener("click", () => {
    const mode = SIGNAL_MODES[(seed + ping) % SIGNAL_MODES.length] ?? "ripple";
    const phrase = SIGNAL_PHRASES[(seed + ping) % SIGNAL_PHRASES.length] ?? SIGNAL_PHRASES[0];
    ping += 1;

    document.body.dataset.activitySignal = mode;
    whisper.textContent = phrase;
    button.dataset.charged = "true";

    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(() => {
      delete document.body.dataset.activitySignal;
      delete button.dataset.charged;
      whisper.textContent = "";
    }, 2400);
  });
}

/** Extract the PR/issue number from a markdown cell like `[#3](https://...)`. */
function extractNumber(cell: string): string | null {
  const m = /^\[([^\]]*)\]\([^)]*\)$/.exec(cell.trim());
  return m ? (m[1] ?? null) : null;
}

/** Make a GitHub link element. Safe — uses createElement, not innerHTML. */
function gitHubLink(cell: string, basePath: string): HTMLTableCellElement {
  const num = extractNumber(cell);
  const td = document.createElement("td");
  if (num) {
    const a = document.createElement("a");
    a.href = `${GITHUB_BASE}/${basePath}/${num}`;
    a.textContent = num;
    td.append(a);
  } else {
    td.textContent = cell;
  }
  return td;
}

async function main() {
  const tbody = document.querySelector<HTMLElement>("#ledger-body");
  const total = document.querySelector<HTMLElement>("#total-gsd");
  const status = document.querySelector<HTMLElement>("#status");
  if (!tbody || !total || !status) return;

  try {
    const response = await fetch(LEDGER_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const entries = parseLedger(await response.text());
    // Override the default render — use our own that adds GitHub links
    renderLedgerWithLinks(entries, tbody);
    total.textContent = String(totalGsd(entries));

    status.textContent =
      entries.length === 0
        ? "The ledger is empty. The first row is worth 1 GSD and is unclaimed."
        : `${entries.length} award${entries.length === 1 ? "" : "s"} issued.`;

    initActivitySignal(entries);
  } catch (error) {
    status.textContent = `Could not load the ledger: ${
      error instanceof Error ? error.message : "unknown error"
    }`;
  }

  // Initialize the interactive garden after the ledger is set up
  initGarden();
}

/** Render entries into a table body with GitHub links and row clickability. */
function renderLedgerWithLinks(
  entries: LedgerEntry[],
  tbody: HTMLElement,
): void {
  tbody.replaceChildren();

  for (const entry of entries) {
    const row = document.createElement("tr");
    row.classList.add("clickable-row");
    row.dataset.award = String(entry.index);

    const cell = document.createElement("td");
    cell.textContent = String(entry.index);
    row.append(cell);

    const dateCell = document.createElement("td");
    dateCell.textContent = entry.date;
    row.append(dateCell);

    const contributorCell = document.createElement("td");
    const contributorLink = document.createElement("a");
    contributorLink.href = `./contributors.html#${encodeURIComponent(entry.contributor)}`;
    contributorLink.textContent = entry.contributor;
    contributorCell.append(contributorLink);
    row.append(contributorCell);

    const kindCell = document.createElement("td");
    kindCell.textContent = entry.kind;
    row.append(kindCell);

    row.append(gitHubLink(entry.pr, "pull"));
    row.append(gitHubLink(entry.issue, "issues"));

    const amountCell = document.createElement("td");
    amountCell.textContent = `${entry.amount} ${entry.denomination}`;
    row.append(amountCell);

    const notesCell = document.createElement("td");
    notesCell.textContent = entry.notes;
    row.append(notesCell);

    row.addEventListener("click", () => {
      window.location.href = `./award-${entry.index}.html`;
    });

    tbody.append(row);
  }
}

void main();

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
import { initMutationGame } from "./mutation-game.js";

const LEDGER_URL = "./GSD-LEDGER.md";
const GITHUB_BASE = "https://github.com/jflournoy/for-funsies";

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
    initFunsiesSignal(entries);
    initThingDoer();
    initMutationGame();
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

  // Initialize the interactive garden after the ledger is set up
  initGarden();
}

function initThingDoer(): void {
  const stepButton = document.querySelector<HTMLButtonElement>("#thing-doer-step");
  const toggleButton = document.querySelector<HTMLButtonElement>("#thing-doer-toggle");
  const throughputEl = document.querySelector<HTMLElement>("#thing-doer-throughput");
  const progressEl = document.querySelector<HTMLElement>("#thing-doer-progress");
  const statusEl = document.querySelector<HTMLElement>("#thing-doer-status");

  if (!stepButton || !toggleButton || !throughputEl || !progressEl || !statusEl) return;

  const status = statusEl;
  const progress = progressEl;
  const throughput = throughputEl;

  const tasks = [
    "Synthesizing consensus across peer nodes",
    "Verifying ledger append cryptographic integrity",
    "Transmuting unformatted ideas into usable artifacts",
    "Calibrating relational graph coordinates",
    "Propagating zero-latency micro-tasks",
    "Auditing deterministic state transitions",
    "Flushing pipeline buffers to persistent storage",
    "Resolving upstream dependency constraints",
  ];

  let taskIndex = 0;
  let currentProgress = 0;
  let completedCount = 0;
  let isStreaming = false;
  let intervalId: number | null = null;
  const startTime = Date.now();

  function advanceTask(stepIncrement = 25): void {
    currentProgress += stepIncrement;
    if (currentProgress >= 100) {
      currentProgress = 0;
      completedCount += 1;
      taskIndex = (taskIndex + 1) % tasks.length;
      const task = tasks[taskIndex] ?? "Processing work unit";
      status.textContent = `Completed unit #${completedCount} · Now: ${task}…`;
    } else {
      const task = tasks[taskIndex] ?? "Processing work unit";
      status.textContent = `[${currentProgress}%] ${task}…`;
    }
    progress.style.width = `${currentProgress}%`;

    const elapsedSeconds = Math.max(0.5, (Date.now() - startTime) / 1000);
    const ops = ((completedCount * 100 + currentProgress) / 100 / elapsedSeconds).toFixed(2);
    throughput.textContent = `${ops} ops/sec`;
  }

  stepButton.addEventListener("click", () => {
    advanceTask(25);
  });

  toggleButton.addEventListener("click", () => {
    isStreaming = !isStreaming;
    if (isStreaming) {
      toggleButton.textContent = "Pause Live Work";
      intervalId = window.setInterval(() => {
        advanceTask(10);
      }, 180);
    } else {
      toggleButton.textContent = "Stream Live Work";
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }
  });
}

function initFunsiesSignal(entries: LedgerEntry[]): void {
  const button = document.querySelector<HTMLButtonElement>("#funsies-button");
  const output = document.querySelector<HTMLElement>("#funsies-output");
  if (!button || !output) return;

  const verbs = ["Teach", "Confuse", "Haunt", "Compost", "Launch", "Rename", "Tickle", "Forecast"];
  const nouns = ["a badge", "the empty ledger", "a footer goblin", "the next agent", "a one-click ritual", "a tiny scoreboard", "the build number", "a commit star"];
  const constraints = ["without a database", "with only text nodes", "in under forty lines", "using the current date", "without adding dependencies", "as a static-page trick", "so it still passes CI", "with one useful sentence"];

  let rolls = 0;
  const seedBase = entries.length + totalGsd(entries) * 17;

  button.addEventListener("click", () => {
    rolls += 1;
    const seed = seedBase + rolls + new Date().getUTCDate();
    const verb = verbs[seed % verbs.length] ?? "Build";
    const noun = nouns[(seed * 3) % nouns.length] ?? "something small";
    const constraint = constraints[(seed * 5) % constraints.length] ?? "before the joke goes stale";
    output.textContent = `${verb} ${noun} ${constraint}.`;
  });
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
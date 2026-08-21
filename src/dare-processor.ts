/**
 * DARE 008: "Thing Doer" — a task processor that feels like it's doing work.
 *
 * A visible queue of invented tasks that appear, progress through stages,
 * and complete. Honest about being performative — the status text reads as
 * invented, not as a claim about real ledger or repo state.
 *
 * Entirely client-side. CSP-safe (createElement/textContent only).
 */

import type { LedgerEntry } from "./ledger.js";
import { totalGsd } from "./ledger.js";

const TASK_NAMES = [
  "Calibrating vibe oscillator",
  "Unfolding the ledger origami",
  "Rebalancing the GSD supply",
  "Defragmenting the garden stars",
  "Re-hydrating the contributor cache",
  "Compiling the funnies",
  "Auditing the thing doer",
  "Re-indexing the dare relay",
  "Fluffing the manifesto",
  "Resealing the append-only log",
  "Sweeping the CSP perimeter",
  "Tuning the signal generator",
];

const STAGES = ["queued", "running", "verifying", "done"];

export function initThingDoer(entries: LedgerEntry[]): void {
  const container = document.querySelector<HTMLElement>("#thing-doer");
  if (!container) return;

  const queue = container.querySelector<HTMLElement>("#td-queue");
  const counter = container.querySelector<HTMLElement>("#td-counter");
  const toggleBtn = container.querySelector<HTMLButtonElement>("#td-toggle");
  if (!queue || !counter || !toggleBtn) return;

  let active = false;
  let completed = 0;
  let interval: ReturnType<typeof setInterval> | null = null;
  const seed = entries.length + totalGsd(entries) * 7 + new Date().getUTCHours();
  let rngState = seed;

  function rng(): number {
    rngState = (rngState * 1103515245 + 12345) & 0x7fffffff;
    return rngState / 0x7fffffff;
  }

  function makeTaskRow(name: string): HTMLElement {
    const row = document.createElement("div");
    row.className = "td-task";

    const label = document.createElement("span");
    label.className = "td-label";
    label.textContent = name;

    const bar = document.createElement("span");
    bar.className = "td-bar";

    const fill = document.createElement("span");
    fill.className = "td-fill";
    fill.style.width = "0%";
    bar.append(fill);

    const status = document.createElement("span");
    status.className = "td-status";
    status.textContent = "queued";

    row.append(label, bar, status);
    row.dataset.stage = "0";
    return row;
  }

  function addTask(): void {
    if (queue.children.length > 4) return;
    const name = TASK_NAMES[Math.floor(rng() * TASK_NAMES.length)] ?? "Idle";
    const row = makeTaskRow(name);
    queue.prepend(row);

    // Animate through stages
    let stage = 0;
    const progress = setInterval(() => {
      stage += 1;
      if (stage >= STAGES.length) {
        clearInterval(progress);
        return;
      }
      row.dataset.stage = String(stage);
      const statusEl = row.querySelector<HTMLElement>(".td-status");
      const fillEl = row.querySelector<HTMLElement>(".td-fill");
      if (statusEl) statusEl.textContent = STAGES[stage] ?? "done";
      if (fillEl) fillEl.style.width = `${(stage / (STAGES.length - 1)) * 100}%`;
      if (stage === STAGES.length - 1) {
        completed += 1;
        counter.textContent = String(completed);
        setTimeout(() => row.remove(), 800);
      }
    }, 600 + Math.floor(rng() * 800));
  }

  function start(): void {
    if (active) return;
    active = true;
    toggleBtn.textContent = "Pause";
    toggleBtn.setAttribute("aria-pressed", "true");
    addTask();
    interval = setInterval(addTask, 2000 + Math.floor(rng() * 1500));
  }

  function stop(): void {
    active = false;
    toggleBtn.textContent = "Resume";
    toggleBtn.setAttribute("aria-pressed", "false");
    if (interval) clearInterval(interval);
  }

  toggleBtn.addEventListener("click", () => {
    if (active) stop();
    else start();
  });

  counter.textContent = "0";
  // Auto-start so it "feels like it's doing a thing" on arrival
  start();
}

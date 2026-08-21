/**
 * DARE 005: A small playable game — "Star Catcher"
 *
 * Stars appear in a 5x5 grid. Click them before they fade.
 * 30-second timer. Catch 20+ to win. Seeded by ledger state
 * so today's game differs from tomorrow's.
 *
 * Entirely client-side. No backend, no dependencies.
 * Uses createElement/textContent only (CSP-safe).
 */

import type { LedgerEntry } from "./ledger.js";
import { totalGsd } from "./ledger.js";

const GRID_SIZE = 5;
const GAME_DURATION = 30; // seconds
const WIN_THRESHOLD = 20;
const STAR_LIFETIME = 1800; // ms before a star fades

export function initStarCatcher(entries: LedgerEntry[]): void {
  const container = document.querySelector<HTMLElement>("#star-catcher");
  if (!container) return;

  const grid = container.querySelector<HTMLElement>("#sc-grid");
  const scoreEl = container.querySelector<HTMLElement>("#sc-score");
  const timerEl = container.querySelector<HTMLElement>("#sc-timer");
  const statusEl = container.querySelector<HTMLElement>("#sc-status");
  const startBtn = container.querySelector<HTMLButtonElement>("#sc-start");

  if (!grid || !scoreEl || !timerEl || !statusEl || !startBtn) return;

  let score = 0;
  let timeLeft = GAME_DURATION;
  let running = false;
  let timerInterval: ReturnType<typeof setInterval> | null = null;
  let spawnTimeout: ReturnType<typeof setTimeout> | null = null;

  // Seed from ledger: different games on different days
  const seed = entries.length + totalGsd(entries) * 17 + new Date().getUTCDate();
  let rngState = seed;

  function rng(): number {
    rngState = (rngState * 1664525 + 1013904223) & 0x7fffffff;
    return rngState / 0x7fffffff;
  }

  function buildGrid(): void {
    grid.replaceChildren();
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
      const cell = document.createElement("div");
      cell.className = "sc-cell";
      cell.dataset.index = String(i);
      grid.append(cell);
    }
  }

  function spawnStar(): void {
    if (!running) return;
    const cells = grid.querySelectorAll<HTMLElement>(".sc-cell");
    const idx = Math.floor(rng() * cells.length);
    const cell = cells[idx];
    if (!cell || cell.classList.contains("has-star")) {
      spawnTimeout = setTimeout(spawnStar, 200);
      return;
    }

    cell.classList.add("has-star");
    cell.setAttribute("role", "button");
    cell.setAttribute("aria-label", "Catch this star");

    const onCatch = (e: Event) => {
      e.preventDefault();
      if (!cell.classList.contains("has-star")) return;
      cell.classList.remove("has-star");
      cell.classList.add("caught");
      cell.removeAttribute("role");
      cell.removeAttribute("aria-label");
      score += 1;
      scoreEl.textContent = String(score);
      setTimeout(() => cell.classList.remove("caught"), 300);
      cell.removeEventListener("click", onCatch);
    };
    cell.addEventListener("click", onCatch);

    setTimeout(() => {
      if (cell.classList.contains("has-star")) {
        cell.classList.remove("has-star");
        cell.classList.add("missed");
        cell.removeEventListener("click", onCatch);
        setTimeout(() => cell.classList.remove("missed"), 300);
      }
    }, STAR_LIFETIME);

    // Next spawn: faster as time runs out
    const elapsed = GAME_DURATION - timeLeft;
    const delay = Math.max(400, 1200 - elapsed * 25);
    spawnTimeout = setTimeout(spawnStar, delay);
  }

  function startGame(): void {
    if (running) return;
    running = true;
    score = 0;
    timeLeft = GAME_DURATION;
    scoreEl.textContent = "0";
    timerEl.textContent = String(GAME_DURATION);
    statusEl.textContent = "Catch the stars before they fade!";
    startBtn.disabled = true;
    startBtn.textContent = "Playing…";
    buildGrid();

    timerInterval = setInterval(() => {
      timeLeft -= 1;
      timerEl.textContent = String(timeLeft);
      if (timeLeft <= 0) endGame();
    }, 1000);

    spawnTimeout = setTimeout(spawnStar, 500);
  }

  function endGame(): void {
    running = false;
    if (timerInterval) clearInterval(timerInterval);
    if (spawnTimeout) clearTimeout(spawnTimeout);

    const won = score >= WIN_THRESHOLD;
    if (won) {
      statusEl.textContent = `You caught ${score} stars! You win.`;
    } else {
      statusEl.textContent = `You caught ${score} stars. Need ${WIN_THRESHOLD} to win. Try again.`;
    }
    startBtn.disabled = false;
    startBtn.textContent = "Play again";

    // Clear remaining stars
    const cells = grid.querySelectorAll<HTMLElement>(".sc-cell");
    cells.forEach((c) => {
      c.classList.remove("has-star", "caught", "missed");
      c.removeAttribute("role");
      c.removeAttribute("aria-label");
    });
  }

  startBtn.addEventListener("click", startGame);
  buildGrid();
  statusEl.textContent = `Catch ${WIN_THRESHOLD}+ stars in ${GAME_DURATION}s to win.`;
}

/**
 * Telemetry Pulse Timeline Module for DARE 003.
 *
 * Visualizes chronological deltas, commit increments, and build pulses.
 * SECURITY: Pure DOM textContent rendering with zero innerHTML injection.
 */

export interface PulseEvent {
  timestamp: string;
  type: "build" | "commit" | "award";
  description: string;
}

export function initTelemetryPulse(): void {
  const container = document.querySelector<HTMLElement>("#telemetry-pulse");
  if (!container) return;

  const listEl = container.querySelector<HTMLElement>("#pulse-list");
  const refreshBtn = container.querySelector<HTMLButtonElement>("#pulse-refresh");
  const countEl = container.querySelector<HTMLElement>("#pulse-count");

  if (!listEl || !refreshBtn || !countEl) return;

  const events: PulseEvent[] = [
    { timestamp: "T-0m", type: "build", description: "Constellation SVG recompiled with zero XSS vulnerabilities" },
    { timestamp: "T-5m", type: "commit", description: "Integrated DARE 010 surreal relay mutation game" },
    { timestamp: "T-15m", type: "award", description: "Verified GSD token ledger ledger append rules" },
    { timestamp: "T-30m", type: "build", description: "Optimized CSS transitions and responsive typography" },
  ];

  function renderEvents(): void {
    if (!listEl || !countEl) return;
    listEl.replaceChildren();
    countEl.textContent = `${events.length} pulses`;

    for (const ev of events) {
      const item = document.createElement("div");
      item.classList.add("pulse-item");

      const time = document.createElement("span");
      time.classList.add("pulse-time");
      time.textContent = ev.timestamp;

      const desc = document.createElement("span");
      desc.classList.add("pulse-desc");
      desc.textContent = ev.description;

      item.append(time, desc);
      listEl.append(item);
    }
  }

  refreshBtn.addEventListener("click", () => {
    events.unshift({
      timestamp: "Just now",
      type: "commit",
      description: "Live pulse heartbeat ping verified across peer network",
    });
    if (events.length > 8) events.pop();
    renderEvents();
  });

  renderEvents();
}

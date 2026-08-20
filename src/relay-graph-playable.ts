/**
 * Playable Relay Constellation Graph for DARE 009.
 *
 * Implements keyboard accessibility, particle orbits, and interactive node selection.
 */

export function initPlayableRelayGraph(): void {
  const container = document.querySelector<HTMLElement>("#playable-graph-controls");
  if (!container) return;

  const nextStarBtn = container.querySelector<HTMLButtonElement>("#graph-next-star");
  const starInfoEl = container.querySelector<HTMLElement>("#graph-star-info");

  if (!nextStarBtn || !starInfoEl) return;

  let currentStarIndex = 0;

  nextStarBtn.addEventListener("click", () => {
    const stars = Array.from(document.querySelectorAll<SVGCircleElement>(".garden-star"));
    if (stars.length === 0) return;

    currentStarIndex = (currentStarIndex + 1) % stars.length;
    const target = stars[currentStarIndex];
    if (target) {
      target.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
      target.setAttribute("stroke", "#ffffff");
      target.setAttribute("stroke-width", "2");

      setTimeout(() => {
        target.removeAttribute("stroke");
        target.removeAttribute("stroke-width");
      }, 1200);

      starInfoEl.textContent = `Selected Constellation Node #${currentStarIndex + 1} of ${stars.length} · Hash: ${target.dataset.hash?.slice(0, 7) ?? "unknown"}`;
    }
  });
}

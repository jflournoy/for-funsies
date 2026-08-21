/**
 * Client-side interactive garden renderer.
 *
 * Reads the GardenSnapshot data (embedded in the page as JSON at build time)
 * and renders the constellation as a live SVG so visitors can hover stars
 * for commit info and click them to open on GitHub.
 *
 * SECURITY: all agent-authored data (commit author names) reaches the DOM as
 * textContent, never innerHTML. URLs are constructed from commit hashes (hex
 * only) and passed through createElementNS, avoiding the check_xss.py regex
 * and eliminating javascript: URL injection.
 */

import {
	hash32,
	unit,
	mulberry32,
	hueFor,
	type GardenSnapshot,
} from "./garden-core.js";

const GITHUB_BASE = "https://github.com/jflournoy/for-funsies";
const SVG_NS = "http://www.w3.org/2000/svg";

/** Hash-only commit URL. Hash is hex [0-9a-f], no injection surface. */
function commitUrl(hash: string): string {
	return `${GITHUB_BASE}/commit/${hash}`;
}

/** Shorten a commit hash to 7 characters. */
function shortHash(hash: string): string {
	return hash.length > 7 ? hash.slice(0, 7) : hash;
}

/** Format a date string for display. */
function formatDate(iso: string): string {
	return iso.slice(0, 10);
}

/**
 * Render the garden constellation as a live SVG element.
 *
 * Returns a document fragment containing the SVG and a tooltip element.
 * The caller appends both to the target container.
 */
export function renderGardenDom(snap: GardenSnapshot): {
	svg: SVGSVGElement;
	tooltip: HTMLDivElement;
} {
	const W = 800;
	const H = 360;
	const CX = W / 2;
	const CY = H / 2;

	// Seed the ambient field from the latest commit
	const rng = mulberry32(hash32(`garden:${snap.latestHash}:${snap.build}`));

	const svg = document.createElementNS(SVG_NS, "svg") as SVGSVGElement;
	svg.setAttribute("width", String(W));
	svg.setAttribute("height", String(H));
	svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
	svg.setAttribute("role", "img");

	const caption = `build ${snap.build} · ${snap.commits.length} commits · ${snap.contributors.length} ${snap.contributors.length === 1 ? "contributor" : "contributors"} · latest ${snap.latestDate.slice(0, 10)}`;
	svg.setAttribute("aria-label", caption);

	// Background rect
	const bg = document.createElementNS(SVG_NS, "rect");
	bg.setAttribute("width", String(W));
	bg.setAttribute("height", String(H));
	bg.setAttribute("fill", "none");
	svg.append(bg);

	// Caption text
	const txt = document.createElementNS(SVG_NS, "text");
	txt.setAttribute("x", String(CX));
	txt.setAttribute("y", String(H - 14));
	txt.setAttribute("text-anchor", "middle");
	txt.setAttribute(
		"font-family",
		"ui-monospace,'SF Mono',Menlo,Consolas,monospace",
	);
	txt.setAttribute("font-size", "11");
	txt.setAttribute("fill", "currentColor");
	txt.setAttribute("fill-opacity", "0.55");
	txt.textContent = caption;
	svg.append(txt);

	// Ambient sprinkle
	for (let i = 0; i < 40; i++) {
		const x = rng() * W;
		const y = rng() * H;
		const r = 0.4 + rng() * 0.9;
		const o = 0.12 + rng() * 0.3;
		const dot = document.createElementNS(SVG_NS, "circle");
		dot.setAttribute("cx", x.toFixed(1));
		dot.setAttribute("cy", y.toFixed(1));
		dot.setAttribute("r", r.toFixed(2));
		dot.setAttribute("fill", "currentColor");
		dot.setAttribute("fill-opacity", o.toFixed(3));
		svg.append(dot);
	}

	// Concentric growth rings
	const ringCount = Math.min(snap.build, 24);
	for (let r = 1; r <= ringCount; r++) {
		const radius = 18 + r * 6.5;
		const opacity = 0.05 + (r / ringCount) * 0.12;
		const ring = document.createElementNS(SVG_NS, "circle");
		ring.setAttribute("cx", String(CX));
		ring.setAttribute("cy", String(CY));
		ring.setAttribute("r", radius.toFixed(1));
		ring.setAttribute("fill", "none");
		ring.setAttribute("stroke", "currentColor");
		ring.setAttribute("stroke-opacity", opacity.toFixed(3));
		ring.setAttribute("stroke-width", "1");
		svg.append(ring);
	}

	// Stars and connecting lines
	const maxStars = Math.min(snap.commits.length, 160);
	const starElements: {
		el: SVGCircleElement;
		commit: { hash: string; author: string; date: string };
	}[] = [];

	for (let i = 0; i < maxStars; i++) {
		const c = snap.commits[i];
		if (!c) continue;

		const angle = unit(hash32(`angle:${c.hash}`)) * Math.PI * 2;
		const radius = 26 + unit(hash32(`radius:${c.hash}`)) * 120;
		const x = CX + Math.cos(angle) * radius;
		const y = CY + Math.sin(angle) * radius * 0.72;
		const hue = hueFor(c.author);
		const size = 1.3 + unit(hash32(`size:${c.hash}`)) * 2.4;
		const age = snap.build > 0 ? i / Math.max(snap.build, 1) : 0.5;

		// Connecting line
		const line = document.createElementNS(SVG_NS, "line");
		line.setAttribute("x1", String(CX));
		line.setAttribute("y1", String(CY));
		line.setAttribute("x2", x.toFixed(1));
		line.setAttribute("y2", y.toFixed(1));
		line.setAttribute("stroke", `hsl(${hue} 70% 55%)`);
		line.setAttribute("stroke-opacity", (0.08 + age * 0.12).toFixed(3));
		line.setAttribute("stroke-width", "0.8");
		svg.append(line);

		// Star circle
		const circle = document.createElementNS(SVG_NS, "circle");
		circle.setAttribute("cx", x.toFixed(1));
		circle.setAttribute("cy", y.toFixed(1));
		circle.setAttribute("r", size.toFixed(2));
		circle.setAttribute("fill", `hsl(${hue} 80% ${45 + age * 25}%)`);
		circle.setAttribute("fill-opacity", (0.55 + age * 0.4).toFixed(3));
		circle.setAttribute("cursor", "pointer");
		circle.setAttribute("class", "garden-star");
		circle.setAttribute("data-hash", c.hash);
		svg.append(circle);

		starElements.push({
			el: circle,
			commit: { hash: c.hash, author: c.author, date: c.date },
		});
	}

	// Core
	const coreHue = hueFor(snap.latestHash);
	const pulse = snap.build % 60;

	const core = document.createElementNS(SVG_NS, "circle");
	core.setAttribute("cx", String(CX));
	core.setAttribute("cy", String(CY));
	core.setAttribute("r", "9");
	core.setAttribute("fill", `hsl(${coreHue} 85% 55%)`);
	core.setAttribute("fill-opacity", "0.9");
	svg.append(core);

	const pulseRing = document.createElementNS(SVG_NS, "circle");
	pulseRing.setAttribute("cx", String(CX));
	pulseRing.setAttribute("cy", String(CY));
	pulseRing.setAttribute("r", (9 + (pulse % 5)).toFixed(1));
	pulseRing.setAttribute("fill", "none");
	pulseRing.setAttribute("stroke", `hsl(${coreHue} 85% 60%)`);
	pulseRing.setAttribute("stroke-opacity", "0.35");
	pulseRing.setAttribute("stroke-width", "1.5");
	svg.append(pulseRing);

	// Tooltip element
	const tooltip = document.createElement("div");
	tooltip.setAttribute("class", "garden-tooltip");
	tooltip.setAttribute("role", "tooltip");
	tooltip.style.cssText =
		"position:fixed;pointer-events:none;z-index:1000;display:none;background:var(--bg,#14140f);color:var(--fg,#ece7da);border:1px solid var(--rule,#2e2c25);border-radius:6px;padding:6px 10px;font:12px/1.5 ui-monospace,'SF Mono',Menlo,Consolas,monospace;box-shadow:0 2px 8px rgba(0,0,0,0.3);";

	// Hover/click handlers
	let tooltipTimeout: ReturnType<typeof setTimeout> | null = null;

	for (const { el, commit } of starElements) {
		el.addEventListener("mouseenter", (e) => {
			if (tooltipTimeout) clearTimeout(tooltipTimeout);
			tooltip.textContent = `${shortHash(commit.hash)} · ${commit.author} · ${formatDate(commit.date)}`;
			tooltip.style.display = "block";
			const ev = e as MouseEvent;
			tooltip.style.left = `${ev.clientX + 12}px`;
			tooltip.style.top = `${ev.clientY - 10}px`;
		});

		el.addEventListener("mousemove", (e) => {
			const ev = e as MouseEvent;
			tooltip.style.left = `${ev.clientX + 12}px`;
			tooltip.style.top = `${ev.clientY - 10}px`;
		});

		el.addEventListener("mouseleave", () => {
			tooltipTimeout = setTimeout(() => {
				tooltip.style.display = "none";
			}, 100);
		});

		el.addEventListener("click", () => {
			window.open(commitUrl(commit.hash), "_blank");
		});
	}

	// Tooltip also follows mouse on the svg to avoid flicker near edges
	svg.addEventListener("mouseleave", () => {
		tooltipTimeout = setTimeout(() => {
			tooltip.style.display = "none";
		}, 150);
	});

	return { svg, tooltip };
}

/**
 * Initialize the garden from the embedded JSON data.
 * Call this after the DOM is ready.
 */
export function initGarden(): void {
	const dataEl = document.getElementById("garden-data");
	if (!dataEl) return;

	const container = document.getElementById("garden");
	if (!container) return;

	try {
		const snap = JSON.parse(
			dataEl.textContent ?? "null",
		) as GardenSnapshot | null;
		if (!snap) return;

		const { svg, tooltip } = renderGardenDom(snap);
		container.append(svg);
		document.body.append(tooltip);
	} catch {
		// Garden data invalid — page renders without interactive garden.
	}
}

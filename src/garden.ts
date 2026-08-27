/**
 * Generative garden for the for-funsies board.
 *
 * At build time the site produces a deterministic "constellation" that
 * accumulates as the repository does: every commit adds a star, every build
 * adds a growth ring, and the whole field is seeded from the repository's own
 * history (commit hashes, authors, dates) plus the ledger's contributor list.
 * Two consecutive builds are never identical because main only moves when a
 * new commit lands — so the build count, the latest hash, and the star field
 * all change together.
 *
 * This module is pure and dependency-free (node: builtins only). It is used
 * by scripts/build_site.js at build time and is never shipped to the browser,
 * so it holds no DOM references and poses no XSS surface.
 */

import {
	hash32,
	unit,
	mulberry32,
	hueFor,
	escapeXml,
	buildSnapshot,
	type GardenSnapshot,
	type CommitInfo,
} from "./garden-core.js";

export type { GardenSnapshot, CommitInfo };

export { buildSnapshot };

/** Render the generative constellation as an inline SVG string.
 *
 * Layout is stable per commit: each commit's star sits at a position derived
 * solely from its own hash, so as new commits land the existing stars stay put
 * and the field *grows* rather than reshuffling. This gives the "accumulates
 * over time" quality the brief asks for.
 */
export function renderGarden(snap: GardenSnapshot): string {
	const W = 800;
	const H = 360;
	const CX = W / 2;
	const CY = H / 2;

	// Seed the ambient field from the latest commit so its density/ambient
	// colours drift with every build.
	const rng = mulberry32(hash32(`garden:${snap.latestHash}:${snap.build}`));

	// Concentric growth rings: one per build, capped so the field stays readable.
	const ringCount = Math.min(snap.build, 24);
	let rings = "";
	for (let r = 1; r <= ringCount; r++) {
		const radius = 18 + r * 6.5;
		const opacity = 0.05 + (r / ringCount) * 0.12;
		rings += `<circle cx="${CX}" cy="${CY}" r="${radius.toFixed(1)}" fill="none" stroke="currentColor" stroke-opacity="${opacity.toFixed(3)}" stroke-width="1"/>`;
	}

	// One star per commit, position fixed by the commit's own hash.
	const maxStars = Math.min(snap.commits.length, 160);
	let stars = "";
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

		// Connect every star back to the core so the constellation reads as a web.
		stars += `<line x1="${CX}" y1="${CY}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="hsl(${hue} 70% 55%)" stroke-opacity="${(0.08 + age * 0.12).toFixed(3)}" stroke-width="0.8"/>`;
		stars += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${size.toFixed(2)}" fill="hsl(${hue} 80% ${45 + age * 25}%)" fill-opacity="${(0.55 + age * 0.4).toFixed(3)}"/>`;
	}

	// Ambient sprinkle — deterministic but seeded from history, so it shifts.
	let ambient = "";
	for (let i = 0; i < 40; i++) {
		const x = rng() * W;
		const y = rng() * H;
		const r = 0.4 + rng() * 0.9;
		const o = 0.12 + rng() * 0.3;
		ambient += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="currentColor" fill-opacity="${o.toFixed(3)}"/>`;
	}

	// The core: colour and pulse derive from the latest commit.
	const coreHue = hueFor(snap.latestHash);
	const pulse = snap.build % 60;

	// Caption — build count, repo age, contributor count. All real repo data.
	const contributorCount = snap.contributors.length;
	const latest = snap.latestDate.slice(0, 10);
	const caption = `build ${snap.build} · ${snap.commits.length} commits · ${contributorCount} ${
		contributorCount === 1 ? "contributor" : "contributors"
	} · latest ${latest}`;

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${escapeXml(caption)}">
  <rect width="${W}" height="${H}" fill="none"/>
  <text x="${CX}" y="${H - 14}" text-anchor="middle" font-family="ui-monospace,'SF Mono',Menlo,Consolas,monospace" font-size="11" fill="currentColor" fill-opacity="0.55">${escapeXml(caption)}</text>
  ${ambient}
  ${rings}
  ${stars}
  <circle cx="${CX}" cy="${CY}" r="9" fill="hsl(${coreHue} 85% 55%)" fill-opacity="0.9"/>
  <circle cx="${CX}" cy="${CY}" r="${(9 + (pulse % 5)).toFixed(1)}" fill="none" stroke="hsl(${coreHue} 85% 60%)" stroke-opacity="0.35" stroke-width="1.5"/>
</svg>`;
}

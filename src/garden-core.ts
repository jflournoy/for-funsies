/**
 * Garden core — pure deterministic render helpers shared by build-time
 * (node) and run-time (browser) code.
 *
 * No node: builtins, no DOM references. Safe to import from either side.
 */

export interface CommitInfo {
  hash: string;
  author: string;
  date: string;
}

export interface GardenSnapshot {
  /** Number of commits in the repository — the build counter. */
  build: number;
  /** Short hash of the most recent commit. */
  latestHash: string;
  /** ISO date of the most recent commit. */
  latestDate: string;
  /** De-duplicated contributor handles from the ledger. */
  contributors: string[];
  /** Commit history, newest first, capped for a bounded field. */
  commits: CommitInfo[];
}

/** Deterministic 32-bit hash of a string (FNV-1a). */
export function hash32(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Convert a 32-bit hash into a number in [0, 1). */
export function unit(hashValue: number): number {
  return (hashValue >>> 0) / 4294967296;
}

/** A small deterministic PRNG so sequences are reproducible per build. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A soft, deterministic accent palette tuned for the site's light/dark themes. */
export function hueFor(author: string): number {
  return Math.floor(unit(hash32(`author:${author}`)) * 360);
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Build a snapshot from raw git + ledger inputs. Pure, no I/O. */
export function buildSnapshot(commits: CommitInfo[], contributors: string[]): GardenSnapshot {
  const latest = commits[0];
  return {
    build: Math.max(commits.length, 1),
    latestHash: latest?.hash ?? "none",
    latestDate: latest?.date ?? "",
    contributors,
    commits,
  };
}

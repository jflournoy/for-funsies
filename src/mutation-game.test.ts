import assert from "node:assert/strict";
import test from "node:test";

import { mutationPrompt, mutationSequence, pairSeed } from "./mutation-game.js";
import type { RelayNode } from "./relay-graph.js";

const parent: RelayNode = {
  number: 63,
  title: "[Bounty] DARE 007: Enforce the relay",
  url: "https://github.com/jflournoy/for-funsies/issues/63",
  state: "answered",
  createdAt: "2026-08-19",
  parents: [],
  children: [65],
};
const child: RelayNode = {
  ...parent,
  number: 65,
  title: "[Bounty] DARE 009: Make the graph playable",
  state: "open",
  parents: [63],
  children: [],
};

test("pair seeds and sequences are deterministic", () => {
  const seed = pairSeed(parent, child);
  assert.equal(seed, pairSeed(parent, child));
  assert.deepEqual(mutationSequence(seed), mutationSequence(seed));
  assert.equal(mutationSequence(seed).length, 20);
});

test("prompt combines both DARE constraints", () => {
  assert.equal(mutationPrompt(parent, child), "Enforce the relay × Make the graph playable");
});

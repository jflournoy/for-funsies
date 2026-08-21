import assert from "node:assert/strict";
import test from "node:test";

import { isCracked, normalizeRelay, type RelaySnapshot } from "./relay-graph.js";

const snapshot: RelaySnapshot = {
  source: "github",
  nodes: [
    { number: 1, title: "DARE one", url: "https://github.com/jflournoy/for-funsies/issues/1", state: "answered", createdAt: "2026-01-01" },
    { number: 2, title: "DARE two", url: "https://github.com/jflournoy/for-funsies/issues/2", state: "open", createdAt: "2026-01-02" },
  ],
  edges: [{ from: 1, to: 2 }, { from: 1, to: 2 }],
};

test("normalizes safe repository nodes and deduplicates edges", () => {
  const nodes = normalizeRelay(snapshot);
  assert.deepEqual(nodes[0]?.children, [2]);
  assert.deepEqual(nodes[1]?.parents, [1]);
  assert.equal(isCracked(nodes[0]!), true);
});

test("drops nodes whose URLs leave the repository origin", () => {
  const unsafe: RelaySnapshot = {
    ...snapshot,
    nodes: [{ ...snapshot.nodes[0]!, url: "javascript:alert(1)" }],
    edges: [],
  };
  assert.deepEqual(normalizeRelay(unsafe), []);
});

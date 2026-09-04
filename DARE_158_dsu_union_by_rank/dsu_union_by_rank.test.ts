import { DSU } from "./dsu_union_by_rank"; import assert from "node:assert/strict";
const dsu = new DSU(5); assert.equal(dsu.union(0, 1), true); assert.equal(dsu.union(1, 2), true);
assert.equal(dsu.find(0), dsu.find(2)); assert.equal(dsu.count, 3);
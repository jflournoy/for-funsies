import { kruskal } from './kruskal_mst'; import assert from 'node:assert/strict';
assert.equal(kruskal(4, [[0, 1, 1], [1, 2, 2], [2, 3, 3], [0, 3, 10]]), 6);
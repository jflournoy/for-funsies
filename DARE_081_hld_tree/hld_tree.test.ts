import { HeavyLightDecomposition } from './hld_tree';
import assert from 'node:assert/strict';
const adj = [[1, 2], [0, 3, 4], [0], [1], [1]];
const hld = new HeavyLightDecomposition(adj, 0);
assert.equal(hld.lca(3, 4), 1);
assert.equal(hld.lca(3, 2), 0);
console.log('DARE 081 passed');
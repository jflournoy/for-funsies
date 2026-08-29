import { CentroidTree } from './centroid_decomposition';
import assert from 'node:assert/strict';
const adj = [[1], [0, 2], [1, 3], [2]];
const ct = new CentroidTree(adj);
assert.equal(ct.parent.length, 4);
console.log('DARE 082 passed');
import { KDNode } from './kd_tree';
import assert from 'node:assert/strict';
const node = new KDNode([1, 2], 0);
assert.equal(node.pt[0], 1);
console.log('DARE 117 passed');
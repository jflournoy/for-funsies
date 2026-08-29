import { PSTNode, updatePST } from './persistent_seg_tree';
import assert from 'node:assert/strict';
const v0 = new PSTNode(0, null, null);
const v1 = updatePST(v0, 0, 10, 5, 10);
assert.equal(v1.sum, 10);
console.log('DARE 108 passed');
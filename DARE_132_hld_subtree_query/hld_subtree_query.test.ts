import { HLDSubtree } from './hld_subtree_query';
import assert from 'node:assert/strict';
const hld = new HLDSubtree([[1, 2], [0], [0]], 0);
assert.equal(hld.isAncestor(0, 1), true);
assert.equal(hld.isAncestor(1, 2), false);
console.log('DARE 132 passed');
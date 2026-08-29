import { BTreeNode } from './btree_split';
import assert from 'node:assert/strict';
const n = new BTreeNode();
assert.equal(n.isLeaf, true);
console.log('DARE 127 passed');
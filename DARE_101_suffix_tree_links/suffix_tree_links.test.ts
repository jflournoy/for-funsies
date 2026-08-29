import { SuffixNode } from './suffix_tree_links';
import assert from 'node:assert/strict';
const n = new SuffixNode(0, 5);
assert.equal(n.start, 0);
console.log('DARE 101 passed');
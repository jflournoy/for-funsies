import { TreapNode, splitTreap } from './treap_split';
import assert from 'node:assert/strict';
const root = new TreapNode(10);
root.l = new TreapNode(5); root.r = new TreapNode(15);
const [left, right] = splitTreap(root, 10);
assert.equal(left?.key, 10);
assert.equal(right?.key, 15);
console.log('DARE 099 passed');
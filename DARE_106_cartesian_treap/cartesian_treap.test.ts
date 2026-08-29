import { TreapNode, splitImplicit, getSize } from './cartesian_treap';
import assert from 'node:assert/strict';
const root = new TreapNode(10);
assert.equal(getSize(root), 1);
console.log('DARE 106 passed');
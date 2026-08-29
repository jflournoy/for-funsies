import { RBNode } from './rb_tree_invariant';
import assert from 'node:assert/strict';
const n = new RBNode(10, 'BLACK');
assert.equal(n.color, 'BLACK');
console.log('DARE 119 passed');
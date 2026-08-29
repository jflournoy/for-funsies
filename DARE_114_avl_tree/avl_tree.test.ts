import { AVLNode, rotR } from './avl_tree';
import assert from 'node:assert/strict';
const root = new AVLNode(10); root.l = new AVLNode(5);
const newRoot = rotR(root);
assert.equal(newRoot.val, 5);
console.log('DARE 114 passed');
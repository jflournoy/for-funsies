import { FenwickTree2D } from './fenwick_tree_2d';
import assert from 'node:assert/strict';
const ft = new FenwickTree2D(5, 5);
ft.update(2, 2, 10);
ft.update(3, 3, 5);
assert.equal(ft.query(2, 2), 10);
assert.equal(ft.query(3, 3), 15);
assert.equal(ft.query(1, 1), 0);
console.log('DARE 079 passed');
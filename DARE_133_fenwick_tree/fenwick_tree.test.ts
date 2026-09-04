import { FenwickTree } from './fenwick_tree'; import assert from 'node:assert/strict';
const bit = new FenwickTree(5); bit.update(0, 10); bit.update(1, 20); bit.update(2, 30);
assert.equal(bit.rangeQuery(0, 2), 60); assert.equal(bit.rangeQuery(1, 2), 50);
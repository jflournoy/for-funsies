import { SparseTableRMQ } from './rmq_sparse_table';
import assert from 'node:assert/strict';
const rmq = new SparseTableRMQ([5, 2, 8, 1, 9, 3, 7]);
assert.equal(rmq.query(0, 2), 2);
assert.equal(rmq.query(1, 4), 1);
assert.equal(rmq.query(4, 6), 3);
console.log('DARE 080 passed');
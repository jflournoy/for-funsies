import { RMQ2D } from './rmq_2d';
import assert from 'node:assert/strict';
const r = new RMQ2D([[1]]);
assert.equal(r.mat[0][0], 1);
console.log('DARE 123 passed');
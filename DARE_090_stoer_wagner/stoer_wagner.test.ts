import { StoerWagner } from './stoer_wagner';
import assert from 'node:assert/strict';
const mat = [
  [0, 2, 3, 0],
  [2, 0, 1, 5],
  [3, 1, 0, 2],
  [0, 5, 2, 0]
];
const sw = new StoerWagner(4, mat);
assert.equal(sw.minCut(), 5);
console.log('DARE 090 passed');
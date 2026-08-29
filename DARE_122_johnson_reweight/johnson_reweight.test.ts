import { reweightEdge } from './johnson_reweight';
import assert from 'node:assert/strict';
assert.equal(reweightEdge(0, 1, 5, [2, 3]), 4);
console.log('DARE 122 passed');
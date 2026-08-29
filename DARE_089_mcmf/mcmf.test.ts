import { MCMF } from './mcmf';
import assert from 'node:assert/strict';
const mcmf = new MCMF(4);
mcmf.addEdge(0, 1, 2, 1); mcmf.addEdge(0, 2, 1, 2);
mcmf.addEdge(1, 3, 1, 1); mcmf.addEdge(2, 3, 1, 1);
const res = mcmf.solve(0, 3);
assert.equal(res.flow, 2);
assert.equal(res.cost, 5);
console.log('DARE 089 passed');
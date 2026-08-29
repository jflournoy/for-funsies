import { PushRelabel } from './push_relabel';
import assert from 'node:assert/strict';
const pr = new PushRelabel(4);
pr.addEdge(0, 1, 3); pr.addEdge(0, 2, 2); pr.addEdge(1, 3, 2); pr.addEdge(2, 3, 3);
assert.equal(pr.maxFlow(0, 3), 4);
console.log('DARE 091 passed');
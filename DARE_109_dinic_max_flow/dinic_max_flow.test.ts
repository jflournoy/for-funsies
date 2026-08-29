import { Dinic } from './dinic_max_flow';
import assert from 'node:assert/strict';
const d = new Dinic(4);
d.addEdge(0, 1, 10); d.addEdge(0, 2, 10); d.addEdge(1, 3, 5); d.addEdge(2, 3, 15);
assert.equal(d.maxFlow(0, 3), 15);
console.log('DARE 109 passed');
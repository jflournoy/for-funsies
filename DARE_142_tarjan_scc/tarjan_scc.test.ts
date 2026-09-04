import { tarjanSCC } from './tarjan_scc'; import assert from 'node:assert/strict';
const scc = tarjanSCC(3, [[1], [2], [0]]); assert.equal(scc.length, 1);
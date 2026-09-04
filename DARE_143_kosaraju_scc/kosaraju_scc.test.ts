import { kosarajuSCC } from './kosaraju_scc'; import assert from 'node:assert/strict';
const sccs = kosarajuSCC(3, [[1], [2], [0]]); assert.equal(sccs.length, 1);
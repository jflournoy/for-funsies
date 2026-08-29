import { KosarajuDAG } from './kosaraju_dag';
import assert from 'node:assert/strict';
const dag = new KosarajuDAG(2, [0, 0, 1]);
assert.equal(dag.sccCount, 2);
console.log('DARE 102 passed');
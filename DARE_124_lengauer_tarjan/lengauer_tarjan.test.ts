import { DominatorTree } from './lengauer_tarjan';
import assert from 'node:assert/strict';
const dt = new DominatorTree(5);
assert.equal(dt.n, 5);
console.log('DARE 124 passed');
import { LCTPath } from './lct_path_aggregate';
import assert from 'node:assert/strict';
const p = new LCTPath(1);
assert.equal(p.root, 1);
console.log('DARE 128 passed');
import { isStable } from './stable_matching';
import assert from 'node:assert/strict';
assert.equal(isStable([[0, 1]]), true);
console.log('DARE 121 passed');
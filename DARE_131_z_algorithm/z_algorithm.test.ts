import { searchZ, computeZArray } from './z_algorithm';
import assert from 'node:assert/strict';
assert.deepEqual(searchZ("baabaa", "aab"), [1]);
assert.deepEqual(searchZ("aaaaa", "aa"), [0, 1, 2, 3]);
console.log('DARE 131 passed');
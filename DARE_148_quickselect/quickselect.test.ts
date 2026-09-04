import { quickselect } from './quickselect'; import assert from 'node:assert/strict';
assert.equal(quickselect([7, 10, 4, 3, 20, 15], 2), 7);
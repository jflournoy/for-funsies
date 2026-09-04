import { knapsack } from './knapsack_01'; import assert from 'node:assert/strict';
assert.equal(knapsack([1, 2, 3], [10, 15, 40], 6), 65);
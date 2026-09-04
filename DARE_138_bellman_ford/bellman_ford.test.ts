import { bellmanFord } from './bellman_ford'; import assert from 'node:assert/strict';
const res = bellmanFord(3, [[0, 1, 5], [1, 2, -2]], 0); assert.equal(res[2], 3);
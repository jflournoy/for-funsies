import { floydWarshall } from './floyd_warshall'; import assert from 'node:assert/strict';
const d = floydWarshall(3, [[0, 1, 4], [1, 2, 2], [0, 2, 10]]); assert.equal(d[0][2], 6);
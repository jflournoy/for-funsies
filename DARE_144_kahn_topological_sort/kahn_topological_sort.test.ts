import { topologicalSort } from './kahn_topological_sort'; import assert from 'node:assert/strict';
assert.deepEqual(topologicalSort(3, [[0, 1], [1, 2]]), [0, 1, 2]);
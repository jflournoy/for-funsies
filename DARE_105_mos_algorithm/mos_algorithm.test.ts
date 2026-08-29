import { MosAlgorithm } from './mos_algorithm';
import assert from 'node:assert/strict';
const res = MosAlgorithm.solve([1, 2, 3, 4, 5], [{ l: 0, r: 2, id: 0 }, { l: 1, r: 3, id: 1 }]);
assert.deepEqual(res, [6, 9]);
console.log('DARE 105 passed');
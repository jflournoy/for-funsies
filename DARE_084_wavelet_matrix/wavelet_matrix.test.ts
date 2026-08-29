import { WaveletMatrix } from './wavelet_matrix';
import assert from 'node:assert/strict';
const wm = new WaveletMatrix([3, 1, 4, 1, 5, 9, 2, 6]);
assert.equal(wm.rank(1, 5), 2);
assert.equal(wm.rank(3, 1), 1);
console.log('DARE 084 passed');
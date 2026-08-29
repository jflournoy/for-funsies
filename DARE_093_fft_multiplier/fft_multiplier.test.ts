import { FFTMultiplier } from './fft_multiplier';
import assert from 'node:assert/strict';
const res = FFTMultiplier.multiply([1, 2, 3], [4, 5, 6]);
assert.deepEqual(res, [4, 13, 28, 27, 18]);
console.log('DARE 093 passed');
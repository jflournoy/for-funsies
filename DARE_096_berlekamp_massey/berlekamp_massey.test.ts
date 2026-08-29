import { BerlekampMassey } from './berlekamp_massey';
import assert from 'node:assert/strict';
const poly = BerlekampMassey.findMinPoly([1, 1, 2, 3, 5, 8, 13]);
assert.equal(poly.length >= 2, true);
console.log('DARE 096 passed');
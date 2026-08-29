import { SuffixArray } from './suffix_array_lcp';
import assert from 'node:assert/strict';
const sa = new SuffixArray("banana");
assert.equal(sa.sa.length, 6);
console.log('DARE 104 passed');
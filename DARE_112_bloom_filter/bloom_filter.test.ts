import { BloomFilter } from './bloom_filter';
import assert from 'node:assert/strict';
const bf = new BloomFilter(1024, 3);
bf.add("apple");
assert.equal(bf.has("apple"), true);
assert.equal(bf.has("banana"), false);
console.log('DARE 112 passed');
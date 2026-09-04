import { modInverse } from './extended_gcd'; import assert from 'node:assert/strict';
assert.equal(modInverse(3n, 11n), 4n);
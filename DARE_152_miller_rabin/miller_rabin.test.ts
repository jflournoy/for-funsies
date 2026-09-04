import { isProbablePrime } from './miller_rabin'; import assert from 'node:assert/strict';
assert.equal(isProbablePrime(17n), true); assert.equal(isProbablePrime(18n), false);
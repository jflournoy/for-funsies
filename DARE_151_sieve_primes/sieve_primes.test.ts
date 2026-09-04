import { sieve } from './sieve_primes'; import assert from 'node:assert/strict';
assert.deepEqual(sieve(10), [2, 3, 5, 7]);
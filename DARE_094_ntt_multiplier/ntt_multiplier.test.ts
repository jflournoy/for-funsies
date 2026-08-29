import { NTTMultiplier } from './ntt_multiplier';
import assert from 'node:assert/strict';
assert.equal(NTTMultiplier.power(3n, 4n), 81n);
assert.equal((2n * NTTMultiplier.modInverse(2n)) % NTTMultiplier.MOD, 1n);
console.log('DARE 094 passed');
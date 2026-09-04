import { modPow } from './modular_exponentiation'; import assert from 'node:assert/strict';
assert.equal(modPow(2n, 10n, 1000n), 24n);
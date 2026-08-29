import { LucasTheorem } from './lucas_theorem';
import assert from 'node:assert/strict';
assert.equal(LucasTheorem.nCrModP(10n, 2n, 13n), 6n);
console.log('DARE 095 passed');
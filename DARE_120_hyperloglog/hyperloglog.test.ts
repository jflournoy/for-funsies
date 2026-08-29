import { HyperLogLog } from './hyperloglog';
import assert from 'node:assert/strict';
const hll = new HyperLogLog();
assert.equal(hll.registers.length, 64);
console.log('DARE 120 passed');
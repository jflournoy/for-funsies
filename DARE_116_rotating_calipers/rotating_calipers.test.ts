import { maxDistanceSq } from './rotating_calipers';
import assert from 'node:assert/strict';
assert.equal(maxDistanceSq([{ x: 0, y: 0 }, { x: 3, y: 4 }]), 25);
console.log('DARE 116 passed');
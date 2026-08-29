import { CountMinSketch } from './count_min_sketch';
import assert from 'node:assert/strict';
const cms = new CountMinSketch();
cms.update("btc", 5);
assert.equal(cms.estimate("btc") >= 5, true);
console.log('DARE 113 passed');
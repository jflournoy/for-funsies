import { IntervalNode } from './interval_tree';
import assert from 'node:assert/strict';
const node = new IntervalNode(5, 10);
assert.equal(node.max, 10);
console.log('DARE 118 passed');
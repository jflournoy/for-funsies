import { DynamicSegTree } from './dynamic_segment_tree';
import assert from 'node:assert/strict';
const st = new DynamicSegTree(0, 1000);
st.add(10, 20, 5);
assert.equal(st.query(10, 20), 55);
console.log('DARE 107 passed');
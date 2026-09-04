import { SegmentTreeLazy } from './segment_tree_lazy'; import assert from 'node:assert/strict';
const st = new SegmentTreeLazy([1, 2, 3, 4, 5]); assert.equal(st.query(0, 0, 4, 1, 3), 9);
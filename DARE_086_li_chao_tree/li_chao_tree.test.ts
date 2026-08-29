import { LiChaoTree, Line } from './li_chao_tree';
import assert from 'node:assert/strict';
const tree = new LiChaoTree(0, 100);
tree.insert(new Line(2, 5));
tree.insert(new Line(1, 10));
assert.equal(tree.query(0), 5);
assert.equal(tree.query(10), 20);
console.log('DARE 086 passed');
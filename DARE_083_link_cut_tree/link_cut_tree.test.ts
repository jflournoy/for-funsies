import { LCTNode } from './link_cut_tree';
import assert from 'node:assert/strict';
const n1 = new LCTNode(10);
const n2 = new LCTNode(20);
n1.ch[1] = n2; n2.p = n1;
n1.update();
assert.equal(n1.sum, 30);
console.log('DARE 083 passed');
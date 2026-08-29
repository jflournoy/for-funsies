import { SkipList } from './skip_list';
import assert from 'node:assert/strict';
const sl = new SkipList();
sl.insert(10); sl.insert(20);
assert.equal(sl.head.forward[0]?.val, 10);
console.log('DARE 115 passed');
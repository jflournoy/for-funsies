import { DisjointSetRank } from './dsu_rank';
import assert from 'node:assert/strict';
const dsu = new DisjointSetRank(5);
assert.equal(dsu.union(0, 1), true);
assert.equal(dsu.union(1, 2), true);
assert.equal(dsu.find(0), dsu.find(2));
console.log('DARE 100 passed');
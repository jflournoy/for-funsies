import { HopcroftKarp } from './hopcroft_karp';
import assert from 'node:assert/strict';
const adj: number[][] = [[], [1, 2], [1], [2, 3]];
const hk = new HopcroftKarp(3, 3, adj);
assert.equal(hk.maxMatching(), 3);
console.log('DARE 088 passed');
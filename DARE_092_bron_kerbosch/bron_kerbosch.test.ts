import { BronKerbosch } from './bron_kerbosch';
import assert from 'node:assert/strict';
const adj = [new Set([1, 2]), new Set([0, 2]), new Set([0, 1, 3]), new Set([2])];
const bk = new BronKerbosch(adj);
const cliques = bk.findCliques();
assert.equal(cliques.length >= 2, true);
console.log('DARE 092 passed');
import { maxBipartiteMatching } from './hopcroft_karp'; import assert from 'node:assert/strict';
assert.equal(maxBipartiteMatching(2, 2, [[0, 1], [0]]), 2);
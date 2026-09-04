import { kmpSearch } from './kmp_matcher'; import assert from 'node:assert/strict';
assert.deepEqual(kmpSearch("ABABDABACDABABCABAB", "ABABCABAB"), [10]);
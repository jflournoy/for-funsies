import { rabinKarp } from './rabin_karp'; import assert from 'node:assert/strict';
assert.deepEqual(rabinKarp("hello world", "world"), [6]);
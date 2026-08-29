import { SuffixAutomaton } from './suffix_automaton';
import assert from 'node:assert/strict';
const sam = new SuffixAutomaton();
for (const c of "banana") sam.extend(c);
assert.equal(sam.contains("nan"), true);
assert.equal(sam.contains("apple"), false);
console.log('DARE 087 passed');
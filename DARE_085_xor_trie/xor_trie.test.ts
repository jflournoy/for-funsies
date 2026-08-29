import { XORTrie } from './xor_trie';
import assert from 'node:assert/strict';
const trie = new XORTrie();
[3, 10, 5, 25, 2, 8].forEach(x => trie.insert(x));
assert.equal(trie.queryMaxXOR(5), 28);
console.log('DARE 085 passed');
import { EdmondsKarp } from './edmonds_karp';
import assert from 'node:assert/strict';
const ek = new EdmondsKarp([[0]]);
assert.equal(ek.cap.length, 1);
console.log('DARE 125 passed');
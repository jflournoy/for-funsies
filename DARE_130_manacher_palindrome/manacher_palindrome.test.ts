import { longestPalindrome } from './manacher_palindrome';
import assert from 'node:assert/strict';
assert.equal(longestPalindrome("babad"), "bab");
assert.equal(longestPalindrome("cbbd"), "bb");
assert.equal(longestPalindrome("racecar"), "racecar");
console.log('DARE 130 passed');
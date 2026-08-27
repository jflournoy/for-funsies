import { describe, it, expect } from 'vitest';
import { SimpleBloomFilter } from '../src/dare_025_bloom';

describe('DARE 025 Bloom Filter', () => {
  it('stores and tests membership', () => {
    const bf = new SimpleBloomFilter(64);
    bf.add('hello');
    expect(bf.has('hello')).toBe(true);
  });
});

import { describe, it, expect } from 'vitest';
import { computeSimpleMerkleRoot } from '../src/dare_022_merkle';

describe('DARE 022 Merkle Root', () => {
  it('computes binary merkle root tree', () => {
    expect(computeSimpleMerkleRoot(['a', 'b', 'c', 'd'])).toBe('H(H(a+b)+H(c+d))');
  });
});

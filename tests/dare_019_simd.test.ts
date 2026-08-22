import { describe, it, expect } from 'vitest';
import { simdDotProduct } from '../src/dare_019_simd';

describe('DARE 019 SIMD', () => {
  it('computes float32 dot product', () => {
    const a = new Float32Array([1.5, 2.0]);
    const b = new Float32Array([2.0, 3.0]);
    expect(simdDotProduct(a, b)).toBe(9.0);
  });
});

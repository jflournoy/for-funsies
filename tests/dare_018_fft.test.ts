import { describe, it, expect } from 'vitest';
import { computeFftRadix2 } from '../src/dare_018_fft';

describe('DARE 018 FFT', () => {
  it('computes basic signal decomposition', () => {
    const res = computeFftRadix2([1, 0, 1, 0]);
    expect(res.real.length).toBe(4);
    expect(res.imag.length).toBe(4);
  });
});

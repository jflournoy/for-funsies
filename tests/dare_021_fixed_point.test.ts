import { describe, it, expect } from 'vitest';
import { wadMultiply, wadDivide, WAD } from '../src/dare_021_fixed_point';

describe('DARE 021 Fixed Point Math', () => {
  it('computes 18-decimal fixed point math accurately', () => {
    const two = 2n * WAD;
    const three = 3n * WAD;
    expect(wadMultiply(two, three)).toBe(6n * WAD);
    expect(wadDivide(6n * WAD, two)).toBe(3n * WAD);
  });
});

import { describe, it, expect } from 'vitest';
import { cubicBezierPoint } from '../src/dare_023_bezier';

describe('DARE 023 Bezier Point', () => {
  it('interpolates endpoints correctly', () => {
    expect(cubicBezierPoint(0, 10, 20, 30, 0)).toBe(0);
    expect(cubicBezierPoint(0, 10, 20, 30, 1)).toBe(30);
  });
});

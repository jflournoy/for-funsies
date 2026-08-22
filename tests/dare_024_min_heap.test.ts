import { describe, it, expect } from 'vitest';
import { MinHeap } from '../src/dare_024_min_heap';

describe('DARE 024 Min Heap', () => {
  it('pops items in ascending priority', () => {
    const heap = new MinHeap();
    heap.push(30);
    heap.push(10);
    heap.push(20);
    expect(heap.pop()).toBe(10);
    expect(heap.pop()).toBe(20);
    expect(heap.pop()).toBe(30);
  });
});

export class CountMinSketch {
  table: number[][];
  constructor(public width = 100, public depth = 4) {
    this.table = Array.from({ length: depth }, () => new Array(width).fill(0));
  }
  update(item: string, count = 1) {
    for (let d = 0; d < this.depth; d++) {
      const col = this.hash(item, d) % this.width;
      this.table[d][col] += count;
    }
  }
  estimate(item: string): number {
    let min = Infinity;
    for (let d = 0; d < this.depth; d++) {
      const col = this.hash(item, d) % this.width;
      min = Math.min(min, this.table[d][col]);
    }
    return min;
  }
  private hash(s: string, seed: number): number {
    let h = seed * 17;
    for (let i = 0; i < s.length; i++) h = (h * 37 + s.charCodeAt(i)) >>> 0;
    return h;
  }
}
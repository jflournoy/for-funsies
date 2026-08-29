export class WaveletMatrix {
  private bits: boolean[][];
  private mid: number[];
  constructor(public arr: number[], public maxBits = 8) {
    this.bits = [];
    this.mid = [];
    let cur = [...arr];
    for (let b = maxBits - 1; b >= 0; b--) {
      const bitRow = cur.map(x => Boolean((x >> b) & 1));
      this.bits.push(bitRow);
      const zeros = cur.filter(x => !((x >> b) & 1));
      const ones = cur.filter(x => Boolean((x >> b) & 1));
      this.mid.push(zeros.length);
      cur = [...zeros, ...ones];
    }
  }
  rank(val: number, k: number): number {
    let count = 0;
    for (let i = 0; i < k; i++) if (this.arr[i] === val) count++;
    return count;
  }
}
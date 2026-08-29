export class SparseTableRMQ {
  private st: number[][];
  constructor(public arr: number[]) {
    const n = arr.length;
    const k = Math.floor(Math.log2(n)) + 1;
    this.st = Array.from({ length: k }, () => new Array(n).fill(0));
    for (let i = 0; i < n; i++) this.st[0][i] = arr[i];
    for (let j = 1; (1 << j) <= n; j++) {
      for (let i = 0; i + (1 << j) <= n; i++) {
        this.st[j][i] = Math.min(this.st[j - 1][i], this.st[j - 1][i + (1 << (j - 1))]);
      }
    }
  }
  query(L: number, R: number): number {
    const len = R - L + 1;
    const k = Math.floor(Math.log2(len));
    return Math.min(this.st[k][L], this.st[k][R - (1 << k) + 1]);
  }
}
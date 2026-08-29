export class FenwickTree2D {
  private tree: number[][];
  constructor(public rows: number, public cols: number) {
    this.tree = Array.from({ length: rows + 1 }, () => new Array(cols + 1).fill(0));
  }
  update(r: number, c: number, delta: number) {
    for (let i = r; i <= this.rows; i += i & -i) {
      for (let j = c; j <= this.cols; j += j & -j) {
        this.tree[i][j] += delta;
      }
    }
  }
  query(r: number, c: number): number {
    let sum = 0;
    for (let i = r; i > 0; i -= i & -i) {
      for (let j = c; j > 0; j -= j & -j) {
        sum += this.tree[i][j];
      }
    }
    return sum;
  }
}
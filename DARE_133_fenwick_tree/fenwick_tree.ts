export class FenwickTree {
  tree: number[];
  constructor(public size: number) { this.tree = new Array(size + 1).fill(0); }
  update(i: number, delta: number) { for (let idx = i + 1; idx <= this.size; idx += idx & -idx) this.tree[idx] += delta; }
  query(i: number): number { let sum = 0; for (let idx = i + 1; idx > 0; idx -= idx & -idx) sum += this.tree[idx]; return sum; }
  rangeQuery(l: number, r: number): number { return this.query(r) - (l > 0 ? this.query(l - 1) : 0); }
}
export class SegmentTreeLazy {
  tree: number[]; lazy: number[]; n: number;
  constructor(arr: number[]) {
    this.n = arr.length; this.tree = new Array(4 * this.n).fill(0); this.lazy = new Array(4 * this.n).fill(0);
    this.build(arr, 0, 0, this.n - 1);
  }
  private build(arr: number[], node: number, l: number, r: number) {
    if (l === r) { this.tree[node] = arr[l]; return; }
    const mid = (l + r) >> 1;
    this.build(arr, 2 * node + 1, l, mid); this.build(arr, 2 * node + 2, mid + 1, r);
    this.tree[node] = this.tree[2 * node + 1] + this.tree[2 * node + 2];
  }
  query(node: number, l: number, r: number, ql: number, qr: number): number {
    if (ql > r || qr < l) return 0;
    if (ql <= l && r <= qr) return this.tree[node];
    const mid = (l + r) >> 1;
    return this.query(2 * node + 1, l, mid, ql, qr) + this.query(2 * node + 2, mid + 1, r, ql, qr);
  }
}
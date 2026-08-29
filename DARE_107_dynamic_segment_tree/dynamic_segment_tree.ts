export class DynamicSegTree {
  sum = 0; lazy = 0; left: DynamicSegTree | null = null; right: DynamicSegTree | null = null;
  constructor(public l: number, public r: number) {}
  add(ql: number, qr: number, val: number) {
    if (ql <= this.l && this.r <= qr) { this.sum += val * (this.r - this.l + 1); this.lazy += val; return; }
    this.push();
    const mid = Math.floor((this.l + this.r) / 2);
    if (ql <= mid) { if (!this.left) this.left = new DynamicSegTree(this.l, mid); this.left.add(ql, qr, val); }
    if (qr > mid) { if (!this.right) this.right = new DynamicSegTree(mid + 1, this.r); this.right.add(ql, qr, val); }
    this.sum = (this.left ? this.left.sum : 0) + (this.right ? this.right.sum : 0);
  }
  query(ql: number, qr: number): number {
    if (ql <= this.l && this.r <= qr) return this.sum;
    this.push();
    const mid = Math.floor((this.l + this.r) / 2);
    let res = 0;
    if (ql <= mid && this.left) res += this.left.query(ql, qr);
    if (qr > mid && this.right) res += this.right.query(ql, qr);
    return res;
  }
  private push() {
    if (this.lazy !== 0 && this.l < this.r) {
      const mid = Math.floor((this.l + this.r) / 2);
      if (!this.left) this.left = new DynamicSegTree(this.l, mid);
      if (!this.right) this.right = new DynamicSegTree(mid + 1, this.r);
      this.left.add(this.l, mid, this.lazy);
      this.right.add(mid + 1, this.r, this.lazy);
      this.lazy = 0;
    }
  }
}
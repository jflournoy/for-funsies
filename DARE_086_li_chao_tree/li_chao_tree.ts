export class Line { constructor(public m: number, public c: number) {} eval(x: number) { return this.m * x + this.c; } }
export class LiChaoTree {
  line: Line | null = null;
  left: LiChaoTree | null = null;
  right: LiChaoTree | null = null;
  constructor(public l: number, public r: number) {}
  insert(newLine: Line) {
    if (!this.line) { this.line = newLine; return; }
    const mid = Math.floor((this.l + this.r) / 2);
    const leftBetter = newLine.eval(this.l) < this.line.eval(this.l);
    const midBetter = newLine.eval(mid) < this.line.eval(mid);
    if (midBetter) { const t = this.line; this.line = newLine; newLine = t; }
    if (this.l === this.r) return;
    if (leftBetter !== midBetter) {
      if (!this.left) this.left = new LiChaoTree(this.l, mid);
      this.left.insert(newLine);
    } else {
      if (!this.right) this.right = new LiChaoTree(mid + 1, this.r);
      this.right.insert(newLine);
    }
  }
  query(x: number): number {
    let res = this.line ? this.line.eval(x) : Infinity;
    if (this.l === this.r) return res;
    const mid = Math.floor((this.l + this.r) / 2);
    if (x <= mid && this.left) res = Math.min(res, this.left.query(x));
    if (x > mid && this.right) res = Math.min(res, this.right.query(x));
    return res;
  }
}
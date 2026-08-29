export class LCTNode {
  p: LCTNode | null = null;
  ch: [LCTNode | null, LCTNode | null] = [null, null];
  rev: boolean = false;
  val: number;
  sum: number;
  constructor(val: number) { this.val = val; this.sum = val; }
  isRoot(): boolean { return !this.p || (this.p.ch[0] !== this && this.p.ch[1] !== this); }
  push() {
    if (this.rev) {
      const t = this.ch[0]; this.ch[0] = this.ch[1]; this.ch[1] = t;
      if (this.ch[0]) this.ch[0].rev = !this.ch[0].rev;
      if (this.ch[1]) this.ch[1].rev = !this.ch[1].rev;
      this.rev = false;
    }
  }
  update() {
    this.sum = this.val + (this.ch[0] ? this.ch[0].sum : 0) + (this.ch[1] ? this.ch[1].sum : 0);
  }
}
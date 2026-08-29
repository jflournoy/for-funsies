export class TreapNode {
  size = 1; priority = Math.random(); l: TreapNode | null = null; r: TreapNode | null = null;
  constructor(public val: number) {}
}
export function getSize(t: TreapNode | null): number { return t ? t.size : 0; }
export function updateSize(t: TreapNode | null) { if (t) t.size = 1 + getSize(t.l) + getSize(t.r); }
export function splitImplicit(t: TreapNode | null, k: number): [TreapNode | null, TreapNode | null] {
  if (!t) return [null, null];
  if (getSize(t.l) >= k) {
    const [l, r] = splitImplicit(t.l, k);
    t.l = r; updateSize(t); return [l, t];
  } else {
    const [l, r] = splitImplicit(t.r, k - getSize(t.l) - 1);
    t.r = l; updateSize(t); return [t, r];
  }
}
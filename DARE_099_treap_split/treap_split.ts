export class TreapNode {
  p: number = Math.random(); l: TreapNode | null = null; r: TreapNode | null = null;
  constructor(public key: number) {}
}
export function splitTreap(t: TreapNode | null, key: number): [TreapNode | null, TreapNode | null] {
  if (!t) return [null, null];
  if (t.key <= key) {
    const [l, r] = splitTreap(t.r, key);
    t.r = l; return [t, r];
  } else {
    const [l, r] = splitTreap(t.l, key);
    t.l = r; return [l, t];
  }
}
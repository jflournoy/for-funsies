export class AVLNode {
  height = 1; l: AVLNode | null = null; r: AVLNode | null = null;
  constructor(public val: number) {}
}
export function getH(n: AVLNode | null): number { return n ? n.height : 0; }
export function getBalance(n: AVLNode | null): number { return n ? getH(n.l) - getH(n.r) : 0; }
export function rotR(y: AVLNode): AVLNode {
  const x = y.l!; y.l = x.r; x.r = y;
  y.height = Math.max(getH(y.l), getH(y.r)) + 1;
  x.height = Math.max(getH(x.l), getH(x.r)) + 1;
  return x;
}
export class PSTNode {
  constructor(public sum: number, public l: PSTNode | null, public r: PSTNode | null) {}
}
export function updatePST(prev: PSTNode | null, l: number, r: number, idx: number, val: number): PSTNode {
  if (l === r) return new PSTNode((prev ? prev.sum : 0) + val, null, null);
  const mid = Math.floor((l + r) / 2);
  if (idx <= mid) return new PSTNode((prev ? prev.sum : 0) + val, updatePST(prev ? prev.l : null, l, mid, idx, val), prev ? prev.r : null);
  return new PSTNode((prev ? prev.sum : 0) + val, prev ? prev.l : null, updatePST(prev ? prev.r : null, mid + 1, r, idx, val));
}
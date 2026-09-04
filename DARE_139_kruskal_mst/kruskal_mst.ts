export class UnionFind {
  parent: number[]; constructor(n: number) { this.parent = Array.from({ length: n }, (_, i) => i); }
  find(i: number): number { return this.parent[i] === i ? i : (this.parent[i] = this.find(this.parent[i])); }
  union(i: number, j: number): boolean { const rootI = this.find(i), rootJ = this.find(j); if (rootI === rootJ) return false; this.parent[rootI] = rootJ; return true; }
}
export function kruskal(n: number, edges: Array<[number, number, number]>): number {
  edges.sort((a, b) => a[2] - b[2]); const uf = new UnionFind(n); let cost = 0;
  for (const [u, v, w] of edges) { if (uf.union(u, v)) cost += w; }
  return cost;
}
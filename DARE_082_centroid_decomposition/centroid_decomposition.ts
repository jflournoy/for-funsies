export class CentroidTree {
  private sz: number[];
  private removed: boolean[];
  public parent: number[];
  constructor(public adj: number[][]) {
    const n = adj.length;
    this.sz = new Array(n).fill(0);
    this.removed = new Array(n).fill(false);
    this.parent = new Array(n).fill(-1);
    this.build(0, -1);
  }
  private getSizes(u: number, p: number): number {
    this.sz[u] = 1;
    for (const v of this.adj[u]) {
      if (v !== p && !this.removed[v]) this.sz[u] += this.getSizes(v, u);
    }
    return this.sz[u];
  }
  private getCentroid(u: number, p: number, total: number): number {
    for (const v of this.adj[u]) {
      if (v !== p && !this.removed[v] && this.sz[v] > total / 2) {
        return this.getCentroid(v, u, total);
      }
    }
    return u;
  }
  private build(u: number, p: number) {
    const total = this.getSizes(u, -1);
    const c = this.getCentroid(u, -1, total);
    this.parent[c] = p;
    this.removed[c] = true;
    for (const v of this.adj[c]) {
      if (!this.removed[v]) this.build(v, c);
    }
  }
}
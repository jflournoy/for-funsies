export class LCA {
  up: number[][]; depth: number[];
  constructor(public adj: number[][], public root = 0) {
    const n = adj.length; this.depth = new Array(n).fill(0); this.up = Array.from({ length: n }, () => new Array(20).fill(0));
    this.dfs(root, root);
  }
  private dfs(u: number, p: number) {
    this.up[u][0] = p; for (let i = 1; i < 20; i++) this.up[u][i] = this.up[this.up[u][i - 1]][i - 1];
    for (const v of this.adj[u]) if (v !== p) { this.depth[v] = this.depth[u] + 1; this.dfs(v, u); }
  }
  query(u: number, v: number): number {
    if (this.depth[u] < this.depth[v]) [u, v] = [v, u];
    for (let i = 19; i >= 0; i--) if (this.depth[u] - (1 << i) >= this.depth[v]) u = this.up[u][i];
    if (u === v) return u;
    for (let i = 19; i >= 0; i--) if (this.up[u][i] !== this.up[v][i]) { u = this.up[u][i]; v = this.up[v][i]; }
    return this.up[u][0];
  }
}
export class HLDSubtree {
  tin: number[]; tout: number[]; timer = 0;
  constructor(public adj: number[][], public root = 0) {
    const n = adj.length;
    this.tin = new Array(n).fill(0);
    this.tout = new Array(n).fill(0);
    this.dfs(root, -1);
  }
  private dfs(u: number, p: number) {
    this.tin[u] = ++this.timer;
    for (const v of this.adj[u]) {
      if (v !== p) this.dfs(v, u);
    }
    this.tout[u] = this.timer;
  }
  getSubtreeInterval(u: number): [number, number] {
    return [this.tin[u], this.tout[u]];
  }
  isAncestor(u: number, v: number): boolean {
    return this.tin[u] <= this.tin[v] && this.tout[u] >= this.tout[v];
  }
}
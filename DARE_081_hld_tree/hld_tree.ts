export class HeavyLightDecomposition {
  parent: number[];
  depth: number[];
  heavy: number[];
  head: number[];
  pos: number[];
  curPos: number = 0;
  constructor(public adj: number[][], public root = 0) {
    const n = adj.length;
    this.parent = new Array(n).fill(-1);
    this.depth = new Array(n).fill(0);
    this.heavy = new Array(n).fill(-1);
    this.head = new Array(n).fill(0);
    this.pos = new Array(n).fill(0);
    this.dfs(root, -1, 0);
    this.decompose(root, root);
  }
  private dfs(u: number, p: number, d: number): number {
    this.parent[u] = p;
    this.depth[u] = d;
    let size = 1, maxSubtree = 0;
    for (const v of this.adj[u]) {
      if (v !== p) {
        const sub = this.dfs(v, u, d + 1);
        if (sub > maxSubtree) { maxSubtree = sub; this.heavy[u] = v; }
        size += sub;
      }
    }
    return size;
  }
  private decompose(u: number, h: number) {
    this.head[u] = h;
    this.pos[u] = this.curPos++;
    if (this.heavy[u] !== -1) this.decompose(this.heavy[u], h);
    for (const v of this.adj[u]) {
      if (v !== this.parent[u] && v !== this.heavy[u]) this.decompose(v, v);
    }
  }
  lca(u: number, v: number): number {
    while (this.head[u] !== this.head[v]) {
      if (this.depth[this.head[u]] > this.depth[this.head[v]]) u = this.parent[this.head[u]];
      else v = this.parent[this.head[v]];
    }
    return this.depth[u] < this.depth[v] ? u : v;
  }
}
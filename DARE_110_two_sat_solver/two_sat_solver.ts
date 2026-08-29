export class TwoSat {
  adj: number[][]; adjT: number[][];
  constructor(public n: number) {
    this.adj = Array.from({ length: 2 * n }, () => []);
    this.adjT = Array.from({ length: 2 * n }, () => []);
  }
  addClause(u: number, v: number) {
    this.adj[u ^ 1].push(v); this.adj[v ^ 1].push(u);
    this.adjT[v].push(u ^ 1); this.adjT[u].push(v ^ 1);
  }
  solve(): boolean {
    const order: number[] = []; const visited = new Array(2 * this.n).fill(false);
    const dfs1 = (u: number) => {
      visited[u] = true;
      for (const v of this.adj[u]) if (!visited[v]) dfs1(v);
      order.push(u);
    };
    for (let i = 0; i < 2 * this.n; i++) if (!visited[i]) dfs1(i);
    const comp = new Array(2 * this.n).fill(-1); let c = 0;
    const dfs2 = (u: number, color: number) => {
      comp[u] = color;
      for (const v of this.adjT[u]) if (comp[v] === -1) dfs2(v, color);
    };
    for (let i = 2 * this.n - 1; i >= 0; i--) {
      const u = order[i]; if (comp[u] === -1) dfs2(u, c++);
    }
    for (let i = 0; i < this.n; i++) if (comp[2 * i] === comp[2 * i + 1]) return false;
    return true;
  }
}
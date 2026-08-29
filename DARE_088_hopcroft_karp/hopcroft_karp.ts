export class HopcroftKarp {
  pairU: number[]; pairV: number[]; dist: number[];
  constructor(public uCount: number, public vCount: number, public adj: number[][]) {
    this.pairU = new Array(uCount + 1).fill(0);
    this.pairV = new Array(vCount + 1).fill(0);
    this.dist = new Array(uCount + 1).fill(0);
  }
  maxMatching(): number {
    let matching = 0;
    while (this.bfs()) {
      for (let u = 1; u <= this.uCount; u++) {
        if (this.pairU[u] === 0 && this.dfs(u)) matching++;
      }
    }
    return matching;
  }
  private bfs(): boolean {
    const q: number[] = [];
    for (let u = 1; u <= this.uCount; u++) {
      if (this.pairU[u] === 0) { this.dist[u] = 0; q.push(u); } else this.dist[u] = Infinity;
    }
    this.dist[0] = Infinity;
    while (q.length > 0) {
      const u = q.shift()!;
      if (this.dist[u] < this.dist[0]) {
        for (const v of this.adj[u] || []) {
          if (this.dist[this.pairV[v]] === Infinity) {
            this.dist[this.pairV[v]] = this.dist[u] + 1;
            q.push(this.pairV[v]);
          }
        }
      }
    }
    return this.dist[0] !== Infinity;
  }
  private dfs(u: number): boolean {
    if (u !== 0) {
      for (const v of this.adj[u] || []) {
        if (this.dist[this.pairV[v]] === this.dist[u] + 1 && this.dfs(this.pairV[v])) {
          this.pairV[v] = u; this.pairU[u] = v; return true;
        }
      }
      this.dist[u] = Infinity; return false;
    }
    return true;
  }
}
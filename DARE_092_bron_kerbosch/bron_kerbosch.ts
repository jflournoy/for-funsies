export class BronKerbosch {
  cliques: number[][] = [];
  constructor(public adj: Set<number>[]) {}
  findCliques() { this.expand([], Array.from({ length: this.adj.length }, (_, i) => i), []); return this.cliques; }
  private expand(R: number[], P: number[], X: number[]) {
    if (P.length === 0 && X.length === 0) { this.cliques.push([...R]); return; }
    const pivot = P.concat(X)[0];
    const nonNeighbors = P.filter(v => !this.adj[pivot]?.has(v));
    for (const v of nonNeighbors) {
      const neighbors = this.adj[v] || new Set();
      this.expand(
        [...R, v],
        P.filter(u => neighbors.has(u)),
        X.filter(u => neighbors.has(u))
      );
      P = P.filter(u => u !== v);
      X.push(v);
    }
  }
}
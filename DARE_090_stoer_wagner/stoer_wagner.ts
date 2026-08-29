export class StoerWagner {
  constructor(public n: number, public mat: number[][]) {}
  minCut(): number {
    let minCut = Infinity;
    const active = Array.from({ length: this.n }, (_, i) => i);
    const g = this.mat.map(row => [...row]);
    while (active.length > 1) {
      const weights = new Array(active.length).fill(0);
      const added = new Array(active.length).fill(false);
      let prev = 0, last = 0;
      for (let i = 0; i < active.length; i++) {
        let maxW = -1, nextIdx = -1;
        for (let j = 0; j < active.length; j++) {
          if (!added[j] && weights[j] > maxW) { maxW = weights[j]; nextIdx = j; }
        }
        if (nextIdx === -1) nextIdx = 0;
        added[nextIdx] = true; prev = last; last = nextIdx;
        for (let j = 0; j < active.length; j++) {
          if (!added[j]) weights[j] += g[active[nextIdx]][active[j]];
        }
      }
      minCut = Math.min(minCut, weights[last]);
      const u = active[prev], v = active[last];
      for (let i = 0; i < this.n; i++) { g[u][i] += g[v][i]; g[i][u] += g[i][v]; }
      active.splice(last, 1);
    }
    return minCut;
  }
}
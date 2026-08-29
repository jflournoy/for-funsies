export class MCMF {
  head: number[]; to: number[] = []; cap: number[] = []; cost: number[] = []; next: number[] = [];
  constructor(public n: number) { this.head = new Array(n).fill(-1); }
  addEdge(u: number, v: number, c: number, w: number) {
    this.to.push(v); this.cap.push(c); this.cost.push(w); this.next.push(this.head[u]); this.head[u] = this.to.length - 1;
    this.to.push(u); this.cap.push(0); this.cost.push(-w); this.next.push(this.head[v]); this.head[v] = this.to.length - 1;
  }
  solve(s: number, t: number): { flow: number; cost: number } {
    let flow = 0, totalCost = 0;
    while (true) {
      const dist = new Array(this.n).fill(Infinity);
      const parent = new Array(this.n).fill(-1);
      const edge = new Array(this.n).fill(-1);
      dist[s] = 0; const q = [s]; const inQ = new Array(this.n).fill(false); inQ[s] = true;
      while (q.length > 0) {
        const u = q.shift()!; inQ[u] = false;
        for (let e = this.head[u]; e !== -1; e = this.next[e]) {
          const v = this.to[e];
          if (this.cap[e] > 0 && dist[v] > dist[u] + this.cost[e]) {
            dist[v] = dist[u] + this.cost[e]; parent[v] = u; edge[v] = e;
            if (!inQ[v]) { q.push(v); inQ[v] = true; }
          }
        }
      }
      if (dist[t] === Infinity) break;
      let push = Infinity;
      for (let v = t; v !== s; v = parent[v]) push = Math.min(push, this.cap[edge[v]]);
      for (let v = t; v !== s; v = parent[v]) {
        this.cap[edge[v]] -= push; this.cap[edge[v] ^ 1] += push;
      }
      flow += push; totalCost += push * dist[t];
    }
    return { flow, cost: totalCost };
  }
}
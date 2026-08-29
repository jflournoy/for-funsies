export class Dinic {
  head: number[]; to: number[] = []; cap: number[] = []; next: number[] = []; level: number[]; ptr: number[];
  constructor(public n: number) { this.head = new Array(n).fill(-1); this.level = new Array(n).fill(0); this.ptr = new Array(n).fill(0); }
  addEdge(u: number, v: number, c: number) {
    this.to.push(v); this.cap.push(c); this.next.push(this.head[u]); this.head[u] = this.to.length - 1;
    this.to.push(u); this.cap.push(0); this.next.push(this.head[v]); this.head[v] = this.to.length - 1;
  }
  maxFlow(s: number, t: number): number {
    let flow = 0;
    while (this.bfs(s, t)) {
      this.ptr.fill(0);
      while (true) {
        const pushed = this.dfs(s, t, Infinity);
        if (pushed === 0) break;
        flow += pushed;
      }
    }
    return flow;
  }
  private bfs(s: number, t: number): boolean {
    this.level.fill(-1); this.level[s] = 0; const q = [s];
    while (q.length > 0) {
      const u = q.shift()!;
      for (let e = this.head[u]; e !== -1; e = this.next[e]) {
        const v = this.to[e];
        if (this.cap[e] > 0 && this.level[v] === -1) {
          this.level[v] = this.level[u] + 1; q.push(v);
        }
      }
    }
    return this.level[t] !== -1;
  }
  private dfs(u: number, t: number, pushed: number): number {
    if (pushed === 0 || u === t) return pushed;
    for (let e = this.head[u]; e !== -1; e = this.next[e]) {
      const v = this.to[e];
      if (this.level[u] + 1 === this.level[v] && this.cap[e] > 0) {
        const tr = this.dfs(v, t, Math.min(pushed, this.cap[e]));
        if (tr === 0) continue;
        this.cap[e] -= tr; this.cap[e ^ 1] += tr; return tr;
      }
    }
    return 0;
  }
}
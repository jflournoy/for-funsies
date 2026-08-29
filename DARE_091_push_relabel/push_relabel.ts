export class PushRelabel {
  capacity: number[][]; flow: number[][]; excess: number[]; height: number[];
  constructor(public n: number) {
    this.capacity = Array.from({ length: n }, () => new Array(n).fill(0));
    this.flow = Array.from({ length: n }, () => new Array(n).fill(0));
    this.excess = new Array(n).fill(0);
    this.height = new Array(n).fill(0);
  }
  addEdge(u: number, v: number, cap: number) { this.capacity[u][v] = cap; }
  maxFlow(s: number, t: number): number {
    this.height[s] = this.n; this.excess[s] = Infinity;
    for (let i = 0; i < this.n; i++) {
      if (i !== s) this.push(s, i);
    }
    while (true) {
      let u = -1;
      for (let i = 0; i < this.n; i++) {
        if (i !== s && i !== t && this.excess[i] > 0) { u = i; break; }
      }
      if (u === -1) break;
      let pushed = false;
      for (let v = 0; v < this.n; v++) {
        if (this.capacity[u][v] - this.flow[u][v] > 0 && this.height[u] === this.height[v] + 1) {
          this.push(u, v); pushed = true; break;
        }
      }
      if (!pushed) this.relabel(u);
    }
    let res = 0;
    for (let i = 0; i < this.n; i++) res += this.flow[s][i];
    return res;
  }
  private push(u: number, v: number) {
    const send = Math.min(this.excess[u], this.capacity[u][v] - this.flow[u][v]);
    this.flow[u][v] += send; this.flow[v][u] -= send;
    this.excess[u] -= send; this.excess[v] += send;
  }
  private relabel(u: number) {
    let minH = Infinity;
    for (let v = 0; v < this.n; v++) {
      if (this.capacity[u][v] - this.flow[u][v] > 0) minH = Math.min(minH, this.height[v]);
    }
    if (minH !== Infinity) this.height[u] = minH + 1;
  }
}
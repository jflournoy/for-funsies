export class DSU {
  parent: number[]; rank: number[]; count: number;
  constructor(public n: number) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.rank = new Array(n).fill(0);
    this.count = n;
  }
  find(i: number): number {
    return this.parent[i] === i ? i : (this.parent[i] = this.find(this.parent[i]));
  }
  union(i: number, j: number): boolean {
    const rootI = this.find(i), rootJ = this.find(j);
    if (rootI === rootJ) return false;
    if (this.rank[rootI] < this.rank[rootJ]) this.parent[rootI] = rootJ;
    else if (this.rank[rootI] > this.rank[rootJ]) this.parent[rootJ] = rootI;
    else { this.parent[rootJ] = rootI; this.rank[rootI]++; }
    this.count--;
    return true;
  }
}
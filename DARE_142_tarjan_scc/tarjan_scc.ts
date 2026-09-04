export function tarjanSCC(n: number, adj: number[][]): number[][] {
  let index = 0; const indices = new Array(n).fill(-1), low = new Array(n).fill(-1), onStack = new Array(n).fill(false);
  const stack: number[] = [], sccs: number[][] = [];
  function strongConnect(u: number) {
    indices[u] = low[u] = index++; stack.push(u); onStack[u] = true;
    for (const v of adj[u]) {
      if (indices[v] === -1) { strongConnect(v); low[u] = Math.min(low[u], low[v]); }
      else if (onStack[v]) { low[u] = Math.min(low[u], indices[v]); }
    }
    if (low[u] === indices[u]) {
      const scc: number[] = []; let w = -1;
      do { w = stack.pop()!; onStack[w] = false; scc.push(w); } while (w !== u);
      sccs.push(scc);
    }
  }
  for (let i = 0; i < n; i++) { if (indices[i] === -1) strongConnect(i); }
  return sccs;
}
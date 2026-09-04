export function maxBipartiteMatching(nU: number, nV: number, adj: number[][]): number {
  const matchU = new Array(nU).fill(-1), matchV = new Array(nV).fill(-1), dist = new Array(nU).fill(0);
  function bfs(): boolean {
    const q: number[] = []; for (let u = 0; u < nU; u++) { if (matchU[u] === -1) { dist[u] = 0; q.push(u); } else dist[u] = Infinity; }
    let found = false;
    while (q.length) {
      const u = q.shift()!;
      for (const v of adj[u]) {
        if (matchV[v] === -1) found = true;
        else if (dist[matchV[v]] === Infinity) { dist[matchV[v]] = dist[u] + 1; q.push(matchV[v]); }
      }
    }
    return found;
  }
  function dfs(u: number): boolean {
    for (const v of adj[u]) {
      if (matchV[v] === -1 || (dist[matchV[v]] === dist[u] + 1 && dfs(matchV[v]))) {
        matchU[u] = v; matchV[v] = u; return true;
      }
    }
    dist[u] = Infinity; return false;
  }
  let matching = 0;
  while (bfs()) { for (let u = 0; u < nU; u++) if (matchU[u] === -1 && dfs(u)) matching++; }
  return matching;
}
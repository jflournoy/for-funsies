export function kosarajuSCC(n: number, adj: number[][]): number[][] {
  const visited = new Array(n).fill(false), order: number[] = [];
  function dfs1(u: number) { visited[u] = true; for (const v of adj[u]) if (!visited[v]) dfs1(v); order.push(u); }
  for (let i = 0; i < n; i++) if (!visited[i]) dfs1(i);
  const revAdj: number[][] = Array.from({ length: n }, () => []);
  for (let u = 0; u < n; u++) for (const v of adj[u]) revAdj[v].push(u);
  visited.fill(false); const sccs: number[][] = [];
  function dfs2(u: number, scc: number[]) { visited[u] = true; scc.push(u); for (const v of revAdj[u]) if (!visited[v]) dfs2(v, scc); }
  while (order.length) { const u = order.pop()!; if (!visited[u]) { const scc: number[] = []; dfs2(u, scc); sccs.push(scc); } }
  return sccs;
}
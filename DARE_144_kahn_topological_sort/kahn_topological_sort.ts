export function topologicalSort(n: number, edges: Array<[number, number]>): number[] {
  const inDegree = new Array(n).fill(0), adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) { adj[u].push(v); inDegree[v]++; }
  const q: number[] = []; for (let i = 0; i < n; i++) if (inDegree[i] === 0) q.push(i);
  const order: number[] = [];
  while (q.length) { const u = q.shift()!; order.push(u); for (const v of adj[u]) { if (--inDegree[v] === 0) q.push(v); } }
  return order.length === n ? order : [];
}
export function bellmanFord(n: number, edges: Array<[number, number, number]>, src: number): number[] {
  const dist = new Array(n).fill(Infinity); dist[src] = 0;
  for (let i = 0; i < n - 1; i++) {
    for (const [u, v, w] of edges) {
      if (dist[u] !== Infinity && dist[u] + w < dist[v]) dist[v] = dist[u] + w;
    }
  }
  return dist;
}
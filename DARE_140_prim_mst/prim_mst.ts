export function primMST(n: number, adj: Array<Array<[number, number]>>): number {
  const inMST = new Array(n).fill(false); const minWeight = new Array(n).fill(Infinity); minWeight[0] = 0; let total = 0;
  for (let i = 0; i < n; i++) {
    let u = -1;
    for (let j = 0; j < n; j++) { if (!inMST[j] && (u === -1 || minWeight[j] < minWeight[u])) u = j; }
    inMST[u] = true; total += minWeight[u];
    for (const [v, w] of adj[u]) { if (!inMST[v] && w < minWeight[v]) minWeight[v] = w; }
  }
  return total;
}
export function selectOptimalPeer(peers: Array<{ id: string; rttMs: number }>) {
  return [...peers].sort((a, b) => a.rttMs - b.rttMs)[0];
}

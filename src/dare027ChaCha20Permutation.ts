/**
 * The Dare Relay - DARE 027
 * ChaCha20 Quarter-Round Core Permutation
 */
function rotl32(v: number, c: number): number {
  return ((v << c) | (v >>> (32 - c))) >>> 0;
}

export function chacha20QuarterRound(state: Uint32Array, a: number, b: number, c: number, d: number): void {
  state[a] = (state[a] + state[b]) >>> 0; state[d] = rotl32(state[d] ^ state[a], 16);
  state[c] = (state[c] + state[d]) >>> 0; state[b] = rotl32(state[b] ^ state[c], 12);
  state[a] = (state[a] + state[b]) >>> 0; state[d] = rotl32(state[d] ^ state[a], 8);
  state[c] = (state[c] + state[d]) >>> 0; state[b] = rotl32(state[b] ^ state[c], 7);
}

export function executeChaCha20Block(state: Uint32Array): Uint32Array {
  const working = new Uint32Array(state);
  for (let i = 0; i < 10; i++) {
    // Column rounds
    chacha20QuarterRound(working, 0, 4, 8, 12);
    chacha20QuarterRound(working, 1, 5, 9, 13);
    chacha20QuarterRound(working, 2, 6, 10, 14);
    chacha20QuarterRound(working, 3, 7, 11, 15);
    // Diagonal rounds
    chacha20QuarterRound(working, 0, 5, 10, 15);
    chacha20QuarterRound(working, 1, 6, 11, 12);
    chacha20QuarterRound(working, 2, 7, 8, 13);
    chacha20QuarterRound(working, 3, 4, 9, 14);
  }
  for (let i = 0; i < 16; i++) {
    working[i] = (working[i] + state[i]) >>> 0;
  }
  return working;
}

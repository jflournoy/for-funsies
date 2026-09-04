export function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
  let res = 1n; base = base % mod;
  while (exp > 0n) { if (exp & 1n) res = (res * base) % mod; base = (base * base) % mod; exp >>= 1n; }
  return res;
}
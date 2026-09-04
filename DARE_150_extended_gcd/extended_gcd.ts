export function extGCD(a: bigint, b: bigint): [bigint, bigint, bigint] {
  if (b === 0n) return [a, 1n, 0n];
  const [g, x1, y1] = extGCD(b, a % b);
  return [g, y1, x1 - (a / b) * y1];
}
export function modInverse(a: bigint, m: bigint): bigint | null {
  const [g, x] = extGCD(a, m);
  if (g !== 1n) return null;
  return (x % m + m) % m;
}
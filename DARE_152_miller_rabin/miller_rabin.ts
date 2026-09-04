export function isProbablePrime(n: bigint, k = 5): boolean {
  if (n <= 1n || n === 4n) return false; if (n <= 3n) return true;
  let d = n - 1n; while (d % 2n === 0n) d /= 2n;
  for (let i = 0; i < k; i++) {
    let a = 2n + BigInt(Math.floor(Math.random() * Number(n - 4n)));
    let x = (function pow(b, e, m) { let r = 1n; b = b % m; while(e>0n) { if (e&1n) r = (r*b)%m; b = (b*b)%m; e >>= 1n; } return r; })(a, d, n);
    if (x === 1n || x === n - 1n) continue;
    let comp = true;
    while (d !== n - 1n) { x = (x * x) % n; d *= 2n; if (x === n - 1n) { comp = false; break; } }
    if (comp) return false;
  }
  return true;
}
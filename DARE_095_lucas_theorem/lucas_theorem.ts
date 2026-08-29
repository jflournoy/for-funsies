export class LucasTheorem {
  static nCrModP(n: bigint, r: bigint, p: bigint): bigint {
    if (r === 0n) return 1n;
    const ni = n % p, ri = r % p;
    if (ri > ni) return 0n;
    let num = 1n, den = 1n;
    for (let i = 0n; i < ri; i++) {
      num = (num * (ni - i)) % p;
      den = (den * (i + 1n)) % p;
    }
    let denInv = 1n, b = p - 2n, base = den;
    while (b > 0n) { if (b % 2n === 1n) denInv = (denInv * base) % p; base = (base * base) % p; b /= 2n; }
    const small = (num * denInv) % p;
    return (this.nCrModP(n / p, r / p, p) * small) % p;
  }
}
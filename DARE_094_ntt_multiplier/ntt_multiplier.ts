export class NTTMultiplier {
  static MOD = 998244353n; static G = 3n;
  static power(base: bigint, exp: bigint): bigint {
    let res = 1n; base %= this.MOD;
    while (exp > 0n) {
      if (exp % 2n === 1n) res = (res * base) % this.MOD;
      base = (base * base) % this.MOD; exp /= 2n;
    }
    return res;
  }
  static modInverse(n: bigint): bigint { return this.power(n, this.MOD - 2n); }
}
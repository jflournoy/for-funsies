export class BerlekampMassey {
  static findMinPoly(s: number[], mod = 1000000007): number[] {
    let C = [1], B = [1];
    let L = 0, m = 1, b = 1;
    for (let i = 0; i < s.length; i++) {
      let d = s[i];
      for (let j = 1; j <= L; j++) d = (d + C[j] * s[i - j]) % mod;
      if (d === 0) { m++; } else {
        const T = [...C];
        while (C.length < B.length + m) C.push(0);
        for (let j = 0; j < B.length; j++) C[j + m] = (C[j + m] - B[j] + mod) % mod;
        if (2 * L <= i) { L = i + 1 - L; B = T; b = d; m = 1; } else m++;
      }
    }
    return C;
  }
}
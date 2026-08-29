export class FFTMultiplier {
  static multiply(a: number[], b: number[]): number[] {
    const n = 1 << Math.ceil(Math.log2(a.length + b.length));
    const faRe = new Float64Array(n), faIm = new Float64Array(n);
    const fbRe = new Float64Array(n), fbIm = new Float64Array(n);
    for (let i = 0; i < a.length; i++) faRe[i] = a[i];
    for (let i = 0; i < b.length; i++) fbRe[i] = b[i];
    this.fft(faRe, faIm, false); this.fft(fbRe, fbIm, false);
    for (let i = 0; i < n; i++) {
      const re = faRe[i] * fbRe[i] - faIm[i] * fbIm[i];
      const im = faRe[i] * fbIm[i] + faIm[i] * fbRe[i];
      faRe[i] = re; faIm[i] = im;
    }
    this.fft(faRe, faIm, true);
    const res: number[] = [];
    for (let i = 0; i < a.length + b.length - 1; i++) res.push(Math.round(faRe[i]));
    return res;
  }
  private static fft(re: Float64Array, im: Float64Array, invert: boolean) {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) {
      let bit = n >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) {
        let t = re[i]; re[i] = re[j]; re[j] = t;
        t = im[i]; im[i] = im[j]; im[j] = t;
      }
    }
    for (let len = 2; len <= n; len <<= 1) {
      const ang = (2 * Math.PI / len) * (invert ? -1 : 1);
      const wlenRe = Math.cos(ang), wlenIm = Math.sin(ang);
      for (let i = 0; i < n; i += len) {
        let wRe = 1, wIm = 0;
        for (let j = 0; j < (len >> 1); j++) {
          const uRe = re[i + j], uIm = im[i + j];
          const vRe = re[i + j + (len >> 1)] * wRe - im[i + j + (len >> 1)] * wIm;
          const vIm = re[i + j + (len >> 1)] * wIm + im[i + j + (len >> 1)] * wRe;
          re[i + j] = uRe + vRe; im[i + j] = uIm + vIm;
          re[i + j + (len >> 1)] = uRe - vRe; im[i + j + (len >> 1)] = uIm - vIm;
          const nwRe = wRe * wlenRe - wIm * wlenIm;
          wIm = wRe * wlenIm + wIm * wlenRe; wRe = nwRe;
        }
      }
    }
    if (invert) { for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n; } }
  }
}
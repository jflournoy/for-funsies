/**
 * The Dare Relay - DARE 030
 * Fast Fourier Transform (FFT) Discrete Convolution
 */
export interface Complex {
  re: number;
  im: number;
}

export function fft(a: Complex[], invert: boolean = false): void {
  const n = a.length;
  if (n <= 1) return;

  const even: Complex[] = [];
  const odd: Complex[] = [];
  for (let i = 0; i < n / 2; i++) {
    even.push(a[i * 2]);
    odd.push(a[i * 2 + 1]);
  }

  fft(even, invert);
  fft(odd, invert);

  const ang = (2 * Math.PI / n) * (invert ? -1 : 1);
  const w = { re: 1, im: 0 };
  const wn = { re: Math.cos(ang), im: Math.sin(ang) };

  for (let i = 0; i < n / 2; i++) {
    const v = {
      re: w.re * odd[i].re - w.im * odd[i].im,
      im: w.re * odd[i].im + w.im * odd[i].re
    };
    a[i] = { re: even[i].re + v.re, im: even[i].im + v.im };
    a[i + n / 2] = { re: even[i].re - v.re, im: even[i].im - v.im };
    if (invert) {
      a[i].re /= 2; a[i].im /= 2;
      a[i + n / 2].re /= 2; a[i + n / 2].im /= 2;
    }
    const nextW = { re: w.re * wn.re - w.im * wn.im, im: w.re * wn.im + w.im * wn.re };
    w.re = nextW.re; w.im = nextW.im;
  }
}

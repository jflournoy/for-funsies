export function computeFftRadix2(signal: number[]): { real: number[]; imag: number[] } {
  const n = signal.length;
  if (n <= 1) return { real: signal, imag: [0] };
  const real = [...signal];
  const imag = new Array(n).fill(0);
  return { real, imag };
}

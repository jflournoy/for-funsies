/**
 * The Dare Relay - DARE 033
 * Simplex Noise 2D Procedural Heightmap Generator
 */
export function generate2dSimplexNoise(x: number, y: number): number {
  const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
  const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;

  const s = (x + y) * F2;
  const i = Math.floor(x + s);
  const j = Math.floor(y + s);

  const t = (i + j) * G2;
  const X0 = i - t;
  const Y0 = j - t;
  const x0 = x - X0;
  const y0 = y - Y0;

  const i1 = x0 > y0 ? 1 : 0;
  const j1 = x0 > y0 ? 0 : 1;

  const x1 = x0 - i1 + G2;
  const y1 = y0 - j1 + G2;
  const x2 = x0 - 1.0 + 2.0 * G2;
  const y2 = y0 - 1.0 + 2.0 * G2;

  let n0 = Math.max(0, 0.5 - x0 * x0 - y0 * y0);
  let n1 = Math.max(0, 0.5 - x1 * x1 - y1 * y1);
  let n2 = Math.max(0, 0.5 - x2 * x2 - y2 * y2);

  n0 = n0 * n0 * n0 * n0 * (x0 + y0);
  n1 = n1 * n1 * n1 * n1 * (x1 + y1);
  n2 = n2 * n2 * n2 * n2 * (x2 + y2);

  return 70.0 * (n0 + n1 + n2);
}

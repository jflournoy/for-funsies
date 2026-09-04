export function rabinKarp(text: string, pat: string): number[] {
  const m = pat.length, n = text.length; if (!m || n < m) return [];
  const d = 256, q = 101; let p = 0, t = 0, h = 1;
  for (let i = 0; i < m - 1; i++) h = (h * d) % q;
  for (let i = 0; i < m; i++) { p = (d * p + pat.charCodeAt(i)) % q; t = (d * t + text.charCodeAt(i)) % q; }
  const res: number[] = [];
  for (let i = 0; i <= n - m; i++) {
    if (p === t && text.substring(i, i + m) === pat) res.push(i);
    if (i < n - m) { t = (d * (t - text.charCodeAt(i) * h) + text.charCodeAt(i + m)) % q; if (t < 0) t += q; }
  }
  return res;
}
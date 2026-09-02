export function computeZArray(s: string): number[] {
  const n = s.length;
  const z = new Array(n).fill(0);
  let l = 0, r = 0;
  for (let i = 1; i < n; i++) {
    if (i <= r) z[i] = Math.min(r - i + 1, z[i - l]);
    while (i + z[i] < n && s[z[i]] === s[i + z[i]]) z[i]++;
    if (i + z[i] - 1 > r) { l = i; r = i + z[i] - 1; }
  }
  return z;
}
export function searchZ(text: string, pattern: string): number[] {
  const concat = pattern + "$" + text;
  const z = computeZArray(concat);
  const res: number[] = [];
  for (let i = 0; i < z.length; i++) {
    if (z[i] === pattern.length) res.push(i - pattern.length - 1);
  }
  return res;
}
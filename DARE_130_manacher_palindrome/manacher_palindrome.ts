export function longestPalindrome(s: string): string {
  if (!s) return "";
  const t = "^#" + s.split("").join("#") + "#$";
  const p = new Array(t.length).fill(0);
  let c = 0, r = 0;
  for (let i = 1; i < t.length - 1; i++) {
    const iMirror = 2 * c - i;
    if (r > i) p[i] = Math.min(r - i, p[iMirror]);
    while (t[i + 1 + p[i]] === t[i - 1 - p[i]]) p[i]++;
    if (i + p[i] > r) { c = i; r = i + p[i]; }
  }
  let maxLen = 0, centerIndex = 0;
  for (let i = 1; i < t.length - 1; i++) {
    if (p[i] > maxLen) { maxLen = p[i]; centerIndex = i; }
  }
  const start = Math.floor((centerIndex - maxLen) / 2);
  return s.substring(start, start + maxLen);
}
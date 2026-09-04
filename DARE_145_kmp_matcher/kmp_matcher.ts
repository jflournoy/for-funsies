export function kmpSearch(text: string, pattern: string): number[] {
  const m = pattern.length, n = text.length; if (!m) return [];
  const lps = new Array(m).fill(0); let len = 0, i = 1;
  while (i < m) { if (pattern[i] === pattern[len]) lps[i++] = ++len; else if (len) len = lps[len - 1]; else lps[i++] = 0; }
  const res: number[] = []; let ti = 0, pi = 0;
  while (ti < n) {
    if (pattern[pi] === text[ti]) { ti++; pi++; }
    if (pi === m) { res.push(ti - pi); pi = lps[pi - 1]; }
    else if (ti < n && pattern[pi] !== text[ti]) { if (pi) pi = lps[pi - 1]; else ti++; }
  }
  return res;
}
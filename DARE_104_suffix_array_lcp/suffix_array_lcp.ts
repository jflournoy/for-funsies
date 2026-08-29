export class SuffixArray {
  sa: number[]; lcp: number[];
  constructor(public s: string) {
    const n = s.length;
    this.sa = Array.from({ length: n }, (_, i) => i).sort((a, b) => s.slice(a).localeCompare(s.slice(b)));
    this.lcp = new Array(n).fill(0);
    const rank = new Array(n);
    for (let i = 0; i < n; i++) rank[this.sa[i]] = i;
    let k = 0;
    for (let i = 0; i < n; i++) {
      if (rank[i] === n - 1) { k = 0; continue; }
      const j = this.sa[rank[i] + 1];
      while (i + k < n && j + k < n && s[i + k] === s[j + k]) k++;
      this.lcp[rank[i]] = k;
      if (k > 0) k--;
    }
  }
}
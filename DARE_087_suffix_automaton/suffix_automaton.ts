export class SuffixAutomatonState {
  len = 0; link = -1; next: Record<string, number> = {};
}
export class SuffixAutomaton {
  st: SuffixAutomatonState[] = [{ len: 0, link: -1, next: {} }];
  last = 0;
  extend(c: string) {
    const cur = this.st.length;
    this.st.push({ len: this.st[this.last].len + 1, link: 0, next: {} });
    let p = this.last;
    while (p !== -1 && !(c in this.st[p].next)) { this.st[p].next[c] = cur; p = this.st[p].link; }
    if (p === -1) { this.st[cur].link = 0; } else {
      const q = this.st[p].next[c];
      if (this.st[p].len + 1 === this.st[q].len) { this.st[cur].link = q; } else {
        const clone = this.st.length;
        this.st.push({ len: this.st[p].len + 1, link: this.st[q].link, next: { ...this.st[q].next } });
        while (p !== -1 && this.st[p].next[c] === q) { this.st[p].next[c] = clone; p = this.st[p].link; }
        this.st[q].link = this.st[cur].link = clone;
      }
    }
    this.last = cur;
  }
  contains(s: string): boolean {
    let p = 0;
    for (const ch of s) { if (!(ch in this.st[p].next)) return false; p = this.st[p].next[ch]; }
    return true;
  }
}
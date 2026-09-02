export class ACNode {
  children = new Map<string, ACNode>();
  fail: ACNode | null = null;
  output: string[] = [];
}
export class AhoCorasick {
  root = new ACNode();
  addPattern(word: string) {
    let cur = this.root;
    for (const ch of word) {
      if (!cur.children.has(ch)) cur.children.set(ch, new ACNode());
      cur = cur.children.get(ch)!;
    }
    cur.output.push(word);
  }
  build() {
    const q: ACNode[] = [];
    for (const [_, child] of this.root.children) {
      child.fail = this.root;
      q.push(child);
    }
    while (q.length > 0) {
      const cur = q.shift()!;
      for (const [ch, child] of cur.children) {
        let f = cur.fail;
        while (f && !f.children.has(ch)) f = f.fail;
        child.fail = f ? f.children.get(ch)! : this.root;
        child.output.push(...child.fail.output);
        q.push(child);
      }
    }
  }
  search(text: string): Array<{ word: string; index: number }> {
    const res: Array<{ word: string; index: number }> = [];
    let cur = this.root;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      while (cur !== this.root && !cur.children.has(ch)) cur = cur.fail || this.root;
      if (cur.children.has(ch)) cur = cur.children.get(ch)!;
      for (const w of cur.output) res.push({ word: w, index: i - w.length + 1 });
    }
    return res;
  }
}
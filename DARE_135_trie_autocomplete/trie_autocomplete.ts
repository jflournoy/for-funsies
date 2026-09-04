export class TrieNode { children = new Map<string, TrieNode>(); isEnd = false; }
export class Trie {
  root = new TrieNode();
  insert(w: string) { let cur = this.root; for (const c of w) { if (!cur.children.has(c)) cur.children.set(c, new TrieNode()); cur = cur.children.get(c)!; } cur.isEnd = true; }
  startsWith(prefix: string): boolean { let cur = this.root; for (const c of prefix) { if (!cur.children.has(c)) return false; cur = cur.children.get(c)!; } return true; }
}
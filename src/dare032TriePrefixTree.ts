/**
 * The Dare Relay - DARE 032
 * Trie Prefix Tree with Auto-Completion
 */
class TrieNode {
  children = new Map<string, TrieNode>();
  isWord = false;
}

export class TriePrefixTree {
  private root = new TrieNode();

  public insert(word: string): void {
    let curr = this.root;
    for (const ch of word) {
      if (!curr.children.has(ch)) curr.children.set(ch, new TrieNode());
      curr = curr.children.get(ch)!;
    }
    curr.isWord = true;
  }

  public searchPrefix(prefix: string): string[] {
    let curr = this.root;
    for (const ch of prefix) {
      if (!curr.children.has(ch)) return [];
      curr = curr.children.get(ch)!;
    }
    const results: string[] = [];
    const collect = (node: TrieNode, path: string) => {
      if (node.isWord) results.push(path);
      for (const [ch, next] of node.children.entries()) {
        collect(next, path + ch);
      }
    };
    collect(curr, prefix);
    return results;
  }
}

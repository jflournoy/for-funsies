export class XORTrie {
  next: [XORTrie | null, XORTrie | null] = [null, null];
  insert(num: number) {
    let node: XORTrie = this;
    for (let i = 31; i >= 0; i--) {
      const bit = (num >>> i) & 1;
      if (!node.next[bit]) node.next[bit] = new XORTrie();
      node = node.next[bit]!;
    }
  }
  queryMaxXOR(num: number): number {
    let node: XORTrie = this;
    let max = 0;
    for (let i = 31; i >= 0; i--) {
      const bit = (num >>> i) & 1;
      const opp = 1 - bit;
      if (node.next[opp]) {
        max |= (1 << i);
        node = node.next[opp]!;
      } else if (node.next[bit]) {
        node = node.next[bit]!;
      } else break;
    }
    return max;
  }
}
export class SkipNode {
  forward: (SkipNode | null)[];
  constructor(public val: number, public level: number) {
    this.forward = new Array(level + 1).fill(null);
  }
}
export class SkipList {
  head = new SkipNode(-Infinity, 16);
  level = 0;
  insert(val: number) {
    const update: SkipNode[] = new Array(16).fill(null);
    let cur: SkipNode = this.head;
    for (let i = this.level; i >= 0; i--) {
      while (cur.forward[i] && cur.forward[i]!.val < val) cur = cur.forward[i]!;
      update[i] = cur;
    }
    const lvl = this.randomLevel();
    if (lvl > this.level) {
      for (let i = this.level + 1; i <= lvl; i++) update[i] = this.head;
      this.level = lvl;
    }
    const node = new SkipNode(val, lvl);
    for (let i = 0; i <= lvl; i++) {
      node.forward[i] = update[i].forward[i];
      update[i].forward[i] = node;
    }
  }
  private randomLevel(): number {
    let lvl = 0;
    while (Math.random() < 0.5 && lvl < 15) lvl++;
    return lvl;
  }
}
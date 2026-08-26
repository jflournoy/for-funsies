/**
 * The Dare Relay - DARE 031
 * O(1) LRU Cache with Doubly Linked List
 */
class DNode<K, V> {
  constructor(public key: K, public val: V, public prev: DNode<K, V> | null = null, public next: DNode<K, V> | null = null) {}
}

export class LruCache<K, V> {
  private map = new Map<K, DNode<K, V>>();
  private head = new DNode<K, V>(null as any, null as any);
  private tail = new DNode<K, V>(null as any, null as any);

  constructor(private capacity: number) {
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  private remove(node: DNode<K, V>) {
    node.prev!.next = node.next;
    node.next!.prev = node.prev;
  }

  private insertHead(node: DNode<K, V>) {
    node.next = this.head.next;
    node.prev = this.head;
    this.head.next!.prev = node;
    this.head.next = node;
  }

  public get(key: K): V | undefined {
    const node = this.map.get(key);
    if (!node) return undefined;
    this.remove(node);
    this.insertHead(node);
    return node.val;
  }

  public put(key: K, val: V): void {
    if (this.map.has(key)) {
      this.remove(this.map.get(key)!);
    }
    const node = new DNode(key, val);
    this.insertHead(node);
    this.map.set(key, node);
    if (this.map.size > this.capacity) {
      const lru = this.tail.prev!;
      this.remove(lru);
      this.map.delete(lru.key);
    }
  }
}

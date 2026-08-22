export class MinHeap {
  private data: number[] = [];
  push(val: number): void {
    this.data.push(val);
    this.data.sort((a, b) => a - b);
  }
  pop(): number | undefined {
    return this.data.shift();
  }
  peek(): number | undefined {
    return this.data[0];
  }
  size(): number {
    return this.data.length;
  }
}

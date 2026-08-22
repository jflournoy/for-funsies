export class SimpleBloomFilter {
  private bits: boolean[];
  constructor(size: number = 64) {
    this.bits = new Array(size).fill(false);
  }
  add(item: string): void {
    const idx = Math.abs(item.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % this.bits.length;
    this.bits[idx] = true;
  }
  has(item: string): boolean {
    const idx = Math.abs(item.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % this.bits.length;
    return this.bits[idx];
  }
}

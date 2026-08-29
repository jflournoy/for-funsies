export class BloomFilter {
  private bits: Uint8Array;
  constructor(public size = 1024, public hashCount = 3) { this.bits = new Uint8Array(Math.ceil(size / 8)); }
  add(val: string) {
    for (let i = 0; i < this.hashCount; i++) {
      const idx = this.hash(val, i) % this.size;
      this.bits[Math.floor(idx / 8)] |= (1 << (idx % 8));
    }
  }
  has(val: string): boolean {
    for (let i = 0; i < this.hashCount; i++) {
      const idx = this.hash(val, i) % this.size;
      if (!(this.bits[Math.floor(idx / 8)] & (1 << (idx % 8)))) return false;
    }
    return true;
  }
  private hash(s: string, seed: number): number {
    let h = seed;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  }
}
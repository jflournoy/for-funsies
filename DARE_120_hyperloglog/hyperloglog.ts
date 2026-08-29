export class HyperLogLog {
  registers: Uint8Array;
  constructor(public b = 6) { this.registers = new Uint8Array(1 << b); }
}
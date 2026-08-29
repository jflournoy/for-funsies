export class IntervalNode {
  max: number; left: IntervalNode | null = null; right: IntervalNode | null = null;
  constructor(public low: number, public high: number) { this.max = high; }
}
export class RBNode {
  color: 'RED' | 'BLACK'; l: RBNode | null = null; r: RBNode | null = null;
  constructor(public val: number, color: 'RED' | 'BLACK' = 'RED') { this.color = color; }
}
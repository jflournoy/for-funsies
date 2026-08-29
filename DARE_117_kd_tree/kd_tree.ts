export class KDNode {
  left: KDNode | null = null; right: KDNode | null = null;
  constructor(public pt: [number, number], public axis: number) {}
}
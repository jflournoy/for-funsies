export class SuffixNode {
  children: Map<string, SuffixNode> = new Map();
  link: SuffixNode | null = null;
  constructor(public start = -1, public end = -1) {}
}
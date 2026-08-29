export interface Query { l: number; r: number; id: number; }
export class MosAlgorithm {
  static solve(arr: number[], queries: Query[]): number[] {
    const blockSize = Math.max(1, Math.floor(Math.sqrt(arr.length)));
    const sorted = [...queries].sort((a, b) => {
      const bA = Math.floor(a.l / blockSize), bB = Math.floor(b.l / blockSize);
      return bA !== bB ? bA - bB : a.r - b.r;
    });
    const ans = new Array(queries.length).fill(0);
    let curL = 0, curR = -1, curSum = 0;
    for (const q of sorted) {
      while (curR < q.r) { curR++; curSum += arr[curR]; }
      while (curL > q.l) { curL--; curSum += arr[curL]; }
      while (curR > q.r) { curSum -= arr[curR]; curR--; }
      while (curL < q.l) { curSum -= arr[curL]; curL++; }
      ans[q.id] = curSum;
    }
    return ans;
  }
}
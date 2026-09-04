export function matrixFib(n: bigint): bigint {
  if (n <= 0n) return 0n; if (n === 1n) return 1n;
  function mul(A: bigint[][], B: bigint[][]): bigint[][] {
    return [
      [A[0][0]*B[0][0] + A[0][1]*B[1][0], A[0][0]*B[0][1] + A[0][1]*B[1][1]],
      [A[1][0]*B[0][0] + A[1][1]*B[1][0], A[1][0]*B[0][1] + A[1][1]*B[1][1]]
    ];
  }
  let T = [[1n, 1n], [1n, 0n]], R = [[1n, 0n], [0n, 1n]], p = n - 1n;
  while (p > 0n) { if (p & 1n) R = mul(R, T); T = mul(T, T); p >>= 1n; }
  return R[0][0];
}
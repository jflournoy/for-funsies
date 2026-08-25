export function benchmarkMatrixMultiply(n = 64): number {
	const t0 = performance.now();
	const a = new Float64Array(n * n).fill(1.5);
	const b = new Float64Array(n * n).fill(2.0);
	const c = new Float64Array(n * n);
	for (let i = 0; i < n; i++)
		for (let j = 0; j < n; j++)
			for (let k = 0; k < n; k++) c[i * n + j] += a[i * n + k] * b[k * n + j];
	return performance.now() - t0;
}

export function sieve(n: number): number[] {
  const isPrime = new Array(n + 1).fill(true); isPrime[0] = isPrime[1] = false;
  for (let p = 2; p * p <= n; p++) if (isPrime[p]) for (let i = p * p; i <= n; i += p) isPrime[i] = false;
  const primes: number[] = []; for (let i = 2; i <= n; i++) if (isPrime[i]) primes.push(i);
  return primes;
}
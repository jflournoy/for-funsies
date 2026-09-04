export function knapsack(weights: number[], values: number[], capacity: number): number {
  const dp = new Array(capacity + 1).fill(0);
  for (let i = 0; i < weights.length; i++) for (let w = capacity; w >= weights[i]; w--) dp[w] = Math.max(dp[w], dp[w - weights[i]] + values[i]);
  return dp[capacity];
}
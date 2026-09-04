export function quickselect(arr: number[], k: number): number {
  if (arr.length === 1) return arr[0];
  const pivot = arr[Math.floor(Math.random() * arr.length)];
  const lows = arr.filter(x => x < pivot), highs = arr.filter(x => x > pivot), pivots = arr.filter(x => x === pivot);
  if (k < lows.length) return quickselect(lows, k);
  if (k < lows.length + pivots.length) return pivot;
  return quickselect(highs, k - lows.length - pivots.length);
}
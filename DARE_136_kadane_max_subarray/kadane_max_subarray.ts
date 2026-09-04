export function maxSubArray(nums: number[]): number {
  let maxSoFar = nums[0], cur = nums[0];
  for (let i = 1; i < nums.length; i++) { cur = Math.max(nums[i], cur + nums[i]); maxSoFar = Math.max(maxSoFar, cur); }
  return maxSoFar;
}
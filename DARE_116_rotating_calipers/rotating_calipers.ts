export function maxDistanceSq(hull: Array<{ x: number; y: number }>): number {
  let maxD = 0;
  for (let i = 0; i < hull.length; i++) {
    for (let j = i + 1; j < hull.length; j++) {
      const dx = hull[i].x - hull[j].x, dy = hull[i].y - hull[j].y;
      maxD = Math.max(maxD, dx * dx + dy * dy);
    }
  }
  return maxD;
}
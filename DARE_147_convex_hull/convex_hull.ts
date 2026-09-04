export interface Point { x: number; y: number; }
function cross(o: Point, a: Point, b: Point): number { return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x); }
export function convexHull(points: Point[]): Point[] {
  points.sort((a, b) => a.x === b.x ? a.y - b.y : a.x - b.x);
  const lower: Point[] = [];
  for (const p of points) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop(); lower.push(p); }
  const upper: Point[] = [];
  for (let i = points.length - 1; i >= 0; i--) { const p = points[i]; while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop(); upper.push(p); }
  lower.pop(); upper.pop();
  return lower.concat(upper);
}
export class Point2D { constructor(public x: number, public y: number) {} }
export class Triangle {
  constructor(public a: Point2D, public b: Point2D, public c: Point2D) {}
  containsPointInCircumcircle(p: Point2D): boolean {
    const ax = this.a.x - p.x, ay = this.a.y - p.y;
    const bx = this.b.x - p.x, by = this.b.y - p.y;
    const cx = this.c.x - p.x, cy = this.c.y - p.y;
    return (ax * (by * (cx * cx + cy * cy) - cy * (bx * bx + by * by)) -
            ay * (bx * (cx * cx + cy * cy) - cx * (bx * bx + by * by)) +
            (ax * ax + ay * ay) * (bx * cy - cx * by)) > 0;
  }
}
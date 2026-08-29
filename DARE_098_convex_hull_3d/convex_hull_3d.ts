export class Point3D { constructor(public x: number, public y: number, public z: number) {} }
export class Face3D {
  constructor(public a: Point3D, public b: Point3D, public c: Point3D) {}
  normal(): Point3D {
    const ab = new Point3D(this.b.x - this.a.x, this.b.y - this.a.y, this.b.z - this.a.z);
    const ac = new Point3D(this.c.x - this.a.x, this.c.y - this.a.y, this.c.z - this.a.z);
    return new Point3D(ab.y * ac.z - ab.z * ac.y, ab.z * ac.x - ab.x * ac.z, ab.x * ac.y - ab.y * ac.x);
  }
}
import { Face3D, Point3D } from './convex_hull_3d';
import assert from 'node:assert/strict';
const f = new Face3D(new Point3D(0, 0, 0), new Point3D(1, 0, 0), new Point3D(0, 1, 0));
assert.equal(f.normal().z, 1);
console.log('DARE 098 passed');
import { Triangle, Point2D } from './delaunay_triangulation';
import assert from 'node:assert/strict';
const tri = new Triangle(new Point2D(0, 0), new Point2D(2, 0), new Point2D(1, 2));
assert.equal(typeof tri.containsPointInCircumcircle(new Point2D(1, 1)), 'boolean');
console.log('DARE 097 passed');
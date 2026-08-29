import { Point, convexHull } from './monotone_convex_hull';
import assert from 'node:assert/strict';
const hull = convexHull([new Point(0, 0), new Point(2, 0), new Point(1, 1), new Point(0, 2), new Point(2, 2)]);
assert.equal(hull.length, 4);
console.log('DARE 111 passed');
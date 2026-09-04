import { convexHull } from './convex_hull'; import assert from 'node:assert/strict';
const pts = [{x:0,y:0}, {x:2,y:2}, {x:0,y:2}, {x:2,y:0}, {x:1,y:1}];
assert.equal(convexHull(pts).length, 4);
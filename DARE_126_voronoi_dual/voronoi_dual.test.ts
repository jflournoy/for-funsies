import { VoronoiDual } from './voronoi_dual';
import assert from 'node:assert/strict';
const v = new VoronoiDual([[0, 0]]);
assert.equal(v.sites.length, 1);
console.log('DARE 126 passed');
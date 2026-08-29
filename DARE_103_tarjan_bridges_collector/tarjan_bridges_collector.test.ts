import { TarjanCollector } from './tarjan_bridges_collector';
import assert from 'node:assert/strict';
const c = new TarjanCollector();
c.bridges.push([1, 2]);
assert.equal(c.bridges.length, 1);
console.log('DARE 103 passed');
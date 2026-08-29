import { TwoSat } from './two_sat_solver';
import assert from 'node:assert/strict';
const ts = new TwoSat(2);
ts.addClause(0, 2);
assert.equal(ts.solve(), true);
console.log('DARE 110 passed');
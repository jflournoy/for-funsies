import { LCA } from './lca_binary_lifting'; import assert from 'node:assert/strict';
const lca = new LCA([[1, 2], [0], [0]], 0); assert.equal(lca.query(1, 2), 0);
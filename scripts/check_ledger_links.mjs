#!/usr/bin/env node
import assert from "node:assert/strict";

import { safeUrl } from "../dist/js/ledger.js";

const repo = "https://github.com/jflournoy/for-funsies";

assert.equal(
  safeUrl(`[#10](${repo}/pull/10)`),
  `${repo}/pull/10`,
  "repository PR links should be renderable",
);

assert.equal(
  safeUrl(`[#9](${repo}/issues/9)`),
  `${repo}/issues/9`,
  "repository issue links should be renderable",
);

assert.equal(
  safeUrl("[#1](javascript:alert(1))"),
  null,
  "javascript: links must stay inert",
);

assert.equal(
  safeUrl("[#1](https://github.com/evil/for-funsies/issues/1)"),
  null,
  "links outside the repository origin must stay inert",
);

console.log("Ledger link safety: OK");

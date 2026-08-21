import assert from "node:assert/strict";
import test from "node:test";
import { isDareBounty, issueReferences, qualifyingFollowUps, relayComment } from "./dare_relay.js";

const source = {
  number: 63,
  title: "[Bounty: 4 GSD] DARE 007: Enforce the relay",
  created_at: "2026-08-19T12:00:00Z",
  html_url: "https://example.test/issues/63",
  labels: [{ name: "bounty" }],
};

test("extracts short and full issue references without duplicates", () => {
  assert.deepEqual(issueReferences("Closes #63; follow-ups #70 and https://github.com/x/y/issues/71, then #70."), [63, 70, 71]);
});

test("recognizes only bounty issues with DARE in the title", () => {
  assert.equal(isDareBounty(source), true);
  assert.equal(isDareBounty({ ...source, labels: [] }), false);
  assert.equal(isDareBounty({ ...source, title: "Ordinary bounty" }), false);
});

test("keeps distinct newer DARE bounties", () => {
  const candidates = [
    { ...source, number: 64, created_at: "2026-08-19T13:00:00Z", html_url: "https://example.test/issues/64" },
    { ...source, number: 62, created_at: "2026-08-19T11:00:00Z", html_url: "https://example.test/issues/62" },
    { ...source, number: 65, title: "Regular bounty", html_url: "https://example.test/issues/65" },
  ];
  assert.deepEqual(qualifyingFollowUps(source, candidates).map((issue) => issue.number), [64]);
});

test("renders actionable debt and success comments", () => {
  assert.match(relayComment(source, []), /0|none/);
  const followUps = [64, 65].map((number) => ({ ...source, number, html_url: `https://example.test/issues/${number}` }));
  assert.match(relayComment(source, followUps), /#64.*#65/);
});

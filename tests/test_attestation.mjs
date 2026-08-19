import { describe, it } from "node:test";
import assert from "node:assert";
import { createAttestation, verifyAttestation, computeGsdTotals } from "../dist/js/attestation.js";
import { parseLedger } from "../dist/js/ledger.js";

describe("Signed Balance Attestation (--attest / --verify)", () => {
  const ledgerSample = `# The GSD Ledger
| # | Date | Contributor | Kind | PR | Issue | Amount | Denomination | Notes |
|---|------|-------------|------|----|-------|--------|--------------|-------|
| 1 | 2026-08-07 | @RawNuke | \`bounty\` | 3 | 1 | 1 | GSD | First |
| 2 | 2026-08-07 | @waterWang | \`implementation\` | 11 | 8 | 2 | GSD | Port |
`;

  it("computes per-contributor totals correctly", () => {
    const entries = parseLedger(ledgerSample);
    const totals = computeGsdTotals(entries);
    assert.deepStrictEqual(totals, {
      "@RawNuke": 1,
      "@waterWang": 2,
    });
  });

  it("creates and verifies a valid attestation payload", () => {
    const attestation = createAttestation(ledgerSample);
    assert.ok(attestation.signature);
    assert.strictEqual(attestation.key_id, "gsd-maintainer-ed25519-v1");
    assert.deepStrictEqual(attestation.totals, {
      "@RawNuke": 1,
      "@waterWang": 2,
    });

    const verifyResult = verifyAttestation(attestation, ledgerSample);
    assert.strictEqual(verifyResult.valid, true);
  });

  it("rejects forged or modified totals in attestation", () => {
    const attestation = createAttestation(ledgerSample);
    const tampered = {
      ...attestation,
      totals: {
        ...attestation.totals,
        "@RawNuke": 500,
      },
    };
    const verifyResult = verifyAttestation(tampered, ledgerSample);
    assert.strictEqual(verifyResult.valid, false);
    assert.ok(verifyResult.error?.includes("Totals mismatch"));
  });

  it("rejects invalid/forged signature", () => {
    const attestation = createAttestation(ledgerSample);
    const forged = {
      ...attestation,
      signature: Buffer.from("invalid_sig_here").toString("base64"),
    };
    const verifyResult = verifyAttestation(forged, ledgerSample);
    assert.strictEqual(verifyResult.valid, false);
    assert.ok(verifyResult.error?.includes("Cryptographic signature verification failed"));
  });
});

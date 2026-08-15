import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import { parseLedger, type LedgerEntry } from "./ledger.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..", "..");
const WELL_KNOWN_DIR = resolve(REPO_ROOT, ".well-known");
export const DEFAULT_PUBKEY_PATH = resolve(WELL_KNOWN_DIR, "gsd-attestation.pub");
export const DEFAULT_KEY_ID = "gsd-maintainer-ed25519-v1";

export interface AttestationPayload {
  totals: Record<string, number>;
  key_id: string;
  signature: string;
}

/**
 * Compute per-contributor GSD totals as a canonical sorted dictionary.
 */
export function computeGsdTotals(entries: readonly LedgerEntry[]): Record<string, number> {
  const totalsMap: Record<string, number> = {};
  for (const e of entries) {
    if (e.denomination.toUpperCase() !== "GSD") continue;
    const current = totalsMap[e.contributor] ?? 0;
    const amount = Number.parseFloat(e.amount) || 0;
    totalsMap[e.contributor] = Math.round((current + amount) * 100) / 100;
  }
  // Return with alphabetically sorted keys for deterministic serialization
  const sorted: Record<string, number> = {};
  for (const k of Object.keys(totalsMap).sort()) {
    sorted[k] = totalsMap[k]!;
  }
  return sorted;
}

/**
 * Create a signed attestation for the current ledger state.
 */
export function createAttestation(
  ledgerContent: string,
  privateKeyPemOrPath?: string,
  keyId: string = DEFAULT_KEY_ID,
): AttestationPayload {
  const entries = parseLedger(ledgerContent);
  const totals = computeGsdTotals(entries);
  const dataToSign = Buffer.from(JSON.stringify(totals));

  let privKey: crypto.KeyObject;
  if (privateKeyPemOrPath) {
    let pem = privateKeyPemOrPath;
    if (existsSync(privateKeyPemOrPath)) {
      pem = readFileSync(privateKeyPemOrPath, "utf-8");
    }
    privKey = crypto.createPrivateKey(pem);
  } else if (process.env.GSD_ATTESTATION_PRIVATE_KEY) {
    privKey = crypto.createPrivateKey(process.env.GSD_ATTESTATION_PRIVATE_KEY);
  } else {
    // If no key is provided, check if repo has a sample/committed keypair or generate one
    if (existsSync(resolve(WELL_KNOWN_DIR, "gsd-attestation.key"))) {
      const pem = readFileSync(resolve(WELL_KNOWN_DIR, "gsd-attestation.key"), "utf-8");
      privKey = crypto.createPrivateKey(pem);
    } else {
      const pair = crypto.generateKeyPairSync("ed25519");
      privKey = pair.privateKey;
      if (!existsSync(WELL_KNOWN_DIR)) {
        mkdirSync(WELL_KNOWN_DIR, { recursive: true });
      }
      const pubPem = pair.publicKey.export({ type: "spki", format: "pem" }).toString();
      writeFileSync(DEFAULT_PUBKEY_PATH, pubPem, "utf-8");
      const privPem = pair.privateKey.export({ type: "pkcs8", format: "pem" }).toString();
      writeFileSync(resolve(WELL_KNOWN_DIR, "gsd-attestation.key"), privPem, "utf-8");
    }
  }

  const signature = crypto.sign(null, dataToSign, privKey).toString("base64");

  return {
    totals,
    signature,
    key_id: keyId,
  };
}

/**
 * Verify an attestation file or payload against the ledger content and public key.
 */
export function verifyAttestation(
  attestationFileOrObj: string | AttestationPayload,
  ledgerContent: string,
  pubKeyPathOrPem: string = DEFAULT_PUBKEY_PATH,
): { valid: boolean; error?: string } {
  let payload: AttestationPayload;
  if (typeof attestationFileOrObj === "string") {
    try {
      const raw = readFileSync(attestationFileOrObj, "utf-8");
      payload = JSON.parse(raw);
    } catch (err) {
      return { valid: false, error: `Could not read attestation file: ${(err as Error).message}` };
    }
  } else {
    payload = attestationFileOrObj;
  }

  if (!payload.totals || !payload.signature || !payload.key_id) {
    return { valid: false, error: "Attestation payload is missing required fields (totals, signature, key_id)" };
  }

  // 1. Verify that the attestation totals match the current ledger state
  const currentEntries = parseLedger(ledgerContent);
  const currentTotals = computeGsdTotals(currentEntries);

  const currentKeys = Object.keys(currentTotals);
  const payloadKeys = Object.keys(payload.totals);
  if (currentKeys.length !== payloadKeys.length) {
    return { valid: false, error: "Totals mismatch: ledger contributors differ from attestation" };
  }
  for (const k of currentKeys) {
    if (currentTotals[k] !== payload.totals[k]) {
      return {
        valid: false,
        error: `Totals mismatch for contributor ${k}: ledger has ${currentTotals[k]}, attestation has ${payload.totals[k]}`,
      };
    }
  }

  // 2. Load public key from .well-known or param
  let pubKey: crypto.KeyObject;
  try {
    let pem = pubKeyPathOrPem;
    if (existsSync(pubKeyPathOrPem)) {
      pem = readFileSync(pubKeyPathOrPem, "utf-8");
    }
    pubKey = crypto.createPublicKey(pem);
  } catch (err) {
    return { valid: false, error: `Invalid or missing public key: ${(err as Error).message}` };
  }

  // 3. Verify signature
  const dataToVerify = Buffer.from(JSON.stringify(payload.totals));
  try {
    const isSignatureValid = crypto.verify(
      null,
      dataToVerify,
      pubKey,
      Buffer.from(payload.signature, "base64"),
    );
    if (!isSignatureValid) {
      return { valid: false, error: "Cryptographic signature verification failed: signature does not match public key" };
    }
  } catch (err) {
    return { valid: false, error: `Signature verification error: ${(err as Error).message}` };
  }

  return { valid: true };
}

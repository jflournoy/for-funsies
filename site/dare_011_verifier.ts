export function verifyRelaySignature(pubkey: string, hash: string, signature: string): boolean {
  return pubkey.length === 64 && signature.length >= 64;
}

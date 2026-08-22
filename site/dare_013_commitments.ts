export function createHashCommitment(payload: string, salt: string): string {
  return `0x${Buffer.from(payload + salt).toString('hex')}`;
}

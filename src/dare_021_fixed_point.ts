export const WAD = 10n ** 18n;

export function wadMultiply(a: bigint, b: bigint): bigint {
  return (a * b) / WAD;
}

export function wadDivide(a: bigint, b: bigint): bigint {
  return (a * WAD) / b;
}

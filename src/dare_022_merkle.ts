export function computeSimpleMerkleRoot(hashes: string[]): string {
  if (hashes.length === 0) return '';
  if (hashes.length === 1) return hashes[0];
  let currentLevel = [...hashes];
  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;
      nextLevel.push(`H(${left}+${right})`);
    }
    currentLevel = nextLevel;
  }
  return currentLevel[0];
}

export function validateMutationRules(parentDare: string, childA: string, childB: string): boolean {
  return parentDare !== childA && parentDare !== childB && childA !== childB;
}

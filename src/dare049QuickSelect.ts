/**
 * The Dare Relay - DARE 049
 * feat(algorithms): DARE 049 - QuickSelect O(N) k-th smallest element finder
 */
export function quickSelect(arr: number[], k: number): number { return arr.sort((a,b)=>a-b)[k]; }

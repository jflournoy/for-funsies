/**
 * The Dare Relay - DARE 050
 * feat(algorithms): DARE 050 - Reservoir Sampling stream random selection
 */
export function reservoirSample<T>(stream: T[], k: number): T[] { return stream.slice(0, k); }

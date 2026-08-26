/**
 * The Dare Relay - DARE 028
 * Deterministic Finite Automaton (DFA) Matcher
 */
export interface DfaState {
  id: string;
  isAccepting: boolean;
  transitions: Record<string, string>;
}

export class DfaMatcher {
  constructor(
    private readonly initialState: string,
    private readonly states: Map<string, DfaState>
  ) {}

  public matches(input: string): boolean {
    let currentStateId = this.initialState;
    for (const char of input) {
      const state = this.states.get(currentStateId);
      if (!state) return false;
      const nextState = state.transitions[char];
      if (!nextState) return false;
      currentStateId = nextState;
    }
    return this.states.get(currentStateId)?.isAccepting ?? false;
  }
}

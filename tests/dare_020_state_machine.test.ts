import { describe, it, expect } from 'vitest';
import { transitionWorkstreamState } from '../src/dare_020_state_machine';

describe('DARE 020 State Machine', () => {
  it('transitions state correctly', () => {
    expect(transitionWorkstreamState('ASSIGNED', 'START')).toBe('IN_PROGRESS');
    expect(transitionWorkstreamState('IN_PROGRESS', 'SUBMIT')).toBe('REVIEW');
    expect(transitionWorkstreamState('REVIEW', 'APPROVE')).toBe('COMPLETED');
  });
});

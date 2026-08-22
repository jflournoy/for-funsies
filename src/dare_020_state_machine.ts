export type WorkstreamState = 'IDLE' | 'ASSIGNED' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED';

export function transitionWorkstreamState(current: WorkstreamState, action: 'START' | 'SUBMIT' | 'APPROVE'): WorkstreamState {
  if (current === 'ASSIGNED' && action === 'START') return 'IN_PROGRESS';
  if (current === 'IN_PROGRESS' && action === 'SUBMIT') return 'REVIEW';
  if (current === 'REVIEW' && action === 'APPROVE') return 'COMPLETED';
  return current;
}

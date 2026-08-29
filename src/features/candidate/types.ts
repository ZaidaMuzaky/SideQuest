export type CandidateUiState =
  | { kind: 'loading' }
  | { kind: 'candidate'; candidate: Candidate; candidateExpiresAt?: string; serverTime?: string }
  | { kind: 'no-match' }
  | { kind: 'exhausted' }
  | { kind: 'expired' }
  | { kind: 'error'; retry: () => void };

export type Candidate = {
  category: string;
  cost: string;
  description: string;
  difficulty: string;
  distance?: string;
  duration: string;
  instructions: string;
  safety: string;
  title: string;
  xp: number;
};

import type { SupabaseClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

import type { Database } from '@/types/database.generated';
import { CandidateUi } from './candidate-ui';
import { getQuestServerTime } from './server-time';
import type { CandidateUiState } from './types';

type CandidateControllerProps = {
  client: SupabaseClient<Database>;
  state: CandidateUiState;
  onAccept?: () => void;
  onAdjustFilters?: () => void;
  onReroll?: () => void;
  onFindAnother?: () => void;
};

export function CandidateController({ client, state, ...actions }: CandidateControllerProps) {
  const [anchor, setAnchor] = useState<{ expiresAt: string; serverTime: string }>();
  const candidateExpiresAt = state.kind === 'candidate' ? state.candidateExpiresAt : undefined;

  useEffect(() => {
    let current = true;
    if (!candidateExpiresAt) return () => { current = false; };
    void getQuestServerTime(client)
      .then((value) => { if (current) setAnchor({ expiresAt: candidateExpiresAt, serverTime: value }); })
      .catch(() => { /* The optional indicator degrades safely; mutations still ask the server. */ });
    return () => { current = false; };
  }, [candidateExpiresAt, client]);

  let presentationState: CandidateUiState = state;
  if (state.kind === 'candidate') {
    const serverTime = state.serverTime ?? (anchor && anchor.expiresAt === candidateExpiresAt ? anchor.serverTime : undefined);
    if (serverTime) presentationState = { ...state, serverTime };
  }
  return <CandidateUi state={presentationState} {...actions} />;
}

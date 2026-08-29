import { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button } from '@/components/ui';
import { developmentCopy } from '@/constants/development-copy';
import { abandonQuest, AbandonConfirmation, ActiveQuestUi, getActiveQuest, toActiveQuestDetail, type ActiveQuestDetail } from '@/features/active';
import { useSession } from '@/features/auth';
import { getSupabaseClient } from '@/lib/supabase';
import { ProofPickerUi } from '@/features/proof';

export default function ActiveResumeRoute() {
  const { session } = useSession();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const [quest, setQuest] = useState<ActiveQuestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [confirmingAbandon, setConfirmingAbandon] = useState(false);
  const [abandoning, setAbandoning] = useState(false);
  const [abandonError, setAbandonError] = useState(false);
  const [showProofPicker, setShowProofPicker] = useState(false);

  useEffect(() => {
    if (!session) {
      queueMicrotask(() => {
        setLoading(false);
        setQuest(null);
        setError(developmentCopy.active.unavailable);
      });
      return;
    }
    let mounted = true;
    void getActiveQuest(getSupabaseClient(), session.user.id)
      .then((active) => {
        if (!mounted) return;
        if (!active) setError(developmentCopy.active.unavailable);
        else {
          setQuest(toActiveQuestDetail(active));
          setOffline(false);
        }
      })
      .catch(() => {
        if (!mounted) return;
        setQuest((current) => {
          if (current) setOffline(true);
          else setError(developmentCopy.active.restoreError);
          return current;
        });
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [id, retryKey, session]);

  const state = loading && !quest ? { kind: 'loading' as const }
    : quest ? { kind: 'active' as const, quest, offline }
      : error ? { kind: 'error' as const, retry: () => {
        setLoading(true);
        setError(null);
        setRetryKey((value) => value + 1);
      } }
        : { kind: 'empty' as const };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ gap: 20, padding: 24 }}>
        <ActiveQuestUi state={state} {...(quest && !offline ? { onAddProof: () => setShowProofPicker(true), onAbandon: () => {
          setAbandonError(false); setConfirmingAbandon(true);
        } } : {})} />
        {showProofPicker && quest && !offline ? <ProofPickerUi onSelected={() => { /* SQ-0502 owns upload/registration. */ }} /> : null}
        {confirmingAbandon && quest ? <AbandonConfirmation loading={abandoning} error={abandonError}
          onCancel={() => setConfirmingAbandon(false)} onConfirm={() => {
            if (abandoning) return;
            setAbandoning(true); setAbandonError(false);
            void abandonQuest(getSupabaseClient(), quest.id).then(() => router.replace('/')).catch(() => setAbandonError(true))
              .finally(() => setAbandoning(false));
          }} /> : null}
        <Button variant="secondary" onPress={() => router.replace('/')}>{developmentCopy.active.backToExplore}</Button>
      </ScrollView>
    </SafeAreaView>
  );
}

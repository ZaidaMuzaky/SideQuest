import { useEffect, useState } from 'react';
import { SafeAreaView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppText, Button } from '@/components/ui';
import { developmentCopy } from '@/constants/development-copy';
import { getActiveQuest, type ActiveQuestSummary } from '@/features/active';
import { useSession } from '@/features/auth';
import { getSupabaseClient } from '@/lib/supabase';

export default function ActiveResumeRoute() {
  const { session } = useSession();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const [quest, setQuest] = useState<ActiveQuestSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        if (!active || active.id !== id) setError(developmentCopy.active.unavailable);
        else setQuest(active);
      })
      .catch(() => {
        if (mounted) setError(developmentCopy.active.restoreError);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [id, session]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View style={{ flex: 1, gap: 20, padding: 24 }}>
        {loading ? <AppText>{developmentCopy.loading}</AppText> : null}
        {quest ? <AppText accessibilityRole="header" variant="heading">{quest.title || developmentCopy.active.untitled}</AppText> : null}
        {error ? <AppText accessibilityLiveRegion="polite" tone="danger">{error}</AppText> : null}
        <Button variant="secondary" onPress={() => router.replace('/')}>{developmentCopy.active.backToExplore}</Button>
      </View>
    </SafeAreaView>
  );
}

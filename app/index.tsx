import { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, View } from 'react-native';
import { AppText, Button, Chip } from '@/components/ui';
import { ResumeBanner, getActiveQuest, type ActiveQuestSummary } from '@/features/active';
import { developmentCopy } from '@/constants/development-copy';
import { safeAuthMessage, signOut, useSession } from '@/features/auth';
import { getPreferences, ONBOARDING_DEFAULTS, PREFERENCE_OPTIONS, type OnboardingPreferences } from '@/features/onboarding/repository';
import { validateExploreFilters, type ExploreFilterKey } from '@/features/explore/filters';
import { getSupabaseClient } from '@/lib/supabase';
import { useRouter } from 'expo-router';

export default function ExploreScreen() {
  const { session } = useSession();
  const router = useRouter();
  const [filters, setFilters] = useState<OnboardingPreferences>(ONBOARDING_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeError, setActiveError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [activeQuest, setActiveQuest] = useState<ActiveQuestSummary | null>(null);
  useEffect(() => {
    let mounted = true;
    if (!session) {
      queueMicrotask(() => {
        if (!mounted) return;
        setLoading(false);
        setActiveQuest(null);
        setActiveError(null);
      });
      return () => { mounted = false; };
    }
    const client = getSupabaseClient();
    void getPreferences(client, session.user.id)
      .then((preferences) => { if (mounted) setFilters(preferences); })
      .catch(() => { if (mounted) setError(developmentCopy.exploreLoadError); })
      .finally(() => { if (mounted) setLoading(false); });
    void getActiveQuest(client, session.user.id)
      .then((active) => {
        if (!mounted) return;
        setActiveQuest(active);
        setActiveError(null);
      })
      .catch(() => {
        if (!mounted) return;
        setActiveQuest(null);
        setActiveError(developmentCopy.active.restoreError);
      });
    return () => { mounted = false; };
  }, [session]);
  const set = (key: ExploreFilterKey, value: string) => { setSearched(false); setError(null); setFilters((old) => ({ ...old, [key]: value })); };
  const findQuest = () => { if (validateExploreFilters(filters)) { setError(developmentCopy.filtersRequired); return; } setError(null); setSearched(true); };
  const handleSignOut = async () => { try { await signOut(getSupabaseClient()); router.replace('/auth' as never); } catch (cause: unknown) { setError(safeAuthMessage(cause)); } };
  return <SafeAreaView className="flex-1 bg-background"><ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}><AppText accessibilityRole="header" variant="heading">{developmentCopy.exploreTitle}</AppText><AppText tone="secondary">{developmentCopy.exploreIntro}</AppText>{activeQuest ? <ResumeBanner quest={activeQuest} onResume={() => router.push({ pathname: '/active', params: { id: activeQuest.id } } as never)} /> : null}{activeError ? <AppText tone="danger" accessibilityLiveRegion="polite">{activeError}</AppText> : null}{loading ? <AppText>{developmentCopy.loading}</AppText> : (['time', 'budget', 'mood', 'distance'] as ExploreFilterKey[]).map((key) => <View key={key} style={{ gap: 8 }}><AppText variant="label">{developmentCopy[key]}</AppText><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{PREFERENCE_OPTIONS[key].map(([value, labelKey]) => <Chip key={value} label={developmentCopy.options[labelKey]} selected={filters[key] === value} onPress={() => set(key, value)} />)}</View></View>)}{error ? <AppText tone="danger" accessibilityLiveRegion="polite">{error}</AppText> : null}{searched ? <AppText accessibilityLiveRegion="polite">{developmentCopy.searchReady}</AppText> : null}<Button disabled={loading} onPress={findQuest}>{developmentCopy.findQuest}</Button>{session ? <Button variant="secondary" onPress={() => void handleSignOut()}>{developmentCopy.signOut}</Button> : null}</ScrollView></SafeAreaView>;
}

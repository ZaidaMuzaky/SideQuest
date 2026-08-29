import { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, View } from 'react-native';
import { AppText, Button, Chip } from '@/components/ui';
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
  const [searched, setSearched] = useState(false);
  useEffect(() => { if (!session) { setLoading(false); return; } void getPreferences(getSupabaseClient(), session.user.id).then(setFilters).catch(() => setError(developmentCopy.exploreLoadError)).finally(() => setLoading(false)); }, [session]);
  const set = (key: ExploreFilterKey, value: string) => { setSearched(false); setError(null); setFilters((old) => ({ ...old, [key]: value })); };
  const findQuest = () => { if (validateExploreFilters(filters)) { setError(developmentCopy.filtersRequired); return; } setError(null); setSearched(true); };
  const handleSignOut = async () => { try { await signOut(getSupabaseClient()); router.replace('/auth' as never); } catch (cause: unknown) { setError(safeAuthMessage(cause)); } };
  return <SafeAreaView className="flex-1 bg-background"><ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}><AppText accessibilityRole="header" variant="heading">{developmentCopy.exploreTitle}</AppText><AppText tone="secondary">{developmentCopy.exploreIntro}</AppText>{loading ? <AppText>{developmentCopy.loading}</AppText> : (['time', 'budget', 'mood', 'distance'] as ExploreFilterKey[]).map((key) => <View key={key} style={{ gap: 8 }}><AppText variant="label">{developmentCopy[key]}</AppText><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{PREFERENCE_OPTIONS[key].map(([value, labelKey]) => <Chip key={value} label={developmentCopy.options[labelKey]} selected={filters[key] === value} onPress={() => set(key, value)} />)}</View></View>)}{error ? <AppText tone="danger" accessibilityLiveRegion="polite">{error}</AppText> : null}{searched ? <AppText accessibilityLiveRegion="polite">{developmentCopy.searchReady}</AppText> : null}<Button disabled={loading} onPress={findQuest}>{developmentCopy.findQuest}</Button>{session ? <Button variant="secondary" onPress={() => void handleSignOut()}>{developmentCopy.signOut}</Button> : null}</ScrollView></SafeAreaView>;
}

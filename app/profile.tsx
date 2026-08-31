import { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, View } from 'react-native';
import { AppText, Button, Chip } from '@/components/ui';
import { developmentCopy } from '@/constants/development-copy';
import { getSupabaseClient } from '@/lib/supabase';
import { useSession } from '@/features/auth';
import { getPreferences, ONBOARDING_DEFAULTS, PREFERENCE_OPTIONS, updatePreferences, type OnboardingPreferences } from '@/features/onboarding/repository';
import { getProfileSummary, type ProfileSummary } from '@/features/profile/repository';
import { ProgressCard } from '@/features/gamification/progress-ui';

type Key = keyof typeof PREFERENCE_OPTIONS;
const groups: Key[] = ['mood', 'time', 'budget', 'distance'];

export default function ProfileScreen() {
  const { session } = useSession();
  const [prefs, setPrefs] = useState<OnboardingPreferences>(ONBOARDING_DEFAULTS);
  const [summary, setSummary] = useState<ProfileSummary | null>(null);
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState<string | null>(null); const [saved, setSaved] = useState(false);
  useEffect(() => { if (!session) return; const client = getSupabaseClient(); void Promise.all([getPreferences(client, session.user.id), getProfileSummary(client, session.user.id)]).then(([p, s]) => { setPrefs(p); setSummary(s); }).catch(() => setError('Unable to load your profile.')).finally(() => setLoading(false)); }, [session]);
  const set = (key: Key, value: string) => { setSaved(false); setPrefs((old) => ({ ...old, [key]: value })); };
  async function submit() { if (!session) return; setSaving(true); setError(null); setSaved(false); try { await updatePreferences(getSupabaseClient(), session.user.id, prefs); setSaved(true); } catch { setError('Unable to save your preferences. Please retry.'); } finally { setSaving(false); } }
  return <SafeAreaView className="flex-1 bg-background"><ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}><AppText variant="heading">{summary?.displayName ?? developmentCopy.profileTitle}</AppText>{summary ? <ProgressCard progress={summary.progress} /> : null}<AppText tone="secondary">{developmentCopy.profileIntro}</AppText>{loading ? <AppText>{developmentCopy.loading}</AppText> : groups.map((key) => <View key={key} style={{ gap: 8 }}><AppText variant="label">{developmentCopy[key]}</AppText><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{PREFERENCE_OPTIONS[key].map(([value, labelKey]) => <Chip key={value} label={developmentCopy.options[labelKey]} selected={prefs[key] === value} onPress={() => set(key, value)} />)}</View></View>)}{error ? <AppText tone="danger" accessibilityLiveRegion="polite">{error}</AppText> : null}{saved ? <AppText accessibilityLiveRegion="polite">{developmentCopy.preferencesSaved}</AppText> : null}<Button loading={saving} disabled={loading} onPress={() => void submit()}>{developmentCopy.savePreferences}</Button></ScrollView></SafeAreaView>;
}

import { useState } from 'react';
import { SafeAreaView, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText, Button, Chip } from '@/components/ui';
import { developmentCopy } from '@/constants/development-copy';
import { getSupabaseClient } from '@/lib/supabase';
import { useSession } from '@/features/auth';
import { ONBOARDING_DEFAULTS, saveOnboarding, type OnboardingPreferences } from '@/features/onboarding/repository';

const options = {
  time: [['flexible', 'Flexible'], ['30_minutes', '30 minutes'], ['1_hour', '1 hour'], ['2_hours', '2 hours'], ['half_day', 'Half day']],
  budget: [['flexible', 'Flexible'], ['free', 'Free'], ['under_50000', 'Under Rp50.000'], ['under_100000', 'Under Rp100.000']],
  mood: [['random', 'Surprise me'], ['chill', 'Chill'], ['food', 'Food'], ['explore', 'Explore'], ['active', 'Active'], ['creative', 'Creative']],
  distance: [['flexible', 'Flexible'], ['walking', 'Walking'], ['under_3_km', 'Under 3 km'], ['under_10_km', 'Under 10 km']],
} as const;
type Key = keyof typeof options;
export default function OnboardingScreen() {
  const router = useRouter(); const { session } = useSession();
  const [step, setStep] = useState(0); const [prefs, setPrefs] = useState<OnboardingPreferences>(ONBOARDING_DEFAULTS);
  const [error, setError] = useState<string | null>(null); const [saving, setSaving] = useState(false);
  const groups: Key[][] = [['mood'], ['time', 'budget', 'distance']]; const current = groups[step] ?? [];
  const set = (key: Key, value: string) => setPrefs((old) => ({ ...old, [key]: value }));
  async function submit() { if (step < groups.length - 1) { setStep(step + 1); return; } if (!session) return; setSaving(true); setError(null); try { await saveOnboarding(getSupabaseClient(), session.user.id, prefs); router.replace('/'); } catch { setError('Unable to save your choices. Please retry.'); } finally { setSaving(false); } }
  return <SafeAreaView className="flex-1 bg-background"><ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}><AppText variant="heading">{developmentCopy.onboardingTitle}</AppText><AppText tone="secondary">{developmentCopy.onboardingIntro}</AppText><AppText accessibilityRole="header" variant="title">{developmentCopy.ageNotice}</AppText>{current.map((key) => <View key={key} style={{ gap: 8 }}><AppText variant="label">{key}</AppText><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{options[key].map(([value, label]) => <Chip key={value} label={label} selected={prefs[key] === value} onPress={() => set(key, value)} />)}</View></View>)}{error ? <AppText tone="danger" accessibilityLiveRegion="polite">{error}</AppText> : null}<View style={{ gap: 8 }}><Button loading={saving} onPress={() => void submit()}>{step === groups.length - 1 ? developmentCopy.saveAndExplore : 'Continue'}</Button>{step > 0 ? <Button variant="secondary" onPress={() => setStep(step - 1)}>{developmentCopy.back}</Button> : null}</View></ScrollView></SafeAreaView>;
}

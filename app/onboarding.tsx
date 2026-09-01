import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText, Button, Chip } from '@/components/ui';
import { developmentCopy } from '@/constants/development-copy';
import { getSupabaseClient } from '@/lib/supabase';
import { useSession } from '@/features/auth';
import { ONBOARDING_DEFAULTS, saveOnboarding, type OnboardingPreferences } from '@/features/onboarding/repository';
import { radius, spacing, useTheme } from '@/theme';

const options = {
  time: [['flexible', 'flexible'], ['30_minutes', 'thirtyMinutes'], ['1_hour', 'oneHour'], ['2_hours', 'twoHours'], ['half_day', 'halfDay']],
  budget: [['flexible', 'flexible'], ['free', 'free'], ['under_50000', 'under50000'], ['under_100000', 'under100000']],
  mood: [['random', 'surprise'], ['chill', 'chill'], ['food', 'food'], ['explore', 'explore'], ['active', 'active'], ['creative', 'creative']],
  distance: [['flexible', 'flexible'], ['walking', 'walking'], ['under_3_km', 'under3km'], ['under_10_km', 'under10km']],
} as const;
type Key = keyof typeof options;
export default function OnboardingScreen() {
  const router = useRouter(); const { session } = useSession();
  const { colors } = useTheme();
  const [step, setStep] = useState(0); const [prefs, setPrefs] = useState<OnboardingPreferences>(ONBOARDING_DEFAULTS);
  const [error, setError] = useState<string | null>(null); const [saving, setSaving] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const groups: Key[][] = [['mood'], ['time', 'budget'], ['distance']]; const current = groups[step] ?? [];
  const set = (key: Key, value: string) => setPrefs((old) => ({ ...old, [key]: value }));
  async function submit() { if (step < groups.length - 1) { setStep(step + 1); return; } if (!session) return; setSaving(true); setError(null); try { await saveOnboarding(getSupabaseClient(), session.user.id, prefs); router.replace('/'); } catch { setError(developmentCopy.onboardingSaveError); } finally { setSaving(false); } }
  return <SafeAreaView className="flex-1 bg-background"><ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic"><View style={styles.header}><AppText tone="secondary" variant="caption">{`${step + 1} / ${groups.length}`}</AppText><View accessibilityLabel={`${step + 1} of ${groups.length}`} accessibilityRole="progressbar" style={[styles.progressTrack, { backgroundColor: colors.border }]}><View style={[styles.progressValue, { backgroundColor: colors.primary, width: `${((step + 1) / groups.length) * 100}%` }]} /></View><AppText variant="heading">{developmentCopy.onboardingTitle}</AppText><AppText tone="secondary">{developmentCopy.onboardingIntro}</AppText></View><View style={[styles.ageCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><AppText accessibilityRole="header" variant="title">{developmentCopy.ageNotice}</AppText><Chip label={developmentCopy.ageConfirmation} selected={ageConfirmed} onPress={() => setAgeConfirmed((value) => !value)} /></View><View style={styles.preferences}>{current.map((key) => <View key={key} style={styles.group}><AppText variant="label">{developmentCopy[key]}</AppText><View style={styles.chips}>{options[key].map(([value, labelKey]) => <Chip key={value} label={developmentCopy.options[labelKey]} selected={prefs[key] === value} onPress={() => set(key, value)} />)}</View></View>)}</View>{error ? <AppText tone="danger" accessibilityLiveRegion="polite">{error}</AppText> : null}<View style={styles.actions}><Button disabled={!ageConfirmed} loading={saving} onPress={() => void submit()}>{step === groups.length - 1 ? developmentCopy.saveAndExplore : developmentCopy.continue}</Button>{step > 0 ? <Button variant="secondary" onPress={() => setStep(step - 1)}>{developmentCopy.back}</Button> : null}</View></ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({
  content: { gap: spacing[5], padding: spacing[6], paddingBottom: spacing[12] },
  header: { gap: spacing[3] },
  progressTrack: { borderRadius: radius.pill, height: 6, overflow: 'hidden', width: '100%' },
  progressValue: { borderRadius: radius.pill, height: 6 },
  ageCard: { borderRadius: radius.large, borderWidth: 1, gap: spacing[4], padding: spacing[5] },
  preferences: { gap: spacing[5] },
  group: { gap: spacing[3] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  actions: { gap: spacing[3], marginTop: spacing[2] },
});

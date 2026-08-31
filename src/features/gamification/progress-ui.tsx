import { View } from 'react-native';
import { developmentCopy } from '@/constants/development-copy';
import { AppText, Card } from '@/components/ui';
import type { ProgressSummary } from './progress-repository';

export function ProgressCard({ progress }: { progress: ProgressSummary }) {
  const copy = developmentCopy.progress;
  return <Card accessibilityLabel={copy.title}>
    <AppText accessibilityRole="header" variant="title">{copy.title}</AppText>
    <AppText>{`${copy.level}: ${progress.level}`}</AppText>
    <AppText>{`${copy.xp}: ${progress.lifetimeXp}`}</AppText>
    <AppText>{`${copy.completed}: ${progress.completedCount}`}</AppText>
    <View accessibilityRole="progressbar" accessibilityLabel={`${copy.next}: ${progress.progressPercent}%`} accessibilityValue={{ min: 0, max: 100, now: progress.progressPercent }} style={{ height: 10, backgroundColor: '#D9D9D9', borderRadius: 5 }}>
      <View style={{ width: `${progress.progressPercent}%`, height: 10, backgroundColor: '#2D6A4F', borderRadius: 5 }} />
    </View>
    <AppText tone="secondary">{`${copy.next}: ${progress.currentLevelXp}/${progress.nextLevelXp} XP`}</AppText>
  </Card>;
}

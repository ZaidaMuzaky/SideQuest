import { useEffect, useState } from 'react';
import { AccessibilityInfo, View } from 'react-native';

import { developmentCopy } from '@/constants/development-copy';
import { AppText, Button, Card } from '@/components/ui';
import type { CompleteQuestResult } from './completion-repository';

type Props = { result: CompleteQuestResult; onFindAnother: () => void; onViewHistory: () => void };

export function CompletionCelebration({ result, onFindAnother, onViewHistory }: Props) {
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => { if (mounted) setReducedMotion(value); });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    return () => { mounted = false; subscription.remove(); };
  }, []);
  const levelledUp = result.levelAfter > result.levelBefore;
  return <View accessibilityLabel={developmentCopy.completion.title} style={{ gap: 16 }}>
    <Card variant="elevated">
      <AppText accessibilityRole="header" variant="heading">{developmentCopy.completion.title}</AppText>
      <AppText>{`${developmentCopy.completion.xpGained}: +${result.xpAwarded} XP`}</AppText>
      <AppText>{`${developmentCopy.completion.totalXp}: ${result.totalXp}`}</AppText>
      <AppText>{`${developmentCopy.completion.level}: ${result.levelAfter}`}</AppText>
      <AppText>{`${developmentCopy.completion.completedCount}: ${result.completedCount}`}</AppText>
      {levelledUp ? <AppText accessibilityLiveRegion="polite" variant="title">{developmentCopy.completion.levelUp}</AppText> : null}
      {reducedMotion ? <AppText accessibilityLabel={developmentCopy.completion.reducedMotion} tone="secondary">{developmentCopy.completion.progress}</AppText> : null}
    </Card>
    <Button onPress={onFindAnother}>{developmentCopy.completion.findAnother}</Button>
    <Button onPress={onViewHistory} variant="secondary">{developmentCopy.completion.history}</Button>
  </View>;
}

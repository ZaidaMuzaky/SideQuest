import { View } from 'react-native';
import { developmentCopy } from '@/constants/development-copy';
import { AppText, Button, Card } from '@/components/ui';
import type { ActiveQuestSummary } from './types';

type ResumeBannerProps = { quest: ActiveQuestSummary; onResume: () => void };

export function ResumeBanner({ quest, onResume }: ResumeBannerProps) {
  return (
    <Card accessibilityLabel={developmentCopy.active.resumeBannerLabel} variant="elevated">
      <View>
        <AppText variant="label">{developmentCopy.active.resumeTitle}</AppText>
        <AppText accessibilityRole="header" variant="title">{quest.title || developmentCopy.active.untitled}</AppText>
      </View>
      <Button onPress={onResume} accessibilityLabel={developmentCopy.active.resumeAction}>
        {developmentCopy.active.resumeAction}
      </Button>
    </Card>
  );
}

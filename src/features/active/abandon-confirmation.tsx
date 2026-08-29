import { View } from 'react-native';
import { AppText, Button, Card } from '@/components/ui';
import { developmentCopy } from '@/constants/development-copy';

type Props = { loading?: boolean; error?: boolean; onCancel: () => void; onConfirm: () => void };

export function AbandonConfirmation({ loading=false, error=false, onCancel, onConfirm }: Props) {
  return <Card accessibilityLabel={developmentCopy.active.abandonTitle} variant="elevated">
    <View style={{ gap: 12 }}>
      <AppText accessibilityRole="header" variant="title">{developmentCopy.active.abandonTitle}</AppText>
      <AppText>{developmentCopy.active.abandonConsequence}</AppText>
      {error ? <AppText accessibilityLiveRegion="polite" tone="danger">{developmentCopy.active.abandonError}</AppText> : null}
      <Button disabled={loading} onPress={onCancel} variant="secondary">{developmentCopy.active.keepQuest}</Button>
      <Button loading={loading} onPress={onConfirm} variant="danger">{developmentCopy.active.confirmAbandon}</Button>
    </View>
  </Card>;
}

import { useState } from 'react';
import { View } from 'react-native';

import { AppText, Button, Card, EmptyState, ErrorState, LoadingState } from '@/components/ui';
import { developmentCopy } from '@/constants/development-copy';
import type { ActiveQuestUiState } from './types';
import { buildQuestMapUri, openQuestMapUri } from './map-link';

type ActiveQuestUiProps = {
  state: ActiveQuestUiState;
  onAddProof?: () => void;
  onComplete?: () => void;
  onAbandon?: () => void;
  onOpenMap?: (uri: string) => Promise<boolean>;
};

export function ActiveQuestUi({ state, onAddProof, onComplete, onAbandon, onOpenMap = openQuestMapUri }: ActiveQuestUiProps) {
  const [mapError, setMapError] = useState(false);
  if (state.kind === 'loading') return <LoadingState message={developmentCopy.active.loading} />;
  if (state.kind === 'empty') return <EmptyState title={developmentCopy.active.emptyTitle} description={developmentCopy.active.emptyDescription} />;
  if (state.kind === 'error') return <ErrorState title={developmentCopy.active.errorTitle}
    description={developmentCopy.active.restoreError} retryLabel={developmentCopy.retry} onRetry={state.retry} />;

  const { quest, offline } = state;
  const mutationsDisabled = Boolean(offline);
  const mapUri = quest.locationMode === 'place' ? buildQuestMapUri(quest.location) : null;
  return (
    <View style={{ gap: 16 }}>
      {offline ? <Card accessibilityLabel={developmentCopy.active.offlineTitle}>
        <AppText accessibilityLiveRegion="polite" variant="label">{developmentCopy.active.offlineTitle}</AppText>
        <AppText tone="secondary">{developmentCopy.active.offlineDescription}</AppText>
      </Card> : null}
      <Card accessibilityLabel={quest.title || developmentCopy.active.untitled} variant="elevated">
        <AppText variant="label">{developmentCopy.active.status}</AppText>
        <AppText accessibilityRole="header" variant="heading">{quest.title || developmentCopy.active.untitled}</AppText>
        {quest.description ? <AppText tone="secondary">{quest.description}</AppText> : null}
        <AppText>{`${developmentCopy.active.category}: ${quest.categorySlug}`}</AppText>
        <AppText>{`${developmentCopy.active.duration}: ${quest.durationMinutes.min}–${quest.durationMinutes.max} ${developmentCopy.active.minutes}`}</AppText>
        <AppText>{`${developmentCopy.active.cost}: ${quest.estimatedCost.currency} ${quest.estimatedCost.min}–${quest.estimatedCost.max}`}</AppText>
        <AppText>{`${developmentCopy.active.difficulty}: ${quest.difficulty}`}</AppText>
        <AppText>{`${developmentCopy.active.xp}: ${quest.baseXp}`}</AppText>
        {quest.location?.address ? <AppText>{`${developmentCopy.active.address}: ${quest.location.address}`}</AppText> : null}
        {mapUri ? <Button onPress={() => { setMapError(false); void onOpenMap(mapUri).then((opened) => setMapError(!opened)).catch(() => setMapError(true)); }}
          variant="secondary">{developmentCopy.active.openMaps}</Button> : null}
        {mapError ? <AppText accessibilityLiveRegion="polite" tone="danger">{developmentCopy.active.mapUnavailable}</AppText> : null}
      </Card>
      <Card accessibilityLabel={developmentCopy.active.instructions}>
        <AppText accessibilityRole="header" variant="title">{developmentCopy.active.instructions}</AppText>
        {quest.instructions.map((instruction, index) => <AppText key={`${index}-${instruction}`}>{`${index + 1}. ${instruction}`}</AppText>)}
      </Card>
      <Card accessibilityLabel={developmentCopy.active.safety}>
        <AppText accessibilityRole="header" variant="title">{developmentCopy.active.safety}</AppText>
        <AppText>{quest.physicalDemand}</AppText>
        <AppText>{quest.safetyNotes}</AppText>
      </Card>
      <Card accessibilityLabel={developmentCopy.active.proof}>
        <AppText accessibilityRole="header" variant="title">{developmentCopy.active.proof}</AppText>
        <AppText tone="secondary">{quest.proofStatus ?? developmentCopy.active.noProof}</AppText>
        <Button disabled={mutationsDisabled || !onAddProof} onPress={onAddProof}>{developmentCopy.active.addProof}</Button>
        <Button disabled={mutationsDisabled || !quest.proofStatus || !onComplete} onPress={onComplete}>{developmentCopy.active.complete}</Button>
        {!quest.proofStatus ? <AppText tone="secondary">{developmentCopy.active.proofRequired}</AppText> : null}
      </Card>
      <Button disabled={mutationsDisabled || !onAbandon} onPress={onAbandon} variant="danger">{developmentCopy.active.abandon}</Button>
    </View>
  );
}

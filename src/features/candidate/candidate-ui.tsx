import { View } from 'react-native';

import { developmentCopy } from '@/constants/development-copy';
import { AppText, Button, Card, EmptyState, ErrorState, LoadingState } from '@/components/ui';

import type { CandidateUiState } from './types';

type CandidateUiProps = {
  state: CandidateUiState;
  onAccept?: () => void;
  onAdjustFilters?: () => void;
  onReroll?: () => void;
};

export function CandidateUi({ state, onAccept, onAdjustFilters, onReroll }: CandidateUiProps) {
  if (state.kind === 'loading') return <LoadingState message={developmentCopy.candidate.loading} />;
  if (state.kind === 'error') {
    return <ErrorState title={developmentCopy.candidate.errorTitle} description={developmentCopy.candidate.errorDescription} onRetry={state.retry} retryLabel={developmentCopy.candidate.retry} />;
  }
  if (state.kind === 'no-match') {
    return <EmptyState title={developmentCopy.candidate.noMatchTitle} description={developmentCopy.candidate.noMatchDescription} />;
  }
  if (state.kind === 'exhausted') {
    return <EmptyState title={developmentCopy.candidate.exhaustedTitle} description={developmentCopy.candidate.exhaustedDescription} />;
  }
  const { candidate } = state;
  return (
    <Card accessibilityLabel={candidate.title} variant="elevated">
      <AppText accessibilityRole="header" variant="title">{candidate.title}</AppText>
      <AppText tone="secondary">{candidate.description}</AppText>
      <View accessibilityLabel={`${developmentCopy.candidate.category}: ${candidate.category}`}><AppText variant="label">{developmentCopy.candidate.category}</AppText><AppText>{candidate.category}</AppText></View>
      <AppText>{`${developmentCopy.candidate.duration}: ${candidate.duration}`}</AppText>
      <AppText>{`${developmentCopy.candidate.cost}: ${candidate.cost}`}</AppText>
      {candidate.distance ? <AppText>{`${developmentCopy.candidate.distance}: ${candidate.distance}`}</AppText> : null}
      <AppText>{`${developmentCopy.candidate.difficulty}: ${candidate.difficulty}`}</AppText>
      <AppText>{`${developmentCopy.candidate.xp}: ${candidate.xp}`}</AppText>
      <AppText variant="label">{developmentCopy.candidate.instructions}</AppText><AppText>{candidate.instructions}</AppText>
      <AppText variant="label">{developmentCopy.candidate.safety}</AppText><AppText>{candidate.safety}</AppText>
      <Button onPress={onAccept}>{developmentCopy.candidate.accept}</Button>
      <Button onPress={onReroll} variant="secondary">{developmentCopy.candidate.reroll}</Button>
      {onAdjustFilters ? <Button onPress={onAdjustFilters} variant="ghost">{developmentCopy.candidate.relaxFilters}</Button> : null}
    </Card>
  );
}

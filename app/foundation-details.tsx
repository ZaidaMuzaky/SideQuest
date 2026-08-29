import { Link } from 'expo-router';
import { type PropsWithChildren, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import {
  AppText,
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
} from '@/components/ui';
import { showcaseCopy } from '@/constants/showcase-copy';
import { spacing, type ThemePreference, useTheme } from '@/theme';

export default function FoundationDetailsScreen() {
  const { preference, setPreference } = useTheme();
  const [name, setName] = useState('');

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <AppText variant="display">{showcaseCopy.pageTitle}</AppText>
        <AppText tone="secondary">{showcaseCopy.pageDescription}</AppText>
        <Link asChild href="/">
          <Button variant="ghost">{showcaseCopy.back}</Button>
        </Link>
      </View>

      <ShowcaseSection
        description={showcaseCopy.themeDescription}
        title={showcaseCopy.themeTitle}
      >
        <View style={styles.rowWrap}>
          {(
            Object.entries(showcaseCopy.themeOptions) as [
              ThemePreference,
              string,
            ][]
          ).map(([value, label]) => (
            <Chip
              key={value}
              label={label}
              onPress={() => setPreference(value)}
              selected={preference === value}
            />
          ))}
        </View>
      </ShowcaseSection>

      <ShowcaseSection title={showcaseCopy.colorsTitle}>
        <View style={styles.swatches}>
          <ColorSwatch className="bg-primary" label={showcaseCopy.colorLabels.primary} />
          <ColorSwatch className="bg-accent" label={showcaseCopy.colorLabels.accent} />
          <ColorSwatch className="bg-success" label={showcaseCopy.colorLabels.success} />
          <ColorSwatch className="bg-warning" label={showcaseCopy.colorLabels.warning} />
          <ColorSwatch className="bg-danger" label={showcaseCopy.colorLabels.danger} />
        </View>
      </ShowcaseSection>

      <ShowcaseSection title={showcaseCopy.typographyTitle}>
        <View style={styles.stack}>
          <AppText variant="display">{showcaseCopy.typographySamples.display}</AppText>
          <AppText variant="heading">{showcaseCopy.typographySamples.heading}</AppText>
          <AppText variant="title">{showcaseCopy.typographySamples.title}</AppText>
          <AppText>{showcaseCopy.typographySamples.body}</AppText>
          <AppText variant="bodySmall">{showcaseCopy.typographySamples.bodySmall}</AppText>
          <AppText variant="label">{showcaseCopy.typographySamples.label}</AppText>
          <AppText tone="secondary" variant="caption">
            {showcaseCopy.typographySamples.caption}
          </AppText>
        </View>
      </ShowcaseSection>

      <ShowcaseSection title={showcaseCopy.buttonsTitle}>
        <View style={styles.stack}>
          <Button>{showcaseCopy.buttons.primary}</Button>
          <Button variant="secondary">{showcaseCopy.buttons.secondary}</Button>
          <Button variant="ghost">{showcaseCopy.buttons.ghost}</Button>
          <Button variant="danger">{showcaseCopy.buttons.danger}</Button>
          <Button disabled>{showcaseCopy.buttons.disabled}</Button>
          <Button loading>{showcaseCopy.buttons.loading}</Button>
        </View>
      </ShowcaseSection>

      <ShowcaseSection title={showcaseCopy.chipsTitle}>
        <View style={styles.rowWrap}>
          <Chip label={showcaseCopy.chips.default} />
          <Chip label={showcaseCopy.chips.selected} selected />
          <Chip disabled label={showcaseCopy.chips.disabled} />
        </View>
      </ShowcaseSection>

      <ShowcaseSection title={showcaseCopy.inputsTitle}>
        <Input
          helperText={showcaseCopy.inputs.helper}
          label={showcaseCopy.inputs.label}
          onChangeText={setName}
          placeholder={showcaseCopy.inputs.placeholder}
          value={name}
        />
        <Input
          errorMessage={showcaseCopy.inputs.error}
          label={showcaseCopy.inputs.label}
          value="A"
        />
        <Input
          disabled
          label={showcaseCopy.inputs.disabledLabel}
          value={showcaseCopy.inputs.disabledValue}
        />
      </ShowcaseSection>

      <ShowcaseSection title={showcaseCopy.cardsTitle}>
        <Card>
          <AppText variant="title">{showcaseCopy.cards.defaultTitle}</AppText>
          <AppText tone="secondary" variant="bodySmall">
            {showcaseCopy.cards.defaultBody}
          </AppText>
        </Card>
        <Card variant="elevated">
          <AppText variant="title">{showcaseCopy.cards.elevatedTitle}</AppText>
          <AppText tone="secondary" variant="bodySmall">
            {showcaseCopy.cards.elevatedBody}
          </AppText>
        </Card>
        <Card
          accessibilityLabel={showcaseCopy.cards.interactiveTitle}
          onPress={() => undefined}
          variant="interactive"
        >
          <AppText variant="title">{showcaseCopy.cards.interactiveTitle}</AppText>
          <AppText tone="secondary" variant="bodySmall">
            {showcaseCopy.cards.interactiveBody}
          </AppText>
        </Card>
      </ShowcaseSection>

      <ShowcaseSection title={showcaseCopy.statesTitle}>
        <Card>
          <LoadingState message={showcaseCopy.states.loading} />
        </Card>
        <Card>
          <EmptyState
            description={showcaseCopy.states.emptyBody}
            title={showcaseCopy.states.emptyTitle}
          />
        </Card>
        <Card>
          <ErrorState
            description={showcaseCopy.states.errorBody}
            onRetry={() => undefined}
            retryLabel={showcaseCopy.states.retry}
            title={showcaseCopy.states.errorTitle}
          />
        </Card>
      </ShowcaseSection>
    </ScrollView>
  );
}

function ShowcaseSection({
  children,
  description,
  title,
}: PropsWithChildren<{ description?: string; title: string }>) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        <AppText variant="heading">{title}</AppText>
        {description ? (
          <AppText tone="secondary" variant="bodySmall">
            {description}
          </AppText>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function ColorSwatch({ className, label }: { className: string; label: string }) {
  return (
    <View style={styles.swatchItem}>
      <View
        accessibilityLabel={`${label} color`}
        className={`h-12 w-12 rounded-xl ${className}`}
      />
      <AppText variant="caption">{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing[10],
    paddingBottom: spacing[12],
    paddingHorizontal: spacing[5],
    paddingTop: spacing[8],
  },
  header: {
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  section: {
    gap: spacing[4],
  },
  sectionHeading: {
    gap: spacing[1],
  },
  stack: {
    gap: spacing[3],
  },
  swatches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[4],
  },
  swatchItem: {
    alignItems: 'center',
    gap: spacing[2],
  },
});

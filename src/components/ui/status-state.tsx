import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { spacing, useTheme } from '@/theme';

import { AppText } from './app-text';
import { Button } from './button';

type StateLayoutProps = {
  description?: string;
  title: string;
};

function StateLayout({ description, title }: StateLayoutProps) {
  return (
    <View style={styles.copy}>
      <AppText style={styles.centerText} variant="title">
        {title}
      </AppText>
      {description ? (
        <AppText style={styles.centerText} tone="secondary" variant="bodySmall">
          {description}
        </AppText>
      ) : null}
    </View>
  );
}

export function LoadingState({ message }: { message: string }) {
  const { colors } = useTheme();

  return (
    <View
      accessibilityLabel={message}
      accessibilityLiveRegion="polite"
      accessibilityRole="progressbar"
      style={styles.container}
    >
      <ActivityIndicator color={colors.primary} size="small" />
      <AppText tone="secondary" variant="bodySmall">
        {message}
      </AppText>
    </View>
  );
}

export function EmptyState(props: StateLayoutProps) {
  return (
    <View style={styles.container}>
      <StateLayout {...props} />
    </View>
  );
}

type ErrorStateProps = StateLayoutProps & {
  onRetry?: () => void;
  retryLabel: string;
};

export function ErrorState({
  onRetry,
  retryLabel,
  ...props
}: ErrorStateProps) {
  return (
    <View accessibilityLiveRegion="polite" style={styles.container}>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no"
        className="h-2 w-10 rounded-full bg-danger"
      />
      <StateLayout {...props} />
      {onRetry ? (
        <Button onPress={onRetry} variant="secondary">
          {retryLabel}
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing[3],
    justifyContent: 'center',
    padding: spacing[5],
  },
  copy: {
    alignItems: 'center',
    gap: spacing[1],
  },
  centerText: {
    textAlign: 'center',
  },
});

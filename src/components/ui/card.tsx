import type { PropsWithChildren } from 'react';
import {
  Pressable,
  type PressableProps,
  StyleSheet,
  View,
  type ViewProps,
} from 'react-native';

import { elevation, radius, spacing, useTheme } from '@/theme';

type CardVariant = 'default' | 'elevated' | 'interactive';

type CardProps = PropsWithChildren<
  ViewProps & {
    accessibilityLabel?: string;
    onPress?: PressableProps['onPress'];
    variant?: CardVariant;
  }
>;

export function Card({
  accessibilityLabel,
  children,
  onPress,
  style,
  variant = 'default',
  ...props
}: CardProps) {
  const { colors } = useTheme();
  const sharedStyle = [
    styles.base,
    {
      backgroundColor:
        variant === 'elevated' ? colors.surfaceElevated : colors.surface,
      borderColor: colors.border,
    },
    variant === 'elevated' ? elevation.raised : elevation.none,
    style,
  ];

  if (variant === 'interactive') {
    return (
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          ...sharedStyle,
          { backgroundColor: pressed ? colors.surfaceElevated : colors.surface },
        ]}
        {...props}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={sharedStyle} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.large,
    borderWidth: 1,
    gap: spacing[2],
    padding: spacing[4],
  },
});

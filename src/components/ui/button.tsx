import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  StyleSheet,
  View,
} from 'react-native';

import { radius, spacing, useTheme } from '@/theme';

import { AppText } from './app-text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

type ButtonProps = Omit<PressableProps, 'children' | 'disabled'> & {
  children: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  variant?: ButtonVariant;
};

export function Button({
  accessibilityLabel,
  children,
  disabled = false,
  loading = false,
  onPress,
  style,
  variant = 'primary',
  ...props
}: ButtonProps) {
  const { colors } = useTheme();
  const isBlocked = disabled || loading;

  const background = {
    primary: colors.primary,
    secondary: colors.surface,
    ghost: 'transparent',
    danger: colors.danger,
  }[variant];
  const pressedBackground = {
    primary: colors.primaryPressed,
    secondary: colors.surfaceElevated,
    ghost: colors.surfaceElevated,
    danger: colors.dangerPressed,
  }[variant];
  const foreground =
    variant === 'primary'
      ? colors.onPrimary
      : variant === 'danger'
        ? colors.onDanger
        : colors.textPrimary;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled: isBlocked, busy: loading }}
      disabled={isBlocked}
      onPress={isBlocked ? undefined : onPress}
      style={(state) => [
        styles.base,
        {
          backgroundColor: isBlocked
            ? colors.disabled
            : state.pressed
              ? pressedBackground
              : background,
          borderColor:
            variant === 'secondary' ? colors.border : 'transparent',
        },
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}
    >
      <View style={styles.content}>
        <AppText
          accessibilityElementsHidden={loading}
          importantForAccessibility={loading ? 'no-hide-descendants' : 'auto'}
          style={{ color: isBlocked ? colors.disabledText : foreground }}
          variant="label"
        >
          {children}
        </AppText>
        {loading ? (
          <View pointerEvents="none" style={styles.loadingOverlay}>
            <ActivityIndicator
              accessible={false}
              importantForAccessibility="no"
              color={colors.disabledText}
              size="small"
            />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: radius.medium,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 48,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 20,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

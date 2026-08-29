import { Pressable, type PressableProps, StyleSheet, View } from 'react-native';

import { radius, spacing, useTheme } from '@/theme';

import { AppText } from './app-text';

type ChipProps = Omit<PressableProps, 'children' | 'disabled'> & {
  disabled?: boolean;
  label: string;
  selected?: boolean;
};

export function Chip({
  accessibilityLabel,
  disabled = false,
  label,
  onPress,
  selected = false,
  style,
  ...props
}: ChipProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={disabled ? undefined : onPress}
      style={(state) => [
        styles.base,
        {
          backgroundColor: disabled
            ? colors.disabled
            : selected
              ? colors.primary
              : state.pressed
                ? colors.surfaceElevated
                : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
        },
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}
    >
      {selected ? (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no"
          style={[styles.selectedMark, { backgroundColor: colors.onPrimary }]}
        />
      ) : null}
      <AppText
        style={{
          color: disabled
            ? colors.disabledText
            : selected
              ? colors.onPrimary
              : colors.textPrimary,
        }}
        variant="label"
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing[2],
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  selectedMark: {
    borderRadius: radius.pill,
    height: 8,
    width: 8,
  },
});

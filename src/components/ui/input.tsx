import { useId, useState } from 'react';
import { StyleSheet, TextInput, type TextInputProps, View } from 'react-native';

import { radius, spacing, typography, useTheme } from '@/theme';

import { AppText } from './app-text';

type InputProps = TextInputProps & {
  disabled?: boolean;
  errorMessage?: string;
  helperText?: string;
  label: string;
};

export function Input({
  accessibilityLabel,
  disabled,
  editable,
  errorMessage,
  helperText,
  label,
  onBlur,
  onFocus,
  style,
  ...props
}: InputProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const descriptionId = useId();
  const isDisabled = disabled === true || editable === false;
  const description = errorMessage ?? helperText;

  return (
    <View style={styles.container}>
      <AppText nativeID={`${descriptionId}-label`} variant="label">
        {label}
      </AppText>
      <TextInput
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ disabled: isDisabled }}
        accessibilityHint={description}
        aria-describedby={description ? descriptionId : undefined}
        editable={!isDisabled}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        placeholderTextColor={colors.textSecondary}
        selectionColor={colors.primary}
        style={[
          styles.input,
          typography.body,
          {
            backgroundColor: isDisabled ? colors.disabled : colors.surface,
            borderColor: errorMessage
              ? colors.danger
              : focused
                ? colors.focus
                : colors.border,
            borderWidth: focused || errorMessage ? 2 : 1,
            color: isDisabled ? colors.disabledText : colors.textPrimary,
          },
          style,
        ]}
        {...props}
      />
      {description ? (
        <AppText
          accessibilityLiveRegion={errorMessage ? 'polite' : 'none'}
          nativeID={descriptionId}
          tone={errorMessage ? 'danger' : 'secondary'}
          variant="caption"
        >
          {errorMessage ?? helperText}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[2],
    width: '100%',
  },
  input: {
    borderRadius: radius.medium,
    minHeight: 48,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
});

import type { ComponentProps } from 'react';
import { Text } from 'react-native';

import { typography } from '@/theme';

export type TextVariant = keyof typeof typography;

type AppTextProps = ComponentProps<typeof Text> & {
  tone?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  variant?: TextVariant;
};

const toneClasses: Record<NonNullable<AppTextProps['tone']>, string> = {
  primary: 'text-text-primary',
  secondary: 'text-text-secondary',
  danger: 'text-danger',
  success: 'text-success',
  warning: 'text-warning',
};

export function AppText({
  className = '',
  style,
  tone = 'primary',
  variant = 'body',
  ...props
}: AppTextProps) {
  return (
    <Text
      className={`${toneClasses[tone]} ${className}`.trim()}
      maxFontSizeMultiplier={2}
      style={[typography[variant], style]}
      {...props}
    />
  );
}

import type { TextStyle, ViewStyle } from 'react-native';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
} as const;

export const radius = {
  small: 8,
  medium: 12,
  large: 16,
  extraLarge: 20,
  pill: 999,
} as const;

export const fontSize = {
  display: 32,
  heading: 28,
  title: 18,
  body: 16,
  bodySmall: 14,
  label: 14,
  caption: 12,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const satisfies Record<string, NonNullable<TextStyle['fontWeight']>>;

export const lineHeight = {
  display: 38,
  heading: 34,
  title: 24,
  body: 24,
  bodySmall: 20,
  label: 20,
  caption: 16,
} as const;

export const typography = {
  display: {
    fontSize: fontSize.display,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.display,
  },
  heading: {
    fontSize: fontSize.heading,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.heading,
  },
  title: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.title,
  },
  body: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.body,
  },
  bodySmall: {
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.bodySmall,
  },
  label: {
    fontSize: fontSize.label,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.label,
  },
  caption: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.caption,
  },
} as const satisfies Record<string, TextStyle>;

export const colorThemes = {
  light: {
    background: '#F8F7F4',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    textPrimary: '#141823',
    textSecondary: '#525B6F',
    border: '#D5D9E2',
    primary: '#4F46E5',
    primaryPressed: '#4338CA',
    accent: '#0D9488',
    success: '#167D52',
    warning: '#B45309',
    danger: '#BE2737',
    dangerPressed: '#9F202F',
    focus: '#4338CA',
    disabled: '#E2E4EA',
    disabledText: '#646C7E',
    onPrimary: '#FFFFFF',
    onDanger: '#FFFFFF',
  },
  dark: {
    background: '#0C111D',
    surface: '#161D2D',
    surfaceElevated: '#1E273A',
    textPrimary: '#F5F7FB',
    textSecondary: '#B2BACB',
    border: '#3E485D',
    primary: '#818CF8',
    primaryPressed: '#A5B4FC',
    accent: '#2DD4BF',
    success: '#4ADE80',
    warning: '#FBBF24',
    danger: '#FB7185',
    dangerPressed: '#FDA4AF',
    focus: '#A5B4FC',
    disabled: '#313A4C',
    disabledText: '#A3ACC0',
    onPrimary: '#11152A',
    onDanger: '#2B0C13',
  },
} as const;

export type ThemeColors = (typeof colorThemes)[ResolvedTheme];

export const elevation = {
  none: {} satisfies ViewStyle,
  raised: {
    elevation: 3,
    shadowColor: '#080C16',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  } satisfies ViewStyle,
  floating: {
    elevation: 6,
    shadowColor: '#080C16',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
  } satisfies ViewStyle,
} as const;

export const themeTokens = {
  colors: colorThemes,
  spacing,
  radius,
  typography,
  fontSize,
  fontWeight,
  lineHeight,
  elevation,
} as const;

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
  small: 10,
  medium: 14,
  large: 20,
  extraLarge: 28,
  pill: 999,
} as const;

export const fontSize = {
  display: 38,
  heading: 30,
  title: 20,
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
    background: '#F4F7F5',
    surface: '#FFFFFF',
    surfaceElevated: '#EAF1EC',
    textPrimary: '#14251D',
    textSecondary: '#587066',
    border: '#D3E1D8',
    primary: '#D95D39',
    primaryPressed: '#B94829',
    accent: '#2F7D68',
    success: '#167D52',
    warning: '#B45309',
    danger: '#BE2737',
    dangerPressed: '#9F202F',
    focus: '#2F7D68',
    disabled: '#DCE6DF',
    disabledText: '#708279',
    onPrimary: '#FFFFFF',
    onDanger: '#FFFFFF',
  },
  dark: {
    background: '#0D1914',
    surface: '#14251D',
    surfaceElevated: '#1B3328',
    textPrimary: '#F2F7F3',
    textSecondary: '#A9C1B3',
    border: '#315141',
    primary: '#F07852',
    primaryPressed: '#FF9672',
    accent: '#65C7A4',
    success: '#4ADE80',
    warning: '#FBBF24',
    danger: '#FB7185',
    dangerPressed: '#FDA4AF',
    focus: '#65C7A4',
    disabled: '#294337',
    disabledText: '#91A99B',
    onPrimary: '#1B160F',
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

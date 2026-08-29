import {
  createContext,
  type PropsWithChildren,
  useContext,
  useMemo,
  useState,
} from 'react';
import { type ColorSchemeName, useColorScheme, View } from 'react-native';
import { vars } from 'nativewind';

import {
  colorThemes,
  type ResolvedTheme,
  type ThemeColors,
  type ThemePreference,
} from './tokens';

type ThemeContextValue = {
  colors: ThemeColors;
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function resolveThemePreference(
  preference: ThemePreference,
  systemTheme: ColorSchemeName | null | undefined,
): ResolvedTheme {
  if (preference !== 'system') {
    return preference;
  }

  return systemTheme === 'dark' ? 'dark' : 'light';
}

function toRgbChannels(hex: string): string {
  const normalized = hex.replace('#', '');
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  return `${red} ${green} ${blue}`;
}

function createNativeWindVariables(colors: ThemeColors) {
  return vars({
    '--color-background': toRgbChannels(colors.background),
    '--color-surface': toRgbChannels(colors.surface),
    '--color-surface-elevated': toRgbChannels(colors.surfaceElevated),
    '--color-text-primary': toRgbChannels(colors.textPrimary),
    '--color-text-secondary': toRgbChannels(colors.textSecondary),
    '--color-border': toRgbChannels(colors.border),
    '--color-primary': toRgbChannels(colors.primary),
    '--color-primary-pressed': toRgbChannels(colors.primaryPressed),
    '--color-accent': toRgbChannels(colors.accent),
    '--color-success': toRgbChannels(colors.success),
    '--color-warning': toRgbChannels(colors.warning),
    '--color-danger': toRgbChannels(colors.danger),
    '--color-danger-pressed': toRgbChannels(colors.dangerPressed),
    '--color-focus': toRgbChannels(colors.focus),
    '--color-disabled': toRgbChannels(colors.disabled),
    '--color-disabled-text': toRgbChannels(colors.disabledText),
  });
}

type ThemeProviderProps = PropsWithChildren<{
  initialPreference?: ThemePreference;
}>;

export function ThemeProvider({
  children,
  initialPreference = 'system',
}: ThemeProviderProps) {
  const systemTheme = useColorScheme();
  const [preference, setPreference] = useState(initialPreference);
  const resolvedTheme = resolveThemePreference(preference, systemTheme);
  const colors = colorThemes[resolvedTheme];
  const nativeWindVariables = useMemo(
    () => createNativeWindVariables(colors),
    [colors],
  );
  const value = useMemo(
    () => ({ colors, preference, resolvedTheme, setPreference }),
    [colors, preference, resolvedTheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      <View className="flex-1 bg-background" style={nativeWindVariables}>
        {children}
      </View>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);

  if (!value) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return value;
}

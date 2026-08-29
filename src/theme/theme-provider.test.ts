import { resolveThemePreference } from './theme-provider';

describe('SQ-0002 theme resolution', () => {
  it.each([
    ['system', 'dark', 'dark'],
    ['system', 'light', 'light'],
    ['system', null, 'light'],
    ['light', 'dark', 'light'],
    ['dark', 'light', 'dark'],
  ] as const)(
    'resolves %s with a %s system theme to %s',
    (preference, systemTheme, expected) => {
      expect(resolveThemePreference(preference, systemTheme)).toBe(expected);
    },
  );
});

import { createTranslator, DEFAULT_LOCALE, resolveLocale } from './index';

test('SQ-0008 defaults to Indonesian locale and falls back to English', () => {
  expect(DEFAULT_LOCALE).toBe('id-ID');
  expect(createTranslator({ greeting: 'Hello', save: 'Save' }, { greeting: 'Halo' })('greeting')).toBe('Halo');
  expect(createTranslator({ greeting: 'Hello', save: 'Save' }, { greeting: 'Halo' })('save')).toBe('Save');
});

test('SQ-0008 normalizes locale tags safely', () => {
  expect(resolveLocale('id-ID')).toBe('id-ID');
  expect(resolveLocale('id')).toBe('id-ID');
  expect(resolveLocale('en-US')).toBe('en');
  expect(resolveLocale(undefined)).toBe('en');
});

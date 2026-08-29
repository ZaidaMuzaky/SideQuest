import { Linking } from 'react-native';
import { buildQuestMapUri, openQuestMapUri } from './map-link';

test('SQ-0403 builds an allowlisted HTTPS map URI from snapshotted public coordinates', () => {
  expect(buildQuestMapUri({ name: 'Museum', latitude: -6.2, longitude: 106.8, externalMapUrl: 'https://evil.test' }))
    .toBe('https://www.google.com/maps/search/?api=1&query=-6.2%2C106.8%20(Museum)');
});

test.each([
  [{ name: 'Bad latitude', latitude: 91, longitude: 10 }],
  [{ name: 'Missing longitude', latitude: -6.2 }],
  [{ name: 'Unsafe scheme', externalMapUrl: 'javascript:alert(1)' }],
  [{ name: 'Untrusted host', externalMapUrl: 'https://example.test/maps' }],
  [undefined],
])('SQ-0403 rejects invalid or unavailable location input %#', (location) => {
  expect(buildQuestMapUri(location)).toBeNull();
});

test('SQ-0403 accepts only a validated HTTPS fallback host when coordinates are absent', () => {
  expect(buildQuestMapUri({ name: 'Park', externalMapUrl: 'https://maps.apple.com/?q=Park' }))
    .toBe('https://maps.apple.com/?q=Park');
});

test('SQ-0403 opens a validated URI only when the platform supports it', async () => {
  jest.spyOn(Linking, 'canOpenURL').mockResolvedValueOnce(true);
  const open = jest.spyOn(Linking, 'openURL').mockResolvedValueOnce(undefined);
  const uri = 'https://www.google.com/maps/search/?api=1&query=-6.2%2C106.8%20(Museum)';
  await expect(openQuestMapUri(uri)).resolves.toBe(true);
  expect(open).toHaveBeenCalledWith(uri);
});

test('SQ-0403 safely declines unsupported map apps', async () => {
  jest.spyOn(Linking, 'canOpenURL').mockResolvedValueOnce(false);
  await expect(openQuestMapUri('https://maps.apple.com/?q=Park')).resolves.toBe(false);
});

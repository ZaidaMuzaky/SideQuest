import * as Location from 'expo-location';
import { createForegroundLocationAdapter } from './foreground';

const now = 1_700_000_000_000;
const granted = { status: Location.PermissionStatus.GRANTED, granted: true, canAskAgain: true, expires: 'never' } as Location.PermissionResponse;
const denied = (canAskAgain: boolean) => ({ status: Location.PermissionStatus.DENIED, granted: false, canAskAgain, expires: 'never' }) as Location.PermissionResponse;

function deps(permission: Location.PermissionResponse, position?: Location.LocationObject) {
  return {
    getForegroundPermissionsAsync: jest.fn().mockResolvedValue(permission),
    requestForegroundPermissionsAsync: jest.fn().mockResolvedValue(permission),
    getCurrentPositionAsync: jest.fn().mockResolvedValue(position),
  };
}

test('SQ-0202 requests foreground permission at point of use and returns ephemeral coordinates', async () => {
  const d = deps(granted, { coords: { latitude: -6, longitude: 106, accuracy: 40 }, timestamp: now - 1_000 } as Location.LocationObject);
  const result = await createForegroundLocationAdapter(d, () => now).getForSearch();
  expect(result).toEqual({ status: 'granted', coordinate: { latitude: -6, longitude: 106, accuracyMeters: 40, timestamp: now - 1_000 } });
  expect(d.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
});

test('SQ-0202 permanently denied permission does not loop and exposes Settings fallback', async () => {
  const d = deps(denied(false));
  const result = await createForegroundLocationAdapter(d, () => now).getForSearch();
  expect(result).toEqual({ status: 'denied', canAskAgain: false, openSettings: true });
  expect(d.requestForegroundPermissionsAsync).toHaveBeenCalledTimes(1);
  expect(d.getCurrentPositionAsync).not.toHaveBeenCalled();
});

test('SQ-0202 rejects stale and inaccurate readings for safe fallback matching', async () => {
  const stale = deps(granted, { coords: { latitude: 1, longitude: 2, accuracy: 10 }, timestamp: now - 300_001 } as Location.LocationObject);
  expect(await createForegroundLocationAdapter(stale, () => now).getForSearch()).toEqual({ status: 'unavailable', reason: 'stale' });
  const inaccurate = deps(granted, { coords: { latitude: 1, longitude: 2, accuracy: 501 }, timestamp: now } as Location.LocationObject);
  expect(await createForegroundLocationAdapter(inaccurate, () => now).getForSearch()).toEqual({ status: 'unavailable', reason: 'inaccurate' });
});

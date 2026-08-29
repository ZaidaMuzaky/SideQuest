import * as Location from 'expo-location';

/** A deliberately short-lived point used only for a proximity search. */
export type EphemeralCoordinate = Readonly<{
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  timestamp: number;
}>;

export type ForegroundLocationState =
  | { status: 'granted'; coordinate: EphemeralCoordinate }
  | { status: 'denied'; canAskAgain: boolean; openSettings: boolean }
  | { status: 'unavailable'; reason: 'stale' | 'inaccurate' | 'error' };

export type ForegroundLocationAdapter = Readonly<{
  /** Call only after the user initiates a proximity-dependent search. */
  getForSearch(): Promise<ForegroundLocationState>;
}>;

export const LOCATION_POLICY = Object.freeze({
  maxAgeMs: 5 * 60 * 1000,
  maxAccuracyMeters: 500,
});

function isFresh(timestamp: number, now: number): boolean {
  return Number.isFinite(timestamp) && timestamp <= now && now - timestamp <= LOCATION_POLICY.maxAgeMs;
}

export function createForegroundLocationAdapter(
  dependencies: Pick<typeof Location, 'getForegroundPermissionsAsync' | 'requestForegroundPermissionsAsync' | 'getCurrentPositionAsync'> = Location,
  clock: () => number = Date.now,
): ForegroundLocationAdapter {
  return {
    async getForSearch(): Promise<ForegroundLocationState> {
      let permission: Location.PermissionResponse;
      try {
        permission = await dependencies.getForegroundPermissionsAsync();
        if (permission.status !== Location.PermissionStatus.GRANTED) {
          permission = await dependencies.requestForegroundPermissionsAsync();
        }
      } catch {
        return { status: 'unavailable', reason: 'error' };
      }

      if (permission.status !== Location.PermissionStatus.GRANTED) {
        return {
          status: 'denied',
          canAskAgain: permission.canAskAgain,
          // Settings is useful only for a permanent denial; avoid prompting loops.
          openSettings: !permission.canAskAgain,
        };
      }

      try {
        const position = await dependencies.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          mayShowUserSettingsDialog: false,
        });
        const accuracy = position.coords.accuracy ?? null;
        if (!isFresh(position.timestamp, clock())) return { status: 'unavailable', reason: 'stale' };
        if (accuracy !== null && (!Number.isFinite(accuracy) || accuracy > LOCATION_POLICY.maxAccuracyMeters)) {
          return { status: 'unavailable', reason: 'inaccurate' };
        }
        return {
          status: 'granted',
          coordinate: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracyMeters: accuracy,
            timestamp: position.timestamp,
          },
        };
      } catch {
        return { status: 'unavailable', reason: 'error' };
      }
    },
  };
}

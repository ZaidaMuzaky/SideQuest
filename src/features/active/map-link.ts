import { Linking } from 'react-native';

export type QuestLocationSnapshot = {
  name: string;
  latitude?: number;
  longitude?: number;
  externalMapUrl?: string;
  address?: string;
};

const allowedOverrideHosts = new Set(['www.google.com', 'maps.google.com', 'maps.apple.com']);

function finiteCoordinate(value: number | undefined, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

function validatedOverride(value?: string) {
  if (!value || value.length > 2048) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && allowedOverrideHosts.has(url.hostname.toLowerCase()) ? url.toString() : null;
  } catch {
    return null;
  }
}

export function buildQuestMapUri(location?: QuestLocationSnapshot): string | null {
  if (!location) return null;
  if (finiteCoordinate(location.latitude, -90, 90) && finiteCoordinate(location.longitude, -180, 180)) {
    const label = location.name.trim().slice(0, 200);
    const query = encodeURIComponent(`${location.latitude},${location.longitude}${label ? ` (${label})` : ''}`);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  }
  return validatedOverride(location.externalMapUrl);
}

export async function openQuestMapUri(uri: string): Promise<boolean> {
  if (!buildQuestMapUri({ name: '', externalMapUrl: uri })) return false;
  if (!await Linking.canOpenURL(uri)) return false;
  await Linking.openURL(uri);
  return true;
}

import * as Location from 'expo-location';
import { apiClient } from './apiClient';

/** The agent's / driver's working day (one per line, role and date) */
export interface Workday {
  id: string;
  line: string;
  role: string;
  date: string;
  startAt: string;
  startLoc?: { lat: number; lng: number };
  endAt?: string;
  endLoc?: { lat: number; lng: number };
}

export const LOCATION_TIMEOUT_MS = 8000;

/** Resolves with the promise's value, or null on error or after ms */
export const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T | null> =>
  new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      () => {
        clearTimeout(timer);
        resolve(null);
      }
    );
  });

/**
 * Current position, or null when permission is denied, GPS fails or it takes longer than ~8s.
 * Falls back to a recent last-known position (up to 5 min old) if a fresh fix is not available.
 */
const readPosition = async (): Promise<{ lat: number; lng: number } | null> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    return await readFix();
  } catch {
    // Location is optional; the workday is saved without it
    return null;
  }
};

/** Fresh fix within ~8s, else a last-known position up to 5 min old, else null. Permission must be granted already. */
export const readFix = async (): Promise<{ lat: number; lng: number } | null> => {
  const loc =
    (await withTimeout(Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }), LOCATION_TIMEOUT_MS)) ||
    (await withTimeout(Location.getLastKnownPositionAsync({ maxAge: 5 * 60 * 1000 }), 1000));
  return loc ? { lat: loc.coords.latitude, lng: loc.coords.longitude } : null;
};

const send = async (action: 'start' | 'end'): Promise<Workday> => {
  const pos = await readPosition();
  const { data } = await apiClient.post('/workday', pos ? { action, lat: pos.lat, lng: pos.lng } : { action });
  return data.workday;
};

/** True when the request never reached the server (no internet / server down) */
export const isNetworkError = (e: any) => !e?.response;

export const workdayService = {
  /** Today's workday, or null if not started yet */
  getToday: async (): Promise<Workday | null> => {
    const { data } = await apiClient.get('/workday/me');
    return data?.workday ?? null;
  },
  /** Start the day (a second start keeps the first time; after end it reopens the day) */
  start: () => send('start'),
  end: () => send('end'),
};

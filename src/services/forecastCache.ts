import type { Forecast, HorizonHours } from '@/src/types/electricity';

const CACHE_VERSION = 1;
const FRESH_FOR_MS = 15 * 60 * 1000;
const KEEP_FOR_MS = 7 * 24 * 60 * 60 * 1000;

interface CacheEntry {
  version: number;
  storedAt: number;
  forecast: Forecast;
}

export interface CachedForecast {
  forecast: Forecast;
  isStale: boolean;
}

function cacheKey(zoneId: string, horizon: HorizonHours): string {
  return `wattwise:forecast:${zoneId}:${horizon}`;
}

export function readForecastCache(
  zoneId: string,
  horizon: HorizonHours,
  now = Date.now(),
): CachedForecast | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(cacheKey(zoneId, horizon));
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    const age = now - entry.storedAt;
    if (entry.version !== CACHE_VERSION || age > KEEP_FOR_MS || !entry.forecast?.points) {
      window.localStorage.removeItem(cacheKey(zoneId, horizon));
      return null;
    }
    return { forecast: entry.forecast, isStale: age > FRESH_FOR_MS };
  } catch {
    return null;
  }
}

export function writeForecastCache(
  zoneId: string,
  horizon: HorizonHours,
  forecast: Forecast,
): void {
  if (typeof window === 'undefined') return;
  try {
    const entry: CacheEntry = { version: CACHE_VERSION, storedAt: Date.now(), forecast };
    window.localStorage.setItem(cacheKey(zoneId, horizon), JSON.stringify(entry));
  } catch {
    // A disabled or full browser cache must never break live data access.
  }
}

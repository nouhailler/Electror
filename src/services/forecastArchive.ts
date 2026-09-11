import type {
  ArchivedForecastPoint,
  Forecast,
  ForecastQuality,
  PricePoint,
} from '@/src/types/electricity';

const ARCHIVE_VERSION = 1;
const KEEP_FOR_MS = 14 * 24 * 60 * 60 * 1_000;

interface ArchiveEntry {
  version: number;
  points: ArchivedForecastPoint[];
}

function storageKey(zoneId: string): string {
  return `wattwise:forecast-archive:${zoneId}`;
}

function readArchive(zoneId: string): ArchivedForecastPoint[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey(zoneId)) ?? 'null') as ArchiveEntry | null;
    if (!parsed || parsed.version !== ARCHIVE_VERSION || !Array.isArray(parsed.points)) return [];
    return parsed.points.filter(
      (point) =>
        typeof point.datetime === 'string' &&
        Number.isFinite(point.predictedPrice) &&
        Date.parse(point.datetime) > Date.now() - KEEP_FOR_MS,
    );
  } catch {
    return [];
  }
}

export function compareForecastWithActual(
  actualPoints: PricePoint[],
  archivedPoints: ArchivedForecastPoint[],
): ForecastQuality | null {
  const archiveByTime = new Map(archivedPoints.map((point) => [point.datetime, point]));
  const differences = actualPoints
    .filter((point) => point.source === 'actual' && archiveByTime.has(point.datetime))
    .map((point) => point.price - (archiveByTime.get(point.datetime)?.predictedPrice ?? point.price));
  if (differences.length === 0) return null;
  return {
    matchedPoints: differences.length,
    meanAbsoluteError: differences.reduce((sum, value) => sum + Math.abs(value), 0) / differences.length,
    meanBias: differences.reduce((sum, value) => sum + value, 0) / differences.length,
  };
}

export function calculateStoredForecastQuality(forecast: Forecast): ForecastQuality | null {
  return compareForecastWithActual(forecast.points, readArchive(forecast.zoneId));
}

export function archiveForecast(forecast: Forecast): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = readArchive(forecast.zoneId);
    const byTime = new Map(existing.map((point) => [point.datetime, point]));
    for (const point of forecast.points) {
      if (point.source !== 'forecast' || byTime.has(point.datetime)) continue;
      byTime.set(point.datetime, {
        datetime: point.datetime,
        predictedPrice: point.price,
        capturedAt: forecast.fetchedAt,
      });
    }
    const points = [...byTime.values()]
      .sort((left, right) => Date.parse(left.datetime) - Date.parse(right.datetime))
      .slice(-500);
    const entry: ArchiveEntry = { version: ARCHIVE_VERSION, points };
    window.localStorage.setItem(storageKey(forecast.zoneId), JSON.stringify(entry));
  } catch {
    // Private browsing or a full storage quota must not prevent forecasts from loading.
  }
}

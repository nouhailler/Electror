import { classifyPrice } from '@/src/services/priceAnalysis';
import type {
  ElectricityMapsForecastResponse,
  ElectricityMapsPriceDatum,
  Forecast,
} from '@/src/types/electricity';

export class InvalidForecastResponseError extends Error {
  constructor(message = 'La réponse de prévision est invalide.') {
    super(message);
    this.name = 'InvalidForecastResponseError';
  }
}

function isValidDatum(value: unknown): value is ElectricityMapsPriceDatum {
  if (!value || typeof value !== 'object') return false;
  const datum = value as Partial<ElectricityMapsPriceDatum>;
  return (
    typeof datum.datetime === 'string' &&
    Number.isFinite(Date.parse(datum.datetime)) &&
    typeof datum.value === 'number' &&
    Number.isFinite(datum.value) &&
    typeof datum.unit === 'string' &&
    datum.unit.length > 0
  );
}

export function mapForecastResponse(
  input: unknown,
  fetchedAt = new Date().toISOString(),
): Forecast {
  if (!input || typeof input !== 'object') throw new InvalidForecastResponseError();
  const raw = input as Partial<ElectricityMapsForecastResponse>;
  if (typeof raw.zone !== 'string' || !Array.isArray(raw.data)) {
    throw new InvalidForecastResponseError();
  }

  const valid = raw.data
    .filter(isValidDatum)
    .sort((a, b) => Date.parse(a.datetime) - Date.parse(b.datetime));
  const prices = valid.map((point) => point.value);
  const unique = new Map(valid.map((point) => [point.datetime, point]));

  return {
    zoneId: raw.zone,
    unit: valid[0]?.unit ?? 'EUR/MWh',
    temporalGranularity: raw.temporalGranularity ?? valid[0]?.temporalGranularity ?? 'hourly',
    fetchedAt,
    points: [...unique.values()].map((point) => ({
      datetime: point.datetime,
      price: point.value,
      unit: point.unit,
      category: classifyPrice(point.value, prices),
      source: 'forecast',
      updatedAt: point.updatedAt,
    })),
  };
}

import { classifyPrice } from '@/src/services/priceAnalysis';
import type {
  ElectricityMapsCarbonForecastResponse,
  ElectricityMapsEnergyResponse,
  ElectricityMapsForecastResponse,
  ElectricityMapsHistoryResponse,
  ElectricityMapsMixResponse,
  ElectricityMapsPriceDatum,
  ElectricityMapsSignalResponse,
  ElectricityMixPoint,
  EnergyData,
  Forecast,
  PricePoint,
  SignalSeries,
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

function mapPricePoints(data: unknown[]): PricePoint[] {
  const valid = data
    .filter(isValidDatum)
    .sort((a, b) => Date.parse(a.datetime) - Date.parse(b.datetime));
  const unique = [...new Map(valid.map((point) => [point.datetime, point])).values()];
  const prices = unique.map((point) => point.value);

  return unique.map((point) => ({
    datetime: point.datetime,
    price: point.value,
    unit: point.unit,
    category: classifyPrice(point.value, prices),
    source: point.source && !point.source.toLocaleLowerCase('en').includes('forecast')
      ? 'actual'
      : 'forecast',
    updatedAt: point.updatedAt,
  }));
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

  const points = mapPricePoints(raw.data);

  return {
    zoneId: raw.zone,
    unit: points[0]?.unit ?? 'EUR/MWh',
    temporalGranularity: raw.temporalGranularity ?? 'hourly',
    fetchedAt,
    points,
  };
}

function mapPriceHistory(input: unknown): PricePoint[] {
  if (!input || typeof input !== 'object') return [];
  const raw = input as Partial<ElectricityMapsHistoryResponse>;
  return Array.isArray(raw.history) ? mapPricePoints(raw.history) : [];
}

function mapCarbon(input: unknown): SignalSeries | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Partial<ElectricityMapsCarbonForecastResponse>;
  if (!Array.isArray(raw.forecast)) return null;
  const points = raw.forecast
    .filter(
      (point) =>
        point &&
        typeof point.datetime === 'string' &&
        Number.isFinite(Date.parse(point.datetime)) &&
        typeof point.carbonIntensity === 'number' &&
        Number.isFinite(point.carbonIntensity),
    )
    .sort((left, right) => Date.parse(left.datetime) - Date.parse(right.datetime))
    .map((point) => ({
      datetime: point.datetime,
      value: point.carbonIntensity,
      unit: 'gCO₂e/kWh',
      isEstimated: true,
      updatedAt: raw.updatedAt,
    }));
  return points.length > 0 ? { unit: 'gCO₂e/kWh', points } : null;
}

function mapSignal(input: unknown): SignalSeries | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Partial<ElectricityMapsSignalResponse>;
  if (!Array.isArray(raw.data)) return null;
  const points = raw.data
    .filter(
      (point) =>
        point &&
        typeof point.datetime === 'string' &&
        Number.isFinite(Date.parse(point.datetime)) &&
        typeof point.value === 'number' &&
        Number.isFinite(point.value),
    )
    .sort((left, right) => Date.parse(left.datetime) - Date.parse(right.datetime))
    .map((point) => ({
      datetime: point.datetime,
      value: point.value,
      unit: point.unit || raw.unit || '%',
      isEstimated: Boolean(point.isEstimated),
      updatedAt: point.updatedAt,
    }));
  return points.length > 0 ? { unit: points[0].unit, points } : null;
}

const RENEWABLE_SOURCES = new Set(['geothermal', 'biomass', 'wind', 'solar', 'hydro']);
const FOSSIL_SOURCES = new Set(['coal', 'gas', 'oil']);

function numericRecord(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, number] =>
        typeof entry[1] === 'number' && Number.isFinite(entry[1]),
    ),
  );
}

function mapMix(input: unknown): ElectricityMixPoint[] {
  if (!input || typeof input !== 'object') return [];
  const raw = input as Partial<ElectricityMapsMixResponse>;
  if (!Array.isArray(raw.data)) return [];

  return raw.data
    .filter(
      (point) =>
        point &&
        typeof point.datetime === 'string' &&
        Number.isFinite(Date.parse(point.datetime)) &&
        point.mix &&
        typeof point.mix === 'object',
    )
    .sort((left, right) => Date.parse(left.datetime) - Date.parse(right.datetime))
    .map((point) => {
      const sources = numericRecord(point.mix);
      const flows = numericRecord(point.mix.flows);
      const totalMw = Object.values(sources).reduce((sum, value) => sum + Math.max(0, value), 0);
      const renewableMw = Object.entries(sources).reduce(
        (sum, [source, value]) => sum + (RENEWABLE_SOURCES.has(source) ? Math.max(0, value) : 0),
        0,
      );
      const fossilMw = Object.entries(sources).reduce(
        (sum, [source, value]) => sum + (FOSSIL_SOURCES.has(source) ? Math.max(0, value) : 0),
        0,
      );
      return {
        datetime: point.datetime,
        unit: raw.unit ?? 'MW',
        sources,
        totalMw,
        renewableMw,
        fossilMw,
        renewableShare: totalMw > 0 ? (renewableMw / totalMw) * 100 : null,
        importsMw: flows.imports ?? 0,
        exportsMw: flows.exports ?? 0,
        isEstimated: Boolean(point.isEstimated),
        updatedAt: point.updatedAt,
      };
    });
}

export function mapEnergyResponse(
  input: unknown,
  fetchedAt = new Date().toISOString(),
): EnergyData {
  if (!input || typeof input !== 'object') throw new InvalidForecastResponseError();
  const raw = input as Partial<ElectricityMapsEnergyResponse>;
  if (!raw.price) throw new InvalidForecastResponseError();

  return {
    forecast: mapForecastResponse(raw.price, fetchedAt),
    carbon: mapCarbon(raw.carbon),
    renewable: mapSignal(raw.renewable),
    mix: mapMix(raw.mix),
    priceHistory: mapPriceHistory(raw.priceHistory),
    unavailableSignals: Array.isArray(raw.unavailableSignals)
      ? raw.unavailableSignals.filter((item): item is string => typeof item === 'string')
      : [],
    forecastQuality: null,
  };
}

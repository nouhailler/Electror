export type HorizonHours = 24 | 48 | 72;

export type PriceSource = 'actual' | 'forecast';

export type PriceCategory =
  | 'very-cheap'
  | 'cheap'
  | 'average'
  | 'expensive'
  | 'very-expensive';

export interface ElectricityMapsPriceDatum {
  zone: string;
  datetime: string;
  createdAt?: string;
  updatedAt?: string;
  value: number;
  unit: string;
  source?: string;
  temporalGranularity?: string;
}

export interface ElectricityMapsForecastResponse {
  zone: string;
  data: ElectricityMapsPriceDatum[];
  temporalGranularity?: string;
}

export interface ElectricityMapsHistoryResponse {
  zone: string;
  history: ElectricityMapsPriceDatum[];
  temporalGranularity?: string;
}

export interface ElectricityMapsCarbonDatum {
  datetime: string;
  carbonIntensity: number;
}

export interface ElectricityMapsCarbonForecastResponse {
  zone: string;
  forecast: ElectricityMapsCarbonDatum[];
  updatedAt?: string;
}

export interface ElectricityMapsSignalDatum {
  zone?: string;
  datetime: string;
  value: number;
  unit: string;
  updatedAt?: string;
  isEstimated?: boolean;
  estimationMethod?: string;
  flowTraced?: boolean;
}

export interface ElectricityMapsSignalResponse {
  zone: string;
  data: ElectricityMapsSignalDatum[];
  temporalGranularity?: string;
  unit?: string;
}

export interface ElectricityMapsMixDatum {
  datetime: string;
  updatedAt?: string;
  breakdownType?: string;
  isEstimated?: boolean;
  mix: Record<string, unknown>;
}

export interface ElectricityMapsMixResponse {
  zone: string;
  data: ElectricityMapsMixDatum[];
  temporalGranularity?: string;
  unit?: string;
}

export interface ElectricityMapsEnergyResponse {
  price: ElectricityMapsForecastResponse;
  carbon: ElectricityMapsCarbonForecastResponse | null;
  renewable: ElectricityMapsSignalResponse | null;
  mix: ElectricityMapsMixResponse | null;
  priceHistory: ElectricityMapsHistoryResponse | null;
  unavailableSignals: string[];
}

export interface PricePoint {
  datetime: string;
  price: number;
  unit: string;
  category: PriceCategory;
  source: PriceSource;
  updatedAt?: string;
}

export interface Forecast {
  zoneId: string;
  unit: string;
  temporalGranularity: string;
  fetchedAt: string;
  points: PricePoint[];
}

export interface SignalPoint {
  datetime: string;
  value: number;
  unit: string;
  isEstimated: boolean;
  updatedAt?: string;
}

export interface SignalSeries {
  unit: string;
  points: SignalPoint[];
}

export interface ElectricityMixPoint {
  datetime: string;
  unit: string;
  sources: Record<string, number>;
  totalMw: number;
  renewableMw: number;
  fossilMw: number;
  renewableShare: number | null;
  importsMw: number;
  exportsMw: number;
  isEstimated: boolean;
  updatedAt?: string;
}

export interface EnergyData {
  forecast: Forecast;
  carbon: SignalSeries | null;
  renewable: SignalSeries | null;
  mix: ElectricityMixPoint[];
  priceHistory: PricePoint[];
  unavailableSignals: string[];
  forecastQuality: ForecastQuality | null;
}

export interface ArchivedForecastPoint {
  datetime: string;
  predictedPrice: number;
  capturedAt: string;
}

export interface ForecastQuality {
  matchedPoints: number;
  meanAbsoluteError: number;
  meanBias: number;
}

export interface PriceStatistics {
  minimum: PricePoint;
  maximum: PricePoint;
  average: number;
}

export interface PriceWindow {
  start: string;
  end: string;
  durationMinutes: number;
  averagePrice: number;
  maximumPrice: number;
  savingsPerMWh: number;
  savingsPercent: number;
}

export interface PricePeriod {
  start: string;
  end: string;
  averagePrice: number;
}

export interface ForecastAnalysis {
  statistics: PriceStatistics;
  bestWindow: PriceWindow | null;
  nextPeak: PricePoint | null;
  nextCheapPeriod: PricePeriod | null;
  nextExpensivePeriod: PricePeriod | null;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
}

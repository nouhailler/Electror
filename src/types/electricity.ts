export type HorizonHours = 24 | 48 | 72;

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

export interface PricePoint {
  datetime: string;
  price: number;
  unit: string;
  category: PriceCategory;
  source: 'forecast';
  updatedAt?: string;
}

export interface Forecast {
  zoneId: string;
  unit: string;
  temporalGranularity: string;
  fetchedAt: string;
  points: PricePoint[];
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

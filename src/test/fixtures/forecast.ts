import type { ElectricityMapsForecastResponse } from '@/src/types/electricity';

export const apiForecastFixture: ElectricityMapsForecastResponse = {
  zone: 'FR',
  temporalGranularity: 'hourly',
  data: [
    {
      zone: 'FR',
      datetime: '2030-01-01T01:00:00.000Z',
      createdAt: '2029-12-31T11:30:00.000Z',
      updatedAt: '2029-12-31T12:00:00.000Z',
      value: 50,
      unit: 'EUR/MWh',
      source: 'settled_and_published_price',
      temporalGranularity: 'hourly',
    },
    {
      zone: 'FR',
      datetime: '2030-01-01T00:00:00.000Z',
      value: 90,
      unit: 'EUR/MWh',
      temporalGranularity: 'hourly',
    },
    {
      zone: 'FR',
      datetime: '2030-01-01T02:00:00.000Z',
      value: 140,
      unit: 'EUR/MWh',
      temporalGranularity: 'hourly',
    },
    {
      zone: 'FR',
      datetime: '2030-01-01T03:00:00.000Z',
      value: 70,
      unit: 'EUR/MWh',
      temporalGranularity: 'hourly',
    },
  ],
};

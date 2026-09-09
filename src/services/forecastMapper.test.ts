import { describe, expect, it } from 'vitest';
import { mapForecastResponse } from '@/src/services/forecastMapper';
import { apiForecastFixture } from '@/src/test/fixtures/forecast';

describe('mapForecastResponse', () => {
  it('transforme, trie et classe la réponse Electricity Maps', () => {
    const forecast = mapForecastResponse(apiForecastFixture, '2030-01-01T00:00:00.000Z');

    expect(forecast.zoneId).toBe('FR');
    expect(forecast.unit).toBe('EUR/MWh');
    expect(forecast.temporalGranularity).toBe('hourly');
    expect(forecast.points.map((point) => point.price)).toEqual([90, 50, 140, 70]);
    expect(forecast.points[0].source).toBe('forecast');
    expect(forecast.points[0].category).toBeDefined();
  });

  it('gère explicitement une réponse vide', () => {
    const forecast = mapForecastResponse({ zone: 'BE', data: [] });
    expect(forecast.points).toEqual([]);
    expect(forecast.unit).toBe('EUR/MWh');
  });

  it('ignore les points incomplets sans casser les points valides', () => {
    const forecast = mapForecastResponse({
      zone: 'FR',
      data: [...apiForecastFixture.data, { datetime: '2030-01-01T04:00:00Z', unit: 'EUR/MWh' }],
    });
    expect(forecast.points).toHaveLength(4);
  });
});

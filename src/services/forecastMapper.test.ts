import { describe, expect, it } from 'vitest';
import { mapEnergyResponse, mapForecastResponse } from '@/src/services/forecastMapper';
import { apiForecastFixture } from '@/src/test/fixtures/forecast';

describe('mapForecastResponse', () => {
  it('transforme, trie et classe la réponse Electricity Maps', () => {
    const forecast = mapForecastResponse(apiForecastFixture, '2030-01-01T00:00:00.000Z');

    expect(forecast.zoneId).toBe('FR');
    expect(forecast.unit).toBe('EUR/MWh');
    expect(forecast.temporalGranularity).toBe('hourly');
    expect(forecast.points.map((point) => point.price)).toEqual([90, 50, 140, 70]);
    expect(forecast.points[0].source).toBe('forecast');
    expect(forecast.points[1].source).toBe('actual');
    expect(forecast.points[0].category).toBeDefined();
  });

  it('regroupe les signaux prix, carbone, renouvelable, mix et historique', () => {
    const data = mapEnergyResponse({
      price: apiForecastFixture,
      carbon: {
        zone: 'FR',
        forecast: [{ datetime: '2030-01-01T00:00:00.000Z', carbonIntensity: 42 }],
      },
      renewable: {
        zone: 'FR',
        data: [{ datetime: '2030-01-01T00:00:00.000Z', value: 64, unit: '%' }],
      },
      mix: {
        zone: 'FR',
        unit: 'MW',
        data: [{
          datetime: '2030-01-01T00:00:00.000Z',
          mix: { nuclear: 60, wind: 20, solar: 10, gas: 10 },
        }],
      },
      priceHistory: {
        zone: 'FR',
        history: [apiForecastFixture.data[0]],
      },
      unavailableSignals: [],
    });

    expect(data.carbon?.points[0].value).toBe(42);
    expect(data.renewable?.points[0].value).toBe(64);
    expect(data.mix[0].renewableShare).toBe(30);
    expect(data.mix[0].fossilMw).toBe(10);
    expect(data.priceHistory[0].source).toBe('actual');
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

import { describe, expect, it } from 'vitest';
import { compareForecastWithActual } from '@/src/services/forecastArchive';
import type { ArchivedForecastPoint, PricePoint } from '@/src/types/electricity';

describe('forecastArchive', () => {
  it('calcule l’erreur absolue et le biais face aux prix publiés', () => {
    const actual: PricePoint[] = [
      { datetime: '2030-01-01T00:00:00.000Z', price: 80, unit: 'EUR/MWh', category: 'average', source: 'actual' },
      { datetime: '2030-01-01T01:00:00.000Z', price: 120, unit: 'EUR/MWh', category: 'expensive', source: 'actual' },
      { datetime: '2030-01-01T02:00:00.000Z', price: 90, unit: 'EUR/MWh', category: 'average', source: 'forecast' },
    ];
    const archived: ArchivedForecastPoint[] = [
      { datetime: '2030-01-01T00:00:00.000Z', predictedPrice: 100, capturedAt: '2029-12-31T00:00:00.000Z' },
      { datetime: '2030-01-01T01:00:00.000Z', predictedPrice: 100, capturedAt: '2029-12-31T00:00:00.000Z' },
    ];

    expect(compareForecastWithActual(actual, archived)).toEqual({
      matchedPoints: 2,
      meanAbsoluteError: 20,
      meanBias: 0,
    });
  });

  it('attend des correspondances avant de produire une métrique', () => {
    expect(compareForecastWithActual([], [])).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import { mapForecastResponse } from '@/src/services/forecastMapper';
import {
  calculateStatistics,
  classifyPrice,
  findBestWindow,
  findNextPeak,
} from '@/src/services/priceAnalysis';
import { apiForecastFixture } from '@/src/test/fixtures/forecast';

const points = mapForecastResponse(apiForecastFixture).points;

describe('priceAnalysis', () => {
  it('calcule le minimum, le maximum et la moyenne', () => {
    const statistics = calculateStatistics(points);
    expect(statistics?.minimum.price).toBe(50);
    expect(statistics?.maximum.price).toBe(140);
    expect(statistics?.average).toBe(87.5);
  });

  it('trouve le meilleur créneau pour une durée paramétrable', () => {
    const window = findBestWindow(points, 120, 87.5);
    expect(window?.start).toBe('2030-01-01T00:00:00.000Z');
    expect(window?.end).toBe('2030-01-01T02:00:00.000Z');
    expect(window?.averagePrice).toBe(70);
    expect(window?.maximumPrice).toBe(90);
    expect(window?.savingsPerMWh).toBe(17.5);
  });

  it('trouve le prochain pic parmi les données futures', () => {
    const peak = findNextPeak(points, Date.parse('2030-01-01T00:00:00.000Z'));
    expect(peak?.datetime).toBe('2030-01-01T02:00:00.000Z');
    expect(peak?.price).toBe(140);
  });

  it('classe les prix relativement à la période', () => {
    const prices = [0, 10, 20, 30, 40];
    expect(prices.map((price) => classifyPrice(price, prices))).toEqual([
      'very-cheap',
      'cheap',
      'average',
      'expensive',
      'very-expensive',
    ]);
  });

  it('retourne null pour des calculs sans donnée', () => {
    expect(calculateStatistics([])).toBeNull();
    expect(findBestWindow([], 60)).toBeNull();
    expect(findNextPeak([], Date.now())).toBeNull();
  });
});

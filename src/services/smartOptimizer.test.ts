import { describe, expect, it } from 'vitest';
import { DEFAULT_PLANNER_PREFERENCES } from '@/src/config/appliances';
import { findOptimizedWindow } from '@/src/services/smartOptimizer';
import type { PricePoint, SignalSeries } from '@/src/types/electricity';

const points: PricePoint[] = [
  { datetime: '2030-01-01T00:00:00.000Z', price: 20, unit: 'EUR/MWh', category: 'cheap', source: 'forecast' },
  { datetime: '2030-01-01T01:00:00.000Z', price: 30, unit: 'EUR/MWh', category: 'cheap', source: 'forecast' },
  { datetime: '2030-01-01T02:00:00.000Z', price: 80, unit: 'EUR/MWh', category: 'expensive', source: 'forecast' },
  { datetime: '2030-01-01T03:00:00.000Z', price: 90, unit: 'EUR/MWh', category: 'expensive', source: 'forecast' },
];

const carbon: SignalSeries = {
  unit: 'gCO₂e/kWh',
  points: [
    { datetime: '2030-01-01T00:00:00.000Z', value: 300, unit: 'gCO₂e/kWh', isEstimated: true },
    { datetime: '2030-01-01T01:00:00.000Z', value: 280, unit: 'gCO₂e/kWh', isEstimated: true },
    { datetime: '2030-01-01T02:00:00.000Z', value: 40, unit: 'gCO₂e/kWh', isEstimated: true },
    { datetime: '2030-01-01T03:00:00.000Z', value: 50, unit: 'gCO₂e/kWh', isEstimated: true },
  ],
};

const renewable: SignalSeries = {
  unit: '%',
  points: carbon.points.map((point) => ({ ...point, value: point.value < 100 ? 80 : 10, unit: '%' })),
};

describe('smartOptimizer', () => {
  it('choisit des créneaux différents selon le mode prix ou carbone', () => {
    const common = { ...DEFAULT_PLANNER_PREFERENCES, durationMinutes: 120 };
    const economical = findOptimizedWindow(points, carbon, renewable, { ...common, optimizationMode: 'economical' }, Date.parse('2029-12-31T23:00:00.000Z'));
    const ecological = findOptimizedWindow(points, carbon, renewable, { ...common, optimizationMode: 'ecological' }, Date.parse('2029-12-31T23:00:00.000Z'));

    expect(economical?.start).toBe('2030-01-01T00:00:00.000Z');
    expect(ecological?.start).toBe('2030-01-01T02:00:00.000Z');
    expect(ecological?.estimatedCarbonKg).toBeCloseTo(0.045);
  });

  it('respecte les bornes horaires et la puissance maximale du logement', () => {
    const constrained = findOptimizedWindow(points, carbon, renewable, {
      ...DEFAULT_PLANNER_PREFERENCES,
      durationMinutes: 60,
      optimizationMode: 'economical',
      earliestStart: '02:00',
      latestEnd: '04:00',
    }, Date.parse('2030-01-01T00:30:00.000Z'));
    const impossible = findOptimizedWindow(points, carbon, renewable, {
      ...DEFAULT_PLANNER_PREFERENCES,
      powerKw: 10,
      maxHomePowerKw: 9,
    }, Date.parse('2029-12-31T23:00:00.000Z'));

    expect(new Date(constrained?.start ?? '').getHours()).toBe(2);
    expect(impossible).toBeNull();
  });

  it('autorise un départ le jour même quand l’heure minimale est déjà passée', () => {
    const window = findOptimizedWindow(points, carbon, renewable, {
      ...DEFAULT_PLANNER_PREFERENCES,
      durationMinutes: 60,
      optimizationMode: 'economical',
      earliestStart: '00:00',
      latestEnd: '04:00',
    }, Date.parse('2030-01-01T00:30:00.000Z'));

    expect(new Date(window?.start ?? '').getHours()).toBe(2);
  });
});

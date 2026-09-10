import { describe, expect, it } from 'vitest';
import { calculateConsumptionEstimate, getCurrencyFromUnit } from '@/src/services/consumptionPlanner';
import type { PriceWindow } from '@/src/types/electricity';

const window: PriceWindow = {
  start: '2030-01-01T01:00:00.000Z',
  end: '2030-01-01T03:00:00.000Z',
  durationMinutes: 120,
  averagePrice: 50,
  maximumPrice: 60,
  savingsPerMWh: 30,
  savingsPercent: 37.5,
};

describe('consumptionPlanner', () => {
  it('estime l\'énergie, le coût et l\'économie du créneau', () => {
    const estimate = calculateConsumptionEstimate(window, 80, 2);

    expect(estimate?.energyKwh).toBe(4);
    expect(estimate?.estimatedCost).toBeCloseTo(0.2);
    expect(estimate?.referenceCost).toBeCloseTo(0.32);
    expect(estimate?.savings).toBeCloseTo(0.12);
  });

  it('refuse une puissance nulle ou invalide', () => {
    expect(calculateConsumptionEstimate(window, 80, 0)).toBeNull();
    expect(calculateConsumptionEstimate(window, 80, Number.NaN)).toBeNull();
  });

  it('déduit la devise de l\'unité Electricity Maps', () => {
    expect(getCurrencyFromUnit('EUR/MWh')).toBe('EUR');
    expect(getCurrencyFromUnit('GBP / MWh')).toBe('GBP');
    expect(getCurrencyFromUnit('custom')).toBe('custom');
  });
});

import { describe, expect, it } from 'vitest';
import { evaluateEnergyAlerts } from '@/src/services/energyAlerts';
import type { AlertPreferences } from '@/src/types/alerts';
import type { EnergyData } from '@/src/types/electricity';

const preferences: AlertPreferences = {
  enabled: true,
  priceBelow: 50,
  carbonBelow: 100,
  renewableAbove: 60,
  leadMinutes: 60,
};

const data: EnergyData = {
  forecast: {
    zoneId: 'FR',
    unit: 'EUR/MWh',
    temporalGranularity: 'hourly',
    fetchedAt: '2030-01-01T00:00:00.000Z',
    points: [
      { datetime: '2030-01-01T01:00:00.000Z', price: 45, unit: 'EUR/MWh', category: 'cheap', source: 'forecast' },
    ],
  },
  carbon: { unit: 'gCO₂e/kWh', points: [{ datetime: '2030-01-01T02:00:00.000Z', value: 80, unit: 'gCO₂e/kWh', isEstimated: true }] },
  renewable: { unit: '%', points: [{ datetime: '2030-01-01T03:00:00.000Z', value: 75, unit: '%', isEstimated: true }] },
  mix: [],
  priceHistory: [],
  unavailableSignals: [],
  forecastQuality: null,
};

describe('energyAlerts', () => {
  it('retourne la première occurrence future de chaque seuil par ordre chronologique', () => {
    const alerts = evaluateEnergyAlerts(data, preferences, Date.parse('2030-01-01T00:00:00.000Z'));
    expect(alerts.map((alert) => alert.kind)).toEqual(['price', 'carbon', 'renewable']);
  });

  it('ignore les points déjà passés', () => {
    const alerts = evaluateEnergyAlerts(data, preferences, Date.parse('2030-01-01T04:00:00.000Z'));
    expect(alerts).toEqual([]);
  });
});

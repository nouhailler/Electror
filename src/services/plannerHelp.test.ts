import { describe, it, expect } from 'vitest';
import { DEFAULT_PLANNER_PREFERENCES } from '@/src/config/appliances';
import { rechargeWarning } from './plannerHelp';
import { explainUnavailableWindow, findOptimizedWindow } from './smartOptimizer';
import type { PricePoint } from '@/src/types/electricity';

const now = new Date(2030, 0, 1, 9).getTime();
const points: PricePoint[] = Array.from({ length: 24 }, (_, index) => ({ datetime: new Date(now + index * 3600000).toISOString(), price: 50, unit: 'EUR/MWh', category: 'average', source: 'forecast' }));
const ev = { ...DEFAULT_PLANNER_PREFERENCES, applianceId: 'electric-car' as const, durationMinutes: 720, powerKw: 1, evBatteryCapacityKwh: 60, evCurrentPercent: 20, evTargetPercent: 80 };

describe('Aide au planificateur', () => {
  it('ne recommande pas une recharge tronquée à 12 h', () => {
    expect(rechargeWarning(ev)).toContain('38 %');
    expect(findOptimizedWindow(points, null, null, ev, now)).toBeNull();
  });
  it('signale une cible déjà atteinte', () => {
    expect(rechargeWarning({ ...ev, evTargetPercent: 20 })).toContain('déjà atteinte');
  });
  it('accepte une cible réalisable', () => {
    expect(rechargeWarning({ ...ev, powerKw: 7.4 })).toBeNull();
  });
  it('explique un dépassement de puissance', () => {
    expect(explainUnavailableWindow(points, { ...DEFAULT_PLANNER_PREFERENCES, powerKw: 10 }, now)).toContain('au-dessus');
  });
  it('distingue une durée non couverte des contraintes horaires', () => {
    expect(explainUnavailableWindow(points.slice(0, 1), { ...DEFAULT_PLANNER_PREFERENCES, durationMinutes: 120 }, now)).toContain('données continues');
    expect(explainUnavailableWindow(points, { ...DEFAULT_PLANNER_PREFERENCES, earliestStart: '10:00', latestEnd: '11:00', durationMinutes: 120 }, now)).toContain('horaires autorisés');
  });
  it('identifie les heures silencieuses bloquantes', () => {
    expect(explainUnavailableWindow(points, { ...DEFAULT_PLANNER_PREFERENCES, earliestStart: '10:00', latestEnd: '12:00', avoidQuietHours: true, quietStart: '09:00', quietEnd: '13:00' }, now)).toContain('heures silencieuses');
  });
});

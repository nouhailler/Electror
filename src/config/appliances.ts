import type { ApplianceId, AppliancePreset, PlannerPreferences } from '@/src/types/planner';

export const APPLIANCES: readonly AppliancePreset[] = [
  {
    id: 'washing-machine',
    name: 'Lave-linge',
    emoji: '🧺',
    durationMinutes: 120,
    powerKw: 0.5,
    description: 'Cycle standard estimé à 1 kWh',
  },
  {
    id: 'dishwasher',
    name: 'Lave-vaisselle',
    emoji: '🍽️',
    durationMinutes: 120,
    powerKw: 0.6,
    description: 'Cycle éco estimé à 1,2 kWh',
  },
  {
    id: 'dryer',
    name: 'Sèche-linge',
    emoji: '👕',
    durationMinutes: 90,
    powerKw: 1.7,
    description: 'Cycle moyen estimé à 2,6 kWh',
  },
  {
    id: 'water-heater',
    name: 'Chauffe-eau',
    emoji: '💧',
    durationMinutes: 180,
    powerKw: 2,
    description: 'Chauffe de ballon estimée à 6 kWh',
  },
  {
    id: 'electric-car',
    name: 'Voiture électrique',
    emoji: '🚗',
    durationMinutes: 240,
    powerKw: 7.4,
    description: 'Recharge domestique triphasée',
  },
  {
    id: 'custom',
    name: 'Appareil personnalisé',
    emoji: '🔌',
    durationMinutes: 60,
    powerKw: 1,
    description: 'Durée et puissance libres',
  },
] as const;

export const DURATION_OPTIONS = [30, 60, 90, 120, 180, 240, 360, 480, 600, 720] as const;

export const DEFAULT_PLANNER_PREFERENCES: PlannerPreferences = {
  applianceId: 'washing-machine',
  durationMinutes: 120,
  powerKw: 0.5,
  optimizationMode: 'balanced',
  priceWeight: 60,
  earliestStart: '',
  latestEnd: '',
  avoidQuietHours: false,
  quietStart: '22:00',
  quietEnd: '07:00',
  maxHomePowerKw: 9,
  evBatteryCapacityKwh: 60,
  evCurrentPercent: 30,
  evTargetPercent: 80,
};

export function getAppliance(id: ApplianceId): AppliancePreset {
  return APPLIANCES.find((appliance) => appliance.id === id) ?? APPLIANCES[0];
}

export function isApplianceId(value: unknown): value is ApplianceId {
  return typeof value === 'string' && APPLIANCES.some((appliance) => appliance.id === value);
}

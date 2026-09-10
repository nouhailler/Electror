export type ApplianceId =
  | 'washing-machine'
  | 'dishwasher'
  | 'dryer'
  | 'water-heater'
  | 'electric-car'
  | 'custom';

export interface AppliancePreset {
  id: ApplianceId;
  name: string;
  emoji: string;
  durationMinutes: number;
  powerKw: number;
  description: string;
}

export interface PlannerPreferences {
  applianceId: ApplianceId;
  durationMinutes: number;
  powerKw: number;
}

export interface ConsumptionEstimate {
  durationMinutes: number;
  powerKw: number;
  energyKwh: number;
  estimatedCost: number;
  referenceCost: number;
  savings: number;
}

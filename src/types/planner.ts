import type { PriceWindow } from '@/src/types/electricity';

export type ApplianceId =
  | 'washing-machine'
  | 'dishwasher'
  | 'dryer'
  | 'water-heater'
  | 'electric-car'
  | 'custom';

export type OptimizationMode = 'economical' | 'ecological' | 'balanced';

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
  optimizationMode: OptimizationMode;
  priceWeight: number;
  earliestStart: string;
  latestEnd: string;
  avoidQuietHours: boolean;
  quietStart: string;
  quietEnd: string;
  maxHomePowerKw: number;
  evBatteryCapacityKwh: number;
  evCurrentPercent: number;
  evTargetPercent: number;
}

export interface ConsumptionEstimate {
  durationMinutes: number;
  powerKw: number;
  energyKwh: number;
  estimatedCost: number;
  referenceCost: number;
  savings: number;
  carbonKg: number | null;
}

export interface OptimizedWindow extends PriceWindow {
  mode: OptimizationMode;
  score: number;
  averageCarbon: number | null;
  averageRenewable: number | null;
  estimatedCarbonKg: number | null;
  explanation: string;
}

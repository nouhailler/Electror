import type { PriceWindow } from '@/src/types/electricity';
import type { ConsumptionEstimate } from '@/src/types/planner';

export function calculateConsumptionEstimate(
  window: PriceWindow,
  referencePricePerMWh: number,
  powerKw: number,
): ConsumptionEstimate | null {
  if (
    !Number.isFinite(referencePricePerMWh) ||
    !Number.isFinite(powerKw) ||
    powerKw <= 0 ||
    window.durationMinutes <= 0
  ) {
    return null;
  }

  const energyKwh = powerKw * (window.durationMinutes / 60);
  const estimatedCost = (window.averagePrice * energyKwh) / 1_000;
  const referenceCost = (referencePricePerMWh * energyKwh) / 1_000;

  return {
    durationMinutes: window.durationMinutes,
    powerKw,
    energyKwh,
    estimatedCost,
    referenceCost,
    savings: Math.max(0, referenceCost - estimatedCost),
  };
}

export function getCurrencyFromUnit(unit: string): string {
  const match = unit.trim().match(/^([A-Z]{3})\s*\/\s*MWh$/i);
  return match?.[1]?.toUpperCase() ?? unit;
}

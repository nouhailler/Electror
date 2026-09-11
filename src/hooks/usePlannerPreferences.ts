'use client';

import { useEffect, useState } from 'react';
import {
  DEFAULT_PLANNER_PREFERENCES,
  DURATION_OPTIONS,
  getAppliance,
  isApplianceId,
} from '@/src/config/appliances';
import type { ApplianceId, PlannerPreferences } from '@/src/types/planner';

const STORAGE_KEY = 'wattwise:planner';

function sanitizePreferences(value: unknown): PlannerPreferences | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<PlannerPreferences>;
  const merged = { ...DEFAULT_PLANNER_PREFERENCES, ...candidate };
  if (
    !isApplianceId(merged.applianceId) ||
    !DURATION_OPTIONS.some((duration) => duration === merged.durationMinutes) ||
    !Number.isFinite(merged.powerKw) ||
    merged.powerKw < 0.1 ||
    merged.powerKw > 22 ||
    !['economical', 'ecological', 'balanced'].includes(merged.optimizationMode) ||
    !Number.isFinite(merged.priceWeight) ||
    merged.priceWeight < 0 ||
    merged.priceWeight > 100
  ) {
    return null;
  }
  return merged;
}

function calculateEvDuration(preferences: PlannerPreferences): number {
  const requestedEnergy =
    preferences.evBatteryCapacityKwh *
    Math.max(0, preferences.evTargetPercent - preferences.evCurrentPercent) /
    100 /
    0.9;
  const rawMinutes = (requestedEnergy / Math.max(0.1, preferences.powerKw)) * 60;
  const rounded = Math.ceil(rawMinutes / 30) * 30;
  return DURATION_OPTIONS.find((duration) => duration >= rounded) ?? 720;
}

export function usePlannerPreferences() {
  const [preferences, setPreferences] = useState<PlannerPreferences>(DEFAULT_PLANNER_PREFERENCES);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let saved: PlannerPreferences | null = null;
    try {
      saved = sanitizePreferences(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null'));
    } catch {
      // Ignore an invalid local preference and keep the safe defaults.
    }
    queueMicrotask(() => {
      if (saved) setPreferences(saved);
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences, ready]);

  const setApplianceId = (applianceId: ApplianceId) => {
    const preset = getAppliance(applianceId);
    setPreferences((current) => {
      const next = {
        ...current,
        applianceId,
        durationMinutes: preset.durationMinutes,
        powerKw: preset.powerKw,
      };
      return applianceId === 'electric-car'
        ? { ...next, durationMinutes: calculateEvDuration(next) }
        : next;
    });
  };

  const setDurationMinutes = (durationMinutes: number) => {
    if (!DURATION_OPTIONS.some((duration) => duration === durationMinutes)) return;
    setPreferences((current) => ({ ...current, durationMinutes }));
  };

  const setPowerKw = (powerKw: number) => {
    setPreferences((current) => {
      const next = {
        ...current,
        powerKw: Number.isFinite(powerKw) ? Math.min(22, Math.max(0, powerKw)) : 0,
      };
      return next.applianceId === 'electric-car'
        ? { ...next, durationMinutes: calculateEvDuration(next) }
        : next;
    });
  };

  const normalizePower = () => {
    setPreferences((current) => ({
      ...current,
      powerKw: Math.min(22, Math.max(0.1, current.powerKw || 0.1)),
    }));
  };

  const updatePreferences = (changes: Partial<PlannerPreferences>) => {
    setPreferences((current) => {
      const next = { ...current, ...changes };
      return next.applianceId === 'electric-car' && (
        changes.powerKw !== undefined ||
        changes.evBatteryCapacityKwh !== undefined ||
        changes.evCurrentPercent !== undefined ||
        changes.evTargetPercent !== undefined
      )
        ? { ...next, durationMinutes: calculateEvDuration(next) }
        : next;
    });
  };

  return {
    preferences,
    setApplianceId,
    setDurationMinutes,
    setPowerKw,
    normalizePower,
    updatePreferences,
  };
}

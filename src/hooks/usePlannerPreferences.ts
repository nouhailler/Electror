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
  if (
    !isApplianceId(candidate.applianceId) ||
    typeof candidate.durationMinutes !== 'number' ||
    !DURATION_OPTIONS.some((duration) => duration === candidate.durationMinutes) ||
    typeof candidate.powerKw !== 'number' ||
    !Number.isFinite(candidate.powerKw) ||
    candidate.powerKw < 0.1 ||
    candidate.powerKw > 22
  ) {
    return null;
  }
  return candidate as PlannerPreferences;
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
    setPreferences({
      applianceId,
      durationMinutes: preset.durationMinutes,
      powerKw: preset.powerKw,
    });
  };

  const setDurationMinutes = (durationMinutes: number) => {
    if (!DURATION_OPTIONS.some((duration) => duration === durationMinutes)) return;
    setPreferences((current) => ({ ...current, durationMinutes }));
  };

  const setPowerKw = (powerKw: number) => {
    setPreferences((current) => ({
      ...current,
      powerKw: Number.isFinite(powerKw) ? Math.min(22, Math.max(0, powerKw)) : 0,
    }));
  };

  const normalizePower = () => {
    setPreferences((current) => ({
      ...current,
      powerKw: Math.min(22, Math.max(0.1, current.powerKw || 0.1)),
    }));
  };

  return {
    preferences,
    setApplianceId,
    setDurationMinutes,
    setPowerKw,
    normalizePower,
  };
}

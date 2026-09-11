'use client';

import { useEffect, useMemo, useState } from 'react';
import { evaluateEnergyAlerts } from '@/src/services/energyAlerts';
import type { AlertPreferences } from '@/src/types/alerts';
import type { EnergyData } from '@/src/types/electricity';

const STORAGE_KEY = 'wattwise:alerts';
const SENT_KEY = 'wattwise:sent-alerts';
const DEFAULT_PREFERENCES: AlertPreferences = {
  enabled: false,
  priceBelow: 50,
  carbonBelow: 100,
  renewableAbove: 60,
  leadMinutes: 60,
};

function sanitize(value: unknown): AlertPreferences | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = { ...DEFAULT_PREFERENCES, ...(value as Partial<AlertPreferences>) };
  return typeof candidate.enabled === 'boolean' &&
    Number.isFinite(candidate.priceBelow) &&
    Number.isFinite(candidate.carbonBelow) &&
    Number.isFinite(candidate.renewableAbove) &&
    [15, 30, 60, 120].includes(candidate.leadMinutes)
    ? candidate
    : null;
}

export function useEnergyAlerts(data: EnergyData | null) {
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [ready, setReady] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');

  useEffect(() => {
    let saved: AlertPreferences | null = null;
    try {
      saved = sanitize(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null'));
    } catch {
      // Keep defaults when local preferences are invalid.
    }
    queueMicrotask(() => {
      if (saved) setPreferences(saved);
      setPermission('Notification' in window ? Notification.permission : 'unsupported');
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences, ready]);

  const alerts = useMemo(
    () => data ? evaluateEnergyAlerts(data, preferences) : [],
    [data, preferences],
  );

  useEffect(() => {
    if (!preferences.enabled || permission !== 'granted' || !('serviceWorker' in navigator)) return;
    const notifyBefore = Date.now() + preferences.leadMinutes * 60_000;
    const due = alerts.filter((alert) => Date.parse(alert.datetime) <= notifyBefore);
    if (due.length === 0) return;

    let sent: string[] = [];
    try {
      sent = JSON.parse(window.localStorage.getItem(SENT_KEY) ?? '[]') as string[];
    } catch {
      sent = [];
    }
    const sentSet = new Set(sent);
    const fresh = due.filter((alert) => !sentSet.has(`${alert.kind}:${alert.datetime}`));
    if (fresh.length === 0) return;

    void navigator.serviceWorker.ready.then(async (registration) => {
      for (const alert of fresh) {
        await registration.showNotification(`Wattwise · ${alert.title}`, {
          body: alert.message,
          icon: '/icon.svg',
          badge: '/icon.svg',
          tag: `wattwise-${alert.kind}-${alert.datetime}`,
          data: { url: '/#alertes' },
        });
        sentSet.add(`${alert.kind}:${alert.datetime}`);
      }
      window.localStorage.setItem(SENT_KEY, JSON.stringify([...sentSet].slice(-100)));
    });
  }, [alerts, permission, preferences.enabled, preferences.leadMinutes]);

  const updatePreferences = (changes: Partial<AlertPreferences>) => {
    setPreferences((current) => ({ ...current, ...changes }));
  };

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      setPermission('unsupported');
      return;
    }
    const next = await Notification.requestPermission();
    setPermission(next);
    if (next === 'granted') setPreferences((current) => ({ ...current, enabled: true }));
  };

  return { preferences, alerts, permission, updatePreferences, requestPermission };
}

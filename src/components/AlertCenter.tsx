'use client';

import { Bell, BellRing, Clock3, Leaf, Sparkles, Zap } from 'lucide-react';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import type { AlertPreferences, EnergyAlert } from '@/src/types/alerts';
import { formatDateTime } from '@/src/utils/format';

interface AlertCenterProps {
  preferences: AlertPreferences;
  alerts: EnergyAlert[];
  permission: NotificationPermission | 'unsupported';
  onUpdate: (changes: Partial<AlertPreferences>) => void;
  onRequestPermission: () => Promise<void>;
}

const ALERT_ICONS = {
  price: Zap,
  carbon: Leaf,
  renewable: Sparkles,
};

export function AlertCenter({
  preferences,
  alerts,
  permission,
  onUpdate,
  onRequestPermission,
}: AlertCenterProps) {
  return (
    <section
      id="alertes"
      className="mt-4 scroll-mt-24 rounded-[2rem] border border-border bg-card p-5 shadow-[0_8px_30px_var(--card-shadow)] sm:p-7"
      aria-labelledby="alerts-title"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Alertes intelligentes</p>
          <h2 id="alerts-title" className="mt-1 text-2xl font-black tracking-tight">Ne manquez plus un bon créneau</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Définissez vos seuils. Wattwise les vérifie à chaque actualisation et peut vous prévenir sur cet appareil.
          </p>
        </div>
        {permission !== 'granted' && permission !== 'unsupported' ? (
          <button
            type="button"
            onClick={() => void onRequestPermission()}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-black text-primary-foreground transition hover:brightness-95"
          >
            <BellRing className="size-4" aria-hidden /> Autoriser les notifications
          </button>
        ) : (
          <span className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-muted px-4 text-xs font-bold text-muted-foreground">
            <Bell className="size-4" aria-hidden />
            {permission === 'granted' ? 'Notifications autorisées' : 'Notifications non disponibles'}
          </span>
        )}
      </div>

      <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-muted/35 p-4">
        <input
          aria-label="Activer la surveillance des seuils énergétiques"
          type="checkbox"
          checked={preferences.enabled}
          onChange={(event) => onUpdate({ enabled: event.target.checked })}
          className="mt-0.5 size-5 accent-[var(--primary)]"
        />
        <span>
          <span className="block text-sm font-black">Activer la surveillance</span>
          <span className="mt-1 block text-xs leading-5 text-muted-foreground">
            Les réglages restent sur cet appareil. Aucune donnée personnelle n’est envoyée.
          </span>
        </span>
      </label>

      <div className="mt-4 grid gap-4 md:grid-cols-4">
        <ThresholdInput
          id="alert-price"
          label="Prix sous"
          value={preferences.priceBelow}
          unit="€/MWh"
          onChange={(priceBelow) => onUpdate({ priceBelow })}
        />
        <ThresholdInput
          id="alert-carbon"
          label="Carbone sous"
          value={preferences.carbonBelow}
          unit="g/kWh"
          onChange={(carbonBelow) => onUpdate({ carbonBelow })}
        />
        <ThresholdInput
          id="alert-renewable"
          label="Renouvelable dès"
          value={preferences.renewableAbove}
          unit="%"
          onChange={(renewableAbove) => onUpdate({ renewableAbove })}
        />
        <label htmlFor="alert-lead">
          <span className="mb-2 block text-sm font-bold">Prévenir avant</span>
          <NativeSelect
            id="alert-lead"
            value={String(preferences.leadMinutes)}
            onChange={(event) => onUpdate({ leadMinutes: Number(event.target.value) })}
            className="w-full [&_select]:h-12 [&_select]:rounded-xl [&_select]:px-4 [&_select]:font-semibold"
          >
            {[15, 30, 60, 120].map((minutes) => (
              <NativeSelectOption key={minutes} value={String(minutes)}>{minutes} min</NativeSelectOption>
            ))}
          </NativeSelect>
        </label>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3" aria-label="Prochaines alertes correspondant aux seuils">
        {alerts.length > 0 ? alerts.map((alert) => {
          const Icon = ALERT_ICONS[alert.kind];
          return (
            <article key={`${alert.kind}:${alert.datetime}`} className="rounded-2xl border border-border p-4">
              <Icon className="size-5 text-success" aria-hidden />
              <p className="mt-3 text-sm font-black">{alert.title}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{alert.message}</p>
              <p className="mt-3 flex items-center gap-1.5 text-xs font-bold">
                <Clock3 className="size-3.5" aria-hidden /> {formatDateTime(alert.datetime)}
              </p>
            </article>
          );
        }) : (
          <p className="md:col-span-3 rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
            Aucun créneau futur ne correspond encore à ces seuils.
          </p>
        )}
      </div>
    </section>
  );
}

function ThresholdInput({
  id,
  label,
  value,
  unit,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  unit: string;
  onChange: (value: number) => void;
}) {
  return (
    <label htmlFor={id}>
      <span className="mb-2 block text-sm font-bold">{label}</span>
      <span className="flex h-12 items-center rounded-xl border border-border px-4 focus-within:ring-2 focus-within:ring-primary/60">
        <input
          id={id}
          type="number"
          value={value}
          onChange={(event) => {
            if (Number.isFinite(event.target.valueAsNumber)) onChange(event.target.valueAsNumber);
          }}
          className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none"
        />
        <span className="text-xs font-bold text-muted-foreground">{unit}</span>
      </span>
    </label>
  );
}

'use client';

import { CalendarClock, Gauge, PiggyBank, PlugZap, Timer } from 'lucide-react';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { APPLIANCES, DURATION_OPTIONS, getAppliance } from '@/src/config/appliances';
import {
  calculateConsumptionEstimate,
  getCurrencyFromUnit,
} from '@/src/services/consumptionPlanner';
import type { PriceWindow } from '@/src/types/electricity';
import type { ApplianceId, PlannerPreferences } from '@/src/types/planner';
import {
  formatCurrency,
  formatDecimal,
  formatDuration,
  formatPeriod,
  formatPrice,
  formatShortDate,
} from '@/src/utils/format';

interface ConsumptionPlannerProps {
  preferences: PlannerPreferences;
  bestWindow: PriceWindow | null;
  referencePrice: number;
  unit: string;
  onApplianceChange: (id: ApplianceId) => void;
  onDurationChange: (durationMinutes: number) => void;
  onPowerChange: (powerKw: number) => void;
  onPowerBlur: () => void;
}

export function ConsumptionPlanner({
  preferences,
  bestWindow,
  referencePrice,
  unit,
  onApplianceChange,
  onDurationChange,
  onPowerChange,
  onPowerBlur,
}: ConsumptionPlannerProps) {
  const selectedAppliance = getAppliance(preferences.applianceId);
  const estimate = bestWindow
    ? calculateConsumptionEstimate(bestWindow, referencePrice, preferences.powerKw)
    : null;
  const currency = getCurrencyFromUnit(unit);

  return (
    <section
      id="planifier"
      className="mt-4 scroll-mt-24 rounded-[2rem] border border-border bg-card p-5 shadow-[0_8px_30px_var(--card-shadow)] sm:p-7"
      aria-labelledby="planner-title"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Planificateur
            </p>
            <span className="rounded-full bg-primary/25 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-foreground">
              V0.2
            </span>
          </div>
          <h2 id="planner-title" className="mt-1 text-2xl font-black tracking-tight">
            Planifiez un appareil au meilleur prix
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Wattwise cherche un créneau continu adapté à votre appareil dans les prévisions disponibles.
          </p>
        </div>
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/20 text-foreground">
          <PlugZap className="size-6" aria-hidden />
        </span>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <label htmlFor="planner-appliance">
          <span className="mb-2 block text-sm font-bold">Appareil</span>
          <NativeSelect
            id="planner-appliance"
            value={preferences.applianceId}
            onChange={(event) => onApplianceChange(event.target.value as ApplianceId)}
            className="w-full [&_select]:h-12 [&_select]:rounded-xl [&_select]:px-4 [&_select]:font-semibold"
          >
            {APPLIANCES.map((appliance) => (
              <NativeSelectOption key={appliance.id} value={appliance.id}>
                {appliance.emoji} {appliance.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <span className="mt-2 block text-xs text-muted-foreground">
            {selectedAppliance.description}
          </span>
        </label>

        <label htmlFor="planner-duration">
          <span className="mb-2 block text-sm font-bold">Durée du cycle</span>
          <NativeSelect
            id="planner-duration"
            value={String(preferences.durationMinutes)}
            onChange={(event) => onDurationChange(Number(event.target.value))}
            className="w-full [&_select]:h-12 [&_select]:rounded-xl [&_select]:px-4 [&_select]:font-semibold"
          >
            {DURATION_OPTIONS.map((duration) => (
              <NativeSelectOption key={duration} value={String(duration)}>
                {formatDuration(duration)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <span className="mt-2 block text-xs text-muted-foreground">
            De 30 minutes à 8 heures
          </span>
        </label>

        <label htmlFor="planner-power">
          <span className="mb-2 block text-sm font-bold">Puissance moyenne</span>
          <span className="flex h-12 items-center rounded-xl border border-border bg-transparent px-4 transition focus-within:ring-2 focus-within:ring-primary/60">
            <Gauge className="mr-3 size-4 shrink-0 text-muted-foreground" aria-hidden />
            <input
              id="planner-power"
              type="number"
              inputMode="decimal"
              min="0.1"
              max="22"
              step="0.1"
              value={preferences.powerKw}
              onChange={(event) => onPowerChange(event.target.valueAsNumber)}
              onBlur={onPowerBlur}
              className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none"
              aria-describedby="planner-power-note"
            />
            <span className="text-xs font-bold text-muted-foreground">kW</span>
          </span>
          <span id="planner-power-note" className="mt-2 block text-xs text-muted-foreground">
            Modifiable selon la fiche de l’appareil
          </span>
        </label>
      </div>

      {bestWindow && estimate ? (
        <div className="mt-6 overflow-hidden rounded-3xl bg-ink text-white">
          <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.3fr_2fr] lg:items-center">
            <div>
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-primary">
                <CalendarClock className="size-4" aria-hidden /> Créneau recommandé
              </p>
              <p className="mt-3 text-sm font-semibold text-white/55">
                {formatShortDate(bestWindow.start)}
              </p>
              <p className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                {formatPeriod(bestWindow.start, bestWindow.end)}
              </p>
              <p className="mt-2 text-sm text-white/55">
                {formatPrice(bestWindow.averagePrice)} {unit} en moyenne
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <article className="rounded-2xl border border-white/10 bg-white/7 p-4">
                <Timer className="size-4 text-accent-blue" aria-hidden />
                <p className="mt-3 text-xs font-bold uppercase tracking-wide text-white/45">Énergie</p>
                <p className="mt-1 text-xl font-black">{formatDecimal(estimate.energyKwh)} kWh</p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-white/7 p-4">
                <PlugZap className="size-4 text-primary" aria-hidden />
                <p className="mt-3 text-xs font-bold uppercase tracking-wide text-white/45">Coût énergie</p>
                <p className="mt-1 text-xl font-black">
                  {formatCurrency(estimate.estimatedCost, currency)}
                </p>
              </article>
              <article className="col-span-2 rounded-2xl border border-success/20 bg-success/10 p-4 sm:col-span-1">
                <PiggyBank className="size-4 text-success" aria-hidden />
                <p className="mt-3 text-xs font-bold uppercase tracking-wide text-success">Économie</p>
                <p className="mt-1 text-xl font-black">
                  {formatCurrency(estimate.savings, currency)}
                </p>
              </article>
            </div>
          </div>
          <p className="border-t border-white/10 px-5 py-3 text-xs leading-5 text-white/45 sm:px-6">
            Estimation de la composante énergie au prix de gros, comparée au prix moyen de la période. Les taxes, frais de réseau et conditions de votre contrat ne sont pas inclus.
          </p>
        </div>
      ) : (
        <output className="mt-6 block rounded-2xl bg-muted p-5 text-sm text-muted-foreground">
          Le créneau demandé dépasse les prévisions disponibles ou la puissance saisie n’est pas valide.
        </output>
      )}
    </section>
  );
}

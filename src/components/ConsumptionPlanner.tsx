'use client';

import {
  CalendarClock,
  CarFront,
  Gauge,
  Leaf,
  PiggyBank,
  PlugZap,
  Settings2,
  Timer,
} from 'lucide-react';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { APPLIANCES, DURATION_OPTIONS, getAppliance } from '@/src/config/appliances';
import {
  calculateConsumptionEstimate,
  getCurrencyFromUnit,
} from '@/src/services/consumptionPlanner';
import type { ApplianceId, OptimizedWindow, PlannerPreferences } from '@/src/types/planner';
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
  bestWindow: OptimizedWindow | null;
  referencePrice: number;
  unit: string;
  onApplianceChange: (id: ApplianceId) => void;
  onDurationChange: (durationMinutes: number) => void;
  onPowerChange: (powerKw: number) => void;
  onPowerBlur: () => void;
  onPreferencesChange: (changes: Partial<PlannerPreferences>) => void;
}

const MODES = [
  { id: 'economical', label: 'Économique', emoji: '€' },
  { id: 'balanced', label: 'Équilibré', emoji: '⚖' },
  { id: 'ecological', label: 'Écologique', emoji: '🌿' },
] as const;

export function ConsumptionPlanner({
  preferences,
  bestWindow,
  referencePrice,
  unit,
  onApplianceChange,
  onDurationChange,
  onPowerChange,
  onPowerBlur,
  onPreferencesChange,
}: ConsumptionPlannerProps) {
  const selectedAppliance = getAppliance(preferences.applianceId);
  const estimate = bestWindow
    ? calculateConsumptionEstimate(
        bestWindow,
        referencePrice,
        preferences.powerKw,
        bestWindow.averageCarbon,
      )
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
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Optimiseur intelligent</p>
            <span className="rounded-full bg-primary/25 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide">V0.3</span>
          </div>
          <h2 id="planner-title" className="mt-1 text-2xl font-black tracking-tight">Choisissez ce que signifie « meilleur »</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Wattwise croise prix, carbone, durée et contraintes domestiques pour recommander un créneau réalisable.
          </p>
        </div>
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/20"><PlugZap className="size-6" aria-hidden /></span>
      </div>

      <div className="mt-6 grid grid-cols-3 rounded-2xl bg-muted p-1" aria-label="Mode d’optimisation">
        {MODES.map((mode) => (
          <button
            key={mode.id}
            type="button"
            onClick={() => onPreferencesChange({ optimizationMode: mode.id })}
            className={`min-h-11 rounded-xl px-2 text-xs font-black transition sm:text-sm ${
              preferences.optimizationMode === mode.id
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            aria-pressed={preferences.optimizationMode === mode.id}
          >
            <span aria-hidden>{mode.emoji}</span> {mode.label}
          </button>
        ))}
      </div>

      {preferences.optimizationMode === 'balanced' && (
        <label htmlFor="price-weight" className="mt-4 block rounded-2xl border border-border p-4">
          <span className="flex items-center justify-between gap-4 text-sm font-bold">
            <span>Priorité du compromis</span>
            <span>{preferences.priceWeight} % prix · {100 - preferences.priceWeight} % carbone</span>
          </span>
          <input
            aria-label="Poids accordé au prix dans le compromis"
            id="price-weight"
            type="range"
            min="0"
            max="100"
            step="10"
            value={preferences.priceWeight}
            onChange={(event) => onPreferencesChange({ priceWeight: Number(event.target.value) })}
            className="mt-3 w-full accent-[var(--primary)]"
          />
        </label>
      )}

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <label htmlFor="planner-appliance">
          <span className="mb-2 block text-sm font-bold">Appareil</span>
          <NativeSelect
            id="planner-appliance"
            value={preferences.applianceId}
            onChange={(event) => onApplianceChange(event.target.value as ApplianceId)}
            className="w-full [&_select]:h-12 [&_select]:rounded-xl [&_select]:px-4 [&_select]:font-semibold"
          >
            {APPLIANCES.map((appliance) => (
              <NativeSelectOption key={appliance.id} value={appliance.id}>{appliance.emoji} {appliance.name}</NativeSelectOption>
            ))}
          </NativeSelect>
          <span className="mt-2 block text-xs text-muted-foreground">{selectedAppliance.description}</span>
        </label>

        <label htmlFor="planner-duration">
          <span className="mb-2 block text-sm font-bold">Durée du cycle</span>
          <NativeSelect
            id="planner-duration"
            value={String(preferences.durationMinutes)}
            onChange={(event) => onDurationChange(Number(event.target.value))}
            disabled={preferences.applianceId === 'electric-car'}
            className="w-full [&_select]:h-12 [&_select]:rounded-xl [&_select]:px-4 [&_select]:font-semibold"
          >
            {DURATION_OPTIONS.map((duration) => (
              <NativeSelectOption key={duration} value={String(duration)}>{formatDuration(duration)}</NativeSelectOption>
            ))}
          </NativeSelect>
          <span className="mt-2 block text-xs text-muted-foreground">
            {preferences.applianceId === 'electric-car' ? 'Calculée depuis la batterie cible' : 'De 30 minutes à 12 heures'}
          </span>
        </label>

        <label htmlFor="planner-power">
          <span className="mb-2 block text-sm font-bold">Puissance moyenne</span>
          <span className="flex h-12 items-center rounded-xl border border-border px-4 transition focus-within:ring-2 focus-within:ring-primary/60">
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
            />
            <span className="text-xs font-bold text-muted-foreground">kW</span>
          </span>
          <span className="mt-2 block text-xs text-muted-foreground">Limite du logement : {preferences.maxHomePowerKw} kW</span>
        </label>
      </div>

      {preferences.applianceId === 'electric-car' && (
        <div className="mt-5 rounded-2xl border border-accent-blue/25 bg-accent-blue/7 p-4">
          <p className="flex items-center gap-2 text-sm font-black"><CarFront className="size-4 text-accent-blue" aria-hidden /> Recharge souhaitée</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <NumberField label="Batterie" value={preferences.evBatteryCapacityKwh} unit="kWh" min={20} max={120} onChange={(value) => onPreferencesChange({ evBatteryCapacityKwh: value })} />
            <NumberField label="Niveau actuel" value={preferences.evCurrentPercent} unit="%" min={0} max={99} onChange={(value) => onPreferencesChange({ evCurrentPercent: value })} />
            <NumberField label="Niveau cible" value={preferences.evTargetPercent} unit="%" min={1} max={100} onChange={(value) => onPreferencesChange({ evTargetPercent: value })} />
          </div>
        </div>
      )}

      <details className="mt-5 rounded-2xl border border-border p-4">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-black">
          <Settings2 className="size-4 text-muted-foreground" aria-hidden /> Contraintes avancées
          <span className="ml-auto text-xs font-semibold text-muted-foreground">horaires · silence · puissance</span>
        </summary>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <TimeField label="Démarrer après" value={preferences.earliestStart} onChange={(earliestStart) => onPreferencesChange({ earliestStart })} />
          <TimeField label="Terminer avant" value={preferences.latestEnd} onChange={(latestEnd) => onPreferencesChange({ latestEnd })} />
          <NumberField label="Puissance logement" value={preferences.maxHomePowerKw} unit="kW" min={1} max={36} onChange={(value) => onPreferencesChange({ maxHomePowerKw: value })} />
        </div>
        <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl bg-muted/45 p-3 text-sm font-bold">
          <input type="checkbox" checked={preferences.avoidQuietHours} onChange={(event) => onPreferencesChange({ avoidQuietHours: event.target.checked })} className="size-5 accent-[var(--primary)]" />
          Éviter les heures silencieuses
        </label>
        {preferences.avoidQuietHours && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <TimeField label="Silence dès" value={preferences.quietStart} onChange={(quietStart) => onPreferencesChange({ quietStart })} required />
            <TimeField label="Jusqu’à" value={preferences.quietEnd} onChange={(quietEnd) => onPreferencesChange({ quietEnd })} required />
          </div>
        )}
      </details>

      {bestWindow && estimate ? (
        <div className="mt-6 overflow-hidden rounded-3xl bg-ink text-white">
          <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.2fr_2fr] lg:items-center">
            <div>
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-primary"><CalendarClock className="size-4" aria-hidden /> Créneau recommandé</p>
              <p className="mt-3 text-sm font-semibold text-white/55">{formatShortDate(bestWindow.start)}</p>
              <p className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">{formatPeriod(bestWindow.start, bestWindow.end)}</p>
              <p className="mt-3 text-xs leading-5 text-white/55">{bestWindow.explanation}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <ResultMetric icon={Timer} label="Énergie" value={`${formatDecimal(estimate.energyKwh)} kWh`} tone="text-accent-blue" />
              <ResultMetric icon={PlugZap} label="Coût énergie" value={formatCurrency(estimate.estimatedCost, currency)} tone="text-primary" />
              <ResultMetric icon={Leaf} label="Empreinte" value={estimate.carbonKg === null ? '—' : `${formatDecimal(estimate.carbonKg)} kg`} tone="text-success" />
              <ResultMetric icon={PiggyBank} label="Économie" value={formatCurrency(estimate.savings, currency)} tone="text-success" />
            </div>
          </div>
          <div className="grid gap-2 border-t border-white/10 px-5 py-3 text-xs text-white/50 sm:grid-cols-3 sm:px-6">
            <span>{formatPrice(bestWindow.averagePrice)} {unit}</span>
            <span>{bestWindow.averageCarbon === null ? 'Carbone indisponible' : `${formatPrice(bestWindow.averageCarbon)} gCO₂e/kWh`}</span>
            <span>{bestWindow.averageRenewable === null ? 'Renouvelable indisponible' : `${formatPrice(bestWindow.averageRenewable)} % renouvelable`}</span>
          </div>
        </div>
      ) : (
        <output className="mt-6 block rounded-2xl border border-warning/25 bg-warning/10 p-5 text-sm">
          Aucun créneau ne respecte toutes les contraintes. Vérifiez la durée, la plage horaire et la puissance du logement.
        </output>
      )}
    </section>
  );
}

function ResultMetric({ icon: Icon, label, value, tone }: { icon: typeof Timer; label: string; value: string; tone: string }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/7 p-4">
      <Icon className={`size-4 ${tone}`} aria-hidden />
      <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-white/45">{label}</p>
      <p className="mt-1 text-lg font-black">{value}</p>
    </article>
  );
}

function NumberField({ label, value, unit, min, max, onChange }: { label: string; value: number; unit: string; min: number; max: number; onChange: (value: number) => void }) {
  return (
    <label>
      <span className="mb-2 block text-xs font-bold text-muted-foreground">{label}</span>
      <span className="flex h-11 items-center rounded-xl border border-border bg-card px-3">
        <input type="number" min={min} max={max} value={value} onChange={(event) => Number.isFinite(event.target.valueAsNumber) && onChange(event.target.valueAsNumber)} className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none" />
        <span className="text-xs font-bold text-muted-foreground">{unit}</span>
      </span>
    </label>
  );
}

function TimeField({ label, value, onChange, required = false }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return (
    <label>
      <span className="mb-2 block text-xs font-bold text-muted-foreground">{label}</span>
      <input type="time" value={value} onChange={(event) => onChange(event.target.value)} required={required} className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/60" />
    </label>
  );
}

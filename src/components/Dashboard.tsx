'use client';

import { useEffect, useMemo, useState, type ComponentType } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  BatteryCharging,
  CheckCircle2,
  Clock3,
  CloudOff,
  Home,
  Moon,
  PlugZap,
  RefreshCw,
  Settings,
  Sun,
  TrendingUp,
  WifiOff,
  Zap,
} from 'lucide-react';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { ConsumptionPlanner } from '@/src/components/ConsumptionPlanner';
import { ForecastSkeleton } from '@/src/components/ForecastSkeleton';
import { PriceChart } from '@/src/components/PriceChart';
import { getAppliance } from '@/src/config/appliances';
import { getZone, ZONES, type ZoneId } from '@/src/config/zones';
import { useForecast } from '@/src/hooks/useForecast';
import { usePlannerPreferences } from '@/src/hooks/usePlannerPreferences';
import { analyzeForecast } from '@/src/services/priceAnalysis';
import type { HorizonHours } from '@/src/types/electricity';
import { formatDateTime, formatHour, formatPeriod, formatPrice, formatShortDate, relativeUpdateTime } from '@/src/utils/format';

type ThemeMode = 'system' | 'light' | 'dark';

function StatCard({
  label,
  value,
  note,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  tone: string;
}) {
  return (
    <article className="rounded-3xl border border-border bg-card p-4 shadow-[0_8px_30px_var(--card-shadow)] sm:p-5">
      <div className={`mb-6 grid size-10 place-items-center rounded-xl bg-muted ${tone}`}>
        <Icon className="size-5" aria-hidden />
      </div>
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-black tracking-tight">{value}</p>
      <p className="mt-1 text-xs font-semibold text-muted-foreground">{note}</p>
    </article>
  );
}

function ErrorState({ code, message, onRetry }: { code: string | null; message: string | null; onRetry: () => void }) {
  const configurationError = code === 'CONFIG_MISSING';
  return (
    <section className="rounded-[2rem] border border-border bg-card p-7 text-center shadow-[0_8px_30px_var(--card-shadow)]" role="alert">
      <span className={`mx-auto grid size-14 place-items-center rounded-2xl ${configurationError ? 'bg-accent-blue/12 text-accent-blue' : 'bg-danger/12 text-danger'}`}>
        {configurationError ? <Settings className="size-7" aria-hidden /> : <CloudOff className="size-7" aria-hidden />}
      </span>
      <h2 className="mt-5 text-xl font-black">{configurationError ? 'Configuration API requise' : 'Prévisions indisponibles'}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">{message}</p>
      {configurationError && (
        <code className="mx-auto mt-4 block w-fit rounded-xl bg-muted px-4 py-2 text-left text-xs font-bold text-foreground">ELECTRICITY_MAPS_API_KEY=…</code>
      )}
      <button onClick={onRetry} className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:brightness-95 active:translate-y-px">
        <RefreshCw className="size-4" aria-hidden /> Réessayer
      </button>
    </section>
  );
}

export function Dashboard() {
  const [zoneId, setZoneId] = useState<ZoneId>('FR');
  const [horizon, setHorizon] = useState<HorizonHours>(24);
  const [theme, setTheme] = useState<ThemeMode>('system');
  const [online, setOnline] = useState(true);
  const planner = usePlannerPreferences();
  const forecastState = useForecast(zoneId, horizon);
  const zone = getZone(zoneId);
  const selectedAppliance = getAppliance(planner.preferences.applianceId);
  const analysis = useMemo(
    () => forecastState.forecast
      ? analyzeForecast(forecastState.forecast.points, planner.preferences.durationMinutes)
      : null,
    [forecastState.forecast, planner.preferences.durationMinutes],
  );

  useEffect(() => {
    const savedZone = window.localStorage.getItem('wattwise:zone') as ZoneId | null;
    const savedTheme = window.localStorage.getItem('wattwise:theme') as ThemeMode | null;
    const savedHorizon = Number(window.localStorage.getItem('wattwise:horizon')) as HorizonHours;
    queueMicrotask(() => {
      if (ZONES.some((item) => item.id === savedZone)) setZoneId(savedZone as ZoneId);
      if (['system', 'light', 'dark'].includes(savedTheme ?? '')) setTheme(savedTheme as ThemeMode);
      if ([24, 48, 72].includes(savedHorizon)) setHorizon(savedHorizon);
      setOnline(window.navigator.onLine);
    });

    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => root.classList.toggle('dark', theme === 'dark' || (theme === 'system' && media.matches));
    applyTheme();
    media.addEventListener('change', applyTheme);
    window.localStorage.setItem('wattwise:theme', theme);
    return () => media.removeEventListener('change', applyTheme);
  }, [theme]);

  const changeZone = (value: string) => {
    const next = value as ZoneId;
    setZoneId(next);
    window.localStorage.setItem('wattwise:zone', next);
  };

  const changeHorizon = (value: HorizonHours) => {
    setHorizon(value);
    window.localStorage.setItem('wattwise:horizon', String(value));
  };

  const forecast = forecastState.forecast;
  const empty = forecastState.status === 'success' && (!forecast || forecast.points.length === 0 || !analysis);
  const nextTheme = theme === 'dark' ? 'light' : 'dark';

  return (
    <main className="min-h-screen bg-background pb-28 text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-8">
          <a href="#accueil" className="flex items-center gap-2.5" aria-label="Wattwise, accueil">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[0_8px_24px_var(--brand-glow)]">
              <Zap className="size-5" fill="currentColor" aria-hidden />
            </span>
            <span className="text-lg font-extrabold tracking-[-0.035em]">Wattwise</span>
          </a>
          <div className="flex items-center gap-2">
            {!online && <span className="hidden items-center gap-1.5 rounded-full bg-danger/10 px-3 py-2 text-xs font-bold text-danger sm:flex"><WifiOff className="size-3.5" /> Hors ligne</span>}
            <button
              onClick={() => setTheme(nextTheme)}
              className="grid size-11 place-items-center rounded-full border border-border bg-card text-muted-foreground transition hover:text-foreground"
              aria-label={nextTheme === 'dark' ? 'Activer le thème sombre' : 'Activer le thème clair'}
            >
              {theme === 'dark' ? <Sun className="size-5" aria-hidden /> : <Moon className="size-5" aria-hidden />}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-8 sm:pt-10">
        <section id="accueil" className="scroll-mt-24">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Prix de l’électricité</p>
              <h1 className="max-w-2xl text-3xl font-black tracking-[-0.045em] sm:text-4xl">Quand consommer au meilleur prix ?</h1>
            </div>
            <label className="hidden sm:block">
              <span className="sr-only">Zone</span>
              <NativeSelect value={zoneId} onChange={(event) => changeZone(event.target.value)} className="rounded-full bg-card shadow-sm [&_select]:h-11 [&_select]:rounded-full [&_select]:pl-4 [&_select]:pr-10 [&_select]:font-bold">
                {ZONES.map((item) => <NativeSelectOption key={item.id} value={item.id}>{item.flag} {item.name}</NativeSelectOption>)}
              </NativeSelect>
            </label>
          </div>

          <label className="mb-4 block sm:hidden">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Zone</span>
            <NativeSelect value={zoneId} onChange={(event) => changeZone(event.target.value)} className="w-full bg-card [&_select]:h-12 [&_select]:rounded-xl [&_select]:px-4 [&_select]:font-bold">
              {ZONES.map((item) => <NativeSelectOption key={item.id} value={item.id}>{item.flag} {item.name}</NativeSelectOption>)}
            </NativeSelect>
          </label>

          {forecastState.status === 'loading' && <ForecastSkeleton />}
          {forecastState.status === 'error' && <ErrorState code={forecastState.code} message={forecastState.message} onRetry={forecastState.refresh} />}
          {empty && (
            <output className="block rounded-[2rem] border border-border bg-card p-8 text-center">
              <Clock3 className="mx-auto size-12 text-muted-foreground" aria-hidden />
              <h2 className="mt-4 text-xl font-black">Aucune prévision disponible</h2>
              <p className="mt-2 text-sm text-muted-foreground">Electricity Maps n’a pas encore publié de prix pour cette zone et cette période.</p>
            </output>
          )}

          {forecast && analysis && forecast.points.length > 0 && (
            <>
              {(forecastState.isStale || !online) && (
                <output className="mb-4 flex items-start gap-3 rounded-2xl border border-warning/25 bg-warning/10 p-4 text-left text-sm">
                  <WifiOff className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
                  <p><strong>Dernière donnée disponible.</strong> Mise à jour {relativeUpdateTime(forecast.fetchedAt)}. Elle peut ne plus refléter les prix actuels.</p>
                </output>
              )}

              <section id="prix" className="relative scroll-mt-24 overflow-hidden rounded-[2rem] bg-ink p-6 text-white shadow-[0_24px_64px_var(--hero-shadow)] sm:p-8">
                <div className="absolute -right-12 -top-12 size-44 rounded-full bg-primary/25 blur-2xl" aria-hidden />
                <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div>
                    <p className="mb-3 flex items-center gap-2 text-sm font-bold text-white/65">
                      <span className="size-2 rounded-full bg-success shadow-[0_0_0_5px_var(--success-glow)]" />
                      {formatShortDate(forecast.points[0].datetime)} · {zone.name}
                    </p>
                    {analysis.bestWindow ? (
                      <>
                        <h2 className="max-w-2xl text-3xl font-black tracking-[-0.045em] sm:text-5xl">
                          Pour {selectedAppliance.name.toLocaleLowerCase('fr-FR')}, commencez à{' '}
                          <span className="text-primary">{formatHour(analysis.bestWindow.start)}</span>
                        </h2>
                        <p className="mt-3 max-w-xl text-sm leading-6 text-white/65 sm:text-base">
                          Consommez entre {formatPeriod(analysis.bestWindow.start, analysis.bestWindow.end)}. Le planificateur tient compte de la durée complète du cycle.
                        </p>
                      </>
                    ) : <h2 className="text-3xl font-black">Pas assez de données pour calculer un créneau.</h2>}
                  </div>
                  {analysis.bestWindow && (
                    <div className="rounded-3xl border border-white/10 bg-white/7 p-5 backdrop-blur-sm">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/50">Prix moyen du créneau</p>
                      <p className="mt-2 text-4xl font-black tracking-tight">{formatPrice(analysis.bestWindow.averagePrice)} <span className="text-base font-semibold text-white/55">{forecast.unit}</span></p>
                      <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1.5 text-xs font-bold text-success"><ArrowDownRight className="size-4" aria-hidden /> {formatPrice(analysis.bestWindow.savingsPercent)} % sous la moyenne</p>
                      <p className="mt-2 text-xs text-white/50">Maximum du créneau : {formatPrice(analysis.bestWindow.maximumPrice)} {forecast.unit}</p>
                    </div>
                  )}
                </div>
              </section>

              <ConsumptionPlanner
                preferences={planner.preferences}
                bestWindow={analysis.bestWindow}
                referencePrice={analysis.statistics.average}
                unit={forecast.unit}
                onApplianceChange={planner.setApplianceId}
                onDurationChange={planner.setDurationMinutes}
                onPowerChange={planner.setPowerKw}
                onPowerBlur={planner.normalizePower}
              />

              <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Statistiques des prix">
                <StatCard label="Minimum" value={`${formatPrice(analysis.statistics.minimum.price)}`} note={`${forecast.unit} · ${formatHour(analysis.statistics.minimum.datetime)}`} icon={ArrowDownRight} tone="text-success" />
                <StatCard label="Moyenne" value={`${formatPrice(analysis.statistics.average)}`} note={`${forecast.unit} · sur ${horizon} h`} icon={BatteryCharging} tone="text-accent-blue" />
                <StatCard label="Maximum" value={`${formatPrice(analysis.statistics.maximum.price)}`} note={`${forecast.unit} · ${formatHour(analysis.statistics.maximum.datetime)}`} icon={ArrowUpRight} tone="text-danger" />
              </section>

              <section className="mt-4 grid gap-3 md:grid-cols-3" aria-label="Prochaines périodes importantes">
                <article className="rounded-3xl border border-border bg-card p-5">
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-success"><CheckCircle2 className="size-4" aria-hidden /> Prochaine période avantageuse</p>
                  <p className="mt-3 text-xl font-black">{analysis.nextCheapPeriod ? formatPeriod(analysis.nextCheapPeriod.start, analysis.nextCheapPeriod.end) : 'Non détectée'}</p>
                  {analysis.nextCheapPeriod && <p className="mt-1 text-xs text-muted-foreground">Moyenne {formatPrice(analysis.nextCheapPeriod.averagePrice)} {forecast.unit}</p>}
                </article>
                <article className="rounded-3xl border border-border bg-card p-5">
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-warning"><AlertTriangle className="size-4" aria-hidden /> Prochaine période chère</p>
                  <p className="mt-3 text-xl font-black">{analysis.nextExpensivePeriod ? formatPeriod(analysis.nextExpensivePeriod.start, analysis.nextExpensivePeriod.end) : 'Non détectée'}</p>
                  {analysis.nextExpensivePeriod && <p className="mt-1 text-xs text-muted-foreground">Moyenne {formatPrice(analysis.nextExpensivePeriod.averagePrice)} {forecast.unit}</p>}
                </article>
                <article className="rounded-3xl border border-danger/25 bg-danger/7 p-5">
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-danger"><TrendingUp className="size-4" aria-hidden /> Prochain pic</p>
                  <p className="mt-3 text-xl font-black">{analysis.nextPeak ? formatDateTime(analysis.nextPeak.datetime) : 'Non détecté'}</p>
                  {analysis.nextPeak && <p className="mt-1 text-xs text-muted-foreground">{formatPrice(analysis.nextPeak.price)} {forecast.unit}</p>}
                </article>
              </section>

              <section id="prévisions" className="mt-4 scroll-mt-24 rounded-[2rem] border border-border bg-card p-5 shadow-[0_8px_30px_var(--card-shadow)] sm:p-7">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Prévisions</p>
                    <h2 className="mt-1 text-xl font-black tracking-tight">Prix sur les prochaines {horizon} h</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex rounded-xl bg-muted p-1" aria-label="Horizon de prévision">
                      {([24, 48, 72] as HorizonHours[]).map((value) => (
                        <button key={value} onClick={() => changeHorizon(value)} className={`min-h-10 rounded-lg px-3 text-xs font-black transition ${horizon === value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`} aria-pressed={horizon === value}>{value} h</button>
                      ))}
                    </div>
                    <button onClick={forecastState.refresh} className="grid size-11 place-items-center rounded-xl border border-border text-muted-foreground transition hover:text-foreground" aria-label="Actualiser les prévisions"><RefreshCw className="size-4" aria-hidden /></button>
                  </div>
                </div>
                <PriceChart points={forecast.points} statistics={analysis.statistics} unit={forecast.unit} />
                <p className="mt-5 text-center text-xs text-muted-foreground">Mis à jour {relativeUpdateTime(forecast.fetchedAt)} · source Electricity Maps · prévisions, non tarifs facturés</p>
              </section>
            </>
          )}
        </section>

        <section id="paramètres" className="mt-4 scroll-mt-24 rounded-[2rem] border border-border bg-card p-5 sm:p-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Préférences</p>
            <h2 className="mt-1 text-xl font-black">Paramètres</h2>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            <label htmlFor="settings-zone">
              <span className="mb-2 block text-sm font-bold">Zone</span>
              <NativeSelect id="settings-zone" value={zoneId} onChange={(event) => changeZone(event.target.value)} className="w-full [&_select]:h-12 [&_select]:rounded-xl [&_select]:px-4">
                {ZONES.map((item) => <NativeSelectOption key={item.id} value={item.id}>{item.flag} {item.name}</NativeSelectOption>)}
              </NativeSelect>
              {zone.note && <span className="mt-2 block text-xs text-muted-foreground">{zone.note}</span>}
            </label>
            <div>
              <span className="mb-2 block text-sm font-bold">Devise / unité</span>
              <div className="flex h-12 items-center rounded-xl border border-border bg-muted/40 px-4 text-sm font-semibold">{forecast?.unit ?? 'EUR/MWh'} <span className="ml-auto text-xs text-muted-foreground">fourni par l’API</span></div>
            </div>
            <label htmlFor="settings-theme">
              <span className="mb-2 block text-sm font-bold">Thème</span>
              <NativeSelect id="settings-theme" value={theme} onChange={(event) => setTheme(event.target.value as ThemeMode)} className="w-full [&_select]:h-12 [&_select]:rounded-xl [&_select]:px-4">
                <NativeSelectOption value="system">Système</NativeSelectOption>
                <NativeSelectOption value="light">Clair</NativeSelectOption>
                <NativeSelectOption value="dark">Sombre</NativeSelectOption>
              </NativeSelect>
            </label>
          </div>
        </section>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/92 px-3 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl" aria-label="Navigation principale">
        <div className="mx-auto flex max-w-md justify-around">
          {[
            ['Accueil', '#accueil', Home],
            ['Prix', '#prix', BarChart3],
            ['Planifier', '#planifier', PlugZap],
            ['Prévisions', '#prévisions', TrendingUp],
            ['Paramètres', '#paramètres', Settings],
          ].map(([label, href, Icon]) => (
            <a key={String(label)} href={String(href)} className="flex min-h-12 min-w-16 flex-col items-center justify-center gap-1 rounded-xl px-2 text-[10px] font-bold text-muted-foreground transition hover:bg-muted hover:text-foreground">
              <Icon className="size-4" aria-hidden />{String(label)}
            </a>
          ))}
        </div>
      </nav>
    </main>
  );
}

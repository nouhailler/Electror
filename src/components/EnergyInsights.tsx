'use client';

import { Activity, History, Leaf, ShieldCheck, Sparkles, Wind } from 'lucide-react';
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartContainer, type ChartConfig } from '@/components/ui/chart';
import type { ElectricityMixPoint, EnergyData } from '@/src/types/electricity';
import type { OptimizedWindow } from '@/src/types/planner';
import { formatDateTime, formatHour, formatPrice } from '@/src/utils/format';

const chartConfig = {
  price: { label: 'Prix historique', color: 'var(--chart-line)' },
} satisfies ChartConfig;

const SOURCE_LABELS: Record<string, string> = {
  nuclear: 'Nucléaire',
  wind: 'Éolien',
  solar: 'Solaire',
  hydro: 'Hydraulique',
  biomass: 'Biomasse',
  geothermal: 'Géothermie',
  gas: 'Gaz',
  coal: 'Charbon',
  oil: 'Pétrole',
  unknown: 'Autres',
};

function closestMix(points: ElectricityMixPoint[], datetime?: string): ElectricityMixPoint | null {
  if (points.length === 0) return null;
  if (!datetime) return points[0];
  const target = Date.parse(datetime);
  return points.reduce((closest, point) =>
    Math.abs(Date.parse(point.datetime) - target) < Math.abs(Date.parse(closest.datetime) - target)
      ? point
      : closest,
  );
}

export function EnergyInsights({ data, bestWindow }: { data: EnergyData; bestWindow: OptimizedWindow | null }) {
  const mix = closestMix(data.mix, bestWindow?.start);
  const topSources = mix
    ? Object.entries(mix.sources)
        .filter(([, value]) => value > 0)
        .sort((left, right) => right[1] - left[1])
        .slice(0, 5)
    : [];
  const actualCount = data.forecast.points.filter((point) => point.source === 'actual').length;
  const forecastCount = data.forecast.points.length - actualCount;
  const history = data.priceHistory.map((point) => ({ datetime: point.datetime, price: point.price }));
  const historyPrices = history.map((point) => point.price);
  const historyMin = historyPrices.length > 0 ? Math.min(...historyPrices) : 0;
  const historyMax = historyPrices.length > 0 ? Math.max(...historyPrices) : 1;

  return (
    <section id="impact" className="mt-4 scroll-mt-24 grid gap-4 lg:grid-cols-2" aria-label="Impact et historique énergétique">
      <article className="rounded-[2rem] border border-border bg-card p-5 shadow-[0_8px_30px_var(--card-shadow)] sm:p-7">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Pourquoi ce créneau ?</p>
        <h2 className="mt-1 text-2xl font-black tracking-tight">Le signal énergétique expliqué</h2>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <InsightMetric icon={Leaf} label="Carbone" value={bestWindow?.averageCarbon === null || bestWindow?.averageCarbon === undefined ? '—' : `${formatPrice(bestWindow.averageCarbon)} g/kWh`} />
          <InsightMetric icon={Sparkles} label="Renouvelable" value={bestWindow?.averageRenewable === null || bestWindow?.averageRenewable === undefined ? '—' : `${formatPrice(bestWindow.averageRenewable)} %`} />
          <InsightMetric icon={ShieldCheck} label="Données" value={`${actualCount} publiées`} note={`${forecastCount} prévues`} />
        </div>

        <p className="mt-3 text-xs leading-5 text-muted-foreground">gCO₂e/kWh : grammes de gaz à effet de serre, en équivalent CO₂, par kilowattheure. Un chiffre bas signifie moins d’émissions. Le renouvelable indique la part issue de sources renouvelables ; le nucléaire est bas carbone mais non renouvelable.</p>
        <div className="mt-6 rounded-2xl bg-muted/55 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-black"><Wind className="size-4 text-accent-blue" aria-hidden /> Mix au début du créneau</p>
            {mix && <span className="text-xs font-semibold text-muted-foreground">{formatHour(mix.datetime)}</span>}
          </div>
          {mix && topSources.length > 0 ? (
            <div className="mt-4 space-y-3">
              {topSources.map(([source, value]) => {
                const share = mix.totalMw > 0 ? value / mix.totalMw * 100 : 0;
                return (
                  <div key={source}>
                    <div className="mb-1.5 flex justify-between text-xs font-bold">
                      <span>{SOURCE_LABELS[source] ?? source}</span>
                      <span>{formatPrice(share)} %</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-border"><div className="h-full rounded-full bg-success" style={{ width: `${Math.min(100, share)}%` }} /></div>
                  </div>
                );
              })}
              {(mix.importsMw > 0 || mix.exportsMw > 0) && (
                <p className="pt-1 text-xs text-muted-foreground">Flux : {formatPrice(mix.importsMw)} MW importés · {formatPrice(mix.exportsMw)} MW exportés</p>
              )}
            </div>
          ) : <p className="mt-4 text-sm text-muted-foreground">Le détail du mix n’est pas disponible pour ce créneau.</p>}
        </div>
      </article>

      <article className="rounded-[2rem] border border-border bg-card p-5 shadow-[0_8px_30px_var(--card-shadow)] sm:p-7">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Historique et confiance</p>
        <h2 className="mt-1 text-2xl font-black tracking-tight">Prix publiés sur les dernières 24 h</h2>
        {history.length > 0 ? (
          <ChartContainer config={chartConfig} className="mt-5 h-52 w-full min-w-0 aspect-auto" aria-label="Historique des prix publiés">
            <LineChart data={history} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} accessibilityLayer>
              <CartesianGrid vertical={false} strokeDasharray="3 5" stroke="var(--border)" />
              <XAxis dataKey="datetime" tickLine={false} axisLine={false} interval={Math.max(0, Math.ceil(history.length / 5) - 1)} tickFormatter={(value: string) => formatHour(value)} />
              <YAxis width={52} tickLine={false} axisLine={false} domain={[Math.floor(historyMin - 5), Math.ceil(historyMax + 5)]} tickFormatter={(value: number) => formatPrice(value)} />
              <Tooltip labelFormatter={(value) => formatDateTime(String(value))} formatter={(value) => [`${formatPrice(Number(value))} ${data.forecast.unit}`, 'Prix']} />
              <Line type="monotone" dataKey="price" stroke="var(--chart-line)" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
            </LineChart>
          </ChartContainer>
        ) : <p className="mt-5 rounded-2xl bg-muted p-4 text-sm text-muted-foreground">Historique momentanément indisponible.</p>}

        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-border p-4">
          {data.forecastQuality ? <Activity className="mt-0.5 size-5 shrink-0 text-success" aria-hidden /> : <History className="mt-0.5 size-5 shrink-0 text-accent-blue" aria-hidden />}
          <div>
            <p className="text-sm font-black">{data.forecastQuality ? 'Précision mesurée localement' : 'Mesure de précision en cours'}</p>
            {data.forecastQuality ? (
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Erreur moyenne : {formatPrice(data.forecastQuality.meanAbsoluteError)} {data.forecast.unit} sur {data.forecastQuality.matchedPoints} points. Biais : {data.forecastQuality.meanBias >= 0 ? '+' : ''}{formatPrice(data.forecastQuality.meanBias)}.
              </p>
            ) : (
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Wattwise conserve les prévisions sur cet appareil et les comparera aux prix publiés lors des prochaines visites.
              </p>
            )}
          </div>
        </div>
      </article>
    </section>
  );
}

function InsightMetric({ icon: Icon, label, value, note }: { icon: typeof Leaf; label: string; value: string; note?: string }) {
  return (
    <div className="rounded-2xl border border-border p-4">
      <Icon className="size-4 text-success" aria-hidden />
      <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-black">{value}</p>
      {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}

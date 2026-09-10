'use client';

import { Area, Bar, CartesianGrid, Cell, ComposedChart, ReferenceLine, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartContainer, type ChartConfig } from '@/components/ui/chart';
import { getCategoryLabel } from '@/src/services/priceAnalysis';
import type { PricePoint, PriceStatistics } from '@/src/types/electricity';
import { formatDateTime, formatHour, formatPrice, formatShortDate } from '@/src/utils/format';

const chartConfig = {
  price: { label: 'Prix', color: 'var(--chart-line)' },
} satisfies ChartConfig;

const CATEGORY_COLORS: Record<PricePoint['category'], string> = {
  'very-cheap': 'var(--price-very-cheap)',
  cheap: 'var(--price-cheap)',
  average: 'var(--price-average)',
  expensive: 'var(--price-expensive)',
  'very-expensive': 'var(--price-very-expensive)',
};

interface PriceChartProps {
  points: PricePoint[];
  statistics: PriceStatistics;
  unit: string;
}

interface TooltipEntry {
  payload?: {
    datetime: string;
    price: number;
    category: PricePoint['category'];
  };
}

function PriceTooltip({
  active,
  payload,
  unit,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  unit: string;
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return (
    <div className="min-w-44 rounded-2xl border border-border bg-card p-3 text-foreground shadow-2xl">
      <p className="text-xs font-semibold text-muted-foreground">{formatDateTime(point.datetime)}</p>
      <p className="mt-1 text-xl font-black">{formatPrice(point.price)} <span className="text-xs font-semibold text-muted-foreground">{unit}</span></p>
      <p className="mt-2 text-xs font-bold" style={{ color: CATEGORY_COLORS[point.category] }}>{getCategoryLabel(point.category)}</p>
    </div>
  );
}

export function PriceChart({ points, statistics, unit }: PriceChartProps) {
  const data = points.map((point) => ({ ...point, hour: formatHour(point.datetime) }));
  const interval = Math.max(0, Math.ceil(points.length / 7) - 1);
  const prices = points.map((point) => point.price);
  const dataMin = Math.min(...prices);
  const dataMax = Math.max(...prices);
  const padding = Math.max(5, (dataMax - dataMin) * 0.18);

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2 text-[11px] font-bold text-muted-foreground" aria-label="Repères statistiques">
        <span className="rounded-full bg-muted px-3 py-1.5">MIN {formatPrice(statistics.minimum.price)}</span>
        <span className="rounded-full bg-muted px-3 py-1.5">MOY {formatPrice(statistics.average)}</span>
        <span className="rounded-full bg-muted px-3 py-1.5">MAX {formatPrice(statistics.maximum.price)}</span>
        <span className="ml-auto rounded-full bg-muted px-3 py-1.5">{unit}</span>
      </div>
      <ChartContainer config={chartConfig} className="h-[270px] w-full min-w-0 aspect-auto sm:h-[330px]" aria-label={`Courbe des prix en ${unit}`}>
        <ComposedChart data={data} margin={{ top: 14, right: 8, left: -18, bottom: 4 }} accessibilityLayer>
          <defs>
            <linearGradient id="price-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-line)" stopOpacity={0.24} />
              <stop offset="100%" stopColor="var(--chart-line)" stopOpacity={0.015} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 5" stroke="var(--border)" />
          <XAxis
            dataKey="datetime"
            tickLine={false}
            axisLine={false}
            interval={interval}
            minTickGap={18}
            tickFormatter={(value: string) => formatHour(value)}
          />
          <YAxis
            width={54}
            tickLine={false}
            axisLine={false}
            domain={[Math.floor(dataMin - padding), Math.ceil(dataMax + padding)]}
            tickFormatter={(value: number) => formatPrice(value)}
          />
          <Tooltip content={<PriceTooltip unit={unit} />} cursor={{ stroke: 'var(--foreground)', strokeDasharray: '3 4', strokeOpacity: 0.35 }} />
          <ReferenceLine y={statistics.minimum.price} stroke="var(--price-very-cheap)" strokeDasharray="2 6" strokeOpacity={0.45} />
          <ReferenceLine y={statistics.average} stroke="var(--price-average)" strokeDasharray="5 5" strokeOpacity={0.65} />
          <ReferenceLine y={statistics.maximum.price} stroke="var(--price-very-expensive)" strokeDasharray="2 6" strokeOpacity={0.45} />
          <Area type="monotone" dataKey="price" fill="url(#price-area)" stroke="var(--chart-line)" strokeWidth={3} activeDot={{ r: 6, strokeWidth: 3, stroke: 'var(--card)' }} />
          <Bar dataKey="price" barSize={5} radius={[4, 4, 4, 4]} opacity={0.75}>
            {points.map((point) => (
              // oxlint-disable-next-line typescript/no-deprecated -- Recharts still requires Cell for per-datum colours.
              <Cell key={point.datetime} fill={CATEGORY_COLORS[point.category]} />
            ))}
          </Bar>
        </ComposedChart>
      </ChartContainer>
      <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
        <span>{formatShortDate(points[0].datetime)}</span>
        <span>Données prévues · touchez la courbe</span>
        <span>{formatShortDate(points[points.length - 1].datetime)}</span>
      </div>
    </div>
  );
}

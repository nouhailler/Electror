import type {
  ForecastAnalysis,
  PriceCategory,
  PricePeriod,
  PricePoint,
  PriceStatistics,
  PriceWindow,
} from '@/src/types/electricity';

const CATEGORY_LABELS: Record<PriceCategory, string> = {
  'very-cheap': 'Très bon marché',
  cheap: 'Bon marché',
  average: 'Prix moyen',
  expensive: 'Cher',
  'very-expensive': 'Très cher',
};

export function getCategoryLabel(category: PriceCategory): string {
  return CATEGORY_LABELS[category];
}

function quantile(sorted: number[], position: number): number {
  if (sorted.length === 0) return Number.NaN;
  const index = (sorted.length - 1) * position;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

export function classifyPrice(price: number, prices: number[]): PriceCategory {
  if (prices.length < 2) return 'average';
  const sorted = [...prices].sort((a, b) => a - b);
  const [q20, q40, q60, q80] = [0.2, 0.4, 0.6, 0.8].map((q) =>
    quantile(sorted, q),
  );

  if (price <= q20) return 'very-cheap';
  if (price <= q40) return 'cheap';
  if (price <= q60) return 'average';
  if (price <= q80) return 'expensive';
  return 'very-expensive';
}

export function calculateStatistics(points: PricePoint[]): PriceStatistics | null {
  if (points.length === 0) return null;
  let minimum = points[0];
  let maximum = points[0];
  let total = 0;

  for (const point of points) {
    if (point.price < minimum.price) minimum = point;
    if (point.price > maximum.price) maximum = point;
    total += point.price;
  }

  return { minimum, maximum, average: total / points.length };
}

function inferIntervalMinutes(points: PricePoint[]): number {
  if (points.length < 2) return 60;
  const differences = points
    .slice(1)
    .map((point, index) =>
      (Date.parse(point.datetime) - Date.parse(points[index].datetime)) / 60_000,
    )
    .filter((difference) => difference > 0 && Number.isFinite(difference))
    .sort((a, b) => a - b);
  return differences[Math.floor(differences.length / 2)] ?? 60;
}

export function findBestWindow(
  points: PricePoint[],
  durationMinutes: number,
  overallAverage?: number,
): PriceWindow | null {
  if (points.length === 0 || durationMinutes <= 0) return null;
  const orderedPoints = [...points].sort(
    (left, right) => Date.parse(left.datetime) - Date.parse(right.datetime),
  );
  const intervalMinutes = inferIntervalMinutes(orderedPoints);
  let best: { points: PricePoint[]; start: string } | null = null;
  let bestAverage = Number.POSITIVE_INFINITY;

  for (let startIndex = 0; startIndex < orderedPoints.length; startIndex += 1) {
    const slice: PricePoint[] = [];
    let weightedPrice = 0;
    let remainingMinutes = durationMinutes;

    for (
      let pointIndex = startIndex;
      pointIndex < orderedPoints.length && remainingMinutes > 0;
      pointIndex += 1
    ) {
      const point = orderedPoints[pointIndex];
      if (pointIndex > startIndex) {
        const previous = orderedPoints[pointIndex - 1];
        const gapMinutes =
          (Date.parse(point.datetime) - Date.parse(previous.datetime)) / 60_000;
        if (gapMinutes > intervalMinutes * 1.5) break;
      }

      const coveredMinutes = Math.min(intervalMinutes, remainingMinutes);
      slice.push(point);
      weightedPrice += point.price * coveredMinutes;
      remainingMinutes -= coveredMinutes;
    }

    if (remainingMinutes > 0) continue;
    const average = weightedPrice / durationMinutes;
    if (average < bestAverage) {
      bestAverage = average;
      best = { points: slice, start: orderedPoints[startIndex].datetime };
    }
  }

  if (!best) return null;
  const baseline = overallAverage ?? calculateStatistics(points)?.average ?? bestAverage;
  const savingsPerMWh = Math.max(0, baseline - bestAverage);
  const end = new Date(Date.parse(best.start) + durationMinutes * 60_000);

  return {
    start: best.start,
    end: end.toISOString(),
    durationMinutes,
    averagePrice: bestAverage,
    maximumPrice: Math.max(...best.points.map((point) => point.price)),
    savingsPerMWh,
    savingsPercent: baseline === 0 ? 0 : (savingsPerMWh / Math.abs(baseline)) * 100,
  };
}

export function findNextPeak(
  points: PricePoint[],
  now: number = Date.now(),
): PricePoint | null {
  const future = points.filter((point) => Date.parse(point.datetime) >= now);
  if (future.length === 0) return null;
  const prices = points.map((point) => point.price);
  const threshold = quantile([...prices].sort((a, b) => a - b), 0.8);
  return (
    future.find((point) => point.price >= threshold) ??
    future.reduce((highest, point) => (point.price > highest.price ? point : highest))
  );
}

function findNextPeriod(
  points: PricePoint[],
  accepted: Set<PriceCategory>,
  now: number,
): PricePeriod | null {
  const future = points.filter((point) => Date.parse(point.datetime) >= now);
  const startIndex = future.findIndex((point) => accepted.has(point.category));
  if (startIndex < 0) return null;
  const period: PricePoint[] = [];
  for (let index = startIndex; index < future.length; index += 1) {
    if (!accepted.has(future[index].category)) break;
    period.push(future[index]);
  }
  const interval = inferIntervalMinutes(points);
  return {
    start: period[0].datetime,
    end: new Date(Date.parse(period[period.length - 1].datetime) + interval * 60_000).toISOString(),
    averagePrice: period.reduce((sum, point) => sum + point.price, 0) / period.length,
  };
}

export function analyzeForecast(
  points: PricePoint[],
  windowDurationMinutes = 60,
  now: number = Date.now(),
): ForecastAnalysis | null {
  const statistics = calculateStatistics(points);
  if (!statistics) return null;
  const available = points.filter((point) => Date.parse(point.datetime) >= now);
  const bestWindow = findBestWindow(
    available.length > 0 ? available : points,
    windowDurationMinutes,
    statistics.average,
  );

  return {
    statistics,
    bestWindow,
    nextPeak: findNextPeak(points, now),
    nextCheapPeriod: findNextPeriod(
      points,
      new Set<PriceCategory>(['very-cheap', 'cheap']),
      now,
    ),
    nextExpensivePeriod: findNextPeriod(
      points,
      new Set<PriceCategory>(['expensive', 'very-expensive']),
      now,
    ),
  };
}

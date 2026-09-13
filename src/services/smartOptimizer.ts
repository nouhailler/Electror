import { calculateStatistics } from '@/src/services/priceAnalysis';
import { rechargeWarning } from '@/src/services/plannerHelp';
import type { PricePoint, SignalPoint, SignalSeries } from '@/src/types/electricity';
import type { OptimizedWindow, PlannerPreferences } from '@/src/types/planner';

interface CandidateWindow {
  start: string;
  end: string;
  prices: PricePoint[];
  averagePrice: number;
  maximumPrice: number;
  averageCarbon: number | null;
  averageRenewable: number | null;
}

function inferIntervalMinutes(points: PricePoint[]): number {
  if (points.length < 2) return 60;
  const differences = points
    .slice(1)
    .map((point, index) =>
      (Date.parse(point.datetime) - Date.parse(points[index].datetime)) / 60_000,
    )
    .filter((difference) => difference > 0 && Number.isFinite(difference))
    .sort((left, right) => left - right);
  return differences[Math.floor(differences.length / 2)] ?? 60;
}

function parseClock(value: string): { hours: number; minutes: number } | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours <= 23 && minutes <= 59 ? { hours, minutes } : null;
}

function occurrenceOnLocalDay(value: string, day: number): number | null {
  const clock = parseClock(value);
  if (!clock) return null;
  const date = new Date(day);
  date.setHours(clock.hours, clock.minutes, 0, 0);
  return date.getTime();
}

function isQuiet(datetime: number, start: string, end: string): boolean {
  const startClock = parseClock(start);
  const endClock = parseClock(end);
  if (!startClock || !endClock) return false;
  const startMinutes = startClock.hours * 60 + startClock.minutes;
  const endMinutes = endClock.hours * 60 + endClock.minutes;
  if (startMinutes === endMinutes) return false;
  const date = new Date(datetime);
  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  return startMinutes < endMinutes
    ? currentMinutes >= startMinutes && currentMinutes < endMinutes
    : currentMinutes >= startMinutes || currentMinutes < endMinutes;
}

function overlapsQuietHours(
  start: number,
  end: number,
  preferences: PlannerPreferences,
): boolean {
  if (!preferences.avoidQuietHours) return false;
  for (let cursor = start; cursor < end; cursor += 15 * 60_000) {
    if (isQuiet(cursor, preferences.quietStart, preferences.quietEnd)) return true;
  }
  return false;
}

function signalMap(series: SignalSeries | null): Map<number, SignalPoint> {
  return new Map(
    (series?.points ?? []).map((point) => [Date.parse(point.datetime), point]),
  );
}

function weightedSignalAverage(
  points: PricePoint[],
  map: Map<number, SignalPoint>,
  durationMinutes: number,
  intervalMinutes: number,
): number | null {
  let weightedTotal = 0;
  let coveredTotal = 0;
  let remainingMinutes = durationMinutes;
  for (const point of points) {
    const coveredMinutes = Math.min(intervalMinutes, remainingMinutes);
    const signal = map.get(Date.parse(point.datetime));
    if (signal) {
      weightedTotal += signal.value * coveredMinutes;
      coveredTotal += coveredMinutes;
    }
    remainingMinutes -= coveredMinutes;
  }
  return coveredTotal > 0 ? weightedTotal / coveredTotal : null;
}

function buildCandidates(
  pricePoints: PricePoint[],
  carbon: SignalSeries | null,
  renewable: SignalSeries | null,
  preferences: PlannerPreferences,
  now: number,
): CandidateWindow[] {
  if (
    preferences.durationMinutes <= 0 ||
    preferences.powerKw <= 0 ||
    preferences.powerKw > preferences.maxHomePowerKw
  ) {
    return [];
  }

  const ordered = [...pricePoints].sort(
    (left, right) => Date.parse(left.datetime) - Date.parse(right.datetime),
  );
  const intervalMinutes = inferIntervalMinutes(ordered);
  const carbonByTime = signalMap(carbon);
  const renewableByTime = signalMap(renewable);
  const configuredEarliest = preferences.earliestStart
    ? occurrenceOnLocalDay(preferences.earliestStart, now)
    : null;
  const earliest = Math.max(now, configuredEarliest ?? now);
  let latest = preferences.latestEnd
    ? occurrenceOnLocalDay(preferences.latestEnd, earliest) ?? Number.POSITIVE_INFINITY
    : Number.POSITIVE_INFINITY;
  if (latest < earliest) {
    const nextDay = new Date(latest);
    nextDay.setDate(nextDay.getDate() + 1);
    latest = nextDay.getTime();
  }
  const candidates: CandidateWindow[] = [];

  for (let startIndex = 0; startIndex < ordered.length; startIndex += 1) {
    const start = Date.parse(ordered[startIndex].datetime);
    const end = start + preferences.durationMinutes * 60_000;
    if (start < earliest || end > latest || overlapsQuietHours(start, end, preferences)) continue;

    const slice: PricePoint[] = [];
    let weightedPrice = 0;
    let remainingMinutes = preferences.durationMinutes;
    for (
      let pointIndex = startIndex;
      pointIndex < ordered.length && remainingMinutes > 0;
      pointIndex += 1
    ) {
      const point = ordered[pointIndex];
      if (pointIndex > startIndex) {
        const previous = ordered[pointIndex - 1];
        const gap = (Date.parse(point.datetime) - Date.parse(previous.datetime)) / 60_000;
        if (gap > intervalMinutes * 1.5) break;
      }
      const coveredMinutes = Math.min(intervalMinutes, remainingMinutes);
      weightedPrice += point.price * coveredMinutes;
      remainingMinutes -= coveredMinutes;
      slice.push(point);
    }
    if (remainingMinutes > 0) continue;

    candidates.push({
      start: new Date(start).toISOString(),
      end: new Date(end).toISOString(),
      prices: slice,
      averagePrice: weightedPrice / preferences.durationMinutes,
      maximumPrice: Math.max(...slice.map((point) => point.price)),
      averageCarbon: weightedSignalAverage(
        slice,
        carbonByTime,
        preferences.durationMinutes,
        intervalMinutes,
      ),
      averageRenewable: weightedSignalAverage(
        slice,
        renewableByTime,
        preferences.durationMinutes,
        intervalMinutes,
      ),
    });
  }

  return candidates;
}

function normalize(value: number, minimum: number, maximum: number): number {
  return maximum === minimum ? 0 : (value - minimum) / (maximum - minimum);
}

export function findOptimizedWindow(
  pricePoints: PricePoint[],
  carbon: SignalSeries | null,
  renewable: SignalSeries | null,
  preferences: PlannerPreferences,
  now = Date.now(),
): OptimizedWindow | null {
  if (rechargeWarning(preferences)) return null;
  const candidates = buildCandidates(pricePoints, carbon, renewable, preferences, now);
  if (candidates.length === 0) return null;

  const priceValues = candidates.map((candidate) => candidate.averagePrice);
  const carbonValues = candidates
    .map((candidate) => candidate.averageCarbon)
    .filter((value): value is number => value !== null);
  const priceMin = Math.min(...priceValues);
  const priceMax = Math.max(...priceValues);
  const carbonMin = carbonValues.length > 0 ? Math.min(...carbonValues) : 0;
  const carbonMax = carbonValues.length > 0 ? Math.max(...carbonValues) : 0;
  const hasCarbon = carbonValues.length > 0;
  const priceWeight = preferences.priceWeight / 100;

  const scored = candidates.map((candidate) => {
    const priceScore = normalize(candidate.averagePrice, priceMin, priceMax);
    const carbonScore = candidate.averageCarbon === null
      ? priceScore
      : normalize(candidate.averageCarbon, carbonMin, carbonMax);
    const score = preferences.optimizationMode === 'economical' || !hasCarbon
      ? priceScore
      : preferences.optimizationMode === 'ecological'
        ? carbonScore
        : priceScore * priceWeight + carbonScore * (1 - priceWeight);
    return { candidate, score };
  });
  scored.sort(
    (left, right) => left.score - right.score || left.candidate.averagePrice - right.candidate.averagePrice,
  );

  const { candidate, score } = scored[0];
  const referencePrice = calculateStatistics(pricePoints)?.average ?? candidate.averagePrice;
  const savingsPerMWh = Math.max(0, referencePrice - candidate.averagePrice);
  const energyKwh = preferences.powerKw * preferences.durationMinutes / 60;
  const explanation = preferences.optimizationMode === 'economical' || !hasCarbon
    ? 'Le créneau au prix moyen le plus bas parmi ceux qui respectent vos contraintes.'
    : preferences.optimizationMode === 'ecological'
      ? 'Le créneau à l’intensité carbone la plus faible parmi ceux qui respectent vos contraintes.'
      : `Un compromis donnant ${preferences.priceWeight} % de poids au prix et ${100 - preferences.priceWeight} % au carbone.`;

  return {
    start: candidate.start,
    end: candidate.end,
    durationMinutes: preferences.durationMinutes,
    averagePrice: candidate.averagePrice,
    maximumPrice: candidate.maximumPrice,
    savingsPerMWh,
    savingsPercent: referencePrice === 0 ? 0 : savingsPerMWh / Math.abs(referencePrice) * 100,
    mode: preferences.optimizationMode,
    score,
    averageCarbon: candidate.averageCarbon,
    averageRenewable: candidate.averageRenewable,
    estimatedCarbonKg: candidate.averageCarbon === null
      ? null
      : candidate.averageCarbon * energyKwh / 1_000,
    explanation,
  };
}

export function explainUnavailableWindow(points: PricePoint[], p: PlannerPreferences, now = Date.now()): string {
  const recharge = rechargeWarning(p);
  if (recharge) return recharge;
  if (!Number.isFinite(p.powerKw) || p.powerKw <= 0) return 'La puissance doit être supérieure à zéro. Renseignez la puissance moyenne réelle de l’appareil.';
  if (p.powerKw > p.maxHomePowerKw) return `L’appareil demande ${p.powerKw} kW, au-dessus de la limite du logement (${p.maxHomePowerKw} kW). Réduisez sa puissance si possible ou vérifiez la limite réelle de votre installation.`;
  if (!points.some((point) => Date.parse(point.datetime) >= now)) return 'Il ne reste aucune donnée future. Actualisez les prévisions ou sélectionnez un autre horizon.';
  const unrestricted = { ...p, earliestStart: '', latestEnd: '', avoidQuietHours: false };
  if (buildCandidates(points, null, null, unrestricted, now).length === 0) return 'Les données continues disponibles ne couvrent pas toute la durée du cycle. Choisissez un horizon plus long, actualisez les données ou réduisez la durée si votre appareil le permet.';
  if (p.avoidQuietHours && buildCandidates(points, null, null, { ...p, avoidQuietHours: false }, now).length > 0) return 'Les heures silencieuses excluent tous les créneaux compatibles avec vos horaires. Ajustez la plage de silence ou élargissez les horaires autorisés.';
  return 'La durée du cycle ne tient pas dans les horaires autorisés avec les contraintes actuelles. Avancez le début autorisé, repoussez la fin ou réduisez la durée si possible. Les horaires utilisent le fuseau de votre appareil.';
}

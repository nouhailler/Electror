import { Skeleton } from '@/components/ui/skeleton';

export function ForecastSkeleton() {
  return (
    <div aria-label="Chargement des prévisions" aria-live="polite">
      <span className="sr-only">Chargement des prévisions…</span>
      <Skeleton className="h-64 rounded-[2rem]" />
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((item) => <Skeleton key={item} className="h-40 rounded-3xl" />)}
      </div>
      <Skeleton className="mt-4 h-96 rounded-[2rem]" />
    </div>
  );
}

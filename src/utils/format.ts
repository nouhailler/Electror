export function formatPrice(value: number): string {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(value);
}

export function formatHour(datetime: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(datetime));
}

export function formatShortDate(datetime: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(datetime));
}

export function formatDateTime(datetime: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(datetime));
}

export function formatPeriod(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const sameDay = startDate.toDateString() === endDate.toDateString();
  return sameDay
    ? `${formatHour(start)} → ${formatHour(end)}`
    : `${formatShortDate(start)} ${formatHour(start)} → ${formatShortDate(end)} ${formatHour(end)}`;
}

export function relativeUpdateTime(datetime: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - Date.parse(datetime)) / 60_000));
  if (minutes < 1) return 'à l’instant';
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  return `le ${formatDateTime(datetime)}`;
}

import type { HorizonHours } from '@/src/types/electricity';

const API_URL = 'https://api.electricitymaps.com/v4/price-day-ahead/forecast';
const ALLOWED_ZONES = new Set(['FR', 'DE', 'BE', 'ES', 'IT-NO', 'NL']);
const ALLOWED_HORIZONS = new Set<HorizonHours>([24, 48, 72]);
const CACHE_TTL_MS = 15 * 60 * 1000;
const RESPONSE_HEADERS = { 'Cache-Control': 'private, max-age=900', 'Content-Type': 'application/json' };

interface ServerCacheEntry {
  expiresAt: number;
  payload: unknown;
}

const cache = new Map<string, ServerCacheEntry>();

function errorResponse(status: number, code: string, message: string): Response {
  return Response.json({ code, message }, { status });
}

function messageForStatus(status: number): { code: string; message: string } {
  switch (status) {
    case 400:
      return { code: 'BAD_REQUEST', message: 'La zone ou la période demandée n’est pas valide.' };
    case 401:
      return { code: 'INVALID_API_KEY', message: 'La clé Electricity Maps est invalide ou a expiré.' };
    case 403:
      return { code: 'ACCESS_DENIED', message: 'Votre accès Electricity Maps ne couvre pas cette zone ou cet horizon.' };
    case 404:
      return { code: 'NO_DATA', message: 'Aucune prévision n’est disponible pour cette zone.' };
    case 429:
      return { code: 'RATE_LIMIT', message: 'La limite de requêtes est atteinte. Réessayez dans quelques minutes.' };
    default:
      return { code: 'UPSTREAM_ERROR', message: 'Electricity Maps est momentanément indisponible.' };
  }
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const zone = searchParams.get('zone') ?? '';
  const horizon = Number(searchParams.get('horizon')) as HorizonHours;

  if (!ALLOWED_ZONES.has(zone) || !ALLOWED_HORIZONS.has(horizon)) {
    return errorResponse(400, 'BAD_REQUEST', 'Sélection de zone ou d’horizon invalide.');
  }

  const apiKey = process.env.ELECTRICITY_MAPS_API_KEY;
  if (!apiKey) {
    return errorResponse(
      503,
      'CONFIG_MISSING',
      'Configuration requise : ajoutez ELECTRICITY_MAPS_API_KEY dans le fichier .env.',
    );
  }

  const cacheKey = `${zone}:${horizon}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return Response.json(cached.payload, { headers: RESPONSE_HEADERS });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const url = new URL(API_URL);
    url.searchParams.set('zone', zone);
    url.searchParams.set('horizonHours', String(horizon));
    url.searchParams.set('temporalGranularity', 'hourly');
    url.searchParams.set('disableCallerLookup', 'true');

    const response = await fetch(url, {
      headers: { Accept: 'application/json', 'auth-token': apiKey },
      signal: controller.signal,
    });
    if (!response.ok) {
      const error = messageForStatus(response.status);
      return errorResponse(response.status, error.code, error.message);
    }
    const payload: unknown = await response.json();
    if (!payload || typeof payload !== 'object' || !Array.isArray((payload as { data?: unknown }).data)) {
      return errorResponse(502, 'INVALID_RESPONSE', 'Electricity Maps a renvoyé une réponse incomplète.');
    }
    cache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, payload });
    return Response.json(payload, { headers: RESPONSE_HEADERS });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return errorResponse(504, 'TIMEOUT', 'Electricity Maps met trop de temps à répondre. Réessayez.');
    }
    return errorResponse(502, 'NETWORK', 'Impossible de joindre Electricity Maps pour le moment.');
  } finally {
    clearTimeout(timeout);
  }
}

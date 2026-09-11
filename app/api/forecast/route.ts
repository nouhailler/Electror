import type { HorizonHours } from '@/src/types/electricity';

const API_ROOT = 'https://api.electricitymaps.com/v4';
const ENDPOINTS = {
  price: 'price-day-ahead/combined',
  carbon: 'carbon-intensity/forecast',
  renewable: 'renewable-energy/forecast',
  mix: 'electricity-mix/forecast',
  priceHistory: 'price-day-ahead/history',
} as const;
const ALLOWED_ZONES = new Set(['FR', 'DE', 'BE', 'ES', 'IT-NO', 'NL']);
const ALLOWED_HORIZONS = new Set<HorizonHours>([24, 48, 72]);
const CACHE_TTL_MS = 15 * 60 * 1000;
const RESPONSE_HEADERS = { 'Cache-Control': 'private, max-age=900', 'Content-Type': 'application/json' };

interface ServerCacheEntry {
  expiresAt: number;
  payload: unknown;
}

interface UpstreamResult {
  ok: boolean;
  status: number;
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
    const fetchEndpoint = async (
      endpoint: string,
      includeHorizon = true,
    ): Promise<UpstreamResult> => {
      const url = new URL(`${API_ROOT}/${endpoint}`);
      url.searchParams.set('zone', zone);
      if (includeHorizon) url.searchParams.set('horizonHours', String(horizon));
      url.searchParams.set('temporalGranularity', 'hourly');
      url.searchParams.set('disableCallerLookup', 'true');
      const response = await fetch(url, {
        headers: { Accept: 'application/json', 'auth-token': apiKey },
        signal: controller.signal,
      });
      return {
        ok: response.ok,
        status: response.status,
        payload: await response.json().catch(() => null),
      };
    };
    const fetchOptionalEndpoint = async (
      endpoint: string,
      includeHorizon = true,
    ): Promise<UpstreamResult> => {
      try {
        return await fetchEndpoint(endpoint, includeHorizon);
      } catch {
        return { ok: false, status: 0, payload: null };
      }
    };

    const [price, carbon, renewable, mix, priceHistory] = await Promise.all([
      fetchEndpoint(ENDPOINTS.price),
      fetchOptionalEndpoint(ENDPOINTS.carbon),
      fetchOptionalEndpoint(ENDPOINTS.renewable),
      fetchOptionalEndpoint(ENDPOINTS.mix),
      fetchOptionalEndpoint(ENDPOINTS.priceHistory, false),
    ]);

    if (!price.ok) {
      const error = messageForStatus(price.status);
      return errorResponse(price.status, error.code, error.message);
    }
    if (
      !price.payload ||
      typeof price.payload !== 'object' ||
      !Array.isArray((price.payload as { data?: unknown }).data)
    ) {
      return errorResponse(502, 'INVALID_RESPONSE', 'Electricity Maps a renvoyé une réponse incomplète.');
    }

    const optionalSignals = { carbon, renewable, mix, priceHistory };
    const payload = {
      price: price.payload,
      carbon: carbon.ok ? carbon.payload : null,
      renewable: renewable.ok ? renewable.payload : null,
      mix: mix.ok ? mix.payload : null,
      priceHistory: priceHistory.ok ? priceHistory.payload : null,
      unavailableSignals: Object.entries(optionalSignals)
        .filter(([, result]) => !result.ok)
        .map(([name]) => name),
    };
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

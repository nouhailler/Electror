import { mapEnergyResponse } from '@/src/services/forecastMapper';
import type { ApiErrorPayload, EnergyData, HorizonHours } from '@/src/types/electricity';

export class ForecastRequestError extends Error {
  code: string;

  constructor(message: string, code = 'UNKNOWN') {
    super(message);
    this.name = 'ForecastRequestError';
    this.code = code;
  }
}

export async function fetchForecast(
  zoneId: string,
  horizon: HorizonHours,
  signal?: AbortSignal,
): Promise<EnergyData> {
  let response: Response;
  try {
    response = await fetch(
      `/api/forecast?zone=${encodeURIComponent(zoneId)}&horizon=${horizon}`,
      { signal, headers: { Accept: 'application/json' } },
    );
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ForecastRequestError(
      'Impossible de joindre le service. Vérifiez votre connexion puis réessayez.',
      'NETWORK',
    );
  }

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const apiError = payload as Partial<ApiErrorPayload> | null;
    throw new ForecastRequestError(
      apiError?.message ?? 'Les prévisions sont momentanément indisponibles.',
      apiError?.code ?? `HTTP_${response.status}`,
    );
  }
  return mapEnergyResponse(payload);
}

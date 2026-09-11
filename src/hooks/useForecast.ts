'use client';

import { useCallback, useEffect, useReducer } from 'react';
import { fetchForecast, ForecastRequestError } from '@/src/api/electricityMaps';
import { archiveForecast, calculateStoredForecastQuality } from '@/src/services/forecastArchive';
import { readForecastCache, writeForecastCache } from '@/src/services/forecastCache';
import type { EnergyData, Forecast, HorizonHours } from '@/src/types/electricity';

interface ForecastState {
  status: 'loading' | 'success' | 'error';
  data: EnergyData | null;
  forecast: Forecast | null;
  isStale: boolean;
  message: string | null;
  code: string | null;
  refreshIndex: number;
}

type Action =
  | { type: 'loading'; cached: EnergyData | null; isStale: boolean }
  | { type: 'success'; data: EnergyData }
  | { type: 'cached-error'; data: EnergyData; message: string; code: string }
  | { type: 'error'; message: string; code: string }
  | { type: 'refresh' };

const initialState: ForecastState = {
  status: 'loading',
  data: null,
  forecast: null,
  isStale: false,
  message: null,
  code: null,
  refreshIndex: 0,
};

function reducer(state: ForecastState, action: Action): ForecastState {
  switch (action.type) {
    case 'loading':
      return {
        ...state,
        status: action.cached ? 'success' : 'loading',
        data: action.cached,
        forecast: action.cached?.forecast ?? null,
        isStale: action.isStale,
        message: null,
        code: null,
      };
    case 'success':
      return { ...state, status: 'success', data: action.data, forecast: action.data.forecast, isStale: false, message: null, code: null };
    case 'cached-error':
      return { ...state, status: 'success', data: action.data, forecast: action.data.forecast, isStale: true, message: action.message, code: action.code };
    case 'error':
      return { ...state, status: 'error', data: null, forecast: null, isStale: false, message: action.message, code: action.code };
    case 'refresh':
      return { ...state, refreshIndex: state.refreshIndex + 1 };
  }
}

export function useForecast(zoneId: string, horizon: HorizonHours): ForecastState & { refresh: () => void } {
  const [state, dispatch] = useReducer(reducer, initialState);
  const refresh = useCallback(() => dispatch({ type: 'refresh' }), []);

  useEffect(() => {
    const controller = new AbortController();
    const cached = readForecastCache(zoneId, horizon);
    if (cached && !cached.isStale && state.refreshIndex === 0) {
      dispatch({ type: 'success', data: cached.data });
      return () => controller.abort();
    }

    dispatch({ type: 'loading', cached: cached?.data ?? null, isStale: Boolean(cached) });
    fetchForecast(zoneId, horizon, controller.signal)
      .then((data) => {
        const enriched = {
          ...data,
          forecastQuality: calculateStoredForecastQuality(data.forecast),
        };
        archiveForecast(data.forecast);
        writeForecastCache(zoneId, horizon, enriched);
        dispatch({ type: 'success', data: enriched });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        const message = error instanceof Error ? error.message : 'Les prévisions sont indisponibles.';
        const code = error instanceof ForecastRequestError ? error.code : 'UNKNOWN';
        if (cached) dispatch({ type: 'cached-error', data: cached.data, message, code });
        else dispatch({ type: 'error', message, code });
      });

    return () => controller.abort();
  }, [zoneId, horizon, state.refreshIndex]);

  return { ...state, refresh };
}

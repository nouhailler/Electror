'use client';

import { useCallback, useEffect, useReducer } from 'react';
import { fetchForecast, ForecastRequestError } from '@/src/api/electricityMaps';
import { readForecastCache, writeForecastCache } from '@/src/services/forecastCache';
import type { Forecast, HorizonHours } from '@/src/types/electricity';

interface ForecastState {
  status: 'loading' | 'success' | 'error';
  forecast: Forecast | null;
  isStale: boolean;
  message: string | null;
  code: string | null;
  refreshIndex: number;
}

type Action =
  | { type: 'loading'; cached: Forecast | null; isStale: boolean }
  | { type: 'success'; forecast: Forecast }
  | { type: 'cached-error'; forecast: Forecast; message: string; code: string }
  | { type: 'error'; message: string; code: string }
  | { type: 'refresh' };

const initialState: ForecastState = {
  status: 'loading',
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
        forecast: action.cached,
        isStale: action.isStale,
        message: null,
        code: null,
      };
    case 'success':
      return { ...state, status: 'success', forecast: action.forecast, isStale: false, message: null, code: null };
    case 'cached-error':
      return { ...state, status: 'success', forecast: action.forecast, isStale: true, message: action.message, code: action.code };
    case 'error':
      return { ...state, status: 'error', forecast: null, isStale: false, message: action.message, code: action.code };
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
      dispatch({ type: 'success', forecast: cached.forecast });
      return () => controller.abort();
    }

    dispatch({ type: 'loading', cached: cached?.forecast ?? null, isStale: Boolean(cached) });
    fetchForecast(zoneId, horizon, controller.signal)
      .then((forecast) => {
        writeForecastCache(zoneId, horizon, forecast);
        dispatch({ type: 'success', forecast });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        const message = error instanceof Error ? error.message : 'Les prévisions sont indisponibles.';
        const code = error instanceof ForecastRequestError ? error.code : 'UNKNOWN';
        if (cached) dispatch({ type: 'cached-error', forecast: cached.forecast, message, code });
        else dispatch({ type: 'error', message, code });
      });

    return () => controller.abort();
  }, [zoneId, horizon, state.refreshIndex]);

  return { ...state, refresh };
}

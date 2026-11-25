import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from './errors';

export interface LoaderState<T> {
  data: T | null;
  error: string | null;
  /** First load with nothing to show yet. */
  loading: boolean;
  /** Pull-to-refresh or background reload while data is already on screen. */
  refreshing: boolean;
  reload: () => void;
}

/**
 * Loads a resource once the screen is enabled (for example, once its tab has
 * been visited) and keeps the last good data on screen while refreshing. A
 * response from an earlier request is dropped if a newer one has started.
 */
export function useLoader<T>(load: () => Promise<T>, fallbackError: string, enabled = true): LoaderState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const dataRef = useRef<T | null>(null);
  const requestId = useRef(0);
  const loaderRef = useRef(load);
  useEffect(() => {
    loaderRef.current = load;
  });

  const reload = useCallback(() => {
    const id = ++requestId.current;
    setError(null);
    setLoading(dataRef.current === null);
    setRefreshing(dataRef.current !== null);
    loaderRef.current()
      .then((result) => {
        if (id !== requestId.current) return;
        dataRef.current = result;
        setData(result);
      })
      .catch((cause: unknown) => {
        if (id !== requestId.current) return;
        setError(errorMessage(cause, fallbackError));
      })
      .finally(() => {
        if (id !== requestId.current) return;
        setLoading(false);
        setRefreshing(false);
      });
  }, [fallbackError]);

  // Loads on first enable, then quietly refreshes each time the screen becomes
  // enabled again (for example, when its tab is revisited).
  const wasEnabled = useRef(false);
  useEffect(() => {
    if (enabled && !wasEnabled.current) reload();
    wasEnabled.current = enabled;
  }, [enabled, reload]);

  useEffect(
    () => () => {
      requestId.current++;
    },
    [],
  );

  return { data, error, loading, refreshing, reload };
}

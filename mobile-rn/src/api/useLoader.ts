import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { errorMessage } from './errors';

export interface LoaderState<T> {
  data: T | null;
  error: string | null;
  /** First load with nothing to show yet. */
  loading: boolean;
  /** Pull-to-refresh while data is already on screen. */
  refreshing: boolean;
  reload: () => void;
}

/**
 * Loads a resource when the screen gains focus and keeps the last good data
 * on screen while refreshing. Stale responses from an earlier call are dropped.
 */
export function useLoader<T>(load: () => Promise<T>, fallbackError: string): LoaderState<T> {
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

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  useEffect(() => () => {
    requestId.current++;
  }, []);

  return { data, error, loading, refreshing, reload };
}

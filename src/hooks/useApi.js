import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiError } from '../lib/apiClient';

/**
 * useApi — fires an async function on mount and whenever deps change.
 * Cancels the in-flight request when the component unmounts or deps change.
 *
 * Usage:
 *   const { data, loading, error, refetch } = useApi(
 *     ({ signal }) => ordersService.list({ status: 'pending', signal }),
 *     [statusFilter]
 *   );
 */
export function useApi(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const abortRef = useRef(null);

  const execute = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const data = await fn({ signal: controller.signal });
      if (!controller.signal.aborted) {
        setState({ data, loading: false, error: null });
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setState({
          data: null,
          loading: false,
          error: err instanceof ApiError ? err : new ApiError(0, err.message),
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    execute();
    return () => abortRef.current?.abort();
  }, [execute]);

  return { ...state, refetch: execute };
}

/**
 * useMutation — wraps a write operation (POST / PUT / PATCH / DELETE).
 * Does NOT auto-fire — call mutate(...args) manually.
 *
 * Usage:
 *   const { mutate, loading, error } = useMutation(ordersService.cancel);
 *   const handleCancel = async (id) => {
 *     const { success, data, error } = await mutate(id, { reason: 'Customer request' });
 *   };
 */
export function useMutation(fn) {
  const [state, setState] = useState({ loading: false, error: null, data: null });

  const mutate = useCallback(
    async (...args) => {
      setState({ loading: true, error: null, data: null });
      try {
        const data = await fn(...args);
        setState({ loading: false, error: null, data });
        return { success: true, data };
      } catch (err) {
        const error = err instanceof ApiError ? err : new ApiError(0, err.message);
        setState({ loading: false, error, data: null });
        return { success: false, error };
      }
    },
    [fn],
  );

  const reset = useCallback(() => {
    setState({ loading: false, error: null, data: null });
  }, []);

  return { ...state, mutate, reset };
}

/**
 * usePaginatedApi — paginated list with built-in filter + page state.
 *
 * Usage:
 *   const { data, meta, loading, setParams, setPage } = usePaginatedApi(
 *     ordersService.list,
 *     { status: 'pending', limit: 20 }
 *   );
 */
export function usePaginatedApi(fn, initialParams = {}) {
  const [params, setParamsState] = useState({ page: 1, limit: 20, ...initialParams });

  const { data: raw, loading, error, refetch } = useApi(
    (opts) => fn({ ...params, ...opts }),
    // stringify so the effect re-fires when any param changes
    [JSON.stringify(params)],
  );

  const setParams = useCallback((updates) => {
    setParamsState((p) => ({ ...p, ...updates, page: 1 }));
  }, []);

  const setPage = useCallback((page) => {
    setParamsState((p) => ({ ...p, page }));
  }, []);

  return {
    data: raw?.data ?? [],
    meta: raw?.meta ?? { page: 1, limit: 20, total: 0, total_pages: 0 },
    loading,
    error,
    params,
    setParams,
    setPage,
    refetch,
  };
}

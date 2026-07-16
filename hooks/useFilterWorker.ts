import { useRef, useState, useEffect } from 'react';
import type { Participant } from '../types';
import type { FilterWorkerFilters } from '../workers/filterWorker';
import { filterData } from '../workers/filterWorker';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseFilterWorkerResult {
  filteredData: Participant[];
  isComputing: boolean;
  error: string | null;
}

export interface UseFilterWorkerOptions {
  /** Debounce delay for text-search changes (default: 300) */
  debounceMs?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createWorkerOrNull(): Worker | null {
  if (typeof Worker === 'undefined') return null;
  try {
    return new Worker(
      new URL('../workers/filterWorker.ts', import.meta.url),
      { type: 'module' },
    );
  } catch {
    return null;
  }
}

function hasActiveFilters(filters: FilterWorkerFilters): boolean {
  return Object.values(filters).some(
    v => v !== undefined && v !== '' && v !== 'todas' && v !== 'todos',
  );
}

function shallowEqual(a: FilterWorkerFilters, b: FilterWorkerFilters): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    if ((a as Record<string, unknown>)[k] !== (b as Record<string, unknown>)[k]) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useFilterWorker(
  data: Participant[],
  filters: FilterWorkerFilters,
  options?: UseFilterWorkerOptions,
): UseFilterWorkerResult {
  const debounceMs = options?.debounceMs ?? 300;

  const [state, setState] = useState<UseFilterWorkerResult>({
    filteredData: data,
    isComputing: false,
    error: null,
  });

  // Worker reference — stable across renders, created/terminated in mount effect
  const workerRef = useRef<Worker | null>(null);
  // Generation counter for stale-response protection
  const genRef = useRef(0);
  // Debounce timer
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track previous search value to detect text vs select changes
  const prevSearchRef = useRef<string | undefined>(undefined);
  // Guard against setState after unmount
  const mountedRef = useRef(true);

  // ── Worker lifecycle (mount / unmount) ──

  useEffect(() => {
    mountedRef.current = true;
    const worker = createWorkerOrNull();
    workerRef.current = worker;

    if (worker) {
      worker.onmessage = (e: MessageEvent) => {
        if (!mountedRef.current) return;

        const msg = e.data;

        // Stale-response guard — only accept responses matching the latest generation
        if (msg._gen !== undefined && msg._gen !== genRef.current) return;

        if (msg.error) {
          // Worker returned an error — fall back to sync
          const result = filterData(data, filters);
          if (!mountedRef.current) return;
          setState({ filteredData: result, isComputing: false, error: msg.error });
        } else {
          setState({ filteredData: msg.filtered, isComputing: false, error: null });
        }
      };

      worker.onerror = () => {
        if (!mountedRef.current) return;
        // Worker threw — fall back to sync
        const result = filterData(data, filters);
        if (!mountedRef.current) return;
        setState({ filteredData: result, isComputing: false, error: 'Worker error' });
      };
    }

    return () => {
      mountedRef.current = false;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      if (worker) {
        worker.terminate();
      }
      workerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track previous values to avoid re-processing on reference-only changes
  const prevDataRef = useRef<Participant[]>(data);
  const prevFiltersRef = useRef<FilterWorkerFilters>(filters);

  // ── Post on filter changes with debounce ──

  useEffect(() => {
    // Guard: skip if both data and filters are unchanged by value
    const dataChanged = data !== prevDataRef.current;
    const filtersChanged = !shallowEqual(filters, prevFiltersRef.current);
    if (!dataChanged && !filtersChanged) return;
    prevDataRef.current = data;
    prevFiltersRef.current = { ...filters };

    // If data is empty, short-circuit immediately
    if (data.length === 0) {
      if (state.filteredData.length !== 0 || state.isComputing) {
        setState({ filteredData: [], isComputing: false, error: null });
      }
      return;
    }

    // If no active filters, return data as-is
    if (!hasActiveFilters(filters)) {
      if (state.filteredData !== data || state.isComputing) {
        setState({ filteredData: data, isComputing: false, error: null });
      }
      return;
    }

    const doCompute = () => {
      // Increment generation before posting
      genRef.current += 1;

      const worker = workerRef.current;
      if (!worker) {
        // Sync fallback when worker is unavailable
        const result = filterData(data, filters);
        if (!mountedRef.current) return;
        setState({ filteredData: result, isComputing: false, error: null });
        return;
      }

      setState(prev => ({ ...prev, isComputing: true }));
      worker.postMessage({ data, filters, _gen: genRef.current });
    };

    // Detect text vs select change
    const isTextChange =
      prevSearchRef.current !== undefined && prevSearchRef.current !== filters.search;
    prevSearchRef.current = filters.search;

    if (isTextChange) {
      // Debounce text-search changes
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(doCompute, debounceMs);
    } else {
      // Immediate for select/boolean changes
      doCompute();
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
    // Watch filters deeply — compare by value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, filters, debounceMs]);

  return state;
}

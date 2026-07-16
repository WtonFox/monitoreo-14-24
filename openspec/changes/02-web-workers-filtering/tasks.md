# Tasks: Web Workers — Off-Main-Thread Filtering

> **Change**: `02-web-workers-filtering`
> **Estimated lines**: ~240 (185 new + 55 modified)
> **Chained PRs**: No (accumulating `feat/mejoras-estructurales` branch)
> **Strategy**: `ask-on-risk`

---

## Task 1 — `workers/filterWorker.ts` (New, ~55 lines) ✓

**Goal**: Create the Web Worker with its pure filter function and message handler.

**Implementation**:

- Create `workers/filterWorker.ts` following the exact pattern of `workers/computeBoardData.worker.ts` (URL constructor pattern, `self.onmessage`, try/catch, `self.postMessage` with result or error).
- Define a `FilterWorkerRequest` interface as the superset covering both filter shapes in the codebase (Participantes fields + filterStore fields):

  ```typescript
  interface FilterWorkerRequest {
    data: Participant[];
    filters: {
      search?: string;
      provincia?: string;
      municipio?: string;
      centro?: string;
      sexo?: string;
      estado?: string;
      yearIngreso?: string;
      yearInclusion?: string;
      ageGroup?: string;
      estadoCivil?: string;
      nivelEstudio?: string;
    };
  }
  ```

- Implement the pure `filterData(data, filters)` function — the exact same logic as `computeFilteredData` in `filterStore.ts` (lines 58–112) merged with the search-term + centro + estado + all filter logic from `useParticipantesFilters.ts` (lines 214–279). Key rules:
  - `search` text matches against `nombres`, `apellidos`, `cedula`, `provincia`, `municipio`, `centro`, `estado`, `estadoCivil`, `nivelEstudio`, `rutaFormativa` (case-insensitive)
  - `provincia` match with `'todas'` as "no filter" value
  - `municipio` match with `'todos'` as "no filter" value
  - `centro` match with `'todos'` as "no filter" value
  - `sexo` match, `estado` exact match
  - `yearIngreso` / `yearInclusion`: parse `fechaRegistro`/`fechaInclusion` year, compare as string
  - `ageGroup`: ranges 14-17, 18-20, 21-24, 25-29, 30+
  - `estadoCivil` / `nivelEstudio`: exact match
  - All filters AND-combined, empty/undefined = no filter
- Define `FilterWorkerResponse`:
  ```typescript
  type FilterWorkerResponse =
    | { filtered: Participant[]; duration: number }
    | { error: string };
  ```
- Export `filterData` as a named export so the sync fallback can import and call it directly.
- Worker handler:
  ```typescript
  self.onmessage = (e: MessageEvent<FilterWorkerRequest>) => {
    const start = performance.now();
    try {
      const { data, filters } = e.data;
      const filtered = filterData(data, filters);
      const response: FilterWorkerResponse = { filtered, duration: performance.now() - start };
      self.postMessage(response);
    } catch (err) {
      self.postMessage({ error: String(err) } as FilterWorkerResponse);
    }
  };
  ```

**Files**:
- `workers/filterWorker.ts` — **New**

**Reference**: `workers/computeBoardData.worker.ts` (pattern), `stores/filterStore.ts` lines 58–112 (filter logic), `hooks/useParticipantesFilters.ts` lines 214–279 (additional filter fields)

---

## Task 2 — `hooks/useFilterWorker.ts` (New, ~80 lines) ✓

**Goal**: Create the worker lifecycle hook with debounce, generation-counter stale-response protection, and sync fallback.

**Implementation**:

- Create `hooks/useFilterWorker.ts` following the exact pattern of `hooks/useBoardDataWorker.ts`.
- Import `filterData` from `../workers/filterWorker` for sync fallback.
- Hook signature:
  ```typescript
  function useFilterWorker(
    data: Participant[],
    filters: FilterWorkerRequest['filters'],
    options?: { debounceMs?: number; immediateKeys?: string[] }
  ): { filteredData: Participant[]; isComputing: boolean; error: string | null }
  ```
- Keep internal state via `useState`: `{ filteredData, isComputing, error }`.
- **Debounce**:
  - Use `useRef` for debounce timer.
  - For text-search changes (the `search` field), debounce by 300ms.
  - For select/boolean filters (provincia, municipio, sexo, etc.), post immediately.
  - Detect "text change" by comparing previous vs current `filters.search`.
- **Generation counter** (`useRef<number>`):
  - Increment before each worker post.
  - In the `onmessage` handler, check `generationRef.current === expectedGen` — if stale, ignore.
- **Worker lifecycle**:
  - `createWorkerOrNull()` helper (same pattern as `useBoardDataWorker.ts`): checks `typeof Worker === 'undefined'`, try/catch `new Worker(new URL('../workers/filterWorker.ts', import.meta.url), { type: 'module' })`.
  - On mount or when `[data, filters]` change: create worker, attach `message` and `error` listeners, post `{ data, filters }`.
  - On worker error or if worker creation fails: fall back to `filterData(data, filters)` synchronously. Set `isComputing: false`, `error` if any.
  - On unmount: remove listeners, `worker.terminate()`.
- Return `{ filteredData: result, isComputing: loading, error }`.

**Edge cases**:
- `data` is empty or `filters` all empty → return `data` directly, no post (optimization).
- Rapid filter changes (e.g., typing) → only last generation wins.
- Worker loads after component unmounts → generation guard prevents stale setState.

**Files**:
- `hooks/useFilterWorker.ts` — **New**

**Reference**: `hooks/useBoardDataWorker.ts` (full pattern), `workers/filterWorker.ts` (sync fallback import)

---

## Task 3 — Wire `hooks/useParticipantesFilters.ts` (Modified, ~25 lines changed) ✓

**Goal**: Replace the inline `useMemo[filteredData]` with `useFilterWorker`, keeping sort and derived state on main thread.

**Implementation**:

- Import `useFilterWorker` from `./useFilterWorker`.
- Replace the `filteredData` `useMemo` block (lines 214–317) with:
  ```typescript
  const { filteredData: workerFiltered, isComputing } = useFilterWorker(data, {
    search: searchTerm,
    provincia: filterProvincia,
    municipio: filterMunicipio,
    centro: filterCentro,
    sexo: filterSexo,
    estado: filterEstado,
    yearIngreso: filterAnioIngreso,
    yearInclusion: filterAnioInclusion,
    ageGroup: filterAgeGroup,
    estadoCivil: filterEstadoCivil,
    nivelEstudio: filterNivelEstudio,
  });
  ```
- **Sort stays on main thread**: wrap `workerFiltered` + `sortColumn` + `sortDirection` in a new `useMemo` that only sorts (no filtering) — lines 281–298 unchanged but now operating on `workerFiltered` instead of the inline filter result.
- `hasActiveFilters` and `activeFilterCount` are already independent of `filteredData` (they check raw filter state) — no changes needed.
- If `useFilterWorker` is computing, consider showing a subtle loading indicator (optional, not required for correctness — the previous filter result stays visible).

**Files**:
- `hooks/useParticipantesFilters.ts` — Modified

**Before/after contract**: The hook's return type `UseParticipantesFiltersResult` is unchanged. All consumers keep working.

---

## Task 4 — Wire `pages/Alertas.tsx` (Modified, ~15 lines changed) ✓

**Goal**: Replace the inline `useMemo[filteredData]` filter chain with `useFilterWorker`.

**Implementation**:

- Import `useFilterWorker` from `../hooks/useFilterWorker`.
- Replace lines 326–341:
  ```typescript
  // Before:
  const filteredData = useMemo(() => {
    let data = dashboardData;
    if (yearFilter !== 'todas') { data = data.filter(...); }
    if (provinceFilter !== 'todas') { data = data.filter(...); }
    if (municipioFilter !== 'todas') { data = data.filter(...); }
    if (sexFilter !== 'todas') { data = data.filter(...); }
    return data;
  }, [dashboardData, yearFilter, provinceFilter, municipioFilter, sexFilter]);

  // After:
  const { filteredData } = useFilterWorker(dashboardData, {
    yearIngreso: yearFilter !== 'todas' ? yearFilter : undefined,
    provincia: provinceFilter !== 'todas' ? provinceFilter : undefined,
    municipio: municipioFilter !== 'todas' ? municipioFilter : undefined,
    sexo: sexFilter !== 'todas' ? sexFilter : undefined,
  });
  ```
- Everything else (alerts computation, filtered alerts by severity/category, pill counts) stays the same.

**Files**:
- `pages/Alertas.tsx` — Modified

---

## Task 5 — Wire `stores/filterStore.ts` (Modified, ~30 lines added) ✓

**Goal**: Add an async filtering path using the worker, with the sync `recompute()` as fallback.

**Implementation**:

- Import `filterData` from `../workers/filterWorker` and `useFilterWorker` is not applicable here (Zustand store, not a React hook).
- Instead, add a **standalone async utility** at the top of the file (or a separate util that the store imports):
  ```typescript
  async function computeWithWorker(
    data: Participant[],
    province: string,
    status: string,
    municipio: string,
    advanced: AdvancedFilterState
  ): Promise<Participant[]> {
    if (typeof Worker === 'undefined') {
      return computeFilteredData(data, province, status, municipio, advanced);
    }
    try {
      const worker = new Worker(
        new URL('../workers/filterWorker.ts', import.meta.url),
        { type: 'module' }
      );
      return await new Promise<Participant[]>((resolve, reject) => {
        worker.onmessage = (e) => {
          const msg = e.data;
          worker.terminate();
          if (msg.error) reject(new Error(msg.error));
          else resolve(msg.filtered);
        };
        worker.onerror = () => { worker.terminate(); reject(new Error('Worker error')); };
        // Timeout safety
        setTimeout(() => { worker.terminate(); reject(new Error('Worker timeout')); }, 5000);
        worker.postMessage({
          data,
          filters: {
            provincia: province || undefined,
            estado: status || undefined,
            municipio: municipio || undefined,
            yearIngreso: advanced.yearIngreso || undefined,
            yearInclusion: advanced.yearInclusion || undefined,
            ageGroup: advanced.ageGroup || undefined,
            sexo: advanced.sexo || undefined,
            estadoCivil: advanced.estadoCivil || undefined,
            nivelEstudio: advanced.nivelEstudio || undefined,
          }
        });
      });
    } catch {
      return computeFilteredData(data, province, status, municipio, advanced);
    }
  }
  ```
- Modify `setData` action to use `computeWithWorker`:
  ```typescript
  setData: async (data) => {
    const state = get();
    const filtered = await computeWithWorker(
      data, state.selectedProvince, state.selectedStatus,
      state.selectedMunicipio, state.advancedFilters
    );
    set({
      dashboardData: data,
      filteredData: filtered,
      // ... other derived fields stay computed synchronously
      // (availableStatuses, availableYears, etc. — those are metadata, not perf-critical)
    });
  },
  ```
  **Note**: `setData` becomes `async`, but that's fine — it's already called from event handlers, not from render. The other setters (`setSelectedProvince`, etc.) keep using the sync `recompute()` for responsiveness — the main cost is on `setData` which processes the full dataset.

- Alternatively, if making `setData` async is too invasive, add a separate `setDataAsync` action and keep the existing `setData` sync. The proposal says "optional async compute" — let's add it as a separate path.

  Decision: Add `setDataViaWorker` as a new action. The existing `setData` stays sync for backwards compatibility. Consumers opt-in by calling `setDataViaWorker`.

**Files**:
- `stores/filterStore.ts` — Modified

**Note**: Other setters in the store (`setSelectedProvince`, etc.) are called on every select change — keeping them sync makes sense; the data is already filtered when those fire.

---

## Task Dependencies

```
Task 1 (filterWorker.ts) ──► Task 2 (useFilterWorker.ts)
                                  ├──► Task 3 (useParticipantesFilters.ts)
                                  ├──► Task 4 (Alertas.tsx)
Task 1 ──────────────────────────► Task 5 (filterStore.ts)
```

Tasks 3, 4, and 5 are independent of each other once Tasks 1 and 2 are done.

---

## Verification

- `npm run build` succeeds with no type errors.
- `npm run dev` — open Participantes page, toggle filters, confirm no main-thread jank (Chrome DevTools Performance).
- `npm run dev` — open Alertas page, toggle filters, confirm no jank.
- Error injection: temporarily break the worker URL → confirm sync fallback produces identical results.
- Unit check: `filterData(data, filters)` called directly (not via worker) produces the same output as the current inline filtering for the same inputs.

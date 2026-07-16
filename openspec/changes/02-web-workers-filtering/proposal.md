# Proposal: Web Workers — Off-Main-Thread Filtering

## Intent

Filtering 10K+ participant records blocks the main thread, causing visible UI jank when users change search text, province, or any filter. Move the filtering computation to a Web Worker so the UI stays responsive regardless of dataset size.

## Scope

### In Scope
1. Create `workers/filterWorker.ts` — receives `Participant[]` + filter criteria, returns filtered subset + duration
2. Create `hooks/useFilterWorker.ts` — manages worker lifecycle (create/terminate), debounces requests, delivers results, provides sync fallback on error
3. Connect `hooks/useParticipantesFilters.ts` — replace inline `filteredData` `useMemo` with worker call
4. Connect `pages/Alertas.tsx` — replace inline `filteredData` chain with worker call
5. Connect `stores/filterStore.ts` — wire `recompute()` to use worker via exported utility
6. Sync fallback: identical filtering logic runs in-main-thread if worker fails to load/errors

### Out of Scope
- Sort logic — stays in the hook (trivial cost, no benefit from offloading)
- Filtering in pages other than Participantes and Alertas
- Shared worker or thread pool — single dedicated Worker per consumer
- Worker bundler config (Vite handles this natively with `?worker` suffix)

## Capabilities

> No spec-level behavior change. This is a pure performance optimization — filtering produces identical results, only off the main thread.

### New Capabilities
None

### Modified Capabilities
None

## Approach

```
┌──────────────────────┐     postMessage      ┌──────────────────────┐
│  useFilterWorker      │ ──────────────────►  │  filterWorker.ts     │
│  (hook)              │     FilterRequest     │  (dedicated Worker)  │
│                      │ ◄──────────────────  │                      │
│  debounce → post     │     FilterResponse    │  data.filter(...)    │
│  onmessage → set     │     {filtered, dur}   │                      │
│  fallback: sync      │                       │                      │
│  filter inline       │                       └──────────────────────┘
│                      │
│  consumers:          │
│  useParticipantesF.  │
│  Alertas.tsx         │
│  filterStore (opt.)  │
└──────────────────────┘
```

**FilterWorker API** (matching existing `computeBoardData.worker.ts` pattern):
- Input: `{ data: Participant[]; filters: FilterWorkerRequest }` — includes search term, provincia, municipio, centro, sexo, estado, years, ageGroup, estadoCivil, nivelEstudio
- Output: `{ filtered: Participant[]; duration: number }` or `{ error: string }`

**Hook design** (`useFilterWorker`):
- Creates Worker on mount via `new Worker(new URL('../workers/filterWorker.ts', import.meta.url), { type: 'module' })`
- Debounces filter changes (300ms for text search, immediate for selects)
- Posts `{ data, filters }` to worker, awaits `onmessage`
- On error or worker unavailability, falls back to built-in sync filter function
- Terminates worker on unmount

**Integration**:
- `useParticipantesFilters.ts`: replace the `filteredData` useMemo body with `useFilterWorker`, keeping all derived state (`hasActiveFilters`, `activeFilterCount`) computed from results
- `Alertas.tsx`: wrap the `filteredData` useMemo chain with `useFilterWorker`
- `filterStore.ts`: add an async `recomputeViaWorker` method that `setData()` can call, with sync fallback in `recompute()`

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `workers/filterWorker.ts` | **New** | Worker receiving data+filters, returning filtered subset |
| `hooks/useFilterWorker.ts` | **New** | Lifecycle management, debounce, send/receive, sync fallback |
| `hooks/useParticipantesFilters.ts` | Modified | `filteredData` useMemo → worker call |
| `pages/Alertas.tsx` | Modified | `filteredData` useMemo chain → worker call |
| `stores/filterStore.ts` | Modified | Optional async compute via worker in `recompute()` |
| `workers/computeBoardData.worker.ts` | Unchanged | Reference pattern for the new worker |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Worker not supported (old browser, strict CSP) | Low | Sync fallback always available |
| Worker pool limit | Low | Single worker per consumer, terminated on unmount |
| Transferable objects not used (structured clone of 10K objects) | Med | If profiling shows clone overhead, switch to `Transferable` with a copy-free schema |
| Timing issues (stale responses in-flight) | Low | Use generation counter — discard responses from stale requests |

## Rollback Plan

1. Revert changes to `hooks/useParticipantesFilters.ts` and `pages/Alertas.tsx` — restore inline `useMemo` filtering
2. Revert changes to `stores/filterStore.ts` — restore purely synchronous `recompute()`
3. Remove `workers/filterWorker.ts` and `hooks/useFilterWorker.ts`
4. The sync fallback makes this safe to deploy even mid-rollback

## Dependencies

- Vite's native `?worker` or `new Worker(..., { type: 'module' })` support (already confirmed by existing `computeBoardData.worker.ts`)
- No external npm packages

## Success Criteria

- [ ] Filtering 10K records shows no visible UI jank (>16ms frames) — confirmed via Chrome DevTools Performance tab
- [ ] Fallback activates when worker URL is invalid (test via error injection) and produces identical results
- [ ] All existing filter combinations produce identical results to inline filtering (before/after snapshot comparison)
- [ ] `npm run build` succeeds with no type errors

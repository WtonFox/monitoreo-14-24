# Spec: Worker Scheduling — move computeBoardData off the main thread

## Purpose

Free the main thread from `computeBoardData`'s ~98ms synchronous per-record loop. The M7 benchmark confirmed the per-record loop dominates at ~93% of total time (~98ms of ~105ms), and active-slice gating saves only ~2ms. The architectural fix is to run this computation in a Web Worker.

## Requirements

- **R-worker-1**: Extract `computeBoardData` from `hooks/useIndicatorBoards.ts` into a pure function in `hooks/computeBoardData.ts`. Export all types (`BoardData`, `BoardCategory`, all slice interfaces) along with the function. Shared helpers (`count`, `safeDiv`, `isEmptyValue`, `topNArr`) and empty slice factories move with it.

- **R-worker-2**: Create `workers/computeBoardData.worker.ts` using the Vite Worker pattern (`new Worker(new URL(...), { type: 'module' })`). Import the pure `computeBoardData` from the hooks directory, handle `onmessage` receiving `{ data: Participant[], activeBoard: BoardCategory | 'all' }`, and `postMessage` the computed `BoardData` back. Handle errors by posting `{ error: string }` back.

- **R-worker-3**: Create `hooks/useBoardDataWorker.ts` — a React hook that manages Worker instantiation (via `useRef`), posts filtered data to the Worker, and receives results through `onmessage`. Return `{ data: BoardData | null, loading: boolean, error: string | null }`. Use `useEffect` to terminate the Worker on unmount. Only create the Worker on the client (skip during SSR).

- **R-worker-4**: Synchronous fallback path. When `typeof Worker === 'undefined'` (SSR, file:// protocol, or Worker instantiation throws), fall back to calling the pure `computeBoardData` directly on the main thread. The hook returns `loading: false` immediately with the synchronously computed data.

- **R-worker-5**: `hooks/useIndicatorBoards.ts` re-exports types and delegates to `useBoardDataWorker`. All existing tests pass unchanged. Benchmark still measures synchronous `computeBoardData` (the pure function) — Worker scheduling is a UX improvement, not a speed improvement.

## Out of scope

- Do NOT touch `useIndicators.ts`, `ChartsSection`, chart components, statsCards, map, sync, exporter, AuthContext, ProtectedRoute, api.ts, normalize, dataUtils, or any module outside the computeBoardData pipeline.
- No changes to `IndicadoresFiltersContext.tsx` — it already passes `activeBoard` correctly.
- No visual or behavioral changes to boards, modals, or indicators.
- No browser-level integration tests for Worker (vitest/jsdom doesn't support real Workers; test the fallback path in unit tests, and rely on manual verification / E2E for the Worker path).

## Verification gates

| Gate | Expected |
|------|----------|
| `npm run test` | All passing (existing + new tests) |
| `npm run typecheck` | Exit 0 |
| `npm run build` | Vite build compiles Worker correctly |
| `npm run bench` | computeBoardData still measured (pure function unchanged) |
| No main-thread blocking | Manual: Worker path confirmed via browser DevTools |

# Apply Report: Worker Scheduling — M11

## Summary

Moved `computeBoardData` from a synchronous main-thread call to a Web Worker via Vite's `new Worker(new URL(...), { type: 'module' })` pattern, with a synchronous fallback when Worker is unavailable.

## Files Created

| File | Purpose |
|------|---------|
| `hooks/computeBoardData.ts` | Pure `computeBoardData` function + all types (`BoardData`, `BoardCategory`, slice interfaces) + helpers + empty slice factories. Extracted from `useIndicatorBoards.ts`. Importable anywhere, no React dependency. |
| `workers/computeBoardData.worker.ts` | Vite Worker entry. Imports `computeBoardData`, handles `onmessage`/`postMessage` protocol. |
| `hooks/useBoardDataWorker.ts` | React hook managing Worker lifecycle. Creates Worker via `new URL(...)`, posts data, receives results. Falls back to synchronous `computeBoardData` when `typeof Worker === 'undefined'` or instantiation throws. Returns `{ data, loading, error }`. |
| `openspec/changes/project-health-sweep/specs/worker-scheduling/spec.md` | Requirements spec (R-worker-1 through R-worker-5). |

## Files Modified

| File | Change |
|------|--------|
| `hooks/useIndicatorBoards.ts` | Replaced entire computeBoardData body with re-export from `computeBoardData.ts`. Hook now delegates to `useBoardDataWorker`. |
| `hooks/useIndicatorBoards.spec.ts` | Added 5 tests for `useBoardDataWorker` fallback path (Worker undefined, single slice, empty data, result matching computeBoardData, hook delegation). |
| `openspec/changes/project-health-sweep/design.md` | Appended M11 Worker scheduling section (architecture, file structure, sequencing, protocol, fallback path, risk register). |

## Architecture

```
Main Thread                          Worker Thread
───────────                          ─────────────
useIndicatorBoards                   
  └─ useBoardDataWorker              
       ├─ Worker available? ───────> computeBoardData.worker.ts
       │   └─ postMessage(data)          └─ computeBoardData(data)
       │   └─ onmessage(result)           └─ postMessage(result)
       │
       └─ Worker unavailable?        
           └─ computeBoardData(data)  ← synchronous fallback
```

## Worker Protocol

```
Main ──> Worker: { data: Participant[], activeBoard: BoardCategory | 'all' }
Worker ──> Main: { data: BoardData } | { error: string }
```

## Verification

| Gate | Result |
|------|--------|
| `npm run test` | 125 passed (144) — 9/10 files pass, 1 pre-existing OOM in unrelated integration test |
| `npm run typecheck` | Exit 0 (no errors) |
| `npm run build` | ✓ built in 292ms — worker emitted as `computeBoardData.worker-*.js` |
| `npm run bench` | Benchmarks run — computeBoardData still measured, pure function unchanged |

## Key Design Decisions

1. **Vite `new URL()` pattern** — Vite detects this static expression and bundles the Worker as a separate chunk. No manual `importScripts` or separate build config needed.

2. **`createWorkerOrNull` failsafe** — Catches both `typeof Worker === 'undefined'` (SSR, jsdom, file://) and `new Worker()` throwing (CSP restrictions, older browsers). Falls back to synchronous `computeBoardData`.

3. **`useIndicatorBoards` keeps synchronous return** — The hook returns `BoardData` directly (not `{ data, loading }`) by using `result ?? fallback`. When the Worker hasn't responded yet (initial render), the fallback runs synchronously. This preserves the synchronous API contract for all existing consumers — they never see `null` or a loading state.

4. **pure function stays separate** — `computeBoardData.ts` is a zero-dependency (except types + normalize helpers) module that can be imported anywhere: Worker, main thread, benchmarks, tests. No React, no Worker APIs.

## Safety

- No `.env` access
- No changes to: `normalize`, `dataUtils`, `exporter`, `api.ts`, `AuthContext`, `ProtectedRoute`, charts, statsCards, map, sync
- All exports re-exported from `useIndicatorBoards.ts` — no import changes needed by consumers

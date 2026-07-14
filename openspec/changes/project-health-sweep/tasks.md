# Tasks: M6 — Sync State Machine (project-health-sweep)

## Review Workload Forecast

| Field | Value |
|---|---|
| Decision needed before apply | No |
| Chained PRs recommended | Yes (M6a + M6b) |
| Chain strategy | stacked-to-main |
| 400-line budget risk | High |
| Estimated changed lines | ~480 (core + tests) |

### Split Rationale

| PR | WUs | Core Δ | Test Δ | Total |
|:---|---:|---:|---:|---:|
| **M6a** — Foundation | WU1+WU2+WU3+WU4+WU7 | ~170 | ~150 | ~320 |
| **M6b** — Resilience | WU5+WU6+WU8 | ~110 | ~200 | ~310 |

M6a ships first and closes H2 for stale cache, dual hooks, stale pause, unsafe resume, and unawaited writes. M6b stacks on M6a and closes H2 for page retry and update/delete detection plus full behavioral coverage.

### Work Units

| Unit | Goal | PR | Focused test command | Runtime harness | Rollback boundary |
|---|---|---|---|---|---|
| 1 | Export `clearApiCache()` from api.ts | M6a | `npm run test:unit -- useDashboardData` | `npm run build:ci` | `services/api.ts` |
| 2 | DashboardProvider stops calling useDashboardData | M6a | `npm run test:unit -- DashboardContext` | `npm run build:ci` | `contexts/DashboardContext.tsx` |
| 3 | Live pause via `isPausedRef` | M6a | `npm run test:unit -- useDashboardData` | `npm run build:ci` | `hooks/useDashboardData.ts` |
| 4 | Persisted checkpoint in IndexedDB metadata | M6a | `npm run test:unit -- useDashboardData` | `npm run build:ci` | `hooks/useDashboardData.ts`, `services/database.ts` |
| 5 | Page retry with exponential backoff | M6b | `npm run test:unit -- useDashboardData` | `npm run build:ci` | `hooks/useDashboardData.ts` |
| 6 | Update/delete detection in polling | M6b | `npm run test:unit -- useDashboardData` | `npm run build:ci` | `hooks/useDashboardData.ts` |
| 7 | Await all IndexedDB writes | M6a | `npm run test:unit -- useDashboardData` | `npm run build:ci` | `hooks/useDashboardData.ts` |
| 8 | Update existing test file with R-sync assertions | M6b | `npm run test:unit -- useDashboardData` | `npm run build:ci` | `hooks/useDashboardData.spec.ts` |

## Phase 1: Foundation — M6a

### WU1 — Export `clearApiCache()` from api.ts

- [x] 1.1 In `services/api.ts`, export a `clearApiCache` function that calls `requestCache.clear()` (the existing Map at line 5).
- [x] 1.2 In `hooks/useDashboardData.ts`, import `clearApiCache` and call it at the top of `handleManualRefresh`, before the `setTimeout(() => startSmartSync(1), 1200)`.

### WU2 — DashboardProvider stops calling useDashboardData

- [x] 2.1 In `contexts/DashboardContext.tsx`, remove import of `useDashboardData` and `CorruptedRecord` from `../hooks/useDashboardData`.
- [x] 2.2 Remove `const hookValue = useDashboardData()` and the `externalValue ?? hookValue` fallback.
- [x] 2.3 Render `<DashboardContext.Provider value={value}>` directly, where `value` is the required `value` prop.
- [x] 2.4 If `value` is undefined at runtime, throw a dev-time error: `'DashboardProvider requires a value prop — call useDashboardData in the parent and pass it down.'`

### WU3 — Live pause via `isPausedRef`

- [x] 3.1 In `hooks/useDashboardData.ts`, add `const isPausedRef = useRef(false)` alongside `stopSyncRef`.
- [x] 3.2 Keep `isPaused` state for rendering. `togglePause`: flip `isPausedRef.current`, then `setIsPaused(isPausedRef.current)`.
- [x] 3.3 In the sync loop, change `while (isPaused)` (line 188) to `while (isPausedRef.current)`.
- [x] 3.4 Remove `isPaused` from the `useCallback` dependency array.
- [x] 3.5 Update `handleManualRefresh`: set `isPausedRef.current = false` so a paused sync can be cancelled by refresh.

### WU4 — Persisted checkpoint

- [x] 4.1 In `services/database.ts`, extend the metadata type (`MonitoreoDB['metadata']['value']`) with additive fields: `lastSyncedPage?: number`, `lastSyncedRecordCount?: number`, `syncTimestamp?: number`. No DB_VERSION change (schema is additive).
- [x] 4.2 In `hooks/useDashboardData.ts` startup effect: after reading `getMetadata('syncInfo')`, set `currentPage = meta.lastSyncedPage || 1` instead of computing from `dashboardData.length`.
- [x] 4.3 After each successful page fetch+processing, `await saveMetadata('syncInfo', { ...existingMeta, lastSyncedPage: currentPage, lastSyncedRecordCount: totalLoadedCount, syncTimestamp: Date.now() })`.
- [x] 4.4 In `handleManualRefresh` and at `startSmartSync(1)` start: persist `lastSyncedPage: 1, lastSyncedRecordCount: 0, syncTimestamp: Date.now()` in metadata.

### WU7 — Await IndexedDB writes

- [x] 7.1 Add `await` to `saveParticipants(cleanBatch)` call (line 248).
- [x] 7.2 Add `await` to both `saveMetadata(...)` calls (lines 253, 279).
- [x] 7.3 Add `await` to `clearAllData()` call (line 366).
- [x] 7.4 Verify no remaining `.catch()`-only IndexedDB calls in `handleManualRefresh` or the sync loop.

## Phase 2: Resilience — M6b

### WU5 — Page retry with exponential backoff

- [ ] 5.1 Add `erroredPages: number[]` to `SyncStats` interface and `statsRef`.
- [ ] 5.2 Wrap the fetch+process block with a 3-attempt retry loop: delays 1000ms, 2000ms, 4000ms (`wait(1000)`, `wait(2000)`, `wait(4000)`).
- [ ] 5.3 On success within retries, `break`.
- [ ] 5.4 On exhaustion after 3 attempts, push `currentPage` to `erroredPages`, continue to next page. Do NOT throw.
- [ ] 5.5 The existing `catch` at line 310-313 becomes the innermost catch (per attempt). Remove the `currentPage++` there; page advancement moves outside the retry loop on exhaustion.

### WU6 — Update/delete detection in polling

- [ ] 6.1 After the poll probe (`fetchParticipants(1, 1, 0, ...)`), compute a lightweight checksum: `JSON.stringify(items.slice(0, 5).map(i => i.id + (i.ultimaModificacion || '')))`.
- [ ] 6.2 Store `lastChecksum` in a ref and in metadata.
- [ ] 6.3 Enhance the poll trigger condition: `apiTotal > totalRecordsInApi || apiTotal < totalRecordsInApi || (apiTotal === totalRecordsInApi && checksum !== lastChecksum)` → trigger re-verify.
- [ ] 6.4 On re-verify, call `handleManualRefresh` (or equivalent full restart). Mark this as a full re-verify, not incremental.

## Phase 3: Tests — M6b

### WU8 — Update `useDashboardData.spec.ts`

- [ ] 8.1 **R-sync-1 (single provider)**: Mount App with DashboardProvider wrapping; spy on `console.log` from `useDashboardData`; assert it fires exactly once.
- [ ] 8.2 **R-sync-2 (clearApiCache)**: Spy on `clearApiCache`. Call `handleManualRefresh`. Assert `clearApiCache` was called before the sync restart timer.
- [ ] 8.3 **R-sync-3 (live pause)**: With fake timers, start sync, call `togglePause`, advance timers, assert sync loop pauses (fetch not called for next page). Call `togglePause`, assert resume. Call cancel, assert restart from page 1.
- [ ] 8.4 **R-sync-4 (checkpoint)**: Mock API with 10 pages. After page 5 completes, assert `saveMetadata` was called with `lastSyncedPage: 5`. Simulate crash; on new mount, assert `startSmartSync` resumes from page 5 (not page 6).
- [ ] 8.5 **R-sync-5 (retry)**: Mock API where page 3 fails twice (throw error) then succeeds on third attempt. Assert all page-3 records present. Mock API where page 4 always fails. Assert `erroredPages` contains `[4]`.
- [ ] 8.6 **R-sync-6 (update/delete)**: Mock API with `totalItems: 100, items: [{id:1, ultimaModificacion: '2026-01-01'}]`. Set `totalRecordsInApi = 100, lastChecksum = same`. Second poll returns same `totalItems: 100` but different checksum. Assert re-verify triggered.
- [ ] 8.7 **R-sync-7 (awaited writes)**: Spy on `saveParticipants` — assert it's called with `await` (the mock resolves before next line executes). After sync completes, assert persisted count matches expected.

## Out of Scope

- No auth changes (`AuthContext`, `ProtectedRoute`, `constants.ts`).
- No formula corrections (`useIndicators.ts`, `useIndicatorBoards.ts`, `ChartsSection.tsx`).
- No normalization contract changes (`dataUtils.ts`, `normalize.ts`).
- No charts, maps, boards.
- No exporter changes.
- No performance optimization (`requestIdleCallback`, Workers, benchmarks).
- No a11y changes.
- No `.env` access.
- No `App.tsx` changes (already the single caller — confirmed by reading source).

## Risk Register

| Risk | Mitigation |
|---|---|
| M3 not merged → no test file to extend | Blocking dependency — M3 must land before M6 apply starts |
| `await` on IndexedDB writes introduces UI jank | Acceptable for M6; M7 profiling will surface if optimization needed |
| `erroredPages` type mismatch with existing `SyncStats` consumers | Additive field; all existing consumers iterate by named key, not index |
| M6b diff polluted by M6a when rebased | Rebase M6b onto merged M6a before opening; confirm diff shows only M6b changes |
| Checksum on page 1 unreliable for update detection | Fallback: if `ultimaModificacion` absent, compare `id` set size + first-5 `id + edad` stringified |

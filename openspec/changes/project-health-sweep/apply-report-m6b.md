# M6b Apply Report — Resilience (WU5+WU6+WU8)

**Change**: project-health-sweep
**Phase**: M6b — Resilience + Tests
**Base**: M6a (HEAD fb41f0d)
**Mode**: Standard (strict_tdd: false)

## Completed Tasks

### WU5 — Page retry with exponential backoff (R-sync-5)
- [x] 5.1 Add `erroredPages: number[]` to `SyncStats` interface, `statsRef`, state init, and reset paths
- [x] 5.2 Wrap fetch+process with 3-attempt retry loop: delays 1000ms, 2000ms, 4000ms
- [x] 5.3 On success within retries, break
- [x] 5.4 On exhaustion after 3 attempts, push page to `erroredPages`, continue (no throw)
- [x] 5.5 Inner catch per attempt; page advancement moved outside retry loop

### WU6 — Update/delete detection in polling (R-sync-6)
- [x] 6.1 Lightweight checksum computed from first records: `JSON.stringify(items.slice(0,5).map(i => \`${i.id}:${i.edad}\`))`
- [x] 6.2 `lastChecksumRef` added; persisted to IndexedDB metadata (saveMetadata + load)
- [x] 6.3 Enhanced poll trigger: `apiTotal > totalRecordsInApi || apiTotal < totalRecordsInApi || (apiTotal === totalRecordsInApi && checksumChanged)`
- [x] 6.4 On re-verify: full restart (clear state + IndexedDB + `startSmartSync(1)`)

### WU8 — Test coverage
- [x] 8.5 Retry: 3rd attempt success test + exhaustion/erroredPages test
- [x] 8.6 Polling: updated data detection (checksum) + deleted data detection (totalItems decrease)
- [x] Full sync cycle: end-to-end with fake API + fake IndexedDB

## Files Changed

| File | Action | Δ |
|------|--------|---|
| `hooks/useDashboardData.ts` | Modified | +237 / -91 (includes retry loop restructure + checksum detection) |
| `hooks/useDashboardData.char.test.tsx` | Modified | +231 / -0 (added 5 new test cases) |

## Deviations from Design

1. **Checksum field**: `ultimaModificacion` does not exist on `Participant` type. Used `id + edad` as fallback per risk register.
2. **Re-verify approach**: Used inline state-clearing + `startSmartSync(1)` instead of `handleManualRefresh` to avoid 1200ms delay and API cache clearing.
3. **Checksum initialization guard**: Added `checksumInitialized` check to prevent false-positive first-poll detection when `lastChecksumRef` is still empty.
4. **Retry execution order**: Retries are per attempt (total 3 attempts, not 3 retries + original), matching the test scenario of "fails twice, succeeds on 3rd." Delays 1000ms before attempt 2, 2000ms before attempt 3.

## Issues Found

1. **`clearAllMocks` behavior**: Vitest's `vi.clearAllMocks()` does not clear mock implementations (`.mockResolvedValueOnce` / `.mockResolvedValue`). Required `mockReset()` + `afterEach` for `vi.useRealTimers()` to prevent cross-test leakage.
2. **Closure bug in exhaustion handler**: `setSyncStats(prev => ({ ...erroredPages: [...prev.erroredPages, currentPage] }))` captures `currentPage` by reference, not value. Fixed by capturing `const failedPage = currentPage` at callback creation time.

## Workload / PR Boundary

- Mode: stacked-to-main (M6b on M6a)
- Delta: ~470 changed lines (core + tests)
- Current work unit: M6b (WU5+WU6+WU8)
- Boundary: M6b stacks on M6a HEAD
- Estimated review budget impact: ~310 lines (M6b forecast)
- `size:exception` not required

## Verification

| Gate | Result |
|------|--------|
| `npm run test` | 119/119 passed (9 files) |
| `npm run typecheck` | Exit 0 |
| `npm run lint` | Exit 1 (baseline errors only) |
| `rg -c 'eyJ\|bIZl\|0fe5a97'` | No code files flagged |

## Rollback

Revert M6b commits only (top 3 commits on M6a). `git revert HEAD~3..HEAD`.

## Next Steps

`sdd-verify` should run against M6b delta. After verification, archive via `sdd-archive`.

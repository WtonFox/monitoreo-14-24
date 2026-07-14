# Sync State Machine — Specification

## Purpose and why now

M6 closes H2 and H4 (`openspec/changes/project-health-sweep/exploration.md:38-61`) — refresh/pause/sync defects and dual hook instances. It MUST own one provider, invalidate both caches, read pause from a ref, persist cursor/checkpoint, retry failed pages, detect updates/deletions, and await all IndexedDB writes.

## Requirements

| ID | Requirement and acceptance scenario |
|---|---|
| **R-sync-1** | The dashboard data state machine MUST live in ONE provider. `App.tsx` calls `useDashboardData`; `DashboardContext.tsx` MUST NOT call `useDashboardData` independently — it uses the value passed via the prop. GIVEN both mounts, WHEN the app starts, THEN `console.log` from `useDashboardData` start appears once. |
| **R-sync-2** | Manual refresh MUST invalidate BOTH the in-memory API cache (`api.ts` 5-min store) AND IndexedDB before restarting sync. `api.ts` MUST export `clearApiCache()`. GIVEN a force refresh, WHEN the first fetch runs, THEN it reaches the real API (not a cached response). |
| **R-sync-3** | The running sync MUST read `isPaused` from a ref, not the closure, so toggling pause takes effect immediately. Pause = suspend and resume from same page; cancel = stop and restart from page 1. GIVEN pause toggled mid-sync, THEN the current-page fetch is not started (or in-flight result is discarded). GIVEN cancel toggled, THEN sync stops and restart begins at page 1. |
| **R-sync-4** | Resume position MUST come from a persisted cursor/page number (`lastSyncedPage`, `lastSyncedRecordCount`, `syncTimestamp` in IndexedDB metadata), not from the length of loaded records. GIVEN a crash after page 5 of 10, WHEN restarting, THEN sync resumes at page 5 (or page 4 with duplicates guard), not page 6 which would miss page-5 records. |
| **R-sync-5** | Failed pages MUST be retried — 3 retries with exponential backoff before marking the page as failed. After all retries exhausted, continue to next page and record in `syncStats.erroredPages`. GIVEN a fake API where page 3 fails twice but succeeds on third retry, THEN all page-3 records are present. GIVEN a page that fails after 3 retries, THEN it is recorded in `erroredPages`, not skipped silently. |
| **R-sync-6** | Polling MUST detect not just growth in `totalItems` but also updates and deletions. Compare `totalRecordsInApi` with persisted record count AND add a checksum or last-modified comparison mechanism. GIVEN `totalItems` stays same but records changed, THEN poll detects change and triggers a full re-verify (or incremental update). GIVEN a deleted record, THEN it is removed from the persisted store. |
| **R-sync-7** | All IndexedDB writes (`saveParticipants`, `saveMetadata`, `clearAllData`) MUST be awaited before the sync loop advances or a clear/restart cycle completes. GIVEN a sealed fake-IndexedDB scenario where all writes are awaited, THEN after sync completes the persisted state matches the expected record count exactly with no incomplete writes. |

## Additional design decisions

| Decision | Rationale |
|---|---|
| `api.ts` MUST export `clearApiCache()` | R-sync-2 invalidation is cross-module; the cache lives outside `useDashboardData` (lines 44-50, 99-100) |
| DB_VERSION remains 2 | No IndexedDB schema migration — metadata keys only, no object store shape change |
| `isPausedRef` added alongside `stopSyncRef` | R-sync-3 requires pause to be live; existing `stopSyncRef` already uses the ref pattern |

## Out of scope

M6 MUST NOT change auth, formulas, performance optimization (M7), a11y (M10), or participant normalization contract (`dataUtils.ts`, `normalize.ts`). M6 MUST NOT add an independent test suite for sync — M3 update TODO already covers fake API + fake IndexedDB fixtures. M6 updates existing characterization tests to assert new behavior.

## Verification Gate

`sdd-verify` MUST use `npm run test`, `npm run typecheck`, `npm run build:ci`. All seven acceptance scenarios pass under fake API + fake IndexedDB.

## Rollback

Single `git revert` of the M6 merge commit. No IndexedDB schema change (DB_VERSION 2 preserved). Metadata keys are additive — no data loss on revert.

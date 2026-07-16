# Tasks: Sync Notifications

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 130–185 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | uiStore toggle + hook + wiring + tests | PR 1 | `vitest run hooks/useSyncNotifications.spec.ts` | N/A — browser Notification API | Revert `uiStore.ts`, delete `useSyncNotifications.ts`, revert `App.tsx` |

## Phase 1: Foundation — uiStore toggle

- [x] 1.1 Add `syncNotificationsEnabled: boolean` (default `true`) + `toggleSyncNotifications()` action to `stores/uiStore.ts`

## Phase 2: Core — useSyncNotifications hook

- [x] 2.1 Create `hooks/useSyncNotifications.ts` — subscribe to `isSyncing` via `useParticipantStore.subscribe`, detect `true → false` transition via prevState
- [x] 2.2 Add visibility guard: skip if `document.visibilityState !== 'hidden'`
- [x] 2.3 Add permission logic: `'granted'` → fire notification; `'default'` → `requestPermission()` then fire; `'denied'` → skip silently
- [x] 2.4 Add opt-out gate: read `useUiStore.getState().syncNotificationsEnabled`
- [x] 2.5 Build notification `{ title: "Sincronización completa", body: "{N} registros sincronizados" }` from `syncStats.loaded`
- [x] 2.6 Return unsubscribe from `useEffect` cleanup (no re-renders — subscription-based)

## Phase 3: Wire into App.tsx

- [x] 3.1 Import `useSyncNotifications` and call it in `App.tsx` alongside existing hooks

## Phase 4: Testing

- [ ] 4.1 Test permission lifecycle — default → request → granted, default → denied, already granted, missing Notification API
- [ ] 4.2 Test visibility guard — no notification when tab visible, fires when hidden
- [ ] 4.3 Test opt-out toggle — disabled blocks notification, re-enabled resumes
- [ ] 4.4 Test notification body — verify `loaded` count appears in message

## Implementation Order

1. **Phase 1** first — uiStore toggle (no deps)
2. **Phase 2** — hook depends on uiStore toggle
3. **Phase 3** — App.tsx wiring depends on hook
4. **Phase 4** — tests depend on hook being implemented

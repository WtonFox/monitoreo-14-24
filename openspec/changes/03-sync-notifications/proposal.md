# Proposal: Sync Notifications

## Intent

Users currently have no feedback when a background sync completes — they must watch the sidebar or check `lastUpdated`. When the tab is in background, a browser Notification API alert gives immediate, actionable feedback without requiring the user to be looking at the app.

## Scope

### In Scope
- Hook `hooks/useSyncNotifications.ts` that subscribes to `isSyncing` transitions and fires a Notification on sync-complete
- Wire hook into `App.tsx`
- Permission request on first sync event (lazy, not on mount)
- Visibility guard: only notify if `document.visibilityState === 'hidden'`
- Settings toggle in `uiStore` to opt out (`syncNotificationsEnabled`)

### Out of Scope
- Notification click handler (navigating to app on click — future)
- Sound/vibration cues
- Notification for individual row updates (batch sync only)
- Desktop PWA install prompt for notification support

## Capabilities

### New Capabilities
- `sync-notifications`: Browser Notification API integration that alerts on sync completion when the tab is backgrounded, with a permission lifecycle and an opt-out toggle.

### Modified Capabilities
- None (the uiStore will be extended, but no existing spec changes behavior at the spec level).

## Approach

1. Create `hooks/useSyncNotifications.ts` — a no-return-value hook that:
   - Reads `isSyncing` via Zustand `subscribe` (no re-render cost)
   - Tracks previous `isSyncing` state across renders
   - On transition `true → false` (sync just finished), checks:
     - `document.visibilityState === 'hidden'`
     - `Notification.permission === 'granted'` (requests if `default`)
   - Fires `new Notification('Sincronización completa', { body: stats summary })`
2. Extend `uiStore` with `syncNotificationsEnabled: boolean` (default `true`) and a toggle action. The hook reads this to gate the notification.
3. Call the hook once in `App.tsx` alongside existing effects.
4. Permission: call `Notification.requestPermission()` on first detected sync-complete if `permission === 'default'`. No request on mount.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/hooks/useSyncNotifications.ts` | New | Hook for notification logic |
| `src/App.tsx` | Modified | Wire the new hook |
| `src/stores/uiStore.ts` | Modified | Add `syncNotificationsEnabled` toggle |
| `src/stores/participantStore.ts` | Unchanged | Reuse existing `isSyncing` / `syncStats` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Browser blocks Notification API (http, permissions denied) | Medium | Hook is no-op if unsupported; no crash |
| Permission prompt at unexpected moment | Low | Prompt only when sync completes + tab hidden + `default` permission |
| User never sees notification (DND, focus assist) | Low | Notification is fire-and-forget; no state depends on it |

## Rollback Plan

Remove the hook call from `App.tsx` and delete `hooks/useSyncNotifications.ts`. Revert `uiStore.ts` additions. No migration required — zero state persistence needed.

## Dependencies

- Browser Notification API (window.Notification) — polyfill not needed, progressive enhancement
- Existing `useParticipantStore` — `isSyncing` and `syncStats` fields

## Success Criteria

- [ ] Notification fires when tab is backgrounded + sync completes
- [ ] No notification fires when tab is visible (same sync)
- [ ] Permission requested at most once, only on first eligible sync
- [ ] Toggle in uiStore disables/resumes notifications without page reload
- [ ] No errors thrown in environments without Notification API support

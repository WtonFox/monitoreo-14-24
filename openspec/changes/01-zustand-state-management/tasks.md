# Tasks: Zustand State Management

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~500-650 |
| 400-line budget risk | High |
| Chained PRs recommended | No |
| Suggested split | Single PR (accumulating branch `feat/mejoras-estructurales`) |
| Delivery strategy | ask-on-risk |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units (not chained — single accumulating branch)

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Create 4 stores | Same branch | `npx tsc --noEmit` | N/A — pure creation, no consumers yet | `git revert` stores/ |
| 2 | Wire stores into App + pages | Same branch | `npm run build` | Manual walkthrough all routes | `git revert` App + pages/ + components/ |
| 3 | Remove contexts + update tests | Same branch | `npm run build && npx vitest run` | Manual walkthrough all routes | Restore deleted contexts/ files |

## Phase 1 — Foundation (create stores)

- [x] 1.1 `npm install zustand` — add zustand to package.json dependencies
- [x] 1.2 Create `stores/participantStore.ts` — port useDashboardData state + all sync actions (startSmartSync, pollForNewData, handleManualRefresh, togglePause) into Zustand `create()`; keep refs (stopSyncRef, isSyncingRef, etc.) as module-level or inline refs
- [x] 1.3 Create `stores/authStore.ts` — port AuthContext logic (decodeToken, readToken, login, logout, hasPermission, dev fallback, isAuthReady init)
- [x] 1.4 Create `stores/filterStore.ts` — wrap `useFilters(data)` inside Zustand; store raw filters, derive filteredData via selector; accept dashboardData via `setData()` action
- [x] 1.5 Create `stores/uiStore.ts` — `isSidebarOpen` boolean + toggle action

## Phase 2 — Wire stores, remove providers

- [x] 2.1 App.tsx — replace DashboardProvider/AuthProvider/FiltersProvider with direct store calls; keep all effects (initial sync, polling, lastUpdated); call `useParticipantStore.getState()` actions; manage isSidebarOpen via `useUiStore`
- [x] 2.2 Update pages (Participantes, Alertas, Estadisticas, Diagnostico, IndicadoresLayout, MapaInteractivo): replace `useDashboard()` with `useParticipantStore(s => s.data)` — selective subscription per page
- [x] 2.3 Estadisticas.tsx: additionally replace `useFiltersContext()` with `useFilterStore()` selectors
- [x] 2.4 ProtectedRoute.tsx: replace `useAuth()` with `useAuthStore(s => ({user, isAuthenticated, isAuthReady, hasPermission}))`
- [x] 2.5 Sidebar.tsx: replace `useAuth()` with `useAuthStore()`; read isOpen from `useUiStore`; prop-drilled sync props kept for now (may simplify in cleanup)

## Phase 3 — Cleanup

- [x] 3.1 Delete `contexts/DashboardContext.tsx`
- [x] 3.2 Delete `contexts/AuthContext.tsx`
- [x] 3.3 Delete `contexts/FiltersContext.tsx`
- [x] 3.4 Update `hooks/useDashboardData.char.test.tsx` — replace DashboardProvider wrapper with direct store mocking; keep all characterization tests working
- [x] 3.5 Prune stale imports: remove `useAuth`/`useFiltersContext`/`useDashboard`/`DashboardProvider`/`AuthProvider`/`FiltersProvider` imports across all files
- [x] 3.6 Verify: `npm run build` passes; no DashboardProvider/AuthProvider/FiltersProvider in tree

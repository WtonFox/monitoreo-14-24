# Proposal: Zustand State Management

## Intent

Replace 3 React Contexts (`DashboardContext`, `AuthContext`, `FiltersContext`) with Zustand stores for selective subscriptions, removing provider nesting and eliminating unnecessary re-renders across the app.

## Current Architecture

```
App (useDashboardData)
  └─ DashboardProvider (value from useDashboardData)
      └─ AuthProvider (JWT login/logout)
          └─ FiltersProvider (depends on useDashboard)
              └─ IndicadoresFiltersProvider (separate, also depends on dashboardData)
```

- **DashboardContext**: entire `useDashboardData()` result passed as value — every consumer re-renders on ANY state change (sync progress, errors, data, etc.)
- **AuthContext**: 2 consumers (`ProtectedRoute`, `Sidebar`) — simple, good candidate for lightweight store
- **FiltersContext**: wraps `useFilters(dashboardData)` — thin wrapper over the hook
- **IndicadoresFiltersContext** (4th context, NOT being removed here — separate scope)

## Proposed Stores

| Store | From | Consumers | Slice |
|---|---|---|---|
| `participantStore` | `DashboardContext` (data + sync) | All pages via `useDashboard()` | `data`, `isSyncing`, `syncStats`, `corruptedItems`, `totalRecordsInApi`, errors, sync actions |
| `authStore` | `AuthContext` | `ProtectedRoute`, `Sidebar` | `user`, `isAuthenticated`, `isAuthReady`, `login`, `logout`, `hasPermission` |
| `filterStore` | `FiltersContext` | `Estadisticas` page | `selectedProvince`, `selectedStatus`, `selectedMunicipio`, advanced filters, `filteredData` |
| `uiStore` | **New** | App shell | `isSidebarOpen`, any future UI prefs (dashboard layout, etc.) |

## Migration Strategy

### Phase 1 — Foundation (add store files, no behavior change)
1. `npm install zustand`
2. Create `stores/` dir with `participantStore.ts`, `authStore.ts`, `filterStore.ts`, `uiStore.ts`
3. Port `useDashboardData` logic into `participantStore` actions — keep the hook for now, but move state into the store
4. Port `AuthContext` logic into `authStore`
5. Port `FiltersContext` + `useFilters` into `filterStore`

### Phase 2 — Wire stores, remove providers
1. In `App.tsx`: call `useParticipantStore.getState()` actions directly, remove `DashboardProvider` + `AuthProvider` + `FiltersProvider`
2. `useDashboard()` → `useParticipantStore(state => state.data)` per page (selective subscription)
3. `useAuth()` → `useAuthStore()`
4. `useFiltersContext()` → `useFilterStore()`
5. Keep `IndicadoresFiltersProvider` as-is (separate concern, no context nesting issue)
6. Remove all 3 context files after migration

### Phase 3 — Cleanup
1. Remove `contexts/DashboardContext.tsx`, `AuthContext.tsx`, `FiltersContext.tsx`
2. Update imports across all pages and hooks
3. `useAlerts(data)` and `useParticipantesFilters(data)` already receive data as param — no change needed

## Files to Create

- `stores/participantStore.ts`
- `stores/authStore.ts`
- `stores/filterStore.ts`
- `stores/uiStore.ts`

## Files to Modify

- `package.json` — add `zustand`
- `App.tsx` — remove providers, use stores
- `pages/Participantes.tsx` — `useDashboard()` → `useParticipantStore`
- `pages/Alertas.tsx` — same
- `pages/Estadisticas.tsx` — same + `useFiltersContext` → `useFilterStore`
- `pages/Diagnostico.tsx` — `useDashboard()` → `useParticipantStore`
- `pages/IndicadoresLayout.tsx` — same
- `pages/MapaInteractivo.tsx` — same
- `components/ProtectedRoute.tsx` — `useAuth()` → `useAuthStore`
- `components/Sidebar.tsx` — `useAuth()` → `useAuthStore` + sidebar state → `useUiStore`

## Files to Remove

- `contexts/DashboardContext.tsx`
- `contexts/AuthContext.tsx`
- `contexts/FiltersContext.tsx`

## Risks

- **App.tsx owns the sync orchestration** (`startSmartSync`, polling, `handleManualRefresh`) — these actions move to the store but the polling effect stays in App. Miswiring could break the sync flow.
- **`useDashboardData` store has complex state** (refs for batching, pause, stop) — porting to Zustand needs careful handling of refs as store properties or `useRef` alongside.
- **`filterStore` depends on `dashboardData`** — must derive `filteredData` reactively. Zustand selectors with `useMemo`-like behavior via `useShallow` or custom middleware.
- **`IndicadoresFiltersContext` stays** — the app will have a hybrid architecture during the transition. Need to ensure no confusion between old `useFiltersContext` and new `useFilterStore`.

## Success Criteria

- App works identically visually
- No `DashboardProvider`, `AuthProvider`, `FiltersProvider` in React tree
- Each page subscribes only to the slice it needs (no blanket re-renders)
- `npm run build` succeeds with no TypeScript errors

## Skill Resolution

- `sdd-apply` — required for implementation

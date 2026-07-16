# Refactor Spec: React Context → Zustand Stores

## Classification

- **Type**: Structural refactor — zero behavioral change
- **Source**: `openspec/changes/01-zustand-state-management/proposal.md`
- **Affected Domains**: `dashboard`, `auth`, `filters` (none have existing specs in `openspec/specs/`)

## Statement

No spec-level changes. This change is a pure implementation refactor.

All three affected React Contexts (`DashboardContext`, `AuthContext`, `FiltersContext`) are internal wiring — they have no spec in `openspec/specs/` because their entire contract is the values they expose, which maps directly to Zustand store slices.

## Behavioral Preservation Guarantee

| Context → Store | Input Contract | Output Contract | Behaviors |
|---|---|---|---|
| `DashboardContext` → `participantStore` | Same hook invocations (`useDashboardData()`) | Same data shape (`data`, `isSyncing`, `syncStats`, etc.) | Identical |
| `AuthContext` → `authStore` | Same login/logout/hasPermission calls | Same `user`, `isAuthenticated`, `isAuthReady` | Identical |
| `FiltersContext` → `filterStore` | Same filter values (+ `dashboardData` dependency) | Same `selectedProvince`, `selectedMunicipio`, `filteredData`, etc. | Identical |
| *(New)* `uiStore` | Sidebar toggle | `isSidebarOpen` | New — no prior spec |

## Explicit Non-Requirements

The following are explicitly NOT in scope:
- `IndicadoresFiltersContext` — remains as-is (separate refactor scope)
- Any new feature, page, or API behavior
- Any change to existing component rendering logic beyond context → store substitution
- Any change to the `useAlerts(data)` or `useParticipantesFilters(data)` hooks (they receive data as a parameter already)

## Verification Criteria

1. App renders identically for all pages and navigation paths
2. `npm run build` passes with zero TypeScript errors
3. No `DashboardProvider`, `AuthProvider`, or `FiltersProvider` present in the React tree
4. Each component subscribes only to its required store slice (verified via `useXxxStore(selector)` usage)

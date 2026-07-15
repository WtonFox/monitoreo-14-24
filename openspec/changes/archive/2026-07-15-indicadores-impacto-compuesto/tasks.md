# Tasks: Indicadores de Impacto Compuesto

## Resolved Design Decisions

- **Icon**: `Target` from lucide-react for the Impacto tab (resolved from open question "TrendingUp vs Activity vs BarChart3")
- **Sex filter**: `IndicadoresFilterBar` already supports `showSex` prop — the Impacto board SHALL pass `showSex` alongside `showYear showProvince showMunicipio`
- **Delivery strategy**: `auto-chain` → stacked-to-main PRs
- **Chain strategy**: `stacked-to-main` — each phase lands independently on main
- **Review budget**: 400 lines per PR

---

## Phase 1 (PR #1): Core — Hook + Board Component

~200–250 lines estimated

### Task 1.1 — Create `hooks/useIndicadoresImpacto.ts`

**Status**: [x] Complete

**Scope**: New file implementing the 10 composite indicator computations as a pure `useMemo` hook.

**Actions**:
1. Define the following types in the file:
   - `GroupedValue { group: string; value: number; pct: number }`
   - `CompositeIndicator { id: string; label: string; status: 'viable' | 'no-viable'; groups: GroupedValue[] }`
   - `RankedItem { name: string; value: number; pct?: number }`
   - `CompositeIndicators` interface with all 10 keys (see design for full type contract)
2. Export `function useIndicadoresImpacto(data: Participant[]): CompositeIndicators` — single `useMemo` wrapping the computations
3. Implement each of the 10 computations deriving from `Participant[]` only:
   - `vulnByProgramStatus`: 2×2 matrix — vulnerable vs non-vulnerable × active vs graduated. Parse comma-separated `vulnerabilidades` field.
   - `programsByGraduation`: Graduation % for participants WITH `programasSociales` vs WITHOUT.
   - `genderByRetention`: Active % segmented by `sexo` value (M, F, null). 3 groups minimum.
   - `ageByGraduation`: Compute age from `fechaNacimiento`, bucket into [14-17, 18-20, 21-24]. Extend type with `counts: GroupedValue[]` per design.
   - `inclusionTimeByCenter`: Average days between `fechaRegistro` and `fechaInclusion` grouped by `centro`. Sort descending. Return `RankedItem[]`.
   - `educationByPrograms`: `nivelEstudio` distribution among participants WITH `programasSociales`.
   - `multiVulnConcentration`: Count `vulnerabilidades` entries split by comma — tiers: 0, 1, 2+ conditions.
   - `provinceSuccessRate`: `graduated / (active + graduated)` per `provincia`. Return `RankedItem[]` sorted descending.
   - `coverageByVulnerability`: `{ pct: number; status: 'viable' | 'no-viable' }` — % of vulnerable participants in social programs.
   - `tutorByRetention`: Active % for participants WITH tutor (`tutor IS NOT NULL`) vs WITHOUT.
4. Each computation must set `status: 'no-viable'` when input data is insufficient (following spec edge cases per R1–R10).
5. Follow the `useMemo` pattern from `hooks/useIndicators.ts`: `useMemo(() => computeAll(data), [data])`.

**Edge cases** per spec:
- All `vulnerabilidades` = null → R1, R7 show `no-viable`
- Zero participants with `programasSociales` → R2, R6 show `no-viable` for the "with programs" group
- All `sexo` = null → R3 shows `no-viable` for all groups
- Empty age bucket → R4 shows 0 count/pct for that bucket
- Center with no `fechaInclusion` → R5 shows "N/A" and ranks last
- Province with zero graduated → R8 shows 0% for that province
- No vulnerable participants in programs → R9 shows 0%
- All `tutor` = null → R10 shows `no-viable` for WITH-tutor group

**Verification**:
- `npx tsc --noEmit` — no type errors
- Hook can be imported without side effects (pure computation)
- Each composite returns correct shape matching `CompositeIndicators`

---

### Task 1.2 — Create `pages/indicadores/ImpactoBoard.tsx`

**Status**: [x] Complete

**Scope**: New board component rendering all 10 composites with Recharts visualizations inside `BoardShell`.

**Actions**:
1. Import and use `BoardShell` wrapper
2. Use `useIndicadoresFilters()` to destructure `filteredData` and `isDataLoading`
3. Call `useIndicadoresImpacto(filteredData)` to get all composite indicators
4. Include `IndicadoresFilterBar` with props `showYear showProvince showMunicipio showSex`
5. Handle loading state: return `<BoardShell loading />` when `isDataLoading` is true
6. Handle empty state: return `<BoardShell empty />` when `filteredData.length === 0`
7. Render the 10 composites as a mix of visual types (following `VulnerabilidadBoard` pattern):

   | Composite | Visual Type | Chart Kind |
   |-----------|-------------|------------|
   | `vulnByProgramStatus` | Grouped bar chart | `<BarChart>` with 2 bars (active, graduated) |
   | `programsByGraduation` | Grouped bar chart | 2 bars side by side |
   | `genderByRetention` | Grouped bar chart | 3 bars (M, F, null) |
   | `ageByGraduation` | Grouped bar + table counts | Bars for %, table row for counts |
   | `inclusionTimeByCenter` | Horizontal bar chart | `<BarChart layout="vertical">` sorted descending |
   | `educationByPrograms` | Horizontal bar / stacked | Distribution bars |
   | `multiVulnConcentration` | Stacked bar chart | 3 tiers as segments |
   | `provinceSuccessRate` | Horizontal bar chart | Sorted descending, labeled |
   | `coverageByVulnerability` | KPI card | Single percentage with icon |
   | `tutorByRetention` | Grouped bar chart | 2 bars (with tutor, without) |

8. Use existing chart utilities: `tickShort`, `chartClass`, `chartH` from `utils/indicadores-helpers`
9. Use existing formatters: `formatNumber`, `formatPercentage` from `utils/formatters`
10. Use `ResponsiveContainer` for all charts matching existing convention
11. Each chart section shows a `status: 'no-viable'` fallback message when data is unavailable (matching spec edge cases)
12. Include `BoardInfo` component for help/description, matching VulnerabilidadBoard pattern

**Verification**:
- Render all 10 indicators without errors
- Loading and empty states display correctly
- All charts render with real data (use browser to verify)
- `npx tsc --noEmit` — no type errors

---

## Phase 2 (PR #2): Integration — Routes, Tab, Cleanup

~200–250 lines estimated

### Task 2.1 — Add route constant in `types/routes.ts`

**Status**: [x] Complete

**Actions**:
1. Add `INDICADORES_IMPACTO: '/indicadores/impacto'` after `INDICADORES_PROGRAMA: '/indicadores/programa'` (maintains alphabetical ordering)
2. Add `[ROUTES.INDICADORES_IMPACTO]: { roles: [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.CONSULTOR] }` to `ROUTE_PERMISSIONS`

**Verification**:
- `npx tsc --noEmit` — no type errors
- New constant is exported and accessible

---

### Task 2.2 — Add Impacto route in `router.tsx`

**Status**: [x] Complete

**Actions**:
1. Add `const ImpactoBoard = React.lazy(() => import('./pages/indicadores/ImpactoBoard'));` alongside existing lazy imports
2. Add child route under `indicadores` at path `impacto`:
   ```tsx
   {
     path: 'impacto',
     element: (
       <Suspense fallback={<LoadingSkeleton variant="board" />}>
         <ImpactoBoard />
       </Suspense>
     ),
   },
   ```
3. Remove the `/indicadores/sociales` redirect route (lines 122-124 in current router.tsx): `{ path: 'sociales', element: <Navigate to="/indicadores" replace /> }`

**Verification**:
- `npx tsc --noEmit` — no type errors
- Navigate to `/indicadores/impacto` — board renders
- Navigate to `/indicadores/sociales` — returns 404 or redirects correctly (route no longer exists)

---

### Task 2.3 — Add Impacto tab in `pages/IndicadoresLayout.tsx`

**Status**: [x] Complete

**Actions**:
1. Import `Target` from `lucide-react`
2. Add Impacto as the 5th entry (after Estado del Programa / `ROUTES.INDICADORES_PROGRAMA`) in the `MAIN_TABS` array:
   ```ts
   { to: ROUTES.INDICADORES_IMPACTO, label: 'Impacto', icon: Target },
   ```
3. The tab becomes the 5th primary tab, always visible

**Verification**:
- Tab appears in the navigation bar with `Target` icon
- Clicking navigates to `/indicadores/impacto`
- Active tab highlights correctly
- `npx tsc --noEmit` — no type errors

---

### Task 2.4 — Update `components/Header.tsx`

**Status**: [x] Complete

**Actions**:
1. Add `[ROUTES.INDICADORES_IMPACTO]: 'Indicadores — Impacto'` to `PAGE_TITLES` object (after `ROUTES.INDICADORES_PROGRAMA` entry)

**Verification**:
- Header shows "Indicadores — Impacto" when on the Impacto board
- `npx tsc --noEmit` — no type errors

---

### Task 2.5 — Gut `pages/ImpactoSocial.tsx`

**Status**: [x] Complete

**Actions**:
1. Replace file content with:
   ```tsx
   import React from 'react';
   import { Navigate } from 'react-router-dom';
   import { ROUTES } from '../types/routes';

   const ImpactoSocial: React.FC = () => (
     <Navigate to={ROUTES.INDICADORES_IMPACTO} replace />
   );

   export default ImpactoSocial;
   ```
2. Remove unused imports (`useFiltersContext`, `ImpactSection`)

**Verification**:
- Navigating to `/impacto-social` redirects to `/indicadores/impacto`
- No import-ghost errors from removed dependencies
- `npx tsc --noEmit` — no type errors

---

### Task 2.6 — Gut `components/ImpactSection.tsx` and `hooks/useImpactData.ts`

**Status**: [x] Complete

**Actions**:
1. **`components/ImpactSection.tsx`**: Replace content with empty default export:
   ```tsx
   import React from 'react';

   const ImpactSection: React.FC = () => null;
   export default ImpactSection;
   ```
   Preserve the named export `ImpactSection` (if it exists) or default export matching how `ImpactoSocial` imports it. Currently `ImpactoSocial` imports `{ ImpactSection }` — use named export:
   ```tsx
   export const ImpactSection: React.FC = () => null;
   ```
2. **`hooks/useImpactData.ts`**: Replace content with empty default export:
   ```tsx
   export const useImpactData = () => ({});
   ```
   Keep the file on disk to avoid import-ghost errors from any remaining references.
3. Files stay on disk (do NOT delete) — this prevents TypeScript import-ghost errors if any file still references them.

**Verification**:
- `npx tsc --noEmit` — no type errors (no orphan imports)
- No runtime errors when React attempts to render `ImpactSection`

---

### Task 2.7 — Delete `pages/indicadores/SocialesBoard.tsx`

**Status**: [x] Complete

**Actions**:
1. Delete the file `pages/indicadores/SocialesBoard.tsx`
2. Confirm the file has no active imports (it is `@ts-nocheck` and unregistered from the router)

**Verification**:
- `npx tsc --noEmit` — no type errors (no orphan imports)
- File no longer exists on disk

---

## Review Workload Forecast

| Metric | Phase 1 | Phase 2 | Combined |
|--------|---------|---------|----------|
| **Estimated lines** | ~200–250 | ~200–250 | ~400–500 |
| **Review risk** | Low | Low | Medium |
| **Decision needed before apply** | No | No | No (auto-chain resolves) |
| **Chained PRs recommended** | No | No | Yes (2 phases) |
| **400-line budget risk** | Low — single PR candidate | Low — single PR candidate | Medium — auto-chain separates them |
| **Dependency** | None | Phase 1 merged | Phase 2 depends on Phase 1 |

Each phase is an independent PR that lands on main (`stacked-to-main`). The auto-chain strategy already resolves the workload guard — no size:exception needed.

## Work Unit Guidance

Per the work-unit-commits skill, each task maps to a single commit within its phase:

| Phase | Commit | Scope |
|-------|--------|-------|
| 1.1 | `feat(impacto): add useIndicadoresImpacto hook with 10 composites` | Hook + types only |
| 1.2 | `feat(impacto): add ImpactoBoard component` | Board + Recharts rendering |
| 2.1–2.4 | `feat(impacto): register Impacto route, tab, and header title` | Routes + Layout + Header |
| 2.5–2.6 | `refactor(impacto): redirect old ImpactoSocial and gut dead deps` | Redirect + empty stubs |
| 2.7 | `refactor(impacto): delete SocialesBoard dead code` | File deletion |

Tests and type checks belong with their respective commit.

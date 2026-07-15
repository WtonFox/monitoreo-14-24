# Design: Reestructuración de Indicadores

## Technical Approach

Top-down refactor: **types → computations → board data → routing → UI**. Each layer depends on the previous one being clean. Changes are purely structural — no logic, formula, or data-flow modifications. Verification is `tsc --noEmit` plus build.

```
Types (useIndicators.ts, computeBoardData.ts)
  ↓
Computations (indicator-computations.ts)
  ↓
Board data (computeBoardData.ts, useIndicatorBoards.ts)
  ↓
Routing (routes.ts, router.tsx, IndicadoresFiltersContext.tsx)
  ↓
UI (IndicadoresLayout, IndicatorsBoard, Modal, OverviewTab)
```

## Architecture Decisions

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Rename `'sociales'` category vs eliminate | Rename keeps dead code structure; eliminate removes it cleanly but requires touching all consumers | **Eliminate** — all indicators moved, no reason to keep category |
| Order: UI-first vs types-first | UI-first breaks TS immediately for all consumers; types-first isolates breakage per commit | **Types-first** — allows typechecking each step |
| `completitudPct` inline vs wrapper | Inline duplicates format; wrapper keeps DRY | **Wrapper** — reuses `formatNumber`, modifies one location |

## Data Flow

```
Participant[]
  └─ computeIndicators()          → Indicator[] (65 items, category-driven)
       └─ buildGroup(category)    → IndicatorGroup[] (8 groups, no Sociales)
  └─ computeBoardData()           → BoardData (no socialData)

Indicator + BoardData
  └─ IndicatorModal.renderContext()
       ├─ OVERVIEW_CATEGORIES → OverviewTab (no 'sociales')
       ├─ DETAIL_CATEGORIES   → DetailTab
       └─ TREND_CATEGORIES    → TrendTab
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `hooks/useIndicators.ts` | Modify | Remove `'sociales'` from `IndicatorCategory` union |
| `hooks/computeBoardData.ts` | Modify | Delete `SocialSlice` type, `emptySocialSlice()`, `socialData` from `BoardData`, and `needs('social')` block |
| `hooks/useIndicatorBoards.ts` | Modify | Remove `SocialSlice` from re-exports |
| `utils/indicator-computations.ts` | Modify | Re-categorize 7 indicators, rename 7 names, reorder groups, change `completitudPct` format |
| `types/routes.ts` | Modify | Remove `INDICADORES_SOCIALES` from `ROUTES` and `ROUTE_PERMISSIONS` |
| `router.tsx` | Modify | Remove `SocialesBoard` lazy import + route child |
| `contexts/IndicadoresFiltersContext.tsx` | Modify | Remove `ROUTES.INDICADORES_SOCIALES` entry from `routeBoardMap` |
| `pages/IndicadoresLayout.tsx` | Modify | Remove `{ to: ROUTES.INDICADORES_SOCIALES }` from `MAIN_TABS` |
| `components/IndicatorsBoard.tsx` | Modify | Remove `sociales` from `CATEGORY_STYLES` and `CATEGORY_ICONS` |
| `components/IndicatorModal.tsx` | Modify | Remove `'sociales'` from `CATEGORY_META` and `OVERVIEW_CATEGORIES` |
| `components/indicator-modal/OverviewTab.tsx` | Modify | Remove `case 'sociales'` block and `socialData` from destructuring |
| `pages/indicadores/SocialesBoard.tsx` | Keep | Dead code, removed from router — clean up in dedicated change if needed |

## Interfaces / Contracts

```typescript
// After: useIndicators.ts
export type IndicatorCategory = 'demograficos' | 'territoriales' | 'programa'
  | 'calidad-dato' | 'vulnerabilidad' | 'cobertura-temporal'
  | 'nivel-educativo' | 'desempeno-centro';

// After: computeBoardData.ts
export type BoardCategory = 'demographic' | 'territorial' | 'program'
  | 'quality' | 'vulnerability' | 'temporal' | 'education' | 'center';

export interface BoardData {
  demographicData: DemographicSlice;
  territorialData: TerritorialSlice;
  programData: ProgramSlice;
  // socialData: SocialSlice; ← REMOVED
  qualityData: QualitySlice;
  vulnerabilityData: VulnerabilitySlice;
  temporalData: TemporalSlice;
  educationData: EducationSlice;
  centerData: CenterSlice;
}
```

```typescript
// completitudPct — new format
const completitudPct = (count: number, total: number): string =>
  `${formatNumber(count)} de ${formatNumber(total)} (${pct(count, total)})`;
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| TypeScript | All files type-check | `npx tsc --noEmit` |
| Build | Bundle succeeds | `npm run build` (or `vite build`) |
| Visual | Category order, renamed labels, completitud format | Manual review of indicators board |

No unit tests needed — the change is type-level, constant-level, and import-level only. No computational logic changes.

## Threat Matrix

N/A — no routing of shell/subprocess commands, VCS/PR automation, executable classification, or process integration. The route `/indicadores/sociales` removal is a SPA route only.

## Migration / Rollout

No migration required. All data lives in-memory from API responses; no persisted state references `sociales`.

## Open Questions

- [ ] Add a redirect from `/indicadores/sociales` to `/indicadores`? Spec allows either 404 or redirect. Redirect is friendlier — add `{ path: 'sociales', element: <Navigate to="/indicadores" replace /> }` in the route children.

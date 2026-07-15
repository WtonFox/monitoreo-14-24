# Tasks: Reestructuración de Indicadores

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 100–150 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |

```
Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low
```

## Phase 1: Foundation (Types)

- [x] 1.1 `hooks/useIndicators.ts:5` — Remove `'sociales'` from `IndicatorCategory` union
- [x] 1.2 `hooks/computeBoardData.ts` — Remove `'social'` from `BoardCategory`, delete `SocialSlice` interface, delete `emptySocialSlice()`, delete `socialData` from `BoardData`
- [x] 1.3 `hooks/useIndicatorBoards.ts` — Remove `SocialSlice` from re-exports

## Phase 2: Core (Computations + BoardData)

- [x] 2.1 `utils/indicator-computations.ts:26` — Change `completitudPct` to return `"${formatNumber(count)} de ${formatNumber(total)} (${pct(count, total)})"`
- [x] 2.2 `utils/indicator-computations.ts` — Recategorize IDs 23,24 → `'calidad-dato'`, IDs 29–32 → `'demograficos'`, ID 26 → `'calidad-dato'`
- [x] 2.3 `utils/indicator-computations.ts` — Rename IDs 11,13,15,17,19,21 ("Número" → "Cantidad"), rename ID 52 ("Edad promedio al momento del registro" → "Edad de ingreso al programa")
- [x] 2.4 `utils/indicator-computations.ts:1111` — Remove `buildGroup('sociales', 'Sociales')` from groups array
- [x] 2.5 `hooks/computeBoardData.ts:445-476` — Remove the entire `needs('social')` computation block (withPhone, withAddress, genderByCentroArr, genderByCurso, ageByCentro, ageByCurso)

## Phase 3: Wiring (Routing)

- [x] 3.1 `types/routes.ts` — Remove `INDICADORES_SOCIALES` from `ROUTES` and its `ROUTE_PERMISSIONS` entry
- [x] 3.2 `router.tsx` — Remove `SocialesBoard` lazy import, remove `/sociales` route child, add redirect `{ path: 'sociales', element: <Navigate to="/indicadores" replace /> }`
- [x] 3.3 `contexts/IndicadoresFiltersContext.tsx:16` — Remove `[ROUTES.INDICADORES_SOCIALES]: 'social'` from `routeBoardMap`

## Phase 4: UI (Navigation + Modal)

- [x] 4.1 `pages/IndicadoresLayout.tsx:20` — Remove `{ to: ROUTES.INDICADORES_SOCIALES, label: 'Sociales', icon: Heart }` from `MAIN_TABS`
- [x] 4.2 `components/IndicatorsBoard.tsx` — Remove `sociales` entry from `CATEGORY_STYLES` and `CATEGORY_ICONS`
- [x] 4.3 `components/IndicatorModal.tsx` — Remove `'sociales'` from `CATEGORY_META` and from `OVERVIEW_CATEGORIES` set
- [x] 4.4 `components/indicator-modal/OverviewTab.tsx` — Remove `case 'sociales'` block, remove `socialData` from destructuring

## Phase 5: Verification

- [x] 5.1 Run `npx tsc --noEmit` — fix any type errors
- [x] 5.2 Run `npm run build` — verify bundle succeeds

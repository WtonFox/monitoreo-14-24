# Proposal: Top Indicators Improvements

## Intent

Remove visual duplication between the `indicator.value` text and the `topItems` table in IndicatorModal, avoid redundant tab data when viewing a top-indicator, and increase the top-N limit from 5 to 10 for territorial and center indicators.

## Scope

### In Scope
- Hide `indicator.value` text block in IndicatorModal when `topItems` exists
- Conditionally hide duplicated sections in OverviewTab (top municipios/centros/cursos), DetailTab (top listas), and TrendTab (top centros) when the indicator matches
- Add `topCount` field to Indicator type and set n=10 for IDs 11,12,15,16,17,18,61

### Out of Scope
- Add `topItems` to indicators that don't already have them
- Change top-N for vulnerability indicators (44, 46) — less data variety

## Capabilities

### New Capabilities
None

### Modified Capabilities
- `indicators-board`: Indicator modal SHALL hide `formatTopN` text value when a structured `topItems` table renders. Tab sections MUST suppress sections that duplicate `indicator.topItems` by matching indicator ID. Indicator type SHALL accept optional `topCount` field; computation SHALL pass `n: topCount ?? 5`.

## Approach

1. Add `topCount?: number` to `Indicator` interface in `useIndicators.ts`
2. Pass `n: 10` to `buildTopItems` / `calcResto` for IDs 11,12,15,16,17,18,61 in `indicator-computations.ts`
3. `IndicatorModal.tsx`: guard `indicator.value` display behind `!indicator.topItems`; change "Top 5" to `indicator.topCount ?? 5`; render `indicator.topItems.length` rows
4. Each tab: skip section when indicator ID matches the section's content type

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `hooks/useIndicators.ts` | Modified | Add `topCount?: number` |
| `utils/indicator-computations.ts` | Modified | Pass n=10 for top indicators |
| `components/IndicatorModal.tsx` | Modified | Hide value on topItems; dynamic header/rows |
| `components/indicator-modal/OverviewTab.tsx` | Modified | Hide Top Municipios (ID 11,12), Centros (15,16), Cursos (17,18) |
| `components/indicator-modal/DetailTab.tsx` | Modified | Hide Discapacidades (44), Enfermedades (46) |
| `components/indicator-modal/TrendTab.tsx` | Modified | Hide Top centros (61) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Missing a duplication edge case | Low | Verify against all 34 indicators |
| Top 10 table wider than modal | Low | Table scrolls; no layout breakage |

## Rollback Plan

Revert each modified file to HEAD via `git checkout -- <path>`. All changes are purely presentational — no data model, API, or persistence impact.

## Dependencies

None.

## Success Criteria

- [ ] `indicator.value` text hidden when `topItems` exists (no "1. X | 2. Y | Resto: ..." text above table)
- [ ] No duplicated tab sections when viewing a top-indicator
- [ ] Top 10 shown for IDs 11,12,15,16,17,18,61 (header says "Top 10", 10 rows rendered)
- [ ] All other indicators still show Top 5
- [ ] `npm run build` passes (TypeScript strict)

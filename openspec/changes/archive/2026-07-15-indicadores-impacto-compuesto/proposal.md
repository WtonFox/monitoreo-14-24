# Proposal: Indicadores de Impacto Compuesto

## Intent

The standalone "Impacto Social" page overlaps heavily with existing indicator tabs (7 of 9 metric groups are already covered by indicators #4, #23–#26, #43–#48, #53). Replace it with a new "Impacto" tab inside Indicadores focused exclusively on **composite cross-dimension indicators** that no existing tab measures. Remove the dead `SocialesBoard.tsx` and the overlapping ImpactSection component.

## Scope

### In Scope
- New "Impacto" tab in `IndicadoresLayout` with 8–10 composite indicators
- New `hooks/useIndicadoresImpacto.ts` — composite computations from `Participant[]`
- New `pages/indicadores/ImpactoBoard.tsx` following BoardShell pattern
- Removal of `SocialesBoard.tsx` (dead code, `@ts-nocheck`, removed from router)
- Cleanup of `/impacto-social` route, `ImpactSection.tsx`, `useImpactData.ts`
- Route, navigation, and title updates

### Out of Scope
- Changing existing indicators or `indicator-computations.ts`
- Adding test infrastructure (no test runner available)
- Modifying `IndicadoresFiltersContext` or data pipeline

## Capabilities

### New Capabilities
- `indicadores-impacto-compuesto`: Composite cross-dimension impact indicators crossing vulnerability × outcomes, programs × results, gender × retention, age × results, inclusion-time × center, education × programs, vulnerability concentration, success-rate by province, coverage × vulnerability, and temporal evolution.

### Modified Capabilities
- `indicators-board`: Remove R1 requirement for `/indicadores/sociales` redirect (legacy path eliminated instead of redirected).

## Approach

1. Create `hooks/useIndicadoresImpacto.ts` — pure computation from `Participant[]` via `useMemo` (follows `useIndicadores.ts` patterns)
2. Create `pages/indicadores/ImpactoBoard.tsx` — renders composite indicators in grid, reuses `BoardShell`, `IndicatorTile`, `IndicatorModal`
3. Add "Impacto" tab to `IndicadoresLayout.tsx` (as final main tab or More dropdown)
4. Delete `SocialesBoard.tsx` and its route registration
5. Remove or gut `ImpactSection.tsx` / `useImpactData.ts` if no other consumers
6. Add route constant and guard in `router.tsx`

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `hooks/useIndicadoresImpacto.ts` | New | Composite indicator computations |
| `pages/indicadores/ImpactoBoard.tsx` | New | Impacto tab board component |
| `pages/IndicadoresLayout.tsx` | Modify | Add Impacto tab to MAIN_TABS |
| `router.tsx` | Modify | Remove SocialesBoard redirect, add Impacto route |
| `types/routes.ts` | Modify | Add `ROUTES.INDICADORES_IMPACTO` |
| `components/Header.tsx` | Modify | Add page title for Impacto |
| `pages/indicadores/SocialesBoard.tsx` | Delete | Dead code removal |
| `pages/ImpactoSocial.tsx` | Modify | Remove or gut standalone page |
| `components/ImpactSection.tsx` | Modify | Remove or gut overlapping content |
| `hooks/useImpactData.ts` | Modify | Remove or gut |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Composite indicators may have no data under some filters | Medium | Show "no-viable" status like existing indicators |
| Overlap if composite is too simple (single-dimension) | Low | Validate each composite is genuinely cross-dimension |
| Route changes break bookmarks | Low | HashRouter + redirect from old `/indicadores/sociales` |

## Rollback Plan

Revert the commit: restore deleted files, revert route changes, remove Impacto tab. The standalone ImpactoSocial page remains unaffected since it's being gutted, not deleted.

## Dependencies

None — all data from existing `Participant[]` and `IndicadoresFiltersContext`.

## Success Criteria

- [ ] Composite indicators render in "Impacto" tab with correct cross-dimension values
- [ ] No overlap with existing 65 indicators (each composite uses ≥2 dimensions)
- [ ] `SocialesBoard.tsx` fully removed with no dangling imports
- [ ] `/indicadores/sociales` no longer resolves or redirects
- [ ] All existing indicator tabs unchanged

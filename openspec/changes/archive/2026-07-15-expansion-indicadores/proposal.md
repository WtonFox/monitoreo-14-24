# Proposal: Expansion de Indicadores

## Intent

Extend the indicators system with deeper analytics across 6 areas while preserving all 65 existing indicators intact. Merge the two quality-data boards (CalidadDato + Calidad ND) into a unified view that eliminates confusion between completeness and ND metrics.

## Scope

### In Scope
- New demographic indicators (age distribution, sex ratio by age, marital × sex)
- Region-level territorial indicators using REGION_PROVINCES (10 planning regions)
- Unified "Calidad del Dato" board merging CalidadDatoBoard + CalidadNdBoard
- Expanded coverage gap analysis beyond "centers without minors"
- Additional desertion analytics (by course, age group, region, trend)
- Extended education indicators (by province, desertion correlation, trend)

### Out of Scope
- Modifying or renumbering existing 65 indicator IDs
- Sector-based indicators (#13–14) — still waiting on API field `sector`
- Vulnerabilidad / Cobertura Temporal / Desempeño Centro expansions
- Board layout refactor (shell, chart components)
- Performance optimization (Web Workers)

## Capabilities

### New Capabilities
- `demograficos-expansion`: Additional age, sex-ratio, and marital-status indicators
- `territoriales-regiones`: Region-level aggregation using 10 planning regions
- `centros-cobertura-gap`: Expanded coverage gap analysis (region/province level, trends)
- `desercion-analytics`: Desertion by course, age group, sex, planning region, trend
- `nivel-educativo-expansion`: Education indicators by province/region, desertion correlation

### Modified Capabilities
- `calidad-dato-nd`: Merge with calidad-dato — remove R5 (distinct requirement), add R6 for unified board display
- `centros-sin-menores`: Expand spec to include gap analysis (rename or extend)
- `desercion-centros`: Add requirements for course/age/region/trend indicators
- `indicators-board`: Add new indicator IDs 66+ to the 65 existing, update tab suppression rules for new IDs

## Approach

1. **New computations**: Extend `computeIndicators()` in `indicator-computations.ts` by appending new indicators (IDs 66+) after existing 65. No loop refactor — just additive.
2. **Region aggregation**: Use `geoUtils.findRegion()` to map each participant's provincia to a planning region, then aggregate counts per region.
3. **Merged Calidad board**: Create a new `CalidadIntegradaBoard` that composites both completeness (existing CalidadDatoBoard logic via `boardData.qualityData`) and ND metrics (internal FIELDS loop from CalidadNdBoard). Deprecate the two old boards.
4. **Expanded boards**: Add new sections/tables to `DesercionBoard`, `CentrosSinMenoresBoard`, `NivelEducativoBoard` — each in their own `useMemo` blocks.
5. **Zero-collision guarantee**: All new indicator IDs start at 66. No existing indicator objects are touched.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `utils/indicator-computations.ts` | Modified | Append new indicators, region aggregation |
| `pages/indicadores/CalidadDatoBoard.tsx` | Removed | Replaced by unified board |
| `pages/indicadores/CalidadNdBoard.tsx` | Removed | Replaced by unified board |
| `pages/indicadores/CalidadIntegradaBoard.tsx` | New | Unified completeness + ND board |
| `pages/indicadores/DesercionBoard.tsx` | Modified | Add course/age/region/trend sections |
| `pages/indicadores/CentrosSinMenoresBoard.tsx` | Modified | Add coverage gap analysis |
| `pages/indicadores/NivelEducativoBoard.tsx` | Modified | Add province/region/desertion indicators |
| `pages/indicadores/DemograficosBoard.tsx` | Modified | Add new chart sections |
| `pages/indicadores/TerritorialesBoard.tsx` | Modified | Add region-level aggregation tabs |
| `routes.ts` | Modified | Update routing for merged board |
| `openspec/specs/calidad-dato-nd/spec.md` | Modified | Remove R5, add R6 for unified display |
| `openspec/specs/desercion-centros/spec.md` | Modified | Add new requirements |
| `openspec/specs/centros-sin-menores/spec.md` | Modified | Extend with gap analysis reqs |
| `openspec/specs/indicators-board/spec.md` | Modified | Add new indicator IDs |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| New indicators degrade performance (>500ms) | Low | useMemo per-board; monitor in build preview |
| Merge breaks existing CalidadDatoBoard consumers | Low | Keep both old boards importable as backup until archive |
| Region-level grouping has edge cases | Med | Add unit test for findRegion() + unmapped provinces |

## Rollback Plan

- **New indicators only**: Remove appended objects from `indicator-computations.ts` — zero collateral damage to IDs 1–65
- **Merged board**: Git restore `CalidadDatoBoard.tsx` and `CalidadNdBoard.tsx`; remove new board; revert routing
- **Full revert**: `git revert HEAD` plus drop the change folder in openspec

## Success Criteria

- [ ] All 65 existing indicators display identical values before and after the change
- [ ] New indicators (66+) render in correct board categories without collision
- [ ] Region-level aggregate values match the sum of their constituent provinces
- [ ] Unified Calidad board shows both completeness % and ND % without overlap
- [ ] `npm run build` passes with no TypeScript errors

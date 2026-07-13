# Proposal: Impacto Social Real

## Intent

The current `ImpactSection.tsx` duplicates metrics from `/estadisticas` (ChartsSection) and `/indicadores` (useIndicatorBoards): vulnerabilities, age groups, education routes, total counts. The "impact" claims are fabricated (e.g., "reducción pobreza" via vulnerability count > 2). Replace with 7 new metric blocks using API fields that are NOT used elsewhere: `programasSociales`, `alergias`, `discapacidades`, `enfermedades`, `edadRegistro`, `fechaRegistro`/`fechaInclusion` delta, `tutor`/`cedulaTutor`, and `telefonos`/`direccion` by province.

## Scope

### In Scope
- `hooks/useImpactData.ts` — new hook computing 7 impact-specific metric groups
- Rewrite `components/ImpactSection.tsx` — full new dashboard replacing old content
- Remove all overlap with Estadisticas/Indicadores (no total count, gender, age groups, vulnerability standalone, education routes)

### Out of Scope
- Changes to ChartsSection, StatsCards, or useIndicatorBoards
- New API fields (already present)
- `/impacto-social` route changes (already works)

## Capabilities

### New Capabilities
- `impact-data-hook`: Structured hook returning 7 chart-ready metric groups from participant data
- `impact-dashboard`: Rewritten ImpactSection with dedicated social-impact visualizations

### Modified Capabilities
None — no existing specs to delta.

## Approach

1. **Hook** (`hooks/useImpactData.ts`, ~120 lines): computes all 7 metric groups via `useMemo`. Use `hasValue` from normalize.ts for completeness checks, date arithmetic for registro→inclusion delta, comma-split for multi-value fields.
2. **Component** (`components/ImpactSection.tsx`, ~280 lines): new layout with KPI row + chart grid. 7 metric blocks, responsive `grid-cols-1 lg:grid-cols-2`. Reuses existing Recharts + lucide-react patterns.

### Metric Blocks
| # | Block | KPI | Chart |
|---|-------|-----|-------|
| 1 | Cobertura Programas Sociales | % with ≥1 program | Bar (top 5) |
| 2 | Perfil de Salud | 3 × % (alergias, discapacidades, enfermedades) | 3 mini bars or combo |
| 3 | Registro→Inclusión | Avg days wait | Histogram bars |
| 4 | Responsables | % with tutor | Bar (top tutors) |
| 5 | Calidad Datos por Provincia | — | Grouped bar (teléfono + dirección by province) |
| 6 | Vulnerabilidades × Programas | — | Stacked bar |
| 7 | Edad Registro vs Actual | Avg at reg, avg current | Grouped bar |

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `hooks/useImpactData.ts` | New | Data computation hook |
| `components/ImpactSection.tsx` | Rewrite | Full replacement, ~280 lines |
| `pages/ImpactoSocial.tsx` | Unchanged | Already passes `data` prop |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| 400-line budget exceeded | Medium | Split hook/component cleanly; each is independently reviewable |
| `fechaRegistro`/`fechaInclusion` date parsing edge cases | Low | `try/catch` + `isNaN` guard (existing pattern in ChartsSection) |
| Province-level completeness gaps | Low | Empty state per block with "Sin datos" fallback |

## Rollback Plan

- Revert `components/ImpactSection.tsx` to previous version
- Delete `hooks/useImpactData.ts`
- Simple 2-file revert, no cascade

## Dependencies

- None. Reuses existing Recharts, lucide-react, normalize.ts utilities.

## Success Criteria

- [ ] ImpactSection shows 7 new metric blocks, zero old metrics
- [ ] No regression in `/estadisticas` or `/indicadores` (they still show their data)
- [ ] All KPIs and charts render with data; empty states shown when no data
- [ ] Hook returns typed, chart-ready data matching each block interface

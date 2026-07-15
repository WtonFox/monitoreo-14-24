# Design: Expansion de Indicadores (IDs 66–83)

## Technical Approach

Append 18 new indicators (IDs 66–83) to `computeIndicators()` without touching existing IDs 1–65. Region aggregation uses `geoUtils.findRegion()` to map provincia → 10 planning regions at computation time. Merge CalidadDatoBoard + CalidadNdBoard into a single `CalidadIntegradaBoard` that composites both completeness and ND metrics. Extend existing boards with additive `useMemo` sections. Route changes are minimal: `/calidad-nd` redirects to `/calidad-dato`.

## Architecture Decisions

| Decision | Choice | Alternative | Rationale |
|----------|--------|-------------|-----------|
| Indicator registry | Append-only (IDs 66+) | Refactor computeIndicators() | Zero risk to 65 existing. Rollback = remove appended block |
| Region aggregation | Runtime findRegion() on filteredData | Pre-computed region key | No schema migration. Respects live filters. findRegion() is O(1) hash lookup |
| Calidad merge | New CalidadIntegradaBoard, keep old files | Inline merge in existing boards | Clean separation. Old boards importable for rollback |
| ID allocation | Sequential 66–83 per spec order | Gaps per area | Simple. Specs already define per-area ranges (66–68 demo, 69–71 terr, 72–74 gap, 75–79 desercion, 80–83 edu) |
| New categories | Append to IndicatorCategory type | Reuse existing categories | New groups (desercion, centros-sin-menores) are semantically distinct from existing 8 |

### Category Additions

```typescript
// Expanded type
export type IndicatorCategory =
  | 'demograficos' | 'territoriales' | 'programa' | 'calidad-dato'
  | 'vulnerabilidad' | 'cobertura-temporal' | 'nivel-educativo'
  | 'desempeno-centro' | 'centros-sin-menores' | 'desercion';
```

## Data Flow

```
Participant[] (filteredData)
    │
    ├── computeIndicators() ──── append new objects (IDs 66–83)
    │                              • findRegion(p.provincia) for region aggregation
    │                              • Age bucket, sex ratio, marital × sex for demos
    │                              • Desertion status filter for desercion analytics
    │                              • rutaFormativa grouping for course breakdown
    │
    └── useIndicadoresFilters()
         └── filteredData → Board components
              ├── CalidadIntegradaBoard: qualityData (completeness) + FIELDS enum (ND)
              ├── DesercionBoard: new useMemo for course/age/region/trend
              ├── CentrosSinMenoresBoard: new useMemo for region gap + trend
              └── NivelEducativoBoard: new sections for province/region/correlation
```

Filter scope propagates automatically: every computation reads from `filteredData`, so provincia/municipio/año/sexo filters apply to all new indicators without plumbing changes.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `utils/indicator-computations.ts` | Modify | Append 18 indicator objects (IDs 66–83) after existing ID 65 block. Add region aggregation helpers using imports from geoUtils |
| `pages/indicadores/CalidadIntegradaBoard.tsx` | Create | Composite board: completeness KPIs from boardData.qualityData + ND KPIs from FIELDS enumeration (11 fields) |
| `pages/indicadores/CalidadDatoBoard.tsx` | Keep (deprecated) | Existing file unchanged — importable for rollback |
| `pages/indicadores/CalidadNdBoard.tsx` | Keep (deprecated) | Existing file unchanged — importable for rollback |
| `pages/indicadores/DesercionBoard.tsx` | Modify | Add 4 useMemo sections: course ranking, age breakdown, region ranking, trend table |
| `pages/indicadores/CentrosSinMenoresBoard.tsx` | Modify | Add 2 useMemo sections: region gap summary, year-over-year trend |
| `pages/indicadores/NivelEducativoBoard.tsx` | Modify | Add 4 sections: province breakdown, region aggregation, desertion correlation, trend |
| `pages/indicadores/DemograficosBoard.tsx` | Modify | Add age-bucket distribution, sex-ratio, marital×sex sections |
| `pages/indicadores/TerritorialesBoard.tsx` | Modify | Add region-level participation, sex distribution, age distribution sections |
| `types/routes.ts` | Modify | Update `INDICADORES_CALIDAD_ND` route to point to `/indicadores/calidad-dato` |
| `router.tsx` | Modify | Change `/calidad-nd` lazy import to render `CalidadIntegradaBoard`; replace `/calidad-dato` lazy import |
| `pages/IndicadoresLayout.tsx` | Modify | Remove separate "Calidad ND" dropdown tab. Rename to "Calidad del Dato" (integrated) |
| `hooks/useIndicators.ts` | Modify | Append `'centros-sin-menores'` and `'desercion'` to `IndicatorCategory` union type |

## Testing Strategy

| Layer | What | How |
|-------|------|-----|
| Unit | New indicator computations (66–83) | Extend `useIndicators.spec.ts` — add test cases per indicator, verify values match spec scenarios |
| Unit | findRegion() mapping | Test unmapped province → "Desconocido", all 10 regions, edge cases |
| Integration | CalidadIntegradaBoard | Mount with mock boardData, verify both completeness and ND sections render |
| Integration | Board expansions | Mount DesercionBoard/CentrosSinMenoresBoard/NivelEducativoBoard with expanded data |
| Snapshot | 65 original indicators unchanged | Assert IDs 1–65 values are identical before/after expansion |

## Open Questions

- [ ] CalidadIntegradaBoard: should both old boards be kept as deprecated imports or can they be removed once stable?
- [ ] Trend direction labels: consistent logic for "Mejorando" / "Empeorando" / "Sin tendencia" across all boards?

# Proposal: API Fields, Dashboard & Indicators

## Intent

Add 7 missing API fields to the participant schema, enrich the existing dashboard with new KPIs and charts, and introduce a dedicated Indicators page at `/indicadores` showing 34 computed indicators organized by category — enabling better program monitoring for the Oportunidad 14-24 team.

## Scope

### In Scope
- 7 new fields: edadRegistro, estadoCivil, nivelEstudio, alergias, discapacidades, enfermedades, programasSociales
- IndexedDB v1→v2 migration, sanitizer update, exporter update
- New DataTable columns + StatsCards KPIs + ChartsSection charts
- New `/indicadores` page with 34 indicators by category
- Safe patch/minor dependency bumps only

### Out of Scope
- Sector-based indicators (13, 14) — no structured sector field in API
- Major dependency bumps (vite 6→8, typescript 5.8→7.0, lucide-react 0→1)
- User auth, role-based access, or RBAC for the indicators page
- Backend API changes

## Capabilities

### New Capabilities
- `participant-data`: Schema updates, IndexedDB migration v1→v2, data sanitizer, export utils
- `dashboard-enrichment`: New KPI cards, chart sections, and DataTable columns
- `indicators-board`: Full indicators computation and display page

### Modified Capabilities
None — no existing specs to modify.

## Approach

Incremental (5 phases, each ≤400 lines, independently deployable):
1. **Schema** — types.ts + database.ts + dataUtils.ts + exporter.ts
2. **Columns** — DataTable.tsx new columns
3. **Dashboard** — StatsCards.tsx + ChartsSection.tsx
4. **Indicators** — New route, page, hook, components
5. **Filters** (optional) — AdvancedFiltersModal for new fields

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| types.ts | Modified | +7 fields to Participant |
| services/database.ts | Modified | DB_VERSION 1→2, migration |
| utils/dataUtils.ts | Modified | sanitizeParticipant extended |
| services/exporter.ts | Modified | CSV/Excel field mappers |
| components/DataTable.tsx | Modified | New columns |
| components/StatsCards.tsx | Modified | New KPI cards |
| components/ChartsSection.tsx | Modified | New chart sections |
| router.tsx | Modified | + /indicadores route |
| pages/Indicadores.tsx | New | Indicator board page |
| components/IndicatorsBoard.tsx | New | Indicator card grid |
| hooks/useIndicators.ts | New | Computation hook |
| components/Sidebar.tsx | Modified | New nav link |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Unknown API field naming | Medium | Log first 3 API responses to confirm shape |
| DB migration breaks existing users | Low | Test v1→v2 with existing records; null defaults |
| Unknown estadoCivil/nivelEstudio values | Low | Compute dynamically from data (no hardcoded ranges) |
| Indicators perf on 10k+ records | Low | useMemo + memoized cross-tabulations |

## Rollback Plan

- **Phase 1 only**: Revert types.ts, restore DB_VERSION to 1 (upgrade callback only runs on version change — re-opening with v1 skips migration)
- **Any later phase**: Revert individual phase files — no data loss, no cascade failures between phases
- Each phase is its own PR — rollback is per-PR revert

## Dependencies

- None external. Safe patch/minor bumps: react (19.2.7), react-router-dom (7.18.x), papaparse (5.5.4)

## Success Criteria

- [ ] All 27 API fields mapped in Participant type and stored in IndexedDB
- [ ] CSV/Excel exports include all new fields
- [ ] Dashboard shows new KPIs and charts from new field data
- [ ] `/indicadores` renders 34 computed indicators by category
- [ ] 2 pending indicators (sector-based) explicitly marked as not implemented
- [ ] All existing tests pass; no regression in existing dashboard functionality

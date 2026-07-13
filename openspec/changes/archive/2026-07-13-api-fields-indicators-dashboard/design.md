# Design: API Fields, Dashboard & Indicators

## Technical Approach

Incremental 5-phase build on existing patterns. Each phase independently deployable (<400 lines). No routing/shell/process boundaries — threat matrix N/A.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|-------------|-----------|
| **DB Migration** | idb `upgrade()` v1→v2 | Re-create DB | Existing `upgrade()` callback on version bump handles both fresh installs & existing data. Old records get `undefined` for new fields — mapped to `null` by sanitizer. Idempotent. |
| **Indicators Computation** | Single `useIndicators` hook with `useMemo` | Per-indicator fns, web worker | 34 indicators from same `Participant[]` source. One hook memoizes cross-tabulations (e.g., sex×municipio matrix) reused by indicators 27-28. Worker overhead unwarranted at <10k records. |
| **New Route** | Lazy-loaded `React.lazy()` + `Suspense` | Static import | Keeps vendor bundle size stable — indicators page only loads on nav. Matches existing route pattern (static imports for now; adding lazy is a one-line change in router.tsx). |
| **Indicator Grouping** | Category cards with KPI tiles + mini-charts | One board per indicator | User explicitly requested logical grouping. 34 indicators shown as 6-8 category cards, each containing 3-6 related indicators. |
| **Route Permission** | Same as `PARTICIPANTES` (ADMIN, SUPERVISOR) | Public (no gate) | `/indicadores` shows derived data from same API. Consultors already see aggregated stats on `/estadisticas`; full indicator set is an extension. |

## Data Flow

### Capability 1: participant-data (new fields)

```
API response
  │
  ▼
sanitizeParticipant() ──► Participant type (27 fields)
  │                          + edadRegistro, estadoCivil, nivelEstudio,
  │                            alergias, discapacidades, enfermedades,
  │                            programasSociales
  │
  ├──► IndexedDB (v2) ──► getAllParticipants() ──► DashboardContext.dashboardData
  │
  └──► exporter.ts CSV/Excel mappers ──► download
```

### Capability 2: dashboard-enrichment (existing flow, new fields)

```
DashboardContext.dashboardData
  │
  ▼
FiltersContext.filteredData
  │
  ├──► StatsCards (new KPIs: avg edadRegistro, discapacidades %, etc.)
  └──► ChartsSection (new charts: estadoCivil pie, nivelEstudio bar)
```

### Capability 3: indicators-board

```
DashboardContext.dashboardData (all data, unfiltered)
  │
  ▼
useIndicators(data)
  │  useMemo → cross-tabulations
  │  useMemo → { demographyIndicators, educationIndicators, ... }
  │
  ▼
IndicatorsBoard
  ├── DemographyCard (indicators 1-12)
  ├── EducationCard (13-18)
  ├── RegistrationCard (19-24, 23-26)
  ├── GeoCrossCard (27-30)
  └── StatusCard (31-36)
```

## File Changes

| File | Phase | Action | Description |
|------|-------|--------|-------------|
| `types.ts` | 1 | Modify | +7 fields to `Participant` interface |
| `services/database.ts` | 1 | Modify | `DB_VERSION` 1→2; existing `upgrade()` handles both stores; add migration step for new fields |
| `utils/dataUtils.ts` | 1 | Modify | `sanitizeParticipant()` return object +7 fields via `getValue()` |
| `services/exporter.ts` | 1 | Modify | CSV + Excel field mappers +7 columns |
| `utils/exportUtils.ts` | 1 | Modify | `exportCSV` headers/rows +7 fields |
| `components/DataTable.tsx` | 2 | Modify | +7 entries to `DEFAULT_COLUMNS`; +7 cases in `renderCell()` |
| `components/StatsCards.tsx` | 3 | Modify | New KPI cards (avg edadRegistro, % discapacidades, % enfermedades, estadoCivil distribution, nivelEstudio distribution) |
| `components/ChartsSection.tsx` | 3 | Modify | New chart blocks (estadoCivil pie, nivelEstudio bar, discapacidades bar) |
| `types/routes.ts` | 4 | Modify | +`INDICADORES: '/indicadores'` to `ROUTES` |
| `router.tsx` | 4 | Modify | +lazy route for `/indicadores`; add `ROUTE_PERMISSIONS` entry |
| `hooks/useIndicators.ts` | 4 | **New** | Single hook computing all 34 indicators via memoized cross-tabulations |
| `pages/Indicadores.tsx` | 4 | **New** | Page shell wrapping IndicatorsBoard |
| `components/IndicatorsBoard.tsx` | 4 | **New** | Category-card grid rendering indicator groups |
| `components/Sidebar.tsx` | 4 | Modify | + nav item linking to `/indicadores` |
| `components/AdvancedFiltersModal.tsx` | 5 | Modify | + estadoCivil, nivelEstudio filter fields (optional) |
| `hooks/useFilters.ts` | 5 | Modify | Extend `AdvancedFilterState` + filter logic (optional) |

## Component Tree (Indicators page)

```
<Indicators>                         ← pages/Indicators.tsx
  <IndicatorsBoard data={...}>       ← components/IndicatorsBoard.tsx
    <IndicatorCard title="Demografía">
      <KpiTile label="Total" value={N} />
      <KpiTile label="% Mujeres" value={P} />
      ...
      <MiniChart data={ageDistribution} />
    </IndicatorCard>
    <IndicatorCard title="Educación">
      <KpiTile label="% por Nivel Estudio" ... />
      ...
    </IndicatorCard>
    ...
    <PendingIndicator label="Sector">
      (explicitly marked as no disponible)
    </PendingIndicator>
  </IndicatorsBoard>
```

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Manual | DB migration v1→v2 | Open app with existing IndexedDB v1 data; verify sync loads + new fields show as null; re-sync to populate. |
| Manual | New field display | Load fresh data; verify DataTable shows new columns; verify CSV/Excel export includes them. |
| Manual | Indicator accuracy | Spot-check 5 indicators against raw data counts. |
| Smoke | Build | `vite build` must succeed; no TS errors. |

## Migration

IndexedDB migration is the `upgrade()` callback on version change from 1→2. idb fires `upgrade()` only when `DB_VERSION` increases — re-opening with v1 skips it, so rollback is safe. No data loss: old records keep existing fields; new fields default to `undefined` → sanitizer sets them to `null`.

**Rollback**: Revert `database.ts` to `DB_VERSION = 1`. On next open, `upgrade()` does NOT run (version decreased). The IndexedDB store retains v2 fields in existing records silently; they are harmless. Full clean requires `clearAllData()`.

## Open Questions

- [ ] What are the actual API field names for the 7 new fields? Confirm via first-3-record log (already in sanitizeParticipant) during Phase 1.
- [ ] What values does `estadoCivil` use? Dynamic computation avoids hardcoding, but UI labels may need mapping.
- [ ] `ROUTE_PERMISSIONS` for `/indicadores` — match `PARTICIPANTES` (ADMIN + SUPERVISOR) or `ESTADISTICAS` (add CONSULTOR)?

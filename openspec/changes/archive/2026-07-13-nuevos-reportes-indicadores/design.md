# Design: Nuevos Reportes e Indicadores

## Technical Approach

4 independent board components implementing the exact pattern of the 9 existing boards: local `useMemo`-based computation over `filteredData` from `useIndicadoresFilters()`. No modifications to `useIndicatorBoards` hook — each board derives its own metrics inline. Zero API, data model, or filter system changes.

## Architecture Decisions

### Decision: Inline computation vs extending useIndicatorBoards

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Extend BoardData with 4 new slices | Centralized, but bloats shared hook; every filter change recomputes all 4 new slices even when user is on an unrelated tab | **Rejected** |
| Compute inside each board via useMemo | Decoupled, lazy — only computed when board is mounted. Follows existing pattern (9 boards use boardData, but these are domain-specific enough to justify inline) | **Chosen** |

### Decision: Shared isEmpty utility import vs per-board helper

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Extract isEmptyValue to utils/ | DRY, but changes one file outside scope | **Rejected** — keep change minimal |
| Inline ND-detection in each board via local helper | Self-contained, follows proposal's zero-coupling constraint | **Chosen**. `hasNdValue()` local to CalidadNdBoard |

### Decision: Icon selection for MORE_TABS entries

Lucide-react icons already imported in `IndicadoresLayout.tsx` give us free bundle inclusion. No new icon imports needed.

| Board | Icon |
|-------|------|
| CentrosSinMenoresBoard | `Users` |
| DesercionBoard | `TrendingDown` |
| RegistroDiarioBoard | `CalendarDays` |
| CalidadNdBoard | `FileWarning` |

## Data Flow

```
useIndicadoresFilters()
  ├─ filteredData: Participant[]
  ├─ boardData: BoardData (unused by these 4 boards)
  └─ isStale: boolean

Each Board ── useMemo(() => deriveMetrics(filteredData), [filteredData])
  ├─ KPI cards: reduce/aggregate over filteredData
  ├─ Chart data: groupBy, sort, slice(0, N)
  └─ Table data: same pipeline, different render
```

No cross-board data sharing. Each board is an isolated React component.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `pages/indicadores/CentrosSinMenoresBoard.tsx` | Create | Centers with zero 14–17yo participants |
| `pages/indicadores/DesercionBoard.tsx` | Create | Top 10 desertion ranking (general + province toggle) |
| `pages/indicadores/RegistroDiarioBoard.tsx` | Create | Daily intake KPIs, 30-day timeline, center ranking |
| `pages/indicadores/CalidadNdBoard.tsx` | Create | "nd"/null field % ranking with province breakdown |
| `types/routes.ts` | Modify | +4 route constants |
| `router.tsx` | Modify | +4 lazy imports + child routes under `/indicadores` |
| `pages/IndicadoresLayout.tsx` | Modify | +4 tab entries in `MORE_TABS` |

## Board Specifications

### 1. CentrosSinMenoresBoard — `centros-sin-menores`

**Algorithm**: Filter `filteredData` where `edad >= 14 && edad <= 17`, collect unique centro names. Diff against all centros in `filteredData` → set of centros with zero 14–17yo participants.

**KPIs** (4 cards): Total centros, Centros sin menores, % sin cobertura, Total participantes 14–17

**Table**: Centro name + provincia columns, sorted alphabetically. Highlight that these centers have zero coverage for the target demographic.

### 2. DesercionBoard — `desercion`

**Algorithm**: Group `filteredData` by centro. For each centro: `rate = count(estado in {Retirado, Desertor, Baja}) / total * 100`. Sort desc → top 10.

**State toggle**: `viewMode: 'general' | 'provincia'`. In 'general' mode, top 10 across all filtered data. In 'provincia' mode, filter by selected provincia first, then top 10.

**KPIs** (4 cards): Deserción general del programa, Centro con mayor deserción (%, name), Total desertores, Centros analizados

**Chart**: Horizontal bar chart — top 10 centros by desertion rate

**Table**: Ranking with columns: #, Centro, Total, Desertores, Tasa %

### 3. RegistroDiarioBoard — `registro-diario`

**Algorithm**: Group `filteredData` by `fechaRegistro` (date only). Count per day. Calculate:
- Hoy: count where date === today
- Semana: count where date >= 7 days ago
- Mes: count where date >= 30 days ago
- Timeline: last 30 days of daily counts
- Center ranking: group by centro, count, sort desc → top 10

**KPIs** (4 cards): Fichas hoy, Esta semana (+% vs semana anterior), Este mes, Promedio diario (30d)

**Chart**: Line/bar chart — daily registrations, last 30 days. Colors: bar for each day, line for 7-day moving average.

**Table**: Ranking de centros por fichas registradas (total filtered period)

### 4. CalidadNdBoard — `calidad-nd`

**Algorithm**: For each of 9 relevant Participant fields, count records where value is `null`, `undefined`, `""`, `"nd"`, `"N/D"`, `"No Disponible"`. Rate = `ndCount / total * 100`. Sort desc by rate.

Fields scanned: `telefonos`, `telefonosResponsable`, `cedulaTutor`, `alergias`, `discapacidades`, `enfermedades`, `programasSociales`, `nivelEstudio`, `direccion`.

**Local helper**: `hasNdValue(val: string | null | undefined): boolean` — returns `true` for nd/null/empty, opposite of existing `hasValue()`.

**KPIs** (4 cards): % General ND, Peor campo (name + %), Campos con >50% ND, Total registros analizados

**Chart**: Horizontal bar chart — fields ranked by % nd (highest first). Color gradient from red (>50%) to green (<10%).

**Table**: Field name, % ND, Count ND, Total

**Province breakdown**: Secondary table or chart showing ND % per province for the worst field, enabling geographic pattern detection.

## Interfaces / Contracts

No new public interfaces. Each board declares its internal types via TypeScript inference from `useMemo` return values. The `hasNdValue` helper is local to `CalidadNdBoard`:

```ts
// Local to CalidadNdBoard.tsx — not exported
const hasNdValue = (val: string | null | undefined): boolean =>
  val === null || val === undefined || val.trim() === '' ||
  val.toLowerCase() === 'nd' || val === 'N/D' || val.toLowerCase() === 'no disponible';
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Metric derivation for each board | Extract pure functions from useMemo; test with known participant arrays |
| Integration | Board rendering with mocked filteredData | Mount each board with `IndicadoresFiltersProvider` wrapping test data |
| E2E | Navigation + data display | Cypress: visit each new route, assert KPI cards show numbers |

## Threat Matrix

N/A — no routing (beyond existing HashRouter child routes), shell commands, subprocesses, VCS/PR automation, executable-file classification, or process-integration boundaries.

## Migration / Rollout

No migration required. All client-side, purely additive. Boards are lazy-loaded and only render when navigated to.

## Open Questions

- None. All decisions are documented above.

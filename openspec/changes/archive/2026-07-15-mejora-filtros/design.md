# Design: Mejora de Filtros — Dashboard y Participantes

## Technical Approach

Dos dominios de filtro independientes con sus propios ciclos de estado: **FiltersContext** (Estadísticas) se mantiene como está, extendido con filtro centro vía props desde FilterBar. **Participantes** extrae toda la lógica inline actual a un hook `useParticipantesFilters`. Ambos dominios comparten `AGE_GROUPS` movido a `constants.ts`. La búsqueda por texto en Estadísticas es local (post-filtro de contexto), usando debounce de 300ms.

## Architecture Decisions

| # | Decision | Alternatives | Rationale |
|---|----------|-------------|-----------|
| D1 | Filtros Estadísticas y Participantes independientes | Single FiltersContext compartido | Cada tab tiene ciclos de vida distintos; compartirlos acopla tabs que no comparten vista. Patrón existente respetado. |
| D2 | Search en Estadísticas es local en `FilterBar` (no en context) | Meter searchTerm en FiltersContext | Search es UI-effímero, no debería ensuciar el estado global. FilterBar emite evento, Estadísticas aplica post-filtro. |
| D3 | Municipio de FilterBar se elimina, no se migra | Dejarlo duplicado y sincronizar | El spec (Feature C) es claro: estado único en advancedFilters.municipio. Eliminar la fuente de duplicación. |
| D4 | `AGE_GROUPS` en `constants.ts` | Dejarlo en types.ts o duplicarlo | Ambos dominios lo necesitan; una sola source of truth. Co-located con otras constantes del dominio. |
| D5 | `useParticipantesFilters` como hook único | Múltiples hooks pequeños | Un hook contiene todas las dependencias cruzadas (availableCentros depende de provincia). Más fácil de razonar y testear. |

## Data Flow

```
=== ESTADÍSTICAS ===

DashboardContext ──→ useFilters(dashboardData) ──→ FiltersContext
                                                       │
FilterBar (local searchTerm + selectedCentro) ──┐      │
    │                                            │      │
    └── onSearchChange(searchTerm) ──┐           │      │
                                     ▼           ▼      ▼
                              Estadisticas ──→ applyFilters()
                                                   │
                              ┌────────────────────┘
                              ▼
                   filteredData (context → search → centro)
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
              StatsCards          ChartsSection

=== PARTICIPANTES ===

DashboardContext ──→ Participantes
                         │
                    useParticipantesFilters(dashboardData)
                         │
                    ┌────┴────┐
                    │         │
                    ▼         ▼
              filteredData   available*
                    │
                    ▼
              DataTable (sin lógica de filtrado, solo props)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `constants.ts` | Modify | Mover `AGE_GROUPS` desde `types.ts`, agregar rangos 25-29 y 30+ |
| `types.ts` | Modify | Eliminar `AGE_GROUPS` (se moverá a constants), expandir `AdvancedFilterState` con `centro`, `estado`, `anioIngreso`, `anioInclusion`, `ageGroup`, `estadoCivil`, `nivelEstudio` |
| `components/FilterBar.tsx` | Modify | Agregar search input (lupa + debounce), select Centro, badge filtros activos. Remover select Municipio. Nuevas props `onSearchChange`, `selectedCentro`, `availableCentros`, `activeAdvancedFilterCount` |
| `components/AdvancedFiltersModal.tsx` | Modify | Importar `AGE_GROUPS` desde `constants.ts` (en vez de `types.ts`) |
| `components/DataTable.tsx` | Major modify | Layout colapsable grid, 6 nuevos filtros, barra de pills/resumen. Props simplificadas (recibe todo desde hook vía Participantes) |
| `hooks/useFilters.ts` | Modify | Actualizar lógica `matchAgeGroup` con rangos 25-29 y 30+ |
| `hooks/useParticipantesFilters.ts` | **Create** | Todo el estado de filtros, opciones, filteredData, hasActiveFilters, clearAll, clearFilter |
| `pages/Estadisticas.tsx` | Modify | Pasar searchTerm y centro entre FilterBar y filteredData. Calcular `activeAdvancedFilterCount`. |
| `pages/Participantes.tsx` | Modify | Consumir `useParticipantesFilters`, pasar todo a DataTable vía props |

## Interfaces / Contracts

```typescript
// ── Retorno de useParticipantesFilters ──
interface UseParticipantesFiltersResult {
  // Estado
  searchTerm: string;
  filterProvincia: string;
  filterMunicipio: string;
  filterCentro: string;
  filterSexo: string;
  filterEstado: string;
  filterAnioIngreso: string;
  filterAnioInclusion: string;
  filterAgeGroup: string;
  filterEstadoCivil: string;
  filterNivelEstudio: string;

  // Setters
  setSearchTerm: (v: string) => void;
  setFilterProvincia: (v: string) => void;
  setFilterMunicipio: (v: string) => void;
  setFilterCentro: (v: string) => void;
  setFilterSexo: (v: string) => void;
  setFilterEstado: (v: string) => void;
  setFilterAnioIngreso: (v: string) => void;
  setFilterAnioInclusion: (v: string) => void;
  setFilterAgeGroup: (v: string) => void;
  setFilterEstadoCivil: (v: string) => void;
  setFilterNivelEstudio: (v: string) => void;

  // Options derivadas del dataset
  availableProvincias: string[];
  availableMunicipios: string[];
  availableCentros: string[];
  availableEstados: string[];
  availableAniosIngreso: string[];
  availableAniosInclusion: string[];
  availableEstadoCivil: string[];
  availableNivelEstudio: string[];

  // Computed
  filteredData: Participant[];
  hasActiveFilters: boolean;
  activeFilterCount: number;
  clearAll: () => void;
  clearFilter: (key: string) => void;
}

// ── Nuevas props de FilterBar ──
interface FilterBarProps {
  // ... props existentes ...
  // NUEVAS:
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  selectedCentro?: string;
  onCentroChange?: (centro: string) => void;
  availableCentros?: string[];
  activeAdvancedFilterCount?: number;
  // ELIMINADAS:
  // selectedMunicipio — se va
  // onMunicipioChange — se va
  // availableMunicipiosForProvince — se va
}

// ── DataTable props simplificadas ──
// DataTable pierde toda la lógica de filtrado inline.
// Recibe filteredData ya calculado + callbacks de limpieza.
interface DataTableProps {
  data: Participant[];
  // ...paginación, exportación, searchTerm, onSearchChange...
  // Filtros: recibe todo desde Participantes (que lo obtiene del hook)
  // NO tiene lógica de filteredData interna
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `useParticipantesFilters` — filteredData, available\*, activeFilterCount | Mock `dashboardData`, assert output for each filter combination |
| Unit | Debounce en búsqueda Estadísticas | `setTimeout` assertion en FilterBar |
| Unit | AGE_GROUPS match ranges (25-29, 30+) | Pure function test |
| Integration | FilterBar + Estadísticas flujo completo | Render con contexto, simular cambio de provincia, assert filteredData |
| E2E | Flujo completo: Estadísticas search + centro, Participantes 6 filtros + pills | Cypress/Playwright — no hay setup actual, diferir |

## Implementation Order

1. `constants.ts` — mover `AGE_GROUPS` + agregar rangos 25-29, 30+
2. `types.ts` — eliminar `AGE_GROUPS` del archivo
3. `hooks/useFilters.ts` — actualizar `matchAgeGroup` con rangos extendidos
4. `components/AdvancedFiltersModal.tsx` — cambiar import a `constants.ts`
5. `hooks/useParticipantesFilters.ts` — crear hook (Feature I)
6. `pages/Participantes.tsx` + `components/DataTable.tsx` — refactor a hook + layout colapsable + nuevos filtros + pills (Features F, G, H)
7. `components/FilterBar.tsx` — agregar search, centro, badge; remover municipio (Features A, B, C, E)
8. `pages/Estadisticas.tsx` — conectar search + centro + badge (Features A, B, E)
9. `openspec/changes/mejora-filtros/spec.md` — sync delta si cambió algo

Steps 1-4 son preparación segura (solo mover constantes). Step 5 es nuevo archivo (no rompe nada). Steps 6-8 tienen riesgo de regresión.

## Migration / Rollback

No migration required. Rollback: `git revert` del commit del cambio completo, o PR por partes (planificar slices de 400 líneas para review).

## Open Questions

- [ ] `useParticipantesFilters` debe recibir `dashboardData` de `useDashboard()` internamente o recibirlo como parámetro? La spec dice recibe `dashboardData: Participant[]` (parámetro), consistente con patrón de `useFilters`.

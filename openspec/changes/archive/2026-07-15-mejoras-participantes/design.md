# Design: Mejoras Página de Participantes

## Technical Approach

Ocho mejoras sobre la página Participantes existente, entregadas en 2 PRs encadenados. Sin cambios arquitectónicos profundos — todo es additive: nuevos componentes, estado local en hooks existentes, y props adicionales en `DataTable`.

## Architecture Decisions

| Option | Alternatives | Decision |
|--------|-------------|----------|
| **Modal**: `ParticipantDetailModal` standalone, recibe participant prop | Modal interno al DataTable | Separación clara, reutilizable, sin fetch extra |
| **Sort**: estado en `useParticipantesFilters` | Hook `useTableSort` separado o estado en Participantes.tsx | Co-located con filteredData, evita prop drilling extra |
| **Loading**: `dashboardData.length === 0` + `dataLoaded` flag de `useDashboardData` | Nuevo `isLoaded` booleano en DashboardContext | Añadir campo existente en `useDashboardData` |
| **Persistencia**: `sessionStorage` en `useParticipantesFilters` | localStorage o hook separado | sessionStorage muere al cerrar tab, semántica correcta |
| **Stats bar**: Componente inline en DataTable | `ParticipantStatsBar` standalone | Props `filteredData` ya existen como `allFilteredData` |
| **Default columns**: Modificar `DEFAULT_COLUMNS` en DataTable | Config externa | Mínimo cambio, localStorage ya sobreescribe |

## Data Flow

```
DashboardContext
  └─ dashboardData (Participant[])
       │
       ▼
useParticipantesFilters(data)
  ├─ sortKey/sortDir (nuevo)
  ├─ filteredData (useMemo: filter + sort)
  ├─ sessionStorage sync (nuevo)
  │
  ├──► Participantes.tsx
  │     ├─ loading = !dataLoaded && dashboardData.length === 0
  │     └─ pagedData = filteredData.slice(pagination)
  │
  ├──► DataTable
  │     ├─ onSort callback → actualiza sortKey/sortDir
  │     ├─ loading={isLoading} → skeleton
  │     ├─ sortColumn/sortDirection → arrow indicators
  │     └─ selectedParticipant → open modal
  │
  ├──► ParticipantStatsBar
  │     └─ allFilteredData → total, M/F, edad prom, centros
  │
  └──► ParticipantDetailModal
        └─ participant prop → 27 fields grid
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `components/ParticipantDetailModal.tsx` | Create | Modal read-only con 27 campos, responsive grid, Escape/overlay close |
| `components/ParticipantStatsBar.tsx` | Create | Barra stats con total, M/F, edad prom, centros |
| `hooks/useParticipantesFilters.ts` | Modify | Añadir sortKey/sortDir, persistencia sessionStorage en useEffect, restaurar en init |
| `hooks/useDashboardData.ts` | Modify | Exponer `dataLoaded` flag para skeleton (señal de que IndexedDB ya devolvió o está vacío) |
| `pages/Participantes.tsx` | Modify | Estado `selectedParticipant`, detectar loading, pasar sort props |
| `components/DataTable.tsx` | Modify | Sort en headers con indicadores, columna Acciones, skeleton real, contador resultados |

## Interfaces / Contracts

```typescript
// Nuevas props en DataTable
interface DataTableProps {
  // ... existing props
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: string) => void;
  onRowClick?: (participant: Participant) => void;
}

// Nuevo en UseParticipantesFiltersResult
interface UseParticipantesFiltersResult {
  // ...existing...
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
  setSortColumn: (col: string) => void;
  setSortDirection: (dir: 'asc' | 'desc') => void;
}

// Nuevo en DashboardContextValue
interface DashboardContextValue {
  // ...existing...
  dataLoaded: boolean;  // true after IndexedDB resolve or initial sync
}

// ParticipantDetailModal
interface ParticipantDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant: Participant | null;
}
```

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | Sort logic | Probar ordering en filteredData con varios tipos (string, number, date) |
| Unit | sessionStorage | Mock Storage, save → reload → verify state |
| Component | Modal | Render con participant mock, verificar campos visibles, Escape/overlay close |
| Component | DataTable | Sort header click → verify arrow + data order |
| E2E | Flujo completo | Cargar datos → filtrar → ordenar → ver detalle → navegar → volver con filtros |

## Open Questions

- [ ] `dataLoaded` flag: ¿añadir a `useDashboardData` o detectar en `Participantes.tsx` con `dashboardData.length === 0 && !isSyncing`? Decisión: añadir flag explícito para evitar falsos positivos con datasets vacíos.

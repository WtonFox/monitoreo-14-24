# Proposal: Mejoras Página de Participantes

## Intent

La página de Participantes muestra datos tabulados sin interacción: no se puede ver detalle de un participante, no hay ordenamiento, ni feedback de carga, y los filtros se pierden al navegar. Esto limita el análisis de los operadores del programa Oportunidad 14-24 que necesitan inspeccionar registros individuales y explorar el dataset.

## Scope

### In Scope
- Modal de detalle con 25+ campos al clickear fila o botón "Ver detalle"
- Ordenamiento asc/desc clickeando headers de columna
- Loading state real con skeleton mientras `dashboardData` carga
- Persistencia de filtros via `sessionStorage`
- Barra de resumen estadístico (total, desglose M/F, edad promedio)
- Columna Acciones con botón "Ver detalle"
- Columnas default mejoradas (municipio, ruta formativa, fecha registro visibles)
- Contador de resultados destacado arriba de la tabla

### Out of Scope
- Edición de datos (API read-only)
- Virtualización de tabla (react-window, evaluar post-MVP)
- Exportación selectiva con checkboxes
- Filtro de búsqueda por campo específico
- Extraer paginación a componente compartido
- Sacar `onExport={() => {}}`

## Capabilities

### New Capabilities
- `participant-detail-modal`: Modal read-only con todos los campos del participante
- `table-column-sorting`: Ordenamiento asc/desc por columna en el header
- `filter-persistence`: Persistencia y restauración de filtros via sessionStorage
- `participant-stats-bar`: Barra de resumen estadístico arriba de la tabla

### Modified Capabilities
None — no existing spec behavior changes at the requirements level.

## Approach

Tres PRs encadenados (~800-900 líneas total, excede el budget de 400):

**PR #1 — Core UX (~450 líneas)**: Loading state real en DataTable, modal `ParticipantDetailModal`, columna Acciones, ordenamiento via hook `useTableSort`. Este es el PR más grande y más riesgoso.

**PR #2 — Información y persistencia (~190 líneas)**: `ParticipantStatsBar`, sync de filtros a `sessionStorage`, columnas default mejoradas, contador destacado.

**PR #3 — Post-MVP (~200 líneas)**: Virtualización con `react-window` si pageSize=100 es lento. Evalua después de PR #2.

### Arquitectura tentativa
1. **Modal**: Componente nuevo `components/ParticipantDetailModal.tsx`. Recibe `Participant` como prop. Sin fetch extra — datos ya están en `dashboardData`.
2. **Ordenamiento**: Estado `sortKey` + `sortDir` en `Participantes.tsx` o hook `useTableSort`. Opera sobre `filteredData` (no raw).
3. **Loading**: Leer `dashboard.data` del contexto `useDashboard()` — mientras sea `undefined`/vacío, mostrar skeleton.
4. **Persistencia**: `useEffect` en `useParticipantesFilters` que serializa estado a `sessionStorage('participantes_filters')` y restaura en init.
5. **Resumen**: Componente `components/ParticipantStatsBar.tsx`. Computa sobre `filteredData` con `useMemo`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `pages/Participantes.tsx` | Modified | Sort state, selectedParticipant, loading del context |
| `components/DataTable.tsx` | Modified | Sort en headers, columna Acciones, skeleton |
| `components/ParticipantDetailModal.tsx` | New | Modal con grid de 25+ campos |
| `components/ParticipantStatsBar.tsx` | New | Barra de resumen |
| `hooks/useParticipantesFilters.ts` | Modified | Sync/restore sessionStorage |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| sessionStorage cuota excedida | Low | ~1KB de strings planos, lejos del límite de 5-10MB |
| Modal con 25+ campos desborda en mobile | Med | Grid responsive (2 cols), scroll interno, max-height |
| Sort lento en datasets de 100K+ | Low | Opera sobre filteredData, no raw. Worker si escala |

## Rollback Plan

Por PR revertir el commit específico. sessionStorage es client-side — sin efecto en backend. Modal y stats son additive — no rompen flujos existentes si se revierten.

## Dependencies

None.

## Success Criteria

- [ ] Click en fila abre modal con datos correctos del participante
- [ ] Click en header de columna ordena asc/desc con indicador visual (flecha)
- [ ] Skeleton visible mientras `dashboardData` no ha cargado
- [ ] Filtros sobreviven a navegación y vuelta a pestaña Participantes
- [ ] Barra de resumen muestra total, desglose M/F y edad promedio correctos

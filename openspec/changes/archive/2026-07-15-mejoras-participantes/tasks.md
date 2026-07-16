# Tasks: Mejoras Página de Participantes

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~650 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR #1 → PR #2 |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Core UX: modal + sort + loading | PR #1 (~400 lines) | Base → main |
| 2 | Info & persistence: stats + sessionStorage + columnas + contador | PR #2 (~250 lines) | Base → main (after PR #1) |

## PR #1 — Core UX

### Phase 1: Modal de Detalle (T-001)

- [x] 1.1 Crear `components/ParticipantDetailModal.tsx` con props `isOpen`, `onClose`, `participant`
- [x] 1.2 Renderizar 27 campos agrupados (Personal, Contacto, Programa, Salud) en grid responsive
- [x] 1.3 Implementar cierre: botón X, overlay click, tecla Escape
- [x] 1.4 Mostrar "—" para campos null, header con nombre del participante
- [x] 1.5 Añadir en `Participantes.tsx`: estado `selectedParticipant`, handler de row click
- [x] 1.6 Pasar `onRowClick` a DataTable, hacer filas clickeables (tbody onClick delegado)

### Phase 2: Ordenamiento de Columnas (T-002)

- [x] 2.1 Añadir `sortColumn` / `sortDirection` state en `useParticipantesFilters`, exp en return
- [x] 2.2 Aplicar sort en `filteredData` useMemo: comparator según tipo (string vs number vs date)
- [x] 2.3 Pasar `sortColumn`, `sortDirection`, `onSort` a DataTable como props
- [x] 2.4 Renderizar indicadores (▲/▼) en headers, click cycle: asc → desc → asc, default icono dimmed
- [x] 2.5 Resetear `pageIndex` a 1 al cambiar sort (en el useEffect existente)

### Phase 3: Loading State Real (T-003)

- [x] 3.1 Añadir `dataLoaded` flag a `useDashboardData`: `true` tras IndexedDB resolve o fetch inicial
- [x] 3.2 En `Participantes.tsx`: `isLoading = !dataLoaded && dashboardData.length === 0`, pasar a DataTable
- [x] 3.3 Reemplazar spinner de DataTable con skeleton CSS (3-4 filas con shimmer/pulse)
- [x] 3.4 Ocultar paginación y stats skeleton mientras loading

## PR #2 — Información y Persistencia

### Phase 4: Persistencia de Filtros (T-004)

- [x] 4.1 Añadir `useEffect` en `useParticipantesFilters`: serializa todo el filter state a `sessionStorage('participantes_filters')`
- [x] 4.2 En init del hook: leer sessionStorage, parsear con try/catch, setear estados si válido
- [x] 4.3 En `clearAll`: limpiar `sessionStorage.removeItem('participantes_filters')`
- [x] 4.4 En catch de parseo: limpiar entry corrupta y usar defaults

### Phase 5: Resumen Estadístico (T-005)

- [x] 5.1 Crear `components/ParticipantStatsBar.tsx`: props `filteredData: Participant[]`
- [x] 5.2 Computar stats: total, M/F, edad prom, centros únicos con `formatNumber`
- [x] 5.3 Renderizar en DataTable entre filter pills y advanced filters
- [x] 5.4 Edge cases: edad prom solo cuando hay datos, formatNumber para totales

### Phase 6: Columna Acciones + Columnas Default (T-006)

- [x] 6.1 Añadir columna `acciones` a `DEFAULT_COLUMNS`: label "Acciones", icon button "Ver detalle"
- [x] 6.2 Renderizar botón Eye inline en DataTable (no en renderCell, para acceso directo a onRowClick)
- [x] 6.3 Columna Acciones no required pero siempre visible por defecto
- [x] 6.4 Cambiar `municipio`, `rutaFormativa`, `fechaRegistro` en DEFAULT_COLUMNS a `visible: true`

### Phase 7: Contador de Resultados (T-007)

- [x] 7.1 Añadir display numérico entre stats bar y filtros avanzados: "X participantes" con `formatNumber`
- [x] 7.2 Vinculado a `allFilteredData.length`, se actualiza en el mismo render
- [x] 7.3 Se muestra solo cuando hay datos (guardado por `allFilteredData.length > 0`)

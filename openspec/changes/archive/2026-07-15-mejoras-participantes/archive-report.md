# Archive Report: mejoras-participantes

## Summary

Dos PRs completados que mejoran la página de Participantes con modal de detalle, ordenamiento de columnas, loading state real, persistencia de filtros en sessionStorage, barra de resumen estadístico, columna Acciones, columnas default mejoradas, y contador de resultados.

## Changes

### PR #1 — Core UX
- **ParticipantDetailModal**: Modal read-only con 27 campos agrupados, grid responsive, cierre por X/overlay/Escape, "—" para nulls, zero fetch extra
- **Table column sorting**: Sort asc/desc por header click, sobre filteredData, indicadores visuales (▲/▼/⇅), reset de paginación al cambiar sort
- **Loading state real**: Flag `dataLoaded` en `useDashboardData`, skeleton CSS con shimmer/pulse en DataTable, oculta paginación y stats durante carga

### PR #2 — Información y Persistencia
- **Filter persistence**: Serialización completa a sessionStorage('participantes_filters'), restauración en mount, manejo de datos corruptos con fallback a defaults
- **ParticipantStatsBar**: Barra con total, M/F, edad promedio, centros únicos sobre filteredData, reactivo a cambios de filtro
- **Acciones column + default columns**: Botón "Ver detalle" y columna Acciones siempre visible. Municipio, Ruta Formativa, Fecha Registro como visibles por defecto
- **Result counter**: Contador numérico "X participantes" con formatNumber, entre stats bar y filtros avanzados

### Post-verify fix
- Sort direction cycle corregido: asc → desc (sin volver a asc en tercer click)
- Icono neutral cambiado a ⇅ (más visible)
- Contador de resultados más visible (mayor font-weight/tamaño)

## Stale-Checkbox Reconciliation

Los tasks de PR #1 (Phases 1–3: T-001, T-002, T-003) estaban sin marcar `[ ]` en tasks.md porque `sdd-apply` no actualizó los checkboxes durante la implementación de PR #1. El usuario/orquestador confirmó que ambos PRs fueron completados y el fix post-verify aplicado. Se reconciliaron mecánicamente los 15 checkboxes de PR #1 a `[x]` durante el archive, respaldado por la evidencia de los PRs completados.

## Files Created

| File | Status |
|---|---|
| `components/ParticipantDetailModal.tsx` | ✅ Creado |
| `components/ParticipantStatsBar.tsx` | ✅ Creado |
| `openspec/specs/participant-detail-modal/spec.md` | ✅ Creado (main spec desde delta) |
| `openspec/specs/table-column-sorting/spec.md` | ✅ Creado (main spec desde delta) |
| `openspec/specs/participant-stats-bar/spec.md` | ✅ Creado (main spec desde delta) |
| `openspec/specs/filter-persistence/spec.md` | ✅ Creado (main spec desde delta) |
| `openspec/changes/archive/2026-07-15-mejoras-participantes/archive-report.md` | ✅ Este archivo |

## Files Modified

| File | Status |
|---|---|
| `hooks/useParticipantesFilters.ts` | ✅ Modificado (sort state + sessionStorage sync/restore) |
| `hooks/useDashboardData.ts` | ✅ Modificado (dataLoaded flag) |
| `pages/Participantes.tsx` | ✅ Modificado (selectedParticipant, loading, sort props) |
| `components/DataTable.tsx` | ✅ Modificado (sort headers + indicadores, columna Acciones, skeleton, contador) |

## Verification

- ✅ TypeScript compilation: `tsc --noEmit` — 0 errors
- ✅ Production build: `vite build` — 0 errors

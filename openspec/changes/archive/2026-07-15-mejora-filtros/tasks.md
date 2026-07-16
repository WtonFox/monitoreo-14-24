# Tasks: Mejora de Filtros — Dashboard y Participantes

## Resumen

| Campo | Valor |
|-------|-------|
| **Cambio** | mejora-filtros |
| **Dominios** | Estadísticas (FiltersContext) y Participantes (useParticipantesFilters) |
| **Estrategia** | stacked-to-main (auto-forecast) |
| **Total estimado bruto** | ~675 líneas |
| **Total estimado neto** | ~380 líneas |
| **Riesgo >400 líneas** | Borderline — T-006 (DataTable) es el factor más riesgoso |

---

## Dependencia resuelta: ¿Parámetro o `useDashboard()` en `useParticipantesFilters`?

**Decisión**: `useParticipantesFilters(dashboardData)` recibe `dashboardData: Participant[]` como **parámetro**.

**Justificación**:

1. **Consistencia con patrón existente**: `useFilters(data)` ya recibe `data` como parámetro. Misma firma → mismo contrato mental. Los desarrolladores ya conocen este patrón.

2. **Testeabilidad**: Pasar data como parámetro hace el hook **puro** — dado X input, produce Y output. Sin dependencia oculta de `DashboardContext`. Se puede testear con `renderHook(() => useParticipantesFilters(mockData))` sin providers.

3. **Composición**: `Participantes.tsx` puede transformar/derivar data antes de pasarla. Si en el futuro se necesita filtrar combinando dos fuentes, el hook no bloquea.

4. **Desacoplamiento**: El hook vive en `hooks/` sin importar contexts. Reutilizable en tests, stories, o futuros consumidores (ej. exportación desde otra página).

5. **Costo vs. beneficio**: Una línea extra en `Participantes.tsx` (`const filters = useParticipantesFilters(dashboardData)`) vs. acoplamiento oculto a `DashboardContext` que penaliza tests y reuso.

**Trade-off**: El boilerplate de pasar `dashboardData` desde la página es mínimo. La ganancia en testabilidad y composición lo justifica ampliamente.

---

## Fase 1 — Preparación (sin riesgo) ✅

Cambios seguros: mover constantes, eliminar duplicación, actualizar lógica pura.

### T-001: Mover `AGE_GROUPS` a `constants.ts` y extender rangos

| Campo | Valor |
|-------|-------|
| **Descripción** | Agregar array `AGE_GROUPS` en `constants.ts` con los 5 rangos: 14-17, 18-20, 21-24, 25-29, 30+. Mantener misma estructura `{ value, label }`. Re-exportar desde `types.ts` durante transición o actualizar imports directamente. |
| **Archivos** | `constants.ts` (+12 líneas) |
| **Dependencias** | — |
| **Estimación** | ~12 líneas |
| **Riesgo** | Bajo |

**Criterios de aceptación**:
- [x] `AGE_GROUPS` existe en `constants.ts` con 5 entries
- [x] `14-17`: label "14-17 años", value "14-17"
- [x] `18-20`: label "18-20 años", value "18-20"
- [x] `21-24`: label "21-24 años", value "21-24"
- [x] `25-29`: label "25-29 años", value "25-29"
- [x] `30+`: label "30+ años", value "30+"
- [x] `constants.ts` no pierde ninguna exportación existente

---

### T-002: Eliminar `AGE_GROUPS` de `types.ts`

| Campo | Valor |
|-------|-------|
| **Descripción** | Remover las líneas 54-59 de `types.ts` (declaración `export const AGE_GROUPS`). El array ahora vive en `constants.ts`. |
| **Archivos** | `types.ts` (-6 líneas) |
| **Dependencias** | T-001 (AGE_GROUPS debe existir en constants.ts primero) |
| **Estimación** | ~2 líneas efectivas |
| **Riesgo** | Bajo |

**Criterios de aceptación**:
- [x] `types.ts` ya no tiene `export const AGE_GROUPS`
- [x] No hay referencias rotas a `AGE_GROUPS` desde `types.ts` en ningún import del proyecto
- [x] `AdvancedFilterState` y demás interfaces intactas

---

### T-003: Actualizar `matchAgeGroup` en `useFilters.ts` con rangos extendidos

| Campo | Valor |
|-------|-------|
| **Descripción** | En el `switch` de `matchAgeGroup` (líneas 132-142), agregar casos para `'25-29'` (age >= 25 && age <= 29) y `'30+'` (age >= 30). El default se mantiene como `true`. |
| **Archivos** | `hooks/useFilters.ts` (+4 líneas) |
| **Dependencias** | — |
| **Estimación** | ~4 líneas |
| **Riesgo** | Bajo |

**Criterios de aceptación**:
- [x] `matchAgeGroup('25-29')` matchea edad 25-29 inclusive
- [x] `matchAgeGroup('30+')` matchea edad >= 30
- [x] Rangos anteriores (14-17, 18-20, 21-24) siguen funcionando
- [x] Valor vacío o desconocido → `true` (sin filtro)
- [x] Edad negativa o nula → no matchea ningún grupo específico

---

### T-004: Cambiar import de `AGE_GROUPS` en `AdvancedFiltersModal.tsx`

| Campo | Valor |
|-------|-------|
| **Descripción** | En `AdvancedFiltersModal.tsx`, cambiar `import { AdvancedFilterState, AGE_GROUPS } from '../types'` a `import { AdvancedFilterState } from '../types'` + `import { AGE_GROUPS } from '../constants'`. |
| **Archivos** | `components/AdvancedFiltersModal.tsx` (1 línea modificada) |
| **Dependencias** | T-001 (AGE_GROUPS debe existir en constants.ts) |
| **Estimación** | ~1 línea |
| **Riesgo** | Bajo |

**Criterios de aceptación**:
- [x] Import de `AGE_GROUPS` viene de `constants.ts`
- [x] Modal sigue renderizando correctamente los grupos de edad
- [x] No hay warning de import no usado

---

## Fase 2 — Participantes (nuevo hook + refactor)

### T-005: Crear hook `useParticipantesFilters`

| Campo | Valor |
|-------|-------|
| **Descripción** | Crear `hooks/useParticipantesFilters.ts`. Recibe `dashboardData: Participant[]`. Retorna todo el estado de filtros, setters, opciones disponibles, `filteredData`, `hasActiveFilters`, `activeFilterCount`, `clearAll()`, `clearFilter(key)`. Implementar toda la lógica actualmente inline en `Participantes.tsx` más los 6 nuevos filtros: Estado, Año Ingreso, Año Inclusión, Grupo Edad, Estado Civil, Nivel Estudio. Incluir dependencia: `availableCentros` se recalcula cuando cambia `filterProvincia`. `availableMunicipios` se deriva de `PROVINCE_MUNICIPALITIES` igual que hoy. Reset a page 1 no es responsabilidad del hook (lo maneja Participantes con `useEffect`). |
| **Archivos** | `hooks/useParticipantesFilters.ts` (CREAR, ~220 líneas) |
| **Dependencias** | T-001, T-002, T-003 (preparación de constantes y tipos) |
| **Estimación** | ~220 líneas |
| **Riesgo** | Medio — Código nuevo pero aislado, no rompe consumidores existentes |

**Criterios de aceptación**:
- [x] Hook exportado como `export const useParticipantesFilters`
- [x] Contrato exacto del design: todos los fields + setters + available\* + computed
- [x] `filteredData` aplica AND entre todos los filtros activos
- [x] `availableCentros` se recalcula cuando cambia `filterProvincia` (si provincia específica, solo centros de esa provincia; si "todas", todos los centros únicos del dataset)
- [x] `availableMunicipios` se deriva de `PROVINCE_MUNICIPALITIES` (vacío si provincia es "todas")
- [x] `availableEstados`, `availableAniosIngreso`, `availableAniosInclusion` dinámicos desde datos
- [x] `availableEstadoCivil`, `availableNivelEstudio` excluyen "N/D" y "Ninguna"
- [x] `AGE_GROUPS` importado desde `constants.ts`
- [x] `activeFilterCount` cuenta filtros con valor !== '' y !== 'todos' y !== 'todas'
- [x] `clearFilter(key)` resetea un filtro individual a su valor por defecto
- [x] `clearAll()` resetea todos los filtros
- [x] Dataset vacío → selects sin opciones (solo "Todos"), sin errores

---

### T-006: Refactor `Participantes.tsx` para usar el hook

| Campo | Valor |
|-------|-------|
| **Descripción** | Reemplazar todo el estado inline (`useState` para searchTerm, filterProvincia, etc.), `useMemo` computations y lógica de filtrado por una sola llamada a `useParticipantesFilters(dashboardData)`. Pasar todo al DataTable vía props. Mantener página, paginación, exportación, MassExportModal. |
| **Archivos** | `pages/Participantes.tsx` (~148 → ~70 líneas) |
| **Dependencias** | T-005 (hook debe existir) |
| **Estimación** | ~80 líneas modificadas, -78 neto |
| **Riesgo** | Medio — Cambia la página principal pero contrato es 1:1 con el hook |

**Criterios de aceptación**:
- [x] `Participantes.tsx` NO tiene lógica de filtrado inline (ni `useMemo` para filteredData, available\*, etc.)
- [x] Llama `useParticipantesFilters(dashboardData)` una sola vez
- [x] Pasa `filteredData`, `searchTerm y setters`, available\* al DataTable
- [x] Paginación funciona igual: `useEffect` resetea a página 1 al cambiar filtros
- [x] `handleProvinciaChange` resetea municipio y centro (viene del hook)
- [x] MassExportModal y exportación no se ven afectados
- [x] El comportamiento visual es idéntico al anterior

---

### T-007: Refactor `DataTable.tsx` — layout colapsable + nuevos filtros + pills ✅

| Campo | Valor |
|-------|-------|
| **Descripción** | Transformar la sección de filtros actual de DataTable en un layout colapsable tipo acordeón. Agregar los 6 nuevos filtros (Estado, Año Ingreso, Año Inclusión, Grupo Edad, Estado Civil, Nivel Estudio) en grid de 2-3 columnas. Agregar barra de resumen/pills SIEMPRE visible debajo del search, con chips por filtro activo y botón "X" para limpiar individual + "Limpiar todos". Simplificar props (DataTable ya no tiene lógica de filtrado, recibe todo ya calculado desde Participantes). |
| **Archivos** | `components/DataTable.tsx` (~414 → ~550 líneas) |
| **Dependencias** | T-005 (hook provee los datos que DataTable recibe) |
| **Estimación** | ~200 líneas modificadas, ~136 neto |
| **Riesgo** | **Alto** — Es el cambio más grande. Afecta layout, props, y funcionalidad. Requiere verificar que exportación, paginación, column selector y tabla en sí no se rompan. |

**Criterios de aceptación**:
- [x] Sección de filtros es expandible/colapsable (colapsada por defecto)
- [x] Al expandir, muestra grid de 2-3 columnas con todos los filtros
- [x] Filtros funcionan aunque la sección esté colapsada
- [x] Barra de pills visible SIEMPRE debajo del search
- [x] Cada pill muestra: "Etiqueta: Valor" con botón X
- [x] Botón "Limpiar todos" resetea todos los filtros
- [x] Sin filtros activos → texto "Sin filtros activos" y badge oculto
- [x] Props actualizadas (recibe filteredData, search, filters, callbacks)
- [x] Paginación, exportación, ColumnSelector intactos
- [x] Tabla se renderiza correctamente sin cambios visuales en los datos
- [x] No hay desbordamiento horizontal en la sección de filtros

---

## Fase 3 — Estadísticas (FilterBar + conexión)

### T-008: Refactor `FilterBar.tsx` — agregar search, centro, badge; remover municipio

| Campo | Valor |
|-------|-------|
| **Descripción** | Agregar input de búsqueda con lupa y debounce 300ms. Agregar select "Centro" con opciones dinámicas (filtrado por provincia). Agregar badge numérico de filtros avanzados activos junto al botón "Avanzado" (hace clic abre modal). Remover select de Municipio y sus props asociadas. Nuevas props: `searchTerm`, `onSearchChange`, `selectedCentro`, `onCentroChange`, `availableCentros`, `activeAdvancedFilterCount`. Props eliminadas: `selectedMunicipio`, `onMunicipioChange`, `availableMunicipiosForProvince`. |
| **Archivos** | `components/FilterBar.tsx` (~119 → ~190 líneas) |
| **Dependencias** | — |
| **Estimación** | ~80 líneas modificadas, ~71 neto |
| **Riesgo** | Medio — Cambia props del componente, requiere actualizar consumidores (Estadisticas.tsx) |

**Criterios de aceptación**:
- [x] Input de búsqueda visible con placeholder "Buscar participante..."
- [x] Debounce de 300ms implementado (no dispara en cada keystroke)
- [x] Select Centro presente, opciones dinámicas desde availableCentros
- [x] Select Centro se deshabilita si no hay centros disponibles ("Sin centros")
- [x] Select Municipio NO existe en FilterBar
- [x] Badge numérico junto al botón "Avanzado" muestra cantidad de filtros activos
- [x] Badge oculto o en gris cuando activeAdvancedFilterCount === 0
- [x] Al hacer clic en el badge, se abre el modal (mismo handler que botón "Avanzado")
- [x] Props viejas de municipio eliminadas de la interface

---

### T-009: Conectar search + centro + badge en `Estadisticas.tsx`

| Campo | Valor |
|-------|-------|
| **Descripción** | Agregar estado local para `searchTerm` y `selectedCentro` en Estadisticas. Pasar `onSearchChange`, `selectedCentro`, `onCentroChange`, `availableCentros` al FilterBar. Aplicar post-filtro: después del `filteredData` del contexto, aplicar filtro por searchTerm (text match en nombres, apellidos, cédula, provincia, municipio, centro) y centro. Calcular `activeAdvancedFilterCount` desde `advancedFilters`. Remover props de municipio (selectedMunicipio, onMunicipioChange, availableMunicipiosForProvince) del FilterBar. |
| **Archivos** | `pages/Estadisticas.tsx` (~86 → ~130 líneas) |
| **Dependencias** | T-008 (FilterBar debe tener las nuevas props) |
| **Estimación** | ~45 líneas modificadas, ~44 neto |
| **Riesgo** | Medio — Flujo de datos cambia (post-filtro local después de contexto) |

**Criterios de aceptación**:
- [x] Search term aplica debounce de 300ms sobre `filteredData` del contexto
- [x] Select Centro filtra sobre `filteredData` del contexto
- [x] Post-filtro: contexto → search → centro (en ese orden)
- [x] StatsCards y ChartsSection reciben el data post-filtrado
- [x] `activeAdvancedFilterCount` computado desde `Object.values(advancedFilters).filter(v => v !== '').length`
- [x] Badge recibe el conteo correcto
- [x] Props de municipio eliminadas de la llamada a FilterBar
- [x] Sin resultados → StatsCards/ChartsSection muestran estado vacío ("Sin resultados")
- [x] Término vacío → sin filtro aplicado

---

## Fase 4 — Cierre

### T-010: Sync delta spec si cambió algo

| Campo | Valor |
|-------|-------|
| **Descripción** | Revisar `openspec/changes/mejora-filtros/spec.md` contra el estado final de la implementación. Si hay discrepancias (features agregadas, comportamientos cambiados, edge cases descubiertos), actualizar el spec para reflejar la realidad. Si no hay cambios, no tocar. |
| **Archivos** | `openspec/changes/mejora-filtros/spec.md` (posible update) |
| **Dependencias** | T-001 a T-009 |
| **Estimación** | ~0-30 líneas |
| **Riesgo** | Bajo |

**Criterios de aceptación**:
- [x] Spec está sincronizado con el código implementado
- [x] Criterios de aceptación del spec son verificables contra el código
- [x] No hay features en el spec que no se implementaron
- [x] No hay features implementadas que no están en el spec

---

## Review Workload Forecast

### Líneas de cambio totales

| Fase | Tareas | Bruto | Neto | Riesgo |
|------|--------|-------|------|--------|
| Fase 1 — Preparación ✅ | T-001, T-002, T-003, T-004 | ~19 | ~11 | Bajo |
| Fase 2 — Participantes | T-005, T-006, T-007 | ~500 | ~278 | Alto |
| Fase 3 — Estadísticas | T-008, T-009 | ~125 | ~115 | Medio |
| Fase 4 — Cierre | T-010 | ~10 | ~0 | Bajo |
| **Total** | **10 tareas** | **~654** | **~404** | **—** |

### Evaluación de riesgo >400 líneas

**Neto estimado: ~404 líneas** — roza el umbral de 400.

El factor de riesgo principal es **T-007 (DataTable refactor)**, que es difícil de estimar con precisión porque el layout colapsable + grid de 6 filtros + pills + cambio de props puede escalar más de lo previsto.

### Recomendación de splits

Dado que la estrategia es **stacked-to-main**, propongo dividir en **4 PRs encadenados**:

| PR | Tareas | Líneas netas estimadas | Review focus |
|----|--------|----------------------|--------------|
| **PR 1** 🟢 | T-001, T-002, T-003, T-004 | ~11 | Preparación segura |
| **PR 2** 🟡 | T-005 + T-006 | ~200 | Hook nuevo + Participantes refactor |
| **PR 3** 🟠 | T-007 | ~136 | DataTable (el más riesgoso, merece review aislado) |
| **PR 4** 🟢 | T-008 + T-009 | ~115 | FilterBar + Estadísticas (bajo riesgo si PR3 ya mergeó) |
| **PR 5** 📄 | T-010 | ~0 | Sync spec |

Si T-007 queda dentro de lo estimado (~136 neto), ningún PR individual cruza las 200 líneas netas, lo que da reviews cómodos.

**Si T-007 se dispara a >250 líneas**, considerar dividirlo en:
- T-007a: Props simplification + pills bar (fácil, ~50 líneas)
- T-007b: Collapsible layout + 6 nuevos filtros (difícil, ~150-200 líneas)

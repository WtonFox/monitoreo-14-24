# Spec: Mejora de Filtros — Dashboard y Participantes

## 1. Especificaciones Funcionales

### A. Panel de Control — Búsqueda por texto

| Campo | Detalle |
|-------|---------|
| **Input** | Campo de texto en FilterBar, placeholder "Buscar participante..." |
| **Comportamiento** | Filtra `filteredData` por coincidencia en nombres, apellidos, cédula, provincia, municipio, centro. Debounce de 300ms. |
| **Output** | `filteredData` reducido; StatsCards y ChartsSection reaccionan al cambio. |
| **Edge cases** | Sin resultados → mostrar "Sin resultados" en gráficas. Término vacío → sin filtro. |

### B. Panel de Control — Filtro Centro

| Campo | Detalle |
|-------|---------|
| **Input** | Select "Centro" en FilterBar. Opciones dinámicas desde `dashboardData`. |
| **Dependencia** | Lista filtrada por provincia seleccionada. Si provincia está vacía, muestra todos los centros únicos del dataset. |
| **Comportamiento** | Al cambiar provincia, resetear centro a "". Si provincia se vacía, restaurar lista completa de centros. |
| **Output** | Data filtrada por centro + provincia + resto de filtros. |
| **Edge cases** | Provincia sin centros → select deshabilitado con "Sin centros". |

### C. Panel de Control — Unificación de Municipio

| Campo | Detalle |
|-------|---------|
| **Qué cambia** | Se elimina `selectedMunicipio` de FilterBar. Municipio solo vive en `advancedFilters.municipio` (modal). |
| **Comportamiento** | FilterBar pierde el select de Municipio. El modal de Filtros Avanzados mantiene el control. |
| **Output** | Estado único: `advancedFilters.municipio` gobierna el filtro. Sin duplicación. |

### D. Panel de Control — AGE_GROUPS extendido

| Campo | Detalle |
|-------|---------|
| **Valores** | `14-17`, `18-20`, `21-24`, `25-29`, `30+` (antes: solo hasta 24) |
| **Input** | Select Grupo de Edad en AdvancedFiltersModal |
| **Lógica** | `14-17`: edad 14-17, `18-20`: 18-20, `21-24`: 21-24, `25-29`: 25-29, `30+`: edad >= 30 |
| **Output** | `AGE_GROUPS` en types.ts actualizado. Modal usa el array. |
| **Edge cases** | Edad negativa o nula → no matchea ningún grupo. |

### E. Panel de Control — Badge de filtros activos

| Campo | Detalle |
|-------|---------|
| **Input** | Indicador visual en FilterBar, junto al botón "Avanzado" |
| **Comportamiento** | Muestra un badge numérico con la cantidad de filtros avanzados activos (ej: "3 activos"). Al hacer clic en el badge, abre el modal. |
| **Output** | Visibilidad inmediata de filtros aplicados sin abrir el modal. |
| **Edge cases** | Sin filtros avanzados activos → badge oculto o gris. |

### F. Participantes — Layout colapsable de filtros

| Campo | Detalle |
|-------|---------|
| **Input** | Sección expandible "Filtros Avanzados" en DataTable, reemplazando la fila horizontal actual |
| **Controles** | Provincia, Municipio, Centro, Sexo + todos los nuevos (G). Organizados en grid 2-3 columnas. |
| **Comportamiento** | Sección colapsada por defecto. Al expandir, muestra controles. Al colapsar, se ocultan pero filtros siguen activos. |
| **Output** | Layout que escala con N filtros. Sin desbordamiento horizontal. |

### G. Participantes — Nuevos filtros

| Control | Input | Valores |
|---------|-------|---------|
| Estado | Select | Dinámico desde datos: Activo, Retirado, Egresado, En Proceso, Pendiente + otros del dataset |
| Año Ingreso | Select | Años extraídos de `fechaRegistro`, orden descendente |
| Año Inclusión | Select | Años extraídos de `fechaInclusion`, orden descendente |
| Grupo Edad | Select | Mismos 5 rangos que en Estadísticas (AGE_GROUPS extendido) |
| Estado Civil | Select | Dinámico desde datos, excluye N/D y Ninguna |
| Nivel Estudio | Select | Dinámico desde datos, excluye N/D y Ninguna |

| Edge cases | Dataset vacío → selects sin opciones (solo "Todos"). Año inválido en fecha → ignorado. |
| **Output** | `filteredData` filtrado por todos los controles activos. Paginación resetea a página 1 al cambiar filtros. |

### H. Participantes — Resumen de filtros activos

| Campo | Detalle |
|-------|---------|
| **Input** | Barra de resumen visible SIEMPRE (aún con sección colapsada), debajo del search |
| **Formato** | Pills/chips con cada filtro activo: "Provincia: Santiago", "Estado: Activo". Botón "X" para limpiar filtro individual. Botón "Limpiar todos". |
| **Output** | Visibilidad constante. Sin pills → todo vacío, mostrar texto "Sin filtros activos". |

### I. Participantes — Extraer lógica a hook `useParticipantesFilters`

| Campo | Detalle |
|-------|---------|
| **Hook nuevo** | `hooks/useParticipantesFilters.ts` |
| **Responsabilidades** | Estado de TODOS los filtros, cómputo de opciones disponibles, filteredData, reseteo de página, availableMunicipios, availableCentros |
| **Output** | `Participantes.tsx` consume el hook. DataTable recibe props sin lógica de filtrado. |
| **Contrato** | Recibe `dashboardData: Participant[]`. Retorna `{ searchTerm, filterProvincia, filterMunicipio, filterCentro, filterSexo, filterEstado, filterAnioIngreso, filterAnioInclusion, filterAgeGroup, filterEstadoCivil, filterNivelEstudio, setters, filteredData, available*, hasActiveFilters, clearAll, activeFilterCount }`. |

---

## 2. Criterios de Aceptación

- [ ] Municipio NO aparece duplicado en Estadísticas (solo en modal, no en FilterBar)
- [ ] Búsqueda por texto filtra en tiempo real con debounce en Estadísticas
- [ ] Select Centro aparece en FilterBar y filtra correctamente según provincia
- [ ] AGE_GROUPS tiene 5 rangos: 14-17, 18-20, 21-24, 25-29, 30+
- [ ] Badge de filtros activos visible en FilterBar con conteo numérico
- [ ] Layout de filtros en Participantes es colapsable/expandible sin desborde
- [ ] Participantes tiene Estado, Año Ingreso, Año Inclusión, Grupo Edad, Estado Civil, Nivel Estudio como filtros funcionales
- [ ] Resumen de filtros activos visible siempre en Participantes, con limpieza individual
- [ ] `useParticipantesFilters` extraído; `Participantes.tsx` sin lógica de filtrado inline
- [ ] FiltersContext (Estadísticas) mantiene estado entre tabs (el provider envuelve la App). Participantes resetea estado al cambiar de ruta (useParticipantesFilters es estado local del hook, no persiste entre montajes).
- [ ] Datasets sin datos no producen errores (selects vacíos, grids sin opciones)

## 3. Consideraciones Técnicas

- **Rendimiento**: Search con `useDeferredValue` o debounce (300ms para Estadísticas, tiempo real para Participantes por ser local).
- **Tipado**: `AdvancedFilterState` ya existía con `yearIngreso`, `yearInclusion`, `municipio`. Se expande con `ageGroup`, `sexo`, `estadoCivil`, `nivelEstudio`. Los filtros `centro` (Estadísticas), `estado`, `anioIngreso`, `anioInclusion` y `provincia/municipio/sexo` de Participantes viven en estado local del hook/componente, no en `AdvancedFilterState`. `AGE_GROUPS` se mueve a `constants.ts`.
- **Estado entre tabs**: FiltersContext (Estadísticas) y `useParticipantesFilters` (Participantes) son independientes. No comparten estado. FiltersContext persiste entre rutas porque el provider envuelve la App. `useParticipantesFilters` se reinicia al montar el componente (estado local, no persiste entre navegaciones).
- **DataTable props**: Refactor menor para recibir nuevos filtros vía props. No romper exportación existente.
- **AGE_GROUPS**: Declarar array en `constants.ts`, importar desde allí tanto en Estadísticas como en Participantes. Eliminar de `types.ts`.
- **Compatibilidad**: Todos los filtros nuevos usan AND lógico con los existentes. No cambiar comportamiento de filtros no modificados.

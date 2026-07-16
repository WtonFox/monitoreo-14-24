# Proposal: Mejora de Filtros — Dashboard y Participantes

## Intent

Los filtros actuales tienen duplicación de estado (municipio en FilterBar y AdvancedFiltersModal), grupos de edad incompletos (sin 25+), y falta búsqueda por texto y filtro Centro en el Panel de Control. En Participantes, la fila horizontal de filtros no escala y faltan filtros clave (Estado, Año, Grupo Edad, Estado Civil, Nivel Estudio).

## Scope

### In Scope
- Unificar estado de municipio en Estadísticas (eliminar duplicación FilterBar vs AdvancedFiltersModal)
- Agregar búsqueda por texto en Panel de Control (Estadísticas)
- Agregar filtro Centro en FilterBar de Estadísticas
- Extender AGE_GROUPS a 14–17, 18–20, 21–24, 25–29, 30+
- Agregar filtros avanzados en Participantes: Estado, Año Ingreso, Año Inclusión, Grupo Edad, Estado Civil, Nivel Estudio
- Rediseñar layout de filtros en Participantes (colapsable/expandible en vez de fila horizontal fija)
- Mostrar badges de filtros activos en ambas pantallas

### Out of Scope
- Compartir contexto de filtros entre Estadísticas y Participantes
- Promedios nacionales en mapa (cambio separado)
- Persistencia de filtros en localStorage
- Filtros del Mapa (MapFilters) — quedan como están

## Capabilities

### New Capabilities
None — los filtros son UX transversal a capacidades existentes, no una capability nueva.

### Modified Capabilities
None — ninguna spec existente define comportamiento de filtros como capability. Los cambios son de implementación, no de contrato spec-level.

## Approach

**Panel de Control (Estadísticas):**
1. Remover `selectedMunicipio` del FilterBar; usar solo `advancedFilters.municipio` como fuente única
2. Agregar input de búsqueda por texto al FilterBar
3. Agregar selector Centro al FilterBar (dependiente de Provincia)
4. Actualizar tipado `AGE_GROUPS` con los 5 rangos; mapear edades en el filtro
5. Agregar indicador visual (`badge` o pill) de filtros avanzados activos en el FilterBar

**Participantes:**
6. Mover filtros (Provincia, Municipio, Centro, Sexo + nuevos) a sección colapsable tipo "Filtros Avanzados"
7. Agregar Estado, Año Ingreso, Año Inclusión, Grupo Edad, Estado Civil, Nivel Estudio
8. Extraer lógica de filtrado a hook `useParticipantesFilters` (hoy está inline en la página)
9. Mostrar resumen de filtros activos visibles siempre (aún colapsado)

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `components/FilterBar.tsx` | Modified | Agregar search input + Centro + active filter badges |
| `components/AdvancedFiltersModal.tsx` | Modified | AGE_GROUPS extendido; sincronizar municipio |
| `components/DataTable.tsx` | Modified | Rediseñar sección de filtros, agrupar, colapsar |
| `pages/Estadisticas.tsx` | Modified | Integrar search + Centro; remover selectedMunicipio duplicado |
| `pages/Participantes.tsx` | Modified | Extraer lógica de filtros a hook; conectar nuevos filtros |
| `hooks/useFilters.ts` | Modified | AGE_GROUPS extendido; search term + centro |
| `hooks/useParticipantesFilters.ts` | New | Hook con lógica de filtros para Participantes |
| `types.ts` | Modified | AGE_GROUPS con 5 rangos; `AdvancedFilterState` opcionalmente expandido |
| `constants.ts` | Modified | Si se agregan centros por defecto u otros helpers |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Romper filtrado existente por refactor de estado duplicado | Medium | Tests manuales de cada combinación de filtros post-cambio |
| Layout de DataTable complejo de rediseñar (colapsable) | Low | Prototipar con sección ya existente "Filtros y Datos" |
| Performance en búsqueda por texto en datasets grandes | Low | Usar `useDeferredValue` o debounce (patrón ya usado en Indicadores) |

## Rollback Plan

Revert commit del cambio. Si se despliega en etapas: revertir solo los archivos tocados en el deploy problemático. El cambio es puramente frontend — no hay migraciones ni cambios de API.

## Dependencies

Ninguna. Todo es frontend, no requiere cambios de API ni base de datos.

## Success Criteria

- [ ] Municipio aparece una sola vez en Estadísticas (sin duplicación FilterBar / modal)
- [ ] Búsqueda por texto filtra participantes en Estadísticas correctamente
- [ ] Filtro Centro funciona en Estadísticas (dependiente de Provincia)
- [ ] AGE_GROUPS muestra 14–17, 18–20, 21–24, 25–29, 30+
- [ ] Filtros avanzados de Participantes (Estado, Años, Grupo Edad, Estado Civil, Nivel Estudio) filtran correctamente
- [ ] Layout de filtros en Participantes no se rompe al agregar nuevos filtros
- [ ] Badges de filtros activos visibles en ambas pantallas

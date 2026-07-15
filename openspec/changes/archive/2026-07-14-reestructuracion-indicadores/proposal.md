# Proposal: Reestructuración de Indicadores

## Intent

Corregir categorías incorrectas (IDs 23, 24 en sociales con descripción calidad-dato), redistribuir indicadores sociales, eliminar `sociales`, mejorar display calidad-dato (count+%), unificar "Número" → "Cantidad". Refactor puro.

## Scope

### In Scope
1. Renombrar IDs 11,13,15,17,19,21 — "Número" → "Cantidad"
2. Mostrar "X de Y (Z%)" en IDs 37-42
3. Mover ID 26 programa → calidad-dato; ID 25 se queda
4. Mover IDs 23,24 sociales → calidad-dato
5. Mover IDs 29-32 sociales → demograficos
6. Eliminar `sociales` de types, rutas, tabs, navegación, board
7. Renombrar ID 52 → "Edad de ingreso al programa"
8. Delta spec indicators-board

### Out of Scope
Nuevos indicadores, fórmulas, Web Worker, API, datos, tests.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `indicators-board`: categorías reorganizadas (sociales eliminada), renombres, display calidad-dato count+%

## Approach

1. Constantes: eliminar `'sociales'` de `IndicatorCategory`, `'social'` de `BoardCategory`, `socialData` de `BoardData`
2. Renombres: reemplazar "Número de participantes" → "Cantidad de participantes"
3. Redistribución: cambiar `category:` en 7 indicadores; reordenar `buildGroup()`
4. Calidad-dato: modificar `completitudPct()` para count/total
5. Rutas: eliminar `INDICADORES_SOCIALES` de routes, router, header, layout, permissions
6. Modal: eliminar `'sociales'` de `OVERVIEW_CATEGORIES` y `case 'sociales'`
7. Spec: delta en `openspec/changes/reestructuracion-indicadores/specs/`

## Affected Areas

| Area | Impact |
|---|---|
| `utils/indicator-computations.ts` | Modified |
| `hooks/useIndicators.ts` | Modified |
| `hooks/computeBoardData.ts` | Modified |
| `hooks/useIndicatorBoards.ts` | Modified |
| `types/routes.ts` | Modified |
| `router.tsx`, `Header.tsx`, `IndicadoresLayout.tsx` | Modified |
| `contexts/IndicadoresFiltersContext.tsx` | Modified |
| `IndicatorModal.tsx`, `OverviewTab.tsx` | Modified |
| `openspec/specs/indicators-board/spec.md` | Modified |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Ruta social referenciada externamente | Low | SPA interna |
| ID 25 vs 26 confusión | Low | Scope documenta que 25 se queda |
| ID 52 confundido con ID 4 | Low | Propósitos distintos documentados |

## Rollback Plan

Revertir commits en orden inverso: rutas → categorías → renombres/display. Sin migración requerida.

## Dependencies

Ninguna — solo frontend, sin API.

## Success Criteria

- [ ] `IndicatorCategory` sin `'sociales'`
- [ ] IDs 23,24,26 en calidad-dato; IDs 29-32 en demograficos
- [ ] IDs 11,13,15,17,19,21 con "Cantidad de participantes"
- [ ] IDs 37-42 con formato "X de Y (Z%)"
- [ ] `/indicadores/sociales` 404 o dashboard
- [ ] Tab Sociales eliminada de navegación
- [ ] `npm run build` sin errores

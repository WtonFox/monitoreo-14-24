# Propuesta: Auditoría y Calidad de Datos

## Intent

Auditar la calidad del dataset (duplicados, ND, anomalías fecha/edad, vocabulario de estados, centinelas, corruptos) y responder —con heurísticas etiquetadas— si hay personas en más de una ruta formativa (Q1) o inscritas más de una vez (Q2). Audiencia: gestores y auditores. Q3 (egreso repetido) no es respondible sin fecha de egreso.

> **Validado contra API real (2026-08-13)**: la semántica de filas quedó confirmada — la API devuelve **1 fila por persona registrada, sin deduplicar** (70.283 registros). En muestra de 2.000 filas: 0 cédulas repetidas, pero **51 grupos de nombre+apellido repetidos** (duplicados de carga y multi-ruta real). El 42% no tiene cédula válida → la heurística debe usar **identidad normalizada por nombre**, con cédula como confirmación secundaria.

## Scope

**In Scope**
- Board "Auditoría" bajo `/indicadores` (patrón `RegistroDiarioBoard`): ruta, const `ROUTES`, tab en "Datos y Calidad".
- Señales: duplicados de carga (misma identidad), multi-ruta (Q1), re-inscripción candidata (Q2), ND `cedula`, anomalías fecha/edad, estados vs vocabulario, centinelas, corruptos.
- Heurísticas Q1/Q2 por **identidad normalizada** (nombre+apellido; cédula como refuerzo) con etiqueta "candidato"; callout Q3; KPIs + drill-down con caveats.

**Out of Scope**: sin cambios de modelo de datos ni historial upstream; Opción B diferida; `isInvalid` aparte.

## Capabilities

**New** — `auditoria-datos`: señales de auditoría/calidad + heurísticas Q1/Q2 + callout Q3.
**Modified** — `indicators-board`: extender R11 con `/indicadores/auditoria` y tab "Auditoría".

## Key Decisions & Assumptions

- **Semántica de filas — CONFIRMADA por validación API**: 1 fila por persona registrada, **sin deduplicación** en origen. Los registros repetidos que aparezcan (misma identidad) son duplicados de carga o multi-ruta real. No se requiere degradación a "sin señal": la señal existe y es medible.
- **Identidad normalizada**: clave primaria = `nombres + apellidos` normalizados (trim, case-fold, sin acentos, sin espacios internos). Cédula normalizada (no-dígitos fuera) como confirmación secundaria cuando exista. Excluir `'N/D'`/vacías del matching por cédula, pero **no** del matching por nombre.
- **Clasificación de grupos repetidos**: mismo nombre + distinta `rutaFormativa` → candidato multi-ruta (Q1); mismo nombre + misma ruta + ids/fechas cercanos → duplicado de carga; mismo nombre + distinta `fechaRegistro` distante → candidato re-inscripción (Q2). Siempre listas candidatas con caveats, nunca afirmaciones.
- **Idioma**: español neutral.

## Approach

`AuditoriaBoard` autónomo: lazy import + ruta en `router.tsx`; `INDICADORES_AUDITORIA` en `types/routes.ts`; item en `TAB_GROUPS` de `IndicadoresLayout`; O(n) en `useMemo` sobre `filteredData`; reutiliza `utils/normalize.ts`. Sin cambios a `computeIndicators` ni `routeBoardMap`.

## Affected Areas

| Área | Impacto |
|------|---------|
| `pages/indicadores/AuditoriaBoard.tsx` | New |
| `router.tsx` / `types/routes.ts` | Modified — ruta + const + permisos |
| `pages/IndicadoresLayout.tsx` | Modified — tab |
| `AuditoriaBoard.spec.tsx`, `e2e/mockData.ts` | New/Mod — fixtures cédulas repetidas |

## Risks

| Riesgo | Prob. | Mitigación |
|--------|-------|------------|
| Falsos positivos en identidad por nombre (homónimos reales) | High | Requerir coincidencia exacta nombre+apellido; cédula como confirmación; etiquetar "candidato"; caveat visual |
| Nombres con variantes ortográficas / acentos | Med | Normalización robusta (case-fold, sin acentos, sin espacios) |
| Desempeño | Low | O(n) en `useMemo` |
| Stub `isInvalid` | Med | Enumerar vs vocabulario |
| 42% sin cédula limita confirmación por cédula | Med | El matching por nombre es la clave primaria; la cédula es refuerzo, no requisito |

## Rollback Plan

Quitar ruta + tab + `AuditoriaBoard.tsx`; revertir router/rutas/layout — IDs 1–83 intactos.

## Dependencies

Fixtures e2e con identidades repetidas (mismo nombre en rutas distintas + duplicados de carga con ids consecutivos). Validación API ya realizada (2026-08-13) — no queda gate de muestra viva pendiente.

## Success Criteria

- [ ] Señales de auditoría correctas con drill-down: duplicados de carga, multi-ruta, re-inscripción, ND cédula, anomalías fecha/edad, vocabulario, centinelas, corruptos
- [ ] Q1/Q2 muestran candidatos reales con caveats (validado: 51 grupos en muestra 2.000)
- [ ] Callout Q3 visible ("no respondible sin fecha de egreso")
- [ ] Build OK; tests pasan

## Delivery

`force-chained`; presupuesto 400 líneas. Slice board+ruta+tab **excede 400** (~450–550). Slices: (1) rutas+shell+KPIs+callout Q3, (2) drill-down, (3) tests, (4) e2e.

## Open Questions

- ¿Filtros globales o universo completo? Supuesto: filtros globales.
- ¿Prioridad de señales en slice 1? Supuesto: las 8 del exploration (duplicados, multi-ruta, re-inscripción, ND, anomalías, vocabulario, centinelas, corruptos).
- Confirmado: semántica de filas (1 fila por persona sin deduplicar) y pageIndex 1-based.
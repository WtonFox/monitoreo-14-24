# Proposal: Pulido Visual — Consistencia de Boards

## Intent

Unificar la apariencia visual, los estados vacío y los patrones de layout entre los 13 boards de indicadores. Eliminar las inconsistencias detectadas: colores de toggle distintos por board, duplicación de helpers inline (`tickShort`, `chartClass`, `chartH`), mensajes de empty state dispares, y variaciones en formato de KPIs. Extraer un wrapper compartido `<BoardShell>` si la duplicación de layout lo justifica.

## Scope

### In Scope
- Revisión de los 13 boards contra checklist de 7 puntos
- Extracción de `<BoardShell>` con layout wrapper, empty state, filter bar + view toggle
- Unificación de helpers `tickShort`, `chartClass`, `chartH` en utilidad compartida
- Estandarización de colores de toggle activo, mensajes de empty state, iconografía
- Ajustes responsive: verificar stacking en mobile y scroll horizontal en tablas
- Registro diario: unificar formato de tabla con los demás boards

### Out of Scope
- Cambios en lógica de negocio o cálculos de indicadores
- Nuevos boards, nuevas gráficas o nuevos KPIs
- API, servicios, tipos o IndexedDB
- Testing (no hay test runner en el proyecto)

## Capabilities

### New Capabilities
None — no new spec-level behavior.

### Modified Capabilities
None — pure visual refactor, no requirement changes at spec level.

## Approach

1. **Auditar** cada board — checklist de 7 puntos (consistencia, KPIs, gráficas, responsive, empty, carga, filtros)
2. **Extraer `<BoardShell>`** — wrapper compartido que renderiza empty state, filter bar + view toggle, y children charts
3. **Unificar helpers** — mover `tickShort`, `chartClass`, `chartH` a utils compartidos
4. **Estandarizar** — toggle active color único (`text-blue-600`), empty state unificado (icono lucide + "Sin datos"), padding/spacing consistente
5. **Ajustes por board** — corregir cada inconsistencia detectada (toggle colors, font sizes YAxis, KPI grid cols, empty state messages)

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `pages/indicadores/*Board.tsx` (13 files) | Modified | Wrapper, empty state, toggle, helpers |
| `components/BoardShell.tsx` | New | Shared layout shell |
| `utils/indicadores-helpers.ts` | New | `tickShort`, `chartClass`, `chartH` |
| `components/IndicadoresFilterBar.tsx` | Minor | Si se mueve lógica de toggle al shell |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| BoardShell muy genérico no cubre casos atípicos (SocialesBoard progress bars, CentrosSinMenores sin toggle) | Med | Slots opcionales en shell (`kpiSection`, `viewToggle`) |
| Regresión en layout de boards con estructura no-estándar | Low | Revisión visual board por board post-cambio |
| Romper tabla responsive de RegistroDiario | Low | Scroll horizontal verificado en mobile |

## Rollback Plan

`git checkout` sobre los 13 archivos Board + eliminar BoardShell.tsx e indicadores-helpers.ts. Sin migración de datos ni dependencias externas.

## Dependencies

None.

## Success Criteria

- [ ] 13 boards comparten mismo wrapper layout (`<BoardShell>`)
- [ ] 0 duplicación de `tickShort`, `chartClass` o `chartH`
- [ ] Todos los toggles activos usan `text-blue-600`
- [ ] Todos los empty states: icono lucide + "Sin datos"
- [ ] Boards funcionales en <768px (columnas stack, tablas scroll)
- [ ] Sin regresiones visuales detectadas en revisión post-cambio

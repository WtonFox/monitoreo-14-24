# Propuesta: Auditoría — límite de 15 filas, modal "Ver más" y heurística Q3

## Intent

El board de auditoría lista hasta 50 filas por señal con un aviso pasivo ("…y N más"), lo que oculta el grueso de cada lista y vuelve el board ilegible para gestores y auditores. Este cambio baja el límite visible a 15 y agrega un botón **"Ver más"** por tarjeta que abre un modal con la lista completa (receta de overlay ya usada en el repo, sin primitive nuevo). Además convierte Q3 de un callout sin salida ("no respondible sin fecha de egreso") en una **lista candidata etiquetada**: identidades con ≥2 registros y ≥1 fila con estado egresado — heurística explícita que nunca afirma un doble egreso (misma caveat AUD-12 de Q1/Q2).

## Scope

**In Scope**
- UI: `VER_MAS_LIMIT = 15` (reemplaza `LIST_LIMIT = 50`); botón "Ver más" por tarjeta, visible solo cuando la lista supera 15; modal por señal con lista completa, título, count, cierre por backdrop/Esc/X, `max-h-[85vh] overflow-y-auto`.
- Datos: **sin cambios** a `computeAuditSignals` para el modal — las arrays ya llegan sin tope.
- Q3 (Opción A del exploration): en `computeAuditSignals`, campo `q3: Q3Candidate[]` = identidad con ≥2 filas Y ≥1 fila con `isGraduatedStatus(estado)`; cada candidato muestra identidad, N filas, rutas, estados (marcando egresado), fechas; etiqueta "candidato" + caveat AUD-12. El callout AUD-10 se reemplaza por esta tarjeta, conservando la nota de limitación como info bajo la tarjeta.
- Specs/tests: delta `auditoria-datos` (AUD-10/12/13), unit specs Q3, specs del board (open/close modal).

**Out of Scope**
- No fabricar `fechaEgreso` ni historial upstream; no afirmar doble egreso (no hay cómo datarlo).
- Sin paginación/virtualización (follow-up de performance, ya anotado en archive).
- Tarjeta Centinelas sigue count-only (no lista, no "Ver más").
- Sin cambios de rutas, layout, filtros ni `computeIndicators`.

## Capabilities

**New** — None.
**Modified** — `auditoria-datos`: ADDED AUD-13 (modal "Ver más" + límite 15 por lista); MODIFIED AUD-10 (callout → tarjeta candidata Q3 con nota de limitación); MODIFIED AUD-12 (etiquetado "candidato" extendido a Q3).

## Key Decisions & Assumptions

- `VER_MAS_LIMIT = 15` (límite visible; la lista completa vive solo en el modal).
- **Un modal genérico único** `components/AuditListModal.tsx` con props `{ title, icon, tone, count?, onClose, children }`, no un modal por señal: sigue el naming plano de `components/` (`IndicatorModal`, `ParticipantDetailModal`) — el exploration sugirió `components/auditoria/`, pero ese subdirectorio no existe; flat es la convención. Descartado inline en el board: engordaría `AuditoriaBoard.tsx` (+~100 líneas) y rompería el slicing.
- El modal **cierra ante cambio de filtro** (guard de lista stale vía `useEffect` sobre `filteredData`).
- Overlap Q3 ↔ Q1/Q2 esperado y aceptable: distinta pregunta, las etiquetas desambiguan.
- ND Cédula full list puede ser enorme (~29,5k filas al 42% de 70.283): render en un solo scroll viable; follow-up de paginación anotado.
- Vocabulario: el modal lista **valores distintos** (no filas), consistente con la tarjeta.
- Idioma: español neutral (convención del repo).

## Approach

Sin cambios de datos para el modal. En el board: `VER_MAS_LIMIT = 15`, un estado `modalSignal` (o derivado) por tarjeta, botón "Ver más" condicional (`list.length > VER_MAS_LIMIT`), y `AuditListModal` renderizado inline (sin portal, `z-50`, receta IndicatorModal + a11y de ParticipantDetailModal); el contenido de cada modal es la misma lista sin `.slice()`. Q3: dentro de `computeAuditSignals`, una pasada sobre el `groups` existente (identidad con ≥2 filas y ≥1 `isGraduatedStatus`) → `q3`; función pura → unit-testable, respeta filtros automáticamente. Reutiliza `isGraduatedStatus` de `utils/normalize.ts` (ya importa `isNotAvailable` desde allí).

## Affected Areas

| Área | Impacto | Descripción |
|------|---------|-------------|
| `utils/auditSignals.ts` | Modified | Tipo `Q3Candidate` + campo `q3` + lógica Opción A |
| `utils/auditSignals.spec.ts` | Modified | Unit specs Q3 (candidato, homonimia, filtros) |
| `components/AuditListModal.tsx` | New | Modal genérico de lista (receta overlay) |
| `pages/indicadores/AuditoriaBoard.tsx` | Modified | `VER_MAS_LIMIT` 15, botón Ver más, estado + contenido del modal, tarjeta Q3 |
| `pages/indicadores/AuditoriaBoard.spec.tsx` | Modified | Open/close modal, cierre por filtro, tarjeta Q3 |
| `openspec/specs/auditoria-datos/spec.md` | Modified | Delta AUD-10/12/13 (vía archive) |

## Risks

| Riesgo | Prob. | Mitigación |
|--------|-------|------------|
| ND Cédula ~29,5k filas en modal (render pesado) | Med | Scroll único viable; follow-up paginación/virtualización |
| Overlap Q3 ↔ Q1/Q2 confunde al lector | Med | Etiquetas "candidato" + caveats distintos por pregunta |
| Modal stale al cambiar filtros | Med | Cierre automático ante cambio de `filteredData` |
| Slice S2 borderline al presupuesto 400 | Med | auto-chain: split S2a/S2b si excede |
| Vitest worker crash en Windows (infra conocida) | Med | Gates enfocados por archivo |

## Rollback Plan

`git revert` de los commits del change: revertir `utils/auditSignals.ts`, `pages/indicadores/AuditoriaBoard.tsx` y borrar `components/AuditListModal.tsx`. Sin datos persistidos ni rutas nuevas — reversión limpia.

## Dependencies

Ninguna externa. `isGraduatedStatus` ya existe en `utils/normalize.ts`; fixtures de identidades repetidas de `auditoria-datos` reutilizables para Q3.

## Success Criteria

- [ ] Cada tarjeta con lista muestra ≤15 filas y "Ver más" solo cuando hay más
- [ ] El modal abre la lista completa; cierra por backdrop/Esc/X y ante cambio de filtro
- [ ] Q3 lista candidatos (≥2 filas + estado egresado) con etiqueta y caveat; sin afirmación de doble egreso
- [ ] `tsc --noEmit` OK y gates de specs pasan

## Delivery

`delivery_strategy: auto-chain`; `chain_strategy: feature-branch-chain`; `review_budget_lines: 400`. Slices (~530–630 total, cada una < 400):
- **S1 (~100–120)**: heurística Q3 en `auditSignals.ts` + unit specs (lógica pura).
- **S2 (~310–360)**: `AuditListModal.tsx` + `VER_MAS_LIMIT` 15 + "Ver más" en las 7 tarjetas + estados/cierre del modal + specs board. Si excede 400 → S2a tarjetas candidatas (dup/Q1/Q2) / S2b resto.
- **S3 (~120–150)**: tarjeta Q3 en board (reemplaza callout) + nota de limitación + specs board.

## Open Questions

1. ¿El callout AUD-10 desaparece por completo o queda la frase "no respondible sin fecha de egreso" como nota bajo la tarjeta Q3? Supuesto: se conserva como nota info (la heurística no confirma el egreso).
2. ¿Scroll lock del body + foco en botón de cierre en el modal? Supuesto: ambos (receta IndicatorModal + ParticipantDetailModal).
3. ¿Orden de filas en el modal? Supuesto: mismo orden que la tarjeta (orden natural de las arrays).
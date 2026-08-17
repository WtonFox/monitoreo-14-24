# Tasks: Auditoría — límite visible 15, modal "Ver más" y heurística Q3

## Review Workload Forecast

```
Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: Medium
```

| Campo | Valor |
|-------|-------|
| Líneas de cambio estimadas | ~530–630 (S1 ~100–120 · S2 ~300–360 · S3 ~120–150) |
| Riesgo >400 líneas por slice | Ningún slice >400; S2 bordea 300–360 (plan B: S2a dup/Q1/Q2 / S2b resto) |
| PR encadenados | Sí — 3 slices (S1/S2/S3) |
| Delivery strategy | `auto-chain` |
| Chain strategy | `feature-branch-chain` (PR1→tracker, PR2→PR1, PR3→PR2) |

### Suggested Work Units

| WU | Contenido | PR | Test enfocado | Runtime harness | Rollback boundary |
|----|-----------|----|---------------|-----------------|-------------------|
| 1 | Heurística Q3 en `auditSignals.ts` + unit specs | PR 1 (S1) | `npx vitest run --project unit utils/auditSignals.spec.ts` | N/A — lógica pura; `npm run typecheck` | Revertir `auditSignals.ts` + spec |
| 2 | `AuditListModal.tsx` + límite 15 + "Ver más" en 7 tarjetas + estado/cierre + specs board | PR 2 (S2) | `npx vitest run --project integration pages/indicadores/AuditoriaBoard.spec.tsx` | N/A — jsdom; si excede 400 → S2a/S2b | Revertir board; `git rm AuditListModal.tsx` |
| 3 | Tarjeta Q3 (reemplaza callout) + `caveatText` + nota + specs Q3 | PR 3 (S3) | `npx vitest run --project integration pages/indicadores/AuditoriaBoard.spec.tsx` | N/A — jsdom | Revertir ediciones board |

## Phase 1: S1 — Heurística Q3 (PR 1)

- [ ] 1.1 `utils/auditSignals.ts`: importar `isGraduatedStatus` de `./normalize`; definir `export interface Q3Candidate { identity; rows; rutas; estados; fechas; cedulaConfirmada? }`; añadir `q3: Q3Candidate[]` a `AuditSignals`. Gate: `npm run typecheck`.
- [ ] 1.2 En el loop de `groups` de `computeAuditSignals`: rama Q3 **independiente** — `rows.length >= 2 && rows.some(isGraduatedStatus)` → push candidato con `rutas` (reutiliza `routes`), `estados`/`fechas` mapeando `rows` en orden, `cedulaConfirmada: hasConfirmedCedula(rows)`. NO cambiar semántica Q1/Q2/duplicados. Gate: `npm run typecheck`.
- [ ] 1.3 Unit specs `utils/auditSignals.spec.ts` (describe Q3 AUD-10): (1) 2 filas + 1 "Egresado pasantía" → 1 candidato con identity/rows/rutas/estados/fechas; (2) 2 filas sin egresado → vacío; (3) 1 fila egresado → vacío (≥2); (4) 1 fila sin egresado → vacío; (5) overlap 2 rutas + egresado → en q1 Y q3; (6) misma ruta fechas distantes + egresado → q2 Y q3; (7) `estados` mapea `rows` en orden; (8) corruptos → q3=0. Fixture `row()`. Gate: `npx vitest run --project unit utils/auditSignals.spec.ts`.

## Phase 2: S2 — Modal + límite 15 (PR 2)

- [ ] 2.1 Crear `components/AuditListModal.tsx` (flat): props `{ title, icon, tone, count?, caveat?, onClose, children }`; overlay `fixed inset-0 z-50`, backdrop `e.target === e.currentTarget`, `max-h-[85vh] overflow-y-auto`, Esc keydown mount/unmount, scroll-lock body, `role="dialog"` `aria-modal`, foco botón cerrar. Gate: `npm run typecheck`.
- [ ] 2.2 Crear `components/AuditListModal.spec.tsx` (integration): renderiza title/count/children; cierra por backdrop, `fireEvent.keyDown(window,{key:'Escape'})`, botón X; restaura scroll-lock. Gate: `npx vitest run --project integration components/AuditListModal.spec.tsx`.
- [ ] 2.3 `AuditoriaBoard.tsx`: renombrar `LIST_LIMIT=50` → `export const VER_MAS_LIMIT=15`; estado `openModal: 'duplicados'|'q1'|'q2'|'nd'|'anomalias'|'vocabulario'|'corruptos'|'q3'|null` + `useEffect(()=>setOpenModal(null),[filteredData])` ANTES de early-returns (líneas 113–119); componente `VerMasButton`. Gate: `npm run typecheck`.
- [ ] 2.4 Editar 7 tarjetas con lista: `slice(0, VER_MAS_LIMIT)` + botón "Ver más" solo si `list.length > VER_MAS_LIMIT` (duplicados/q1/q2/ndCedula/anomalias/vocabulario/corruptos). Corruptos: sin modal si `items` vacío con count>0 (AD-8). Gate: `npm run typecheck`.
- [ ] 2.5 Bloque de render del modal: `MODAL_META` (title/icon/tone/count/caveat por señal) + switch que arma `children` con lista COMPLETA sin `.slice()` (AD-2); helper `flattenAnomalias()` (merge 4 sub-checks); footer caveat para dup/q1/q2. Gate: `npm run typecheck`.
- [ ] 2.6 Extensions `AuditoriaBoard.spec.tsx` (AUD-13): (a) 15 filas ND → sin botón; (b) 16 filas ND → botón + modal con 16 (fila 16 no visible en tarjeta, sí en modal) + título + count; (c) cierre Esc/backdrop; (d) rerender `filteredData` nueva → modal desmonta (`waitFor`). Gate: `npx vitest run --project integration pages/indicadores/AuditoriaBoard.spec.tsx`.

## Phase 3: S3 — Tarjeta Q3 + caveatText (PR 3)

- [ ] 3.1 `SignalCard` gana prop `caveatText?: string` (default `CANDIDATE_CAVEAT`); `AuditListModal` gana `caveat?: React.ReactNode` como footer (AUD-12). Gate: `npm run typecheck`.
- [ ] 3.2 Reemplazar callout Q3 (líneas 452–463) por SignalCard Q3: badge "candidatos", caveat Q3 propio (homonimia + "sin `fechaEgreso` no se confirma un egreso repetido"), lista `slice(VER_MAS_LIMIT)`, botón "Ver más" → `setOpenModal('q3')`; nota `<p>` hermano conservando EXACTO "no respondible sin fecha de egreso" (AD-7). Gate: `npm run typecheck`.
- [ ] 3.3 Modal q3: children con `personName(rows)` + "N filas", `Rutas`, `estados` (egresado `isGraduatedStatus` → `text-emerald-600 font-semibold`), `Fechas`; footer caveat Q3. Gate: `npm run typecheck`.
- [ ] 3.4 `AuditoriaBoard.spec.tsx`: mantener test AUD-10 existente pasando (frase preservada); nuevo test — fixture con fila egresado → tarjeta Q3 lista candidato + nota "no respondible sin fecha de egreso" + caveat Q3. Gate: `npx vitest run --project integration pages/indicadores/AuditoriaBoard.spec.tsx`.

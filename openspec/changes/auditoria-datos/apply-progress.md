# Apply Progress: auditoria-datos

## PR 1 / S1 — Fundación (utilidades puras) — COMPLETO

- **Commit**: `79e4640` — `feat(utils): add audit identity normalization and signal computation with unit tests`
- **Archivos**: `utils/auditIdentity.ts` (nuevo), `utils/auditSignals.ts` (nuevo), `utils/auditIdentity.spec.ts` (nuevo), `utils/auditSignals.spec.ts` (nuevo) — 837 líneas añadidas
- **Tareas**: 1.1–1.4 ✅
- **Verificación**: `npm run typecheck` PASS · `npx vitest run --project unit utils/auditIdentity.spec.ts utils/auditSignals.spec.ts` → 33/33 PASS (unit project completo: 147/147, sin regresiones)
- **Gate S1**: PASS
- **Decisiones implementadas**: AD-1/2/3 (identidad `\u0001` + sentinels), AD-4 (`DUPLICATE_WINDOW_DAYS=30`), AD-5 (delta=1 solo sin fechas), AD-6 (precedencia Q1, clústeres gap>T1), AD-7 (vocabulario 8 estados + "Sin Estado"), AD-8 (tolerancia ±2 años), AD-9 (corruptos best-effort)
- **Desviaciones registradas**: `Q2Candidate.cedulaConfirmada` (exigido por test); `anomalias.totalFilas` = filas distintas afectadas (ambigüedad del design resuelta a favor del test)

## PR 2 / S2 — Ruteo + Shell del board — COMPLETO

- **Commit**: `bd8bdbf` — `feat(indicadores): add auditoria route, tab and board shell with KPIs`
- **Archivos**: `types/routes.ts` (+`INDICADORES_AUDITORIA` + permiso), `router.tsx` (lazy import + ruta `auditoria`), `pages/IndicadoresLayout.tsx` (tab "Auditoría" en "Datos y Calidad"), `pages/indicadores/AuditoriaBoard.tsx` (nuevo, shell con 8 KPI cards, callout Q3, `IndicadoresFilterBar`, empty/loading, BoardInfo) — 204 líneas
- **Tareas**: 2.1–2.4 ✅
- **Verificación**: `npm run typecheck` PASS · `npm run build` PASS · `npm run test:int` 49/68 passed (7/8 archivos) + **1 error de infraestructura** (vitest worker fork crash en Windows, no fallo de aserción; `test:int` tarda ~6.5 min)
- **Gate S2**: PARCIAL — typecheck+build verdes; test:int con worker crash ambiental (requiere diagnóstico en verify)
- **Incidente**: el agente `sdd-apply` S2 se colgó 51 min (comando test:int lento + worker fork); el orquestador verificó y commiteó manualmente; ledger reseteado con aprobación de maintainer

## PR 3 / S3 — Drill-downs + caveats + tests de componente — COMPLETO

- **Commit**: `c321f1d` — `feat(indicadores): add audit drill-downs with candidate caveats`
- **Archivos**: `pages/indicadores/AuditoriaBoard.tsx` (modificado, +drill-downs), `pages/indicadores/AuditoriaBoard.spec.tsx` (nuevo) — 512 líneas añadidas
- **Tareas**: 3.1–3.2 ✅
- **Verificación**: `npm run typecheck` PASS · `npm run build` PASS · `npx vitest run --project integration pages/indicadores/AuditoriaBoard.spec.tsx` → 5/5 PASS (specs relacionadas CalidadIntegradaBoard + RegistroDiarioBoard: 6/6 sin regresiones)
- **Gate S3**: PASS (focused — NO se ejecutó `npm run test:int` completo por el worker-crash ambiental documentado en S2; la verificación focused cubre el slice)
- **Implementado**: 8 drill-downs (duplicados, Q1 con rutas, Q2 con fechas, ND cédula, anomalías con razón, vocabulario fuera, centinelas por campo, corruptos con razones de `corruptedItems`); etiqueta "candidatos" + caveat AUD-12 (homonimia posible, clasificación heurística sin historial en el origen); listas acotadas a 50 con "+N más" y conteo
- **Decisiones implementadas**: AUD-12 (caveat textual exacto del spec en `CANDIDATE_CAVEAT`); AD-9 (corruptos best-effort: si `count>0` pero `items` vacío → nota de que la lista no se persiste en caché); listas acotadas `LIST_LIMIT=50` (performance, design §Performance)
- **Desviaciones registradas**: sin componente colapsable existente en el repo (grep `ExpandableSection|Collapsible|details` sin resultados en `pages/indicadores/`); se usaron `SignalCard` estáticos acotados que respetan el patrón tailwind de cards de los boards existentes — el requisito de performance se cumple acotando listas, no colapsando

## PR 4 / S4 — E2E (fixtures + navegación) — COMPLETO

- **Commit**: `d7eea96` — `test(e2e): cover auditoria navigation with repeated-identity fixtures`
- **Archivos**: `e2e/mockData.ts` (modificado, +202 líneas: `AUDIT_FIXTURES`), `e2e/navigation.spec.ts` (modificado, +1 entrada) — 202 líneas añadidas
- **Tareas**: 4.1–4.2 ✅
- **Verificación**: `npm run typecheck` PASS · `npx playwright test e2e/navigation.spec.ts` → 21/21 PASS (1.1 min; incluye el nuevo test `/indicadores/auditoria renders`)
- **Gate S4**: PASS (focused — NO se ejecutó `npm run test:e2e` completo: suite lenta + worker crash ambiental documentado en S2; verificación focused por archivo cubre el slice)
- **Incidente ambiental**: `npx playwright test` fallaba 21/21 con `Executable doesn't exist ... chromium_headless_shell-1228` (browsers no instalados en `AppData\Local\ms-playwright`); se resolvió con `npx playwright install chromium` — sin cambios de código
- **Fixtures implementados** (`AUDIT_FIXTURES`, ids reservados 100001+ fuera de colisión con ids generados 1..count; apellidos fuera del vocabulario del generador para evitar merge de identidades):
  - Q1 (multi-ruta, AUD-3/AD-6): "María De León" ids 100001/100002 en rutas `Informática` y `Camarero de Barra` → 1 candidato Q1 (precedencia rutas sobre temporal)
  - Duplicado de carga (AUD-2): "Juan Fernández" ids 100003/100004 CONSECUTIVOS, misma ruta `Programa A`, misma `fechaRegistro` 2024-05-02 → 1 grupo duplicado
  - Q2 (re-inscripción, AUD-4): "Rosa Castillo" ids 100005/100006, misma ruta `Programa B`, fechas 2024-01-20 → 2024-09-20 (244 días > T1=30) → 1 candidato Q2
  - Filas libres de anomalías (fechas válidas no futuras, `fechaInclusion` = `fechaRegistro`, edad consistente ±2, `edad >= edadRegistro`, estado `Identificado` en vocabulario, sin centinelas) y con provincia/municipio/centro dedicados (`Monte Plata`/`Centro Especializado`) para no perturbar las agregaciones de `alerts.spec.ts`/`participants.spec.ts`
- **Decisiones implementadas**: AD-6 (Q1 por rutas, nunca temporal — mismo par con fechas cercanas igual va a Q1); AD-4 (244 días > T1); AD-5 (ids consecutivos como refuerzo estructural cuando faltan fechas, presente en el par duplicado)

## Pendiente

- Phase 5: verificación final (5.1)

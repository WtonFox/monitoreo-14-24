# Tasks: Auditoría de Datos (AuditoriaBoard)

## Review Workload Forecast

```
Decision needed before apply: Yes (resuelto: auto-chain + feature-branch-chain)
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: Medium
```

| Campo | Valor |
|-------|-------|
| Líneas de cambio estimadas | ~940 (S1 ~270 · S2 ~300 · S3 ~220 · S4 ~150) |
| Riesgo >400 líneas por slice | Ningún slice supera 400; S2 es el de mayor riesgo de creep |
| PR encadenados | Sí — 4 slices (S1–S4 del design) |
| Delivery strategy | `auto-chain` (re-colectado por dominio canónico; la opción previa `force-chained` era inválida) |
| Chain strategy | `feature-branch-chain` (PR #1 a la rama tracker; hijos al PR previo; solo la tracker mergea a main) |

> **Ajuste al design**: el ruteo (`types/routes.ts` + `router.tsx` + `IndicadoresLayout.tsx`) se movió de S1 a S2 para que cada PR quede compilable — el lazy import de `AuditoriaBoard` debe aterrizar en el mismo PR que crea el archivo. S1 queda como lógica pura + specs unit, autocontenido. Estimaciones del design ajustadas en consecuencia.

### Work Units (PR mapping)

| WU | Contenido | PR | Test enfocado | Runtime harness | Rollback boundary |
|----|-----------|----|---------------|-----------------|-------------------|
| 1 | `auditIdentity.ts` + `auditSignals.ts` + specs unit | PR 1 (S1) | `npx vitest run --project unit utils/auditIdentity.spec.ts utils/auditSignals.spec.ts` | N/A — lógica pura sin boundary de runtime; `npm run typecheck` cubre integración | Borrar `utils/auditIdentity.ts`, `utils/auditSignals.ts` y sus specs |
| 2 | Ruteo (routes/router/layout) + shell `AuditoriaBoard` + KPIs + callout Q3 + empty/loading | PR 2 (S2) | `npm run test:int` (smoke) | `npm run dev` → `#/indicadores/auditoria` | Revertir routes/router/layout; borrar `pages/indicadores/AuditoriaBoard.tsx` |
| 3 | Drill-downs + caveats (AUD-12) + `AuditoriaBoard.spec.tsx` | PR 3 (S3) | `npx vitest run --project integration pages/indicadores/AuditoriaBoard.spec.tsx` | `npm run dev` → `#/indicadores/auditoria` (expandir drill-downs) | Revertir ediciones de `AuditoriaBoard.tsx`; borrar spec |
| 4 | `e2e/mockData.ts` + `e2e/navigation.spec.ts` | PR 4 (S4) | `npx playwright test e2e/navigation.spec.ts` | `npm run test:e2e` (suite completa) | Revertir `e2e/mockData.ts` y `e2e/navigation.spec.ts` |

Commits sugeridos (conventional commits, inglés, tests/docs con el código): `feat(utils): add audit identity normalization and signal computation with unit tests` · `feat(indicadores): add auditoria route, tab and board shell with KPIs` · `feat(indicadores): add audit drill-downs with candidate caveats` · `test(e2e): cover auditoria navigation with repeated-identity fixtures`.

## Phase 1: Fundación — Utilidades puras (S1 / PR 1)

- [x] 1.1 Crear `normalizeNamePart` (trim→lower→NFD→sin marcas `[\u0300-\u036f]`→sin espacios internos), `normalizeIdentity` con separador `\u0001` (null si sentinel), `normalizeCedula` (solo dígitos; ''→null), `isSentinelIdentity`, `SENTINEL_WORDS` — `utils/auditIdentity.ts` (AUD-0, AD-1, AD-2, AD-3) — verificado: `npm run typecheck`
- [x] 1.2 Unit tests: "María De León" ≡ "maria de leon"; anti-colisión "Maria De"+"Leon" ≠ "Maria"+"De Leon"; `'001-0000001-1'` ≡ `'00100000011'`; `'N/D'` → null sin excluir del matching por nombre; sentinel → null — `utils/auditIdentity.spec.ts` (AUD-0) — verificado: `npx vitest run --project unit utils/auditIdentity.spec.ts`
- [x] 1.3 Crear `computeAuditSignals(filteredData, corruptedItems, syncStats)`: 1 pasada `Map<identidad, filas[]>` excluyendo corruptos y sentinelas; clasificación AD-4/5/6 (`DUPLICATE_WINDOW_DAYS=30`; `|idA−idB|===1` solo sin fechas parseables; ≥2 rutas → Q1 precedencia, clústeres gap>T1 → dup/Q2, mixto = 1 dup + 1 Q2); ND cédula count+% (AUD-5); 4 sub-checks anomalías ±2 años (AD-8); vocabulario AD-7 (8 estados + "Sin Estado", case-insensitive); centinelas vía `NA_VALUES`/`isNotAvailable` (AUD-8); corruptos `syncStats.corrupted` + `corruptedItems` (AD-9). Tipos `AuditSignals`/`DuplicateGroup`/`Q1Candidate`/`Q2Candidate`, const `AGE_MISMATCH_TOLERANCE_YEARS=2` — `utils/auditSignals.ts` (AUD-2..AUD-9, AD-4..AD-9) — verificado: `npm run typecheck`
- [x] 1.4 Unit tests por señal: ids 1001/1002 fechas iguales → 1 dup; 8 meses → Q2; 14 meses → NO duplicado; mixto 3 filas → 1 dup + 1 Q2; homónimos rutas distintas → Q1 `cedulaConfirmada=false`; ND 840/2000 → `42.0%`; fecha no parseable NO cuenta en anomalías; "En proceso" count 5; 12 `Sin Centro`; corruptos 3 + razones — `utils/auditSignals.spec.ts` (AUD-2..AUD-9, AD-4..AD-9) — verificado: `npx vitest run --project unit utils/auditSignals.spec.ts`

Gate S1: `npm run typecheck && npm run test:unit` — **PASS** (commit `79e4640`)

## Phase 2: Ruteo + Shell del board (S2 / PR 2)

- [x] 2.1 Agregar `INDICADORES_AUDITORIA: '/indicadores/auditoria'` + entrada en `ROUTE_PERMISSIONS` con los roles de `/indicadores` — `types/routes.ts` (AUD-1) — verificado: `npm run typecheck`
- [x] 2.2 Lazy import `AuditoriaBoard` + ruta `auditoria` con `Suspense fallback={<LoadingSkeleton variant="board" />}` — `router.tsx` (AUD-1) — verificado: `npm run typecheck && npm run build`
- [x] 2.3 Item `{ to: ROUTES.INDICADORES_AUDITORIA, label: 'Auditoría', icon: CheckCircle }` en el grupo "Datos y Calidad" de `TAB_GROUPS` (junto a "Calidad del Dato") — `pages/IndicadoresLayout.tsx` (AUD-1) — verificado: `npm run typecheck`
- [x] 2.4 Crear `AuditoriaBoard.tsx` (shell): BoardShell; `useMemo(computeAuditSignals)` sobre `filteredData` de `useIndicadoresFilters()` + `corruptedItems`/`syncStats` de `useParticipantStore`; KPIs ×8; `IndicadoresFilterBar showYear showProvince showMunicipio showSex={false} noContainer`; callout Q3 "no respondible sin fecha de egreso"; loading (`isSyncing` → BoardShell loading) y empty (`filteredData` vacío → "Sin datos"); BoardInfo. Sin drill-downs (Phase 3) — `pages/indicadores/AuditoriaBoard.tsx` (nuevo) (AUD-1, AUD-10, AUD-11) — verificado: `npm run build` + `npm run test:int` (smoke, 49/68 + worker crash infra)

Gate S2: `npm run build && npm run test:int` — **PARCIAL** (build PASS; test:int worker crash ambiental — verificar en sdd-verify; commit `bd8bdbf`)

## Phase 3: Drill-downs + caveats + tests de componente (S3 / PR 3)

- [x] 3.1 En `AuditoriaBoard.tsx`: drill-downs de las 8 señales (duplicados; Q1 con rutas; Q2 con fechas; ND cédula con lista; anomalías; vocabulario; centinelas; corruptos con razones de `corruptedItems`) etiquetados "candidatos" + caveat visible (homonimia posible, clasificación heurística sin historial en el origen) — `pages/indicadores/AuditoriaBoard.tsx` (AUD-2..AUD-9, AUD-12, AD-9) — verificado: `npm run build` PASS
- [x] 3.2 Tests de componente (mock `useIndicadoresFilters` + `useParticipantStore`, patrón `RegistroDiarioBoard.spec.tsx`): KPIs renderizan; callout Q3 visible; etiqueta "candidatos" + caveat (AUD-12); empty → "Sin datos"; loading → estado de carga del shell — `pages/indicadores/AuditoriaBoard.spec.tsx` (nuevo) (AUD-1, AUD-10, AUD-12) — verificado: `npx vitest run --project integration pages/indicadores/AuditoriaBoard.spec.tsx` → 5/5 PASS

Gate S3: `npm run typecheck && npm run build && npx vitest run --project integration pages/indicadores/AuditoriaBoard.spec.tsx` — **PASS** (commit `c321f1d`)

## Phase 4: E2E (S4 / PR 4)

- [x] 4.1 Fixtures fijos con identidades repetidas en `generateParticipants`: misma persona en 2 rutas (Q1); par duplicado de carga con ids consecutivos; par a 8 meses (Q2) — `e2e/mockData.ts` (AUD-2, AUD-3, AUD-4) — verificado: `npm run typecheck`
- [x] 4.2 Entrada `{ hash: '/indicadores/auditoria', title: 'Auditoría' }` (navegación + visibilidad del board) — `e2e/navigation.spec.ts` (AUD-1) — verificado: `npx playwright test e2e/navigation.spec.ts`

Gate S4: `npm run test:e2e` — **PASS (focused)**: typecheck PASS + `npx playwright test e2e/navigation.spec.ts` → 21/21 PASS (incl. `/indicadores/auditoria`); NO se ejecutó la suite completa por el worker-crash ambiental documentado en S2 (commit `d7eea96`)

## Phase 5: Verificación final

- [x] 5.1 Gate completo: typecheck + build + lint + unit + integration + e2e — todas — verificado (focused, sdd-verify): `npm run typecheck` PASS · `npm run build` PASS · lint: repo-wide red PRE-EXISTENTE (0 hallazgos nuevos en archivos de esta change) · `npx vitest run --project unit utils/auditIdentity.spec.ts utils/auditSignals.spec.ts` → 33/33 PASS · `npx vitest run --project integration pages/indicadores/AuditoriaBoard.spec.tsx` → 5/5 PASS · `npx playwright test e2e/navigation.spec.ts` → 21/21 PASS (incl. `/indicadores/auditoria`). Suites completas no ejecutables por worker-crash ambiental de vitest en Windows (ver verify-report). Verdict: PASS WITH WARNINGS.

## Ejecución

Orden por dependencia: S1 → S2 → S3 → S4 (cada PR se basa sobre el anterior; el diff de cada slice debe mostrar solo su trabajo). Sin RED tests: threat matrix N/A y `strict_tdd: false` en `openspec/config.yaml`. Rollback global: quitar ruta + tab + `AuditoriaBoard.tsx`; IDs 1–83 de `computeIndicators` intactos (nada toca `indicator-computations.ts` ni `routeBoardMap`).

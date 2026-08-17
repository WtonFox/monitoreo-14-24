```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:837df2f8ffb5d576a36b52c329cdc0aeb513bf426d73b17ae60bbcdaae1e5d32
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 13/13
scenarios: 29/29
test_command: npx vitest run --project unit utils/auditIdentity.spec.ts utils/auditSignals.spec.ts && npx vitest run --project integration pages/indicadores/AuditoriaBoard.spec.tsx && npx playwright test e2e/navigation.spec.ts
test_exit_code: 0
test_output_hash: sha256:442989d49d632d805232751dc24562c144257a69a07133c262904209ab6a130d
build_command: npm run typecheck && npm run build
build_exit_code: 0
build_output_hash: sha256:fb0e59a25a4663e68d14a6a29fa711bfcffd7d69d8c0ba3c52c076cfd6090b53
```

## Verification Report

**Change**: auditoria-datos
**Version**: N/A
**Mode**: Standard (strict_tdd: false per openspec/config.yaml)

### Post-Merge Refresh (2026-08-17)

- **HEAD**: `4bd1a6a6bd8edb7764f7eb099fd2999a78266d79` — "Merge pull request #15 from WtonFox/feature/auditoria-datos" (branch `main`, working tree clean, `git status --porcelain` empty).
- **What changed since the original verify**: only git history — PR #15 merged the feature branch into `main`. No implementation files changed; the merged tree is byte-identical for this change's files to the originally verified state.
- **Gates re-run against merged HEAD** (focused only, per the S2 vitest worker-crash environmental constraint):
  - `npm run typecheck` → **exit 0** (`tsc --noEmit`, clean)
  - `npm run build` → **exit 0** (vite v8.1.4 · 2704 modules transformed · built in 16.08s · PWA precache 40 entries)
  - `npx vitest run --project unit utils/auditIdentity.spec.ts utils/auditSignals.spec.ts` → **33/33 PASS** (1.40s)
  - `npx vitest run --project integration pages/indicadores/AuditoriaBoard.spec.tsx` → **5/5 PASS** (31.50s)
  - `npx playwright test e2e/navigation.spec.ts` → **21/21 PASS** (1.2m, incl. "/indicadores/auditoria renders")
- **Fresh evidence revision**: `sha256:837df2f8ffb5d576a36b52c329cdc0aeb513bf426d73b17ae60bbcdaae1e5d32` computed as SHA-256 (UTF-8, LF) over `HEAD commit + test_exit_code + test_output_hash + build_exit_code + build_output_hash`, with the output hashes below taken from the exact captured bytes of the re-run gates.
- **Conclusion**: verification evidence refreshed against the merged HEAD; implementation unchanged (only history advanced via merge); the prior findings and verdict stand.

### Completeness
| Metric | Value |
|--------|-------|
| Tasks total | 14 (1.1–1.4, 2.1–2.4, 3.1–3.2, 4.1–4.2, 5.1) |
| Tasks complete | 14 (5.1 marked by the original verify phase) |
| Tasks incomplete | 0 |

### Build & Tests Execution (re-run @ merged HEAD 4bd1a6a)

**Type Check**: ✅ Passed (exit 0)
```text
> tsc --noEmit
(no output — clean)
```

**Build**: ✅ Passed (exit 0, 16.08s)
```text
> vite build
✓ 2704 modules transformed.
dist/assets/AuditoriaBoard-qgSZm_yX.js  16.47 kB │ gzip: 4.80 kB
✓ built in 16.08s
PWA v1.3.0 — mode generateSW — precache 40 entries (3473.09 KiB)
dist/sw.js, dist/workbox-9c191d2f.js generated
```

**Tests (focused gates, per the S2 worker-crash environmental constraint)**:
```text
unit:         npx vitest run --project unit utils/auditIdentity.spec.ts utils/auditSignals.spec.ts
              Test Files 2 passed (2) · Tests 33 passed (33) · Duration 1.40s
integration:  npx vitest run --project integration pages/indicadores/AuditoriaBoard.spec.tsx
              Test Files 1 passed (1) · Tests 5 passed (5) · Duration 31.50s
e2e:          npx playwright test e2e/navigation.spec.ts
              21 passed (1.2m) — incl. "/indicadores/auditoria renders"
```
All three focused test commands exited 0 on the merged HEAD. The full suites (`test:unit`, `test:int`, `test:e2e`) are NOT runnable reliably on this Windows machine (vitest worker fork crash `Worker exited unexpectedly`, 6+ min suites) — documented in S2; the focused runs above are the valid substitute evidence.

**Lint**: ⚠️ Red repo-wide, pre-existing — NOT attributable to this change
```text
npm run lint → oxlint exits 1 (~100 findings across the repo) → prettier --check never runs.
Scoped oxlint on the 11 change-touched files: only 4 findings, all on PRE-EXISTING lines
(router.tsx:25/34 unused CalidadDatoBoard/CalidadNdBoard lazy imports; IndicadoresLayout.tsx:190
dropdown backdrop) — none in files created by this change.
Prettier --check fails on untouched files too (utils/normalize.ts, App.tsx, BoardShell.tsx,
useDashboardData.ts): repo convention is 4-space indent vs .prettierrc default (no tabWidth) 2-space.
```
Zero lint findings introduced by auditoria-datos. The new files (`auditIdentity.ts`, `auditSignals.ts`, both specs, `AuditoriaBoard.tsx`, `AuditoriaBoard.spec.tsx`) are oxlint-clean. (Not re-run in this refresh — applies to the same merged bytes.)

**Coverage**: ➖ Not available (no coverage threshold configured for this change; `test:coverage` not run).

### Spec Compliance Matrix (13 requirements, 29 scenarios)

| Requirement | Scenario | Test | Result |
|-------------|----------|------|--------|
| AUD-0 Identidad normalizada | Variantes ortográficas coinciden | `utils/auditIdentity.spec.ts > normalizeNamePart equivale variantes` | ✅ COMPLIANT |
| AUD-0 | Cédula refuerza sin ser requisito | `utils/auditIdentity.spec.ts > normalizeCedula '001-0000001-1' ≡ '00100000011'` | ✅ COMPLIANT |
| AUD-0 | Sin cédula no excluye del grupo | `utils/auditIdentity.spec.ts > no depende de la cédula` + `utils/auditSignals.spec.ts > fila sin cédula comparte grupo por nombre` | ✅ COMPLIANT |
| AUD-1 Board Auditoría | Navegación al board | `e2e/navigation.spec.ts > /indicadores/auditoria renders` (21/21 PASS @ 4bd1a6a) | ✅ COMPLIANT |
| AUD-1 | Acceso por tab | `IndicadoresLayout.tsx` TAB_GROUPS "Datos y Calidad" item Auditoría (junto a Calidad del Dato) + e2e title "Auditoría" visible | ✅ COMPLIANT (static + e2e) |
| AUD-1 | Dataset vacío | `AuditoriaBoard.spec.tsx > muestra estado vacío "Sin datos"` | ✅ COMPLIANT |
| AUD-1 | Carga en curso | `AuditoriaBoard.spec.tsx > muestra el estado de carga del shell` | ✅ COMPLIANT |
| AUD-2 Duplicados de carga | Pares con ids consecutivos | `auditSignals.spec.ts > ids 1001/1002 fechas iguales → 1 grupo duplicado` + `> ids consecutivos sin fechas → duplicado estructural` | ✅ COMPLIANT |
| AUD-2 | Fechas distantes en misma ruta | `auditSignals.spec.ts > fechas separadas 14 meses → NO duplicado (Q2)` | ✅ COMPLIANT |
| AUD-3 Multi-ruta (Q1) | Una persona en dos rutas | `auditSignals.spec.ts > homónimos en rutas distintas → 1 Q1` + `AuditoriaBoard.spec.tsx` rutas render | ✅ COMPLIANT |
| AUD-3 | Homónimos reales | `auditSignals.spec.ts > cedulaConfirmada=false` + `AuditoriaBoard.spec.tsx > caveat homonimia visible` | ✅ COMPLIANT |
| AUD-4 Re-inscripción (Q2) | Re-inscripción en misma ruta | `auditSignals.spec.ts > 8 meses → 1 Q2 con fechas` | ✅ COMPLIANT |
| AUD-4 | Grupo mixto por cercanía | `auditSignals.spec.ts > mixto 3 filas → 1 dup + 1 Q2` | ✅ COMPLIANT |
| AUD-5 ND cédula | Muestra con 42% | `auditSignals.spec.ts > 840/2000 → count 840 y 42.0%` | ✅ COMPLIANT |
| AUD-5 | Universo sin ND | `auditSignals.spec.ts > 0 y 0.0% con lista vacía` | ✅ COMPLIANT |
| AUD-6 Anomalías fecha/edad | Fecha de nacimiento futura | `auditSignals.spec.ts > 4 sub-checks (futura id 8101)` | ✅ COMPLIANT |
| AUD-6 | Inclusión previa al registro | `auditSignals.spec.ts > 4 sub-checks (inclusionPrevia id 8102)` | ✅ COMPLIANT |
| AUD-6 | Fechas corruptas excluidas | `auditSignals.spec.ts > fecha no parseable NO cuenta como anomalía` | ✅ COMPLIANT |
| AUD-7 Vocabulario de estados | Valor fuera de vocabulario | `auditSignals.spec.ts > "En proceso" count 5, conocido=false` + `AuditoriaBoard.spec.tsx > render` | ✅ COMPLIANT |
| AUD-7 | Vocabulario íntegro | `auditSignals.spec.ts` (conocido=true para Identificado/egresado; fueraVocabulario=0) + `AuditoriaBoard.spec.tsx` fixture sin marcas | ✅ COMPLIANT (UI muestra "Sin datos" en vez de la enumeración completa — nota en Issues) |
| AUD-8 Centinelas | Centinela en centro | `auditSignals.spec.ts > 12 Sin Centro → count 12 campo centro` | ✅ COMPLIANT |
| AUD-8 | Sin centinelas | `auditSignals.spec.ts > un centinela por campo (otros 0)` + throwaway AUDIT_FIXTURES check (todos 0) | ✅ COMPLIANT |
| AUD-9 Corruptos | Sync con corruptos | `auditSignals.spec.ts > corrupted=3 + razones de corruptedItems` | ✅ COMPLIANT |
| AUD-9 | Sin corruptos | `auditSignals.spec.ts > 0 y lista vacía` | ✅ COMPLIANT |
| AUD-10 Callout Q3 | Callout visible | `AuditoriaBoard.spec.tsx > "no respondible sin fecha de egreso"` | ✅ COMPLIANT |
| AUD-11 Filtros globales | Filtro por provincia | `computeAuditSignals` puro sobre `filteredData` de `useIndicadoresFilters()` (unit tests sobre universos arbitrarios) + `IndicadoresFilterBar showProvince` | ✅ COMPLIANT (composición; sin test UI dedicado de filtro — nota en Issues) |
| AUD-11 | Recalculo ante cambio de filtro | `useMemo` con deps `[filteredData, corruptedItems, syncStats]` + `AuditoriaBoard.spec.tsx` re-render con distintos universos | ✅ COMPLIANT |
| AUD-12 Etiquetado de candidatos | Caveat en multi-ruta | `AuditoriaBoard.spec.tsx > "candidatos" + "homonimia" + "sin historial en el origen"` | ✅ COMPLIANT |
| AUD-12 | Caveat en duplicados | Mismo test (CANDIDATE_CAVEAT aplicado a las 3 cards dup/Q1/Q2) | ✅ COMPLIANT |

**Compliance summary**: 29/29 scenarios compliant (13/13 requirements MET)

### Correctness (Static Evidence)
| Requirement | Status | Notes |
|------------|--------|-------|
| AUD-0 normalizeIdentity | ✅ Implemented | `utils/auditIdentity.ts`: `\u0001` separator (AD-1), NFD strip marks + all internal spaces (AD-2), cédula digits-only null-if-empty (AD-3), `isSentinelIdentity` reuses `isMissing`/`isNotAvailable` |
| AUD-1 Route + tab + permissions | ✅ Implemented | `types/routes.ts` `INDICADORES_AUDITORIA` + `ROUTE_PERMISSIONS` (admin/supervisor/consultor); `router.tsx` lazy + Suspense board; `IndicadoresLayout.tsx` tab en "Datos y Calidad" |
| AUD-2/3/4 Classification | ✅ Implemented | `utils/auditSignals.ts` `classifySameRoute`: clústeres gap ≤ T1=30 → duplicados; ids consecutivos solo sin fechas parseables; Q2 = resto; `routes.size ≥ 2 → Q1` (precedencia) |
| AUD-5 ND cédula | ✅ Implemented | count sobre TODO el universo filtrado; pct redondeado a 1 decimal (42.0%) |
| AUD-6 Anomalías | ✅ Implemented | 4 sub-checks solo con fechas parseables; ±2 años tolerancia; `edad < edadRegistro` (ambas > 0) |
| AUD-7 Vocabulario | ✅ Implemented | `AUDIT_STATUS_VOCABULARY` = 8 estados API + "Sin Estado"; case-insensitive; corruptos excluidos |
| AUD-8 Centinelas | ✅ Implemented | `isNotAvailable` por campo (centro/estado/provincia/rutaFormativa) reusando normalize.ts |
| AUD-9 Corruptos | ✅ Implemented | count = `syncStats.corrupted`; items de `corruptedItems`; filas `GENERIC_ERROR`/`CRITICALLY_CORRUPT` excluidas del agrupamiento |
| AUD-10 Q3 callout | ✅ Implemented | Texto "no respondible sin fecha de egreso" + BoardInfo |
| AUD-11 filteredData | ✅ Implemented | Único `useMemo(computeAuditSignals)` sobre `filteredData` de `useIndicadoresFilters()` |
| AUD-12 Candidatos + caveat | ✅ Implemented | `badge="candidatos"` + `CANDIDATE_CAVEAT` en las 3 cards; "posible homonimia" en Q1 sin cédula |

### Coherence (Design)
| Decision | Followed? | Notes |
|----------|-----------|-------|
| AD-1 Clave `\u0001` | ✅ Yes | `normalizeIdentity` = `normalizeNamePart(nombres) + '\u0001' + normalizeNamePart(apellidos)` |
| AD-2 Normalización nombre | ✅ Yes | trim → lower → NFD → quitar `[\u0300-\u036f]` → sin espacios internos |
| AD-3 Cédula solo dígitos | ✅ Yes | `replace(/\D/g,'')`, vacío → null; 'N/D' excluida del matching por cédula, no del nombre |
| AD-4 `DUPLICATE_WINDOW_DAYS = 30` | ✅ Yes | Constante exportada; clústeres con gap ≤ 30 días |
| AD-5 ids consecutivos delta 1 | ✅ Yes | `Math.abs(idA−idB) === 1`, usado SOLO cuando `fechaRegistro` no parsea |
| AD-6 Precedencia Q1 > temporal | ✅ Yes | ≥2 rutas reales → Q1 nunca temporal; mixto = 1 dup + 1 Q2 (unit test 4001/4002/4003) |
| AD-7 Vocabulario 8+1, case-insensitive | ✅ Yes | 9 entradas; comparación `toLowerCase()` |
| AD-8 Tolerancia ±2 años; `edad < edadRegistro` | ✅ Yes | `AGE_MISMATCH_TOLERANCE_YEARS = 2`; sub-checks solo fechas parseables |
| AD-9 Corruptos best-effort | ✅ Yes | count persistido `syncStats.corrupted`; drill-down `corruptedItems` con nota de no-persistencia en caché |

**Design deviations**:
1. ⚠️ **apply-progress S1 note stale**: registró `Q2Candidate.cedulaConfirmada` como desviación, pero el código real NO tiene ese campo — `Q2Candidate` es exactamente `{ identity, ruta, rows, fechas }` como en el design. No hay desviación real.
2. ⚠️ `anomalias.totalFilas` = filas DISTINTAS afectadas (Set de ids) — el design era ambiguo ("totalFilas"); se resolvió a filas distintas, coherente con el hint UI "filas con ≥1 anomalía".
3. ⚠️ S3 size:exception: drill-downs + spec sumaron 512 líneas vs ~220 estimadas (orquestador aceptó vía size:exception; el diff del slice fue solo S3). S1 sumó 837 vs ~300 estimadas. Informativo — sin impacto en compliance.

### Issues Found
**CRITICAL**: None

**WARNING**:
1. **Gate 5.1 lint red repo-wide (pre-existing)** — `npm run lint` (oxlint && prettier --check) falla en todo el repo con ~100 hallazgos en archivos ajenos a este cambio (vite.config.ts, MapFilters, Alertas, Sidebar, etc.) y prettier falla también en archivos intocados (convención 4-space del repo vs default 2-space de .prettierrc). El scoped check sobre los 11 archivos del cambio: solo 4 hallazgos pre-existentes en líneas no añadidas por esta change; los 6 archivos NUEVOS están limpios. No es atribuible a auditoria-datos.
2. **Full test suites no ejecutables** — vitest worker fork crash ambiental en Windows (`Worker exited unexpectedly`), suites de 6+ min. Focalizados (re-run @ 4bd1a6a): unit 33/33, integration 5/5, playwright 21/21 — todos exit 0 (evidencia válida sustituta).

**SUGGESTION**:
1. **LIST_LIMIT=50** — los drill-downs acotan listas a 50 con "+N más" y conteo. Los escenarios AUD-2..AUD-9 piden "listar" sin límite; la capa de datos (`computeAuditSignals`) NO limita (solo la vista). Con 70.283 registros reales y ~51 grupos repetidos en la muestra, 50 cubre el caso real; escalar implicaría paginación/virtualización.
2. **AUD-7 "Vocabulario íntegro"** — cuando todo valor es conocido el drill-down muestra "Sin datos" en vez de la enumeración completa; la señal `vocabulario.valores` sí enumera todo con count y flag `conocido`. Ajuste cosmético si se quiere la enumeración visible.
3. **AUD-11 sin test UI de filtro** — la corrección de filtrado está probada por composición (función pura sobre el universo recibido + unit tests con universos arbitrarios + useMemo), pero no hay un test de componente que simule provincia="Santiago" y verifique counts. Cubrir con un caso en `AuditoriaBoard.spec.tsx` futuro.
4. **Fixtures e2e generan Q1 extra** — con `count=50`, el generador repite identidades en i e i+40 (periodo lcm(10,8)) en rutas distintas → ~10 Q1 candidatos adicionales. Inofensivo para `navigation.spec.ts` (solo verifica título) pero si un test futuro asevera counts exactos sobre el board, usar los 6 `AUDIT_FIXTURES` aislados o ajustar el generador.
5. **`isInvalid` stub** — `normalize.ts` `isInvalid()` retorna siempre false (fuera de scope de esta change); el vocabulario de estados se audita con `AUDIT_STATUS_VOCABULARY`, no con `isInvalid`.

### Verdict
**PASS WITH WARNINGS**
Las 13/13 requirements y 29/29 escenarios están cubiertos con tests pasando en runtime sobre el HEAD mergeado `4bd1a6a` (PR #15): focused unit 33/33, integration 5/5, e2e 21/21; typecheck y build exit 0. Cero hallazgos nuevos de lint; los 4 hallazgos en archivos tocados son pre-existentes. Las advertencias son ambientales/pre-existentes (suites completas no confiables en Windows, lint repo-wide red, LIST_LIMIT=50, isInvalid stub, best-effort de corruptedItems), ninguna rompe un escenario de spec. La implementación no cambió respecto a la verificación original — solo avanzó el historial vía merge. Listo para archive.

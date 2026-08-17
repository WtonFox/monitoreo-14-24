# Exploration: Auditoría y Calidad de Datos (auditoria-datos)

**Verdict up front**: The app CAN answer most *data-quality* audit questions today, but the three *lifecycle* questions (multi-route, repeated enrollment, repeated graduation) are only **partially answerable via cédula-based heuristics** — the data model has no history structure. A dedicated **Auditoría board under `/indicadores`** is the recommended fit; it follows the existing self-contained board pattern (`RegistroDiarioBoard`), needs no data-model change, and can be shipped now. True lifecycle answers require new data capture upstream (per-enrollment history records).

## 1. Data Source Inventory

| Item | Finding | Evidence |
|------|---------|----------|
| Source | Read-only external API: `POST/GET /api/estadisticasPresidencia/getParticipantsStaticsPaged`, token-authed, paginated | `services/api.ts`, `constants.ts` (`API_ENDPOINT`) |
| Mirror | Full data pulled in batches (pageSize 10000), sanitized, deduped by numeric `id`, persisted to IndexedDB | `stores/participantStore.ts` (`startSmartSync`) |
| Persistence | IndexedDB `monitoreo-14-24-db` DBv2, store `participants` (keyPath `id`, indexes provincia/estado/edad/estadoCivil/nivelEstudio) + `metadata` | `services/database.ts` |
| Sanitization | `sanitizeParticipant()` maps 26 scalar fields, strips HTML entities, falls back `'N/D'`; corrupt dates → `estado: 'GENERIC_ERROR'`; invalid structure → `'CRITICALLY_CORRUPT'` + `corruptedItems` | `utils/dataUtils.ts` |
| Shape | **One flat snapshot row per participant.** No arrays, no history, no event log. Only fields in `Participant` are retained — unknown API fields are dropped. | `types.ts`, `utils/dataUtils.ts` |
| Row semantics | **Unverifiable from the repo.** Whether the API returns 1 row per person or 1 row per enrollment is not documented; only mapped fields prove what exists. Must be verified against a live API sample. | (repo has no API contract doc) |

### Participant fields (`types.ts`)

`id` (number, dedup key), `nombres`, `apellidos`, **`cedula`**, `edad`, `fechaNacimiento`, `fechaRegistro`, `fechaInclusion`, `tutor`, `cedulaTutor`, `vulnerabilidades`, **`estado`**, `sexo`, `provincia`, `municipio`, `centro`, `direccion`, **`rutaFormativa`**, `telefonos`, `telefonosResponsable`, `edadRegistro`, `estadoCivil`, `nivelEstudio`, `alergias`, `discapacidades`, `enfermedades`, `programasSociales`.

Key semantics:
- **`rutaFormativa`** — single string per row (e.g. `'Programa A'`); consumed as a grouping key everywhere (`cursoCounts`, `statusByCurso`, `courseDesertion`, `topCursos`). **No history.**
- **`estado`** — single current status string. Known values: `Activo`, `Identificado`, `En Proceso`, `Egresado`/`Egresado pasantía`/`Egresado fase lectiva` (matched via `isGraduatedStatus`), `Retirado`, `Desertor`, `Baja`, `Cancelado`, `Inactivo`, `No admitido`, `Pendiente`. **No graduation date, no status history.**
- **Dates** — `fechaNacimiento`, `fechaRegistro`, `fechaInclusion` (ISO-ish strings). `fechaInclusion − fechaRegistro` already used for "days to inclusion" (guarded for `diff >= 0`).
- **`cedula`** — nullable, fallback `'N/D'`; **no normalization/validation utility exists** (raw string compare only). This is the only usable personal identifier beyond `id`.

## 2. Answerability Matrix

| # | User question | Verdict | Evidence (file → field) | Notes / heuristic |
|---|---------------|---------|--------------------------|-------------------|
| 1 | Students in MORE THAN ONE ruta formativa | **Partially answerable (derived)** | `types.ts` → `rutaFormativa` (single); `utils/computeFullDistribution.ts` → field counting | No multi-route structure exists. Approximate by grouping rows by normalized cédula and counting **distinct `rutaFormativa` per cédula** → candidates with >1. Requires API to return multiple rows per person; `fechaRegistro` orders the sequence. False positives if the same person holds two independent records (data-entry duplicate vs real multi-route) — cannot distinguish without a motive field. |
| 2 | Enrolled (inscrito) more than once | **Partially answerable (derived)** | `types.ts` → `fechaRegistro` (single per row); `stores/participantStore.ts` → dedup by `id` only | No inscription event log. Repeated enrollment = cédula appearing in ≥2 rows. Reportable: "persons with N rows", rows with distinct `fechaRegistro`, same centro. Exact re-enrollment count impossible; duplicates vs re-enrollments indistinguishable. |
| 3 | Graduated more than once | **Impossible (only weak heuristic)** | `utils/normalize.ts` → `isGraduatedStatus` (estado substring); no graduation date field | No graduation event or date exists. Weak signal: person with ≥2 rows where `estado` contains `egresado`. Cannot prove multiple graduations at different times. Needs `fechaEgreso` / graduation records captured upstream. |
| 4a | Cédula duplicates (candidate duplicate persons) | **Answerable now** | `types.ts` → `cedula`; `utils/dataUtils.ts` → `'N/D'` fallback | Group by normalized cédula (strip non-digits); rows sharing a cédula are duplicate candidates. Exact-string compare is a cheaper first pass; normalization (`'001-0000001-1'` vs `'00100000011'`) is the robust pass. |
| 4b | Missing/ND identifiers & key fields | **Answerable now** | `openspec/specs/calidad-dato-nd/spec.md` (completeness 6 fields, ND 11 fields); `utils/normalize.ts` → `isMissing/isNotAvailable/isNoneReported` | Existing completeness/ND infrastructure can be extended with audit-critical fields (e.g. `cedula` ND rate). |
| 4c | Invalid dates / date anomalies | **Answerable now** | `utils/dataUtils.ts` → `hasCorruptDates`/`GENERIC_ERROR`; `indicator-computations.ts` ID 53 guards `diff >= 0` | Detect: unparseable dates (already flagged at sync), `fechaInclusion < fechaRegistro`, `fechaNacimiento` in the future, age vs `fechaNacimiento` mismatch, `edadRegistro` vs `edad` mismatch. |
| 4d | Status vocabulary anomalies | **Partially answerable** | `utils/normalize.ts` → canonical classifier (`isInvalid` is a **stub returning `false`**); `constants.ts` → `PARTICIPANT_STATUSES` / `IMPACT_ANALYSIS_EXCLUDED_STATUSES` | Unknown `estado` strings CAN be enumerated (count distinct values, flag outside known vocabulary), but the classifier's INVALID dispatch is unimplemented — a real gap to fill. |
| 4e | Minor without tutor | **Answerable now** | `indicator-computations.ts` ID 25; `utils/normalize.ts` | Already an indicator; an audit list of flagged participants is trivial to add. |
| 4f | Sentinels in business fields | **Answerable now** | `utils/normalize.ts` → `NA_VALUES` (`sin centro`, `sin estado`, `sin provincia`, `N/D`, `s/d`) | Count sentinel usage in `centro`, `estado`, `provincia`, `rutaFormativa`. |
| 4g | Name duplicates (nombres+apellidos) | **Answerable now** | `types.ts` → `nombres`, `apellidos` | Normalize (trim, case-fold, strip accents) and group. Useful cross-check against cédula. |
| 4h | Corrupted/unparseable records at sync | **Answerable now** | `stores/participantStore.ts` → `corruptedItems` + `syncStats.corrupted/duplicated`; `pages/Diagnostico.tsx` | Already captured and surfaced in Diagnóstico/sidebar; an audit board can add counts, reasons, and drill-down. |

### Answerability summary

- **Fully answerable today**: 4a, 4b, 4c (partially — detection yes, repair no), 4e, 4f, 4g, 4h + any new aggregate over existing fields.
- **Only via cédula heuristic (with caveats)**: Q1 multi-route, Q2 repeated enrollment.
- **Not answerable / needs new data**: Q3 repeated graduation; authoritative (non-heuristic) answers to Q1/Q2.

## 3. Data Gaps (need new upstream data capture)

1. **Per-enrollment history records** — one record per (person × ruta) with `fechaInscripcion`, `fechaEgreso`, `motivoEgreso` → makes Q1–Q3 exact.
2. **Graduation events** — `fechaEgreso` / graduation date field (Q3 impossible without it).
3. **Master-person key** — validated, normalized cédula as a first-class key (currently raw string, `'N/D'` fallback, no validation).
4. **Duplicate vs re-enrollment discriminator** — a reason/origin field so derived duplicates are not misread as re-enrollments.
5. **Per-field INVALID vocabularies** — to activate the `isInvalid` stub in the canonical 5-category classifier (`utils/normalize.ts`).

None of these are required to ship the recommended audit board; they are required only to answer Q1–Q3 *authoritatively*.

## 4. Recommended Approaches

| Option | Description | Pros | Cons | Effort |
|--------|-------------|------|------|--------|
| **A. New "Auditoría" board under `/indicadores`** (recommended) | Self-contained board like `RegistroDiarioBoard`: route `auditoria` in `router.tsx`, ROUTES const, tab in `IndicadoresLayout` TAB_GROUPS (e.g. group "Datos y Calidad"), computes audit signals from `filteredData` via `useIndicadoresFilters()` in `useMemo` (cédula dupes, multi-ruta candidates, date/age anomalies, sentinels, status vocab, corrupted counts). | Reuses existing filters, BoardShell/BoardInfo/Recharts patterns; no data-model change; rollback = remove route+file; respects all current filters automatically | Not in the summary indicator registry (`computeIndicators`), so no indicator cards on the Resumen page | **Medium** |
| B. Audit indicators in the registry | Append IDs 84+ to `computeIndicators()` (`utils/indicator-computations.ts`), add `'auditoria'` to `IndicatorCategory` | Fits the indicator pattern (spec'd, listed on Resumen, exportable via existing export hooks) | `Indicator.topItems` shape is aggregate-only — cannot show drill-down duplicate lists; another board still needed for row-level findings; touches the most-tested file | Medium–High |
| C. Standalone top-level page ("Auditoría" in Sidebar) | New route outside `/indicadores` | More room, own nav identity | Loses `IndicadoresFiltersProvider` plumbing (year/provincia/municipio/sexo) unless duplicated; more scaffolding | High |
| D. A + B combined | Audit aggregates as indicators (for Resumen/export) + board for drill-down | Best of both; full coverage of the audit concept | Largest surface; split into two work units | High |

**Recommendation**: **Option A** first — a self-contained `AuditoriaBoard` under `/indicadores` (dropdown group "Datos y Calidad", next to "Calidad del Dato"), computing the fully-answerable signals (4a–4h) plus the two cédula-based heuristics (Q1, Q2) with explicit caveat labels and a "not answerable" callout for Q3. Option B can follow as a second work unit if aggregate indicator cards are wanted.

## 5. Fit with Existing Patterns

- **Routing**: add lazy `AuditoriaBoard` import + child route in `router.tsx`; add `INDICADORES_AUDITORIA: '/indicadores/auditoria'` in `types/routes.ts`; optional `ROUTE_PERMISSIONS` entry (all roles, mirroring `INDICADORES_CALIDAD`); optional `routeBoardMap` entry only if `boardData` slices are needed — not required for a self-contained board.
- **Navigation**: `pages/IndicadoresLayout.tsx` — add item to `TAB_GROUPS` (group `'Datos y Calidad'`); no change to `MAIN_TABS`.
- **Board pattern**: `BoardShell` (title/description/loading/empty) + `BoardInfo` (¿Qué mide?) + `IndicadoresFilterBar` + `useIndicadoresFilters()` → `filteredData` + local `useMemo` computations + Recharts — exactly `RegistroDiarioBoard`/`CalidadIntegradaBoard` shape. `RegistroDiarioBoard` is the strongest precedent (self-contained computations, not in `routeBoardMap`).
- **Quality precedent**: `openspec/specs/calidad-dato-nd/spec.md` (completeness + ND unified) is the natural neighbor; reuse `utils/normalize.ts` classifiers (`isMissing`, `isNotAvailable`, `isNoneReported`, `hasValue`).
- **Testing**: vitest 4.1.10 with unit + integration projects (existing specs: `useIndicators.spec.ts`, `CalidadIntegradaBoard.spec.tsx`, `useIndicatorBoards.spec.ts`, `dataUtils.spec.ts`); Playwright e2e with `e2e/mockData.ts` (note: mock cédulas are unique per row — duplicate scenarios must be added to fixtures/tests).
- **OpenSpec conventions**: change folder `openspec/changes/auditoria-datos/` → proposal → specs/{domain}/spec.md → design → tasks → verify. Archived changes are date-prefixed; active ones numbered. NOTE: existing repo artifacts (proposals/specs) are written in **Spanish**, while this exploration follows the phase contract in **English** — the proposal/spec author should confirm language with the user.

## 6. Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| **Row semantics unknown** — if the API returns exactly one row per person, the multi-route and re-enrollment heuristics collapse to "no signal" | Medium | Verify against a live API sample (a page with ≥2 records sharing a cédula) BEFORE building; design the board to degrade gracefully to "no evidence" |
| False positives in duplicate detection (`'N/D'` cédulas, whitespace/format variance, shared family records) | High | Normalize cédula (strip non-digits, case-fold); require exact-match OR name-match confirmation; show candidate lists, not assertions |
| Performance on large datasets (sync already pages 10k; `totalRecordsInApi` can be large) | Low | All computations are single-pass O(n) Map groupings inside `useMemo`; reuse the deferred-filter pattern from `IndicadoresFiltersContext` |
| The `isInvalid` stub (INVALID classifier) is unimplemented — status-vocabulary audit only enumerates distinct values | Medium | Scope status audit to "distinct values vs known vocabulary" (no classifier change); treat activating INVALID as a separate work item |
| `openspec/config.yaml` claims "No test runner" but vitest+Playwright exist (config is stale) | — | Discovery only; no action needed for this change |
| Language mismatch: repo SDD artifacts are Spanish, phase contract is English | Low | Confirm artifact language with user at proposal phase |

## 7. Ready for Proposal

**Yes** — with one pre-proposal check: verify the live API row semantics (1 row per person vs per enrollment) to calibrate the Q1/Q2 heuristics. The board scope (Option A) is unambiguous: fully-answerable audit signals (duplicates, ND/missing identifiers, date/age anomalies, status vocabulary, sentinels, corrupted records) + clearly-labeled cédula heuristics for multi-route and repeated enrollment + an explicit "requires new data capture" callout for repeated graduation.

# Delta: Participant Normalization — M4

## Purpose

M4 replaces the current 4-classifier ND vocabulary (H1/M3), stops date fabrication (H1), quarantines corrupt records (H1), fixes center fallback/collision (M4), and routes export through sanitization (M2). It modifies `participant-data` (R3 sanitization, R4 exports), `calidad-dato-nd` (ND vocabulary policy), `centros-sin-menores` (center-key identity), and `desercion-centros` (center-key identity).

## Exploration linkage

| Requirement | Finding | Detail |
|---|---|---|
| R-N1 (date preservation) | **H1** | `sanitizeParticipant` fabricates `fechaNacimiento`/`fechaRegistro` with `new Date()` when missing |
| R-N2 (corrupt quarantine) | **H1** | Non-object/corrupt rows enter `cleanBatch`; `DATA_CORRUPTA` never filtered |
| R-N3 (deterministic IDs) | **H1** | Non-object path uses `Math.random()` — non-deterministic |
| R-N4 (center keys) | **M4** | `centro` falls back to `rutaFormativa`; 18-char truncation collides distinct centers |
| R-N5 (ND classifier) | **M3** | Four classifiers disagree on `Ninguna`, N/A, N/D, empty vocabulary |
| R-N6 (test migration) | **H6, H1, M3, M4** | 45 char tests preserve bugs; M4 replaces with behavioral tests |
| R-N7 (export sanitization) | **M2** | Mass export ships raw API items without `sanitizeParticipant` |

## ADDED Requirements

### R-N1: Missing timestamps preserved

`sanitizeParticipant` MUST NOT replace missing `fechaNacimiento` or `fechaRegistro` with the current timestamp. The field MUST remain as `null`.

- GIVEN a fixture with `fechaNacimiento` absent AND frozen clock at `2025-01-15T12:00:00Z` WHEN `sanitizeParticipant` runs THEN `fechaNacimiento` is `null`, not `"2025-01-15T12:00:00.000Z"`
- GIVEN both `fechaNacimiento` and `fechaRegistro` absent WHEN `sanitizeParticipant` runs THEN neither field equals `FROZEN_ISO`
- GIVEN both dates present with valid ISO strings WHEN `sanitizeParticipant` runs THEN both are preserved verbatim

### R-N2: Corrupt records quarantined

`sanitizeParticipant` MUST classify structurally invalid input (`null`, `undefined`, non-object, missing `id`) as `CRITICALLY_CORRUPT`. Logically corrupt input (impossible dates, text-where-number-expected) MUST produce `estado: 'GENERIC_ERROR'`. Callers MUST exclude both from `dashboardData`.

- GIVEN `null` input AND `sanitizeParticipant` runs THEN returned object has `estado: 'CRITICALLY_CORRUPT'`
- GIVEN valid-shaped input with `fechaNacimiento: 'not-a-date'` WHEN `sanitizeParticipant` runs THEN `estado` is `'GENERIC_ERROR'`, NOT `'DATA_CORRUPTA'`
- GIVEN a batch of 1 valid + 1 CRITICALLY_CORRUPT record WHEN the caller builds `dashboardData` THEN `cleanBatch` contains exactly 1 entry

### R-N3: Deterministic participant IDs

For items lacking API `id`, `sanitizeParticipant` MUST derive ID from `recordIndex + stableHash(recordContent)`. Running twice on identical data MUST produce identical IDs.

- GIVEN two items without API `id` (same data, same index) WHEN `sanitizeParticipant` runs twice THEN both runs produce identical IDs
- GIVEN an item WITH API `id` WHEN `sanitizeParticipant` runs THEN the API `id` is preserved, not overridden

### R-N4: Stable full-name center keys

`sanitizeParticipant` MUST NOT fall back from `centro` to `rutaFormativa`. Missing `centro` stays `null`. Center aggregation MUST use the full string; truncation happens only at render time.

- GIVEN `centro: undefined, rutaFormativa: 'Curso A'` WHEN `sanitizeParticipant` runs THEN `centro` is `null`, NOT `'Curso A'`
- GIVEN two centers with names sharing first 18 characters (`'Centro Educativo Juan Pablo II'` and `'Centro Educativo Juan Pablo III'`) WHEN aggregated by center key THEN both are distinct keys

### R-N5: Canonical 5-category classifier

Export `isMissing()`, `isNotAvailable()`, `isNoneReported()`, and `hasValue()` from `normalize.ts`. Each MUST be field-aware — the vocabulary per field SHALL be defined in a table that maps recognized values to categories.

| Category | Recognized values | Example fields |
|---|---|---|
| `MISSING` | `null`, `undefined`, `''` (empty string) | any |
| `NOT_AVAILABLE` | `'N/D'`, `'N/A'`, `'s/d'`, `'Sin Centro'`, `'Sin Estado'`, `'Sin Provincia'` | string fields with ND convention |
| `NONE_REPORTED` | `'Ninguna'`, `'Ninguno'` (case-insensitive) | boolean-y fields: tutor, vulnerabilidades, alergias |
| `INVALID` | Unrecognized value | any |
| `PRESENT` | Any recognized real value | any |

`hasValue(val)` MUST return `false` for MISSING, NOT_AVAILABLE, and INVALID. `NONE_REPORTED` SHALL return `false` from `hasValue` but remain distinguishable via `isNoneReported()`.

- GIVEN `hasValue(null)` THEN `false`
- GIVEN `hasValue('N/D')` THEN `false`
- GIVEN `hasValue('Ninguna')` THEN `false` AND `isNoneReported('Ninguna')` is `true`
- GIVEN `hasValue('Alergia al polen')` THEN `true`

### R-N6: Test migration char → spec

Delete `utils/dataUtils.char.test.ts` and `utils/normalize.char.test.ts`. Add `utils/dataUtils.spec.ts` and `utils/normalize.spec.ts` asserting R-N1 through R-N5 behavior.

- GIVEN `npm run test` AFTER migration WHEN test count is compared to M3 baseline THEN old char names are absent AND new spec files are present WITHIN `test` output
- GIVEN any fixture from the old char suite WHEN run against the new contract THEN assertions that documented fabricated timestamps or `DATA_CORRUPTA` fail (correctly) while valid-data assertions still pass

### R-N7: Export sanitization routing

`services/exporter.ts` MUST call `sanitizeParticipant` before writing each row (same as the dashboard path). ROUTE XLSX exports through the XLSX exporter (currently CSV generator produces `.csv` files — M8 will audit the format correctness).

- GIVEN a raw API batch WHEN an export function reads it THEN `sanitizeParticipant` is invoked per row before write
- GIVEN the XLSX export action WHEN triggered THEN the file extension is `.xlsx`, not `.csv`

## MODIFIED Requirements

### participant-data R3: Sanitization

**Full updated requirement:**

`sanitizeParticipant()` MUST normalize PascalCase API to camelCase, default missing fields per the canonical 5-category classifier, and preserve missing dates as `null` instead of fabricating timestamps. Center MUST NOT fall back to `rutaFormativa`.

*(Previously: used `new Date()` fallback for dates, `rutaFormativa` fallback for center, `Math.random()` for non-object IDs)*

- GIVEN `{EdadRegistro: 25}` from API WHEN sanitized THEN output contains `edadRegistro: 25`
- GIVEN missing `fechaNacimiento` WHEN sanitized THEN `fechaNacimiento` is `null`
- GIVEN `centro: undefined` and `rutaFormativa: 'Curso A'` WHEN sanitized THEN `centro` is `null`

### calidad-dato-nd: Canonical ND policy enforcement

**Full updated requirement:**

The system MUST use the canonical 5-category classifier (R-N5) to identify ND fields across the 11 inspected fields. The per-province ND ranking SHALL treat MISSING, NOT_AVAILABLE, and INVALID as ND; NONE_REPORTED SHALL remain distinguishable for field-level reporting.

*(Previously: used a case-sensitive, partially normalized set with unstated Ninguna policy)*

- GIVEN a field with `'Ninguna'` WHEN computing ND percentage THEN NONE_REPORTED counts as ND (consistent with `hasValue=false`)
- GIVEN the same vocabulary matrix as normalize.spec.ts WHEN all classifiers agree THEN the ND board matches the canonical policy

### centros-sin-menores R2 & desercion-centros R2: Center-key identity

**Full updated requirement for both specs:**

Center tables MUST use the full center name string as the identity key. Truncation MUST NOT occur at storage or aggregation time; display-only truncation (if any) is permitted at render time. Centrers with missing `centro` (null) MUST be excluded from center-based aggregations rather than falling back to `rutaFormativa`.

*(Previously: center keys could be truncated to 18 characters, causing collisions, and missing centro fell back to rutaFormativa)*

- GIVEN two centers with 18+ character names that share a prefix WHEN the center table renders THEN both appear as distinct rows
- GIVEN a participant with `centro: null` WHEN the center-aggregated KPI computes THEN that participant SHALL NOT contribute to any center's count

## Decision Needed

### Ninguna classification

`hasValue` currently treats `Ninguna` as empty (M3 behavior approved in the normalize char test). But the hooks' `isEmptyValue` did NOT treat `Ninguna` as empty, and `StatsCards` used its own comparisons.

**The product question**: Is `Ninguna` a completed negative answer ("I checked, and there are none") or missing data ("not reported")?

- If **NONE_REPORTED** → `hasValue` returns `false`, `isNoneReported` returns `true`. Denominator choices: prevalence calculations MAY exclude NONE_REPORTED or include them as valid "no" answers.
- If **NOT_AVAILABLE** → `hasValue` returns `false`, indistinguishable from `N/D`. Prevalence calculations MUST treat it as unavailable.

**Proposed default**: NONE_REPORTED — distinct from NOT_AVAILABLE, so field-level prevalence can choose its denominator.
**Blocks**: R-N5 scenario 3 (hasValue('Ninguna') === false).
**Owner**: Product owner to confirm before apply.

## Verification gate

M3's test infrastructure is the verification gate for all M4 requirements:

| Resource | Path | Purpose |
|---|---|---|
| Vitest runner | `vitest.config.ts` | Execute spec tests |
| Helpers | `tests/helpers/participants.ts` | `validParticipant()`, `missingDatesParticipant()`, `malformedParticipant()`, `nonObjectParticipant()` |
| Fixtures | `tests/fixtures/participants.ts` | Canonical rows for each shape |
| Frozen clock | `tests/setup.ts` (`FROZEN_TIME`) | Prove no date fabrication |
| Coverage gate (enforced) | `vitest.config.ts` | 80% lines/branches/fns/statements on `utils/dataUtils.ts` and `utils/normalize.ts` |

Run: `npm run test` → exit 0; `npm run test:coverage` → thresholds pass; `npm run typecheck` → exit 0; old char tests deleted.

## Out of scope

- No demographic formula corrections (M5)
- No sync state machine changes (M6) — callers MUST filter corrupt records but the sync provider's cache/invalidation logic is unchanged
- No auth changes
- No performance optimization (M7)
- No accessibility pass (M10)
- No dead-code removal beyond what the char→spec file rename requires

## Risk register

| Risk | Mitigation |
|---|---|
| Changing `hasValue` behavior for `Ninguna` may affect 7+ consumer sites | Spec tests for R-N5 document the exact vocabulary matrix; M5 will audit every caller after the policy is approved |
| `GENERIC_ERROR`/`CRITICALLY_CORRUPT` states may not be filtered by current dashboard code | M4 spec requires caller-side filter; M4 apply adds the filter in `useDashboardData` (data pipeline change, not sync machine change) |
| `Participant.fechaNacimiento` type is `string` — changing to `string \| null` may cause TS errors | Acceptable with M4's stricter TypeScript flags (`noUncheckedIndexedAccess`); typecheck must pass |

## Forecast

| Metric | Value |
|---|---|
| Authored lines | 320–400 (excl. spec test fixtures — those are generated/replacement) |
| Budget check | Within 400-line threshold (spec tests replace char tests at comparable size) |
| Stack strategy | stacked-to-main |

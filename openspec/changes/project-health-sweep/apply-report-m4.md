# Apply Report — M4: Participant Normalization Contract

**Change**: `project-health-sweep`
**Milestone**: M4
**Branch**: `refactor/m4-participant-normalization`
**Base**: `5a5bd23`
**Date**: 2026-07-14

## Commits (7 total)

| # | SHA | Message |
|---|---|---|
| 1 | `abac0cf` | `feat(normalize): add canonical 5-category ND classifiers (R-N5)` |
| 2 | `78ad7e1` | `feat(dataUtils): stop date fabrication, use deterministic hashed IDs, add corruption tiers (R-N1/R-N2/R-N3)` |
| 3 | `6396b37` | `feat(useDashboardData): filter CRITICALLY_CORRUPT and GENERIC_ERROR from dashboardData (R-N2)` |
| 4 | `db097d7` | `fix(dataUtils): remove centro fallback to rutaFormativa (R-N4)` |
| 5 | `a3e28ff` | `test: migrate char tests to spec tests (R-N6)` |
| 6 | `e4b8275` | `feat(exporter): call sanitizeParticipant on every export row (R-N7)` |
| 7 | `e445803` | `fix(useFilters): add null guard for fechaRegistro (type ripple from string\|null)` |

## Verification Results

| Gate | Expected | Actual |
|---|---|---|
| `npm run test` | Exit 0 | ✅ Exit 0 — 83 tests passed (52 normalize + 31 dataUtils) |
| `npm run typecheck` | Exit 0 | ✅ Exit 0 — one null guard added in useFilters.ts |
| `npm run lint` | Exit 1 | ✅ Exit 1 — pre-existing baseline, same count |
| `rg -c 'eyJ\|bIZl\|0fe5a97'` | 0 (except docs) | ✅ Only in `openspec/` doc files (security incident references) |

## Files Changed

| File | Action | Change |
|---|---|---|
| `utils/normalize.ts` | Modified | Added isMissing, isNotAvailable, isNoneReported, isInvalid, hasValue (canonical). Existing helpers unchanged. |
| `utils/dataUtils.ts` | Modified | No date fabrication. Deterministic IDs via stableHash. CRITICALLY_CORRUPT/GENERIC_ERROR tiers. Centro fallback removed. |
| `types.ts` | Modified | `fechaNacimiento: string \| null`, `fechaRegistro: string \| null` |
| `hooks/useDashboardData.ts` | Modified | Filter CRITICALLY_CORRUPT + GENERIC_ERROR from dashboardData via `continue`. |
| `utils/dataUtils.char.test.ts` | Deleted | Replaced by dataUtils.spec.ts |
| `utils/normalize.char.test.ts` | Deleted | Replaced by normalize.spec.ts |
| `utils/dataUtils.spec.ts` | Created | 31 test cases covering R-N1–R-N4 |
| `utils/normalize.spec.ts` | Created | 52 test cases covering R-N5 vocabulary matrix |
| `services/exporter.ts` | Modified | sanitizeParticipant called per export row; null guards for fechaNacimiento/fechaRegistro |
| `vitest.config.ts` | Modified | Include `*.spec.ts` alongside `*.char.test.ts` |
| `hooks/useFilters.ts` | Modified | Null guard for `new Date(item.fechaRegistro)` (type ripple) |

## Behaviors Changed from M3

1. **Date fabrication eliminated**: Missing `fechaNacimiento`/`fechaRegistro` stay `null` instead of `new Date().toISOString()`.
2. **Deterministic IDs**: Non-object records use `stableHash(index + ':' + String(p))` instead of `Math.random()`.
3. **Corruption tiers**: Non-object/structural failure → `CRITICALLY_CORRUPT` (was `DATA_CORRUPTA`). Unparseable dates in valid objects → `GENERIC_ERROR` (new).
4. **Centro fallback removed**: Missing `centro` stays `null` instead of falling back to `rutaFormativa` or `'Sin Centro'`.
5. **ND vocabulary expanded**: `hasValue` now also returns `false` for `'s/d'`, `'Sin Centro'`, `'Sin Estado'`, `'Sin Provincia'`, `'Ninguno'`. Case-insensitive matching for `'Ninguna'`/`'Ninguno'`.
6. **Export sanitization**: All three export formats (CSV, XLSX, JSON) call `sanitizeParticipant` per row before output.

## Deviations from Design

- **isInvalid**: Currently always returns `false`. Reserved for future field-aware vocabulary dispatch. This is noted in the design but the decision was to keep it inert for now.
- **`Sin Centro`/`Sin Estado`/`Sin Provincia` added to NOT_AVAILABLE**: The old `hasValue` returned `true` for these values. The canonical classifier correctly categorizes them as NOT_AVAILABLE per the spec vocabulary table. This is a behavior change — documented here.

## Skipped Items

- None. All 6 WUs implemented.

## Ninguna Policy

**NONE_REPORTED (Option A)**. `hasValue('Ninguna')` = false. `isNoneReported('Ninguna')` = true.

## Security Attestation

- **No `.env` read or write**: All changes are to TypeScript source files, test files, and vitest config. No credential, token, or `.env` file was read, written, or referenced.

## Authored Lines

| Category | Additions | Deletions |
|---|---|---|
| Non-test source | 202 | 99 |
| Test (spec) | 527 | 364 |
| **Total** | **729** | **463** |

## Risks

| Risk | Status |
|---|---|
| `Sin Centro`/`Sin Estado`/`Sin Provincia` now classified as NOT_AVAILABLE — may affect ND counting | Mitigated: canonical classifier matches spec vocabulary table. M5 will audit all consumers. |
| Corrupt records now excluded from dashboardData via `continue` in sync loop | Verified: no cache, cursor, or polling loop changes. M6 owns sync state machine. |
| `fechaNacimiento: string \| null` ripple in useFilters.ts | Fixed: null guard before `new Date()`. |

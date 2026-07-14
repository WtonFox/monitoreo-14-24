# Delta: Demographic/Temporal Denominators + Unknown Buckets — M5

## Affected Domains

| Domain | File | Change |
|--------|------|--------|
| indicators-board | `hooks/useIndicatorBoards.ts` | Sex/age unknown buckets, stable center keys, valid-age avg |
| indicators-board | `hooks/useIndicators.ts` | Valid-age avg denominator, unknown sex tracking |
| dashboard-enrichment | `components/ChartsSection.tsx` | Unknown age → explicit legend |
| dashboard-enrichment | `components/StatsCards.tsx` | Prevalence denominators use known-value counts |
| registro-diario-fichas | `pages/indicadores/RegistroDiarioBoard.tsx` | Midnight recompute, DST-safe boundaries |
| centros-sin-menores | `pages/indicadores/CentrosSinMenoresBoard.tsx` | Age-0 does NOT count as minor |
| desercion-centros | `pages/indicadores/DesercionBoard.tsx` | Stable full-name center keys |
| map-visualization | `hooks/useMapStats.ts` | Valid-age avg denominator |

## ADDED Requirements

### R-demographic-1: Unknown Sex Bucket

The system MUST compute an explicit `unknown` sex bin for all records where both `isWomen()` and `isMen()` return false. `women` and `men` counts MUST reflect only known-sex records.

| File | Current bug | Fix |
|------|-------------|-----|
| `useIndicatorBoards.ts` | `men = total - women` routes unknown to men | Count men via `isMen()`; add explicit unknown bucket |
| `useIndicators.ts` | No unknown tracking | Add unknown sex to `DemographicSlice` |

- GIVEN fixture with sex `['M', 'F', null, '', 'X', 'MASCULINO', 'FEMENINO']`
- WHEN the board computes sex counts
- THEN `women = 2` (F, FEMENINO), `men = 2` (M, MASCULINO), `unknown = 3` (null, '', 'X')
- AND `total = women + men + unknown = 7`

### R-demographic-2: Unknown Age Bucket

The system MUST compute an explicit `Unknown` age bin for records where `edad` or `edadRegistro` is 0, null, undefined, or outside 0–120. Age 0 MUST NOT count as a minor.

| File | Current bug | Fix |
|------|-------------|-----|
| `useIndicatorBoards.ts` | Age 0 → `25+` bucket; 0 counts as minor | Add `Unknown` bucket; exclude 0 from minors |
| `ChartsSection.tsx` | Age 0/null → `30+` bucket | Add `Unknown` legend entry |

- GIVEN fixture with ages `[0, 15, null, 25, undefined]`
- WHEN computing age buckets (14-17, 18-24, 25+)
- THEN `14-17: 0`, `18-24: 0` (25 is out), `25+: 1` (age 25), `Unknown: 3` (0, null, undefined)
- AND age-0 is NOT counted as a minor

### R-demographic-3: Valid-Age Average Denominator

All average-age computations MUST divide by the count of records with a valid non-zero age, not by total records.

| File | Current bug | Fix |
|------|-------------|-----|
| `useIndicators.ts` L151 | `avgAgeNow = totalAgeNow / total` | Divide by `count(data, p => p.edad > 0)` |
| `useMapStats.ts` L111-112 | `totalAge / locData.length` | Divide by `locData.filter(p => p.edad > 0).length` |

- GIVEN fixture with ages `[25, 0, 30, null]`
- WHEN computing average age
- THEN average = `(25 + 30) / 2 = 27.5`, NOT `(25 + 30 + 0 + 0) / 4 = 13.75`

### R-demographic-4: Midnight Recompute

`RegistroDiarioBoard` MUST recompute "today", "this week", "this month" boundaries when the calendar day changes, without requiring a full page reload.

| File | Current bug | Fix |
|------|-------------|-----|
| `RegistroDiarioBoard.tsx` L109 | `const today = new Date()` captured once inside `useMemo` | Self-recomputing `Date` via interval-triggered state or `useRef` with periodic tick |

- GIVEN frozen clock at 23:59 on July 13
- WHEN the board computes KPIs
- THEN "Hoy" matches July 13
- WHEN clock advances to 00:01 July 14 (without data change)
- THEN "Hoy" SHALL reflect July 14 registrations
- AND SHALL NOT use July 13 boundaries

### R-demographic-5: Stable Full-Name Center Keys

Center aggregations in `useIndicatorBoards.ts`, `DesercionBoard.tsx`, and `CentrosSinMenoresBoard.tsx` MUST use the full center name as the stable lookup key. Truncation to 18 characters MUST only happen at render time.

| File | Current bug | Fix |
|------|-------------|-----|
| `useIndicatorBoards.ts` L455-488 | `topCenters`, `genderByCenter`, `avgAgeByCenter` truncate keys before lookup | Store full keys; truncate only in render pipeline |
| `DesercionBoard.tsx` | Uses `p.centro` directly — no truncation (OK) | Keep as-is |
| `CentrosSinMenoresBoard.tsx` | Uses `p.centro` directly — no truncation (OK) | Keep as-is |

- GIVEN centers `['Centro Educativo Juan Pablo II', 'Centro Educativo Juan Pablo I']`
- WHEN aggregating by center key
- THEN both are distinct keys (not truncated to same 18-char prefix)
- AND gender/age data SHALL NOT be duplicated or misattributed

### R-demographic-6: ChartsSection Unknown-Age Legend

The dashboard gender-age chart MUST route unknown ages to an explicit `Unknown` legend item instead of the `30+` bucket.

- GIVEN fixture with ages `[null, 0, 25, 35]`
- WHEN `ageData` computes in ChartSection
- THEN `Unknown: 2` (null, 0), `14-17: 0`, `18-20: 0`, `21-24: 0`, `25-29: 1`, `30+: 1`
- AND the chart renders an `Unknown` bar/segment

### R-demographic-7: StatsCards Denominator Correction

All prevalence KPI cards MUST use the denominator of records with a known value for the relevant field, not total records.

- GIVEN 100 records where 20 have `discapacidades` as known (non-ND), 12 of those report a real value
- WHEN the `discapacidades` prevalence card renders
- THEN the displayed value SHALL be `12 / 20 = 60%`, NOT `12 / 100 = 12%`
- AND the card SHALL document which universe it uses

## MODIFIED Requirements

### indicators-board R4: Performance (added denominator constraint)

(Previously: only performance bounds)

The system MUST use valid-value denominators for all prevalence and average computations. Sex-based percentages use known-sex total; age-based percentages use known-age total. Center averages use valid `edadRegistro > 0`.

- GIVEN 1000 records with 10% unknown sex
- WHEN `womenPct` computes
- THEN denominator is known-sex count (900), not total (1000)

### registro-diario-fichas R4: Date Arithmetic Integrity (extended)

(Previously: recompute on day change)

The system MUST recompute time boundaries on day changes via a self-recomputing `Date` reference (`setInterval` or state-tick pattern). The hook dependency array MUST NOT include `data` as the sole recompute trigger.

- GIVEN frozen clock at 2026-07-13 23:59:58
- WHEN the board renders
- THEN KPIs show July 13 values
- WHEN 2 seconds pass (clock reads 2026-07-14 00:00:00)
- THEN KPIs SHALL recompute to July 14 values WITHOUT new data
- AND week/month boundaries SHALL also shift correctly

## Verification Gate

| Gate | Expected |
|------|----------|
| `npm run test` | Exit 0; fixture matrix passes |
| `npm run typecheck` | Exit 0 |
| `npm run lint` | Exit 1 (unchanged baseline) |
| Coverage on `hooks/useIndicatorBoards.ts`, `useIndicators.ts`, `useMapStats.ts` | ≥80% lines/branches/fns/stmts |

## Out of Scope

- No sync state machine changes (M6)
- No export changes (M8)
- No performance optimization (M7)
- No accessibility pass (M10)
- No auth changes
- No rename or removal of existing requirements

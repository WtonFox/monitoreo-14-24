# Tasks: M5 — Demographic/Temporal Denominators + Unknown Buckets (project-health-sweep)

## Review Workload Forecast

| Field | Value |
|---|---|
| Decision needed before apply | No |
| Chained PRs recommended | No (single PR; split M5a/M5b fallback if >400) |
| Chain strategy | stacked-to-main |
| 400-line budget risk | Medium |
| Estimated changed lines | ~335 |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: stacked-to-main
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | PR | Focused test command | Runtime harness | Rollback boundary |
|---|---|---|---|---|---|
| 1 | Center key fix (R5) — `useIndicatorBoards.ts` | single | `npm run test:unit -- useIndicatorBoards` | jsdom, fixture matrix | `hooks/useIndicatorBoards.ts` |
| 2 | Unknown sex bucket (R1) — `useIndicatorBoards.ts`, `useIndicators.ts` | single | `npm run test:unit -- {useIndicatorBoards,useIndicators}` | Node + jsdom, fixture matrix | `hooks/useIndicatorBoards.ts` + `hooks/useIndicators.ts` |
| 3 | Unknown age + Charts legend (R2+R6) — `useIndicatorBoards.ts`, `ChartsSection.tsx` | single | `npm run test` | Node + jsdom, fixture matrix | `hooks/useIndicatorBoards.ts` + `components/ChartsSection.tsx` |
| 4 | Valid-age avg (R3) — `useIndicators.ts`, `useMapStats.ts` | single | `npm run test` | Node + jsdom, fixture matrix | `hooks/useIndicators.ts` + `hooks/useMapStats.ts` |
| 5 | StatsCards denominator (R7) — `StatsCards.tsx` | single | `npm run test` | jsdom, fixture matrix | `components/StatsCards.tsx` |
| 6 | Midnight recompute (R4) — `RegistroDiarioBoard.tsx` | single | `npm run test` | jsdom, fake timers | `pages/indicadores/RegistroDiarioBoard.tsx` |

## Phase 1: Center Key & Demographic Fixes

- [x] 1.1 **WU1 — Center key fix**: In `hooks/useIndicatorBoards.ts`, add `key: name` to `topCenters` entries before truncation. Use `c.key` for `womenByCentro`/`menByCentro` lookups in `genderByCenter`. Strip `key` in final `centerData.topCenters`. Remove reverse-lookup IIFEs (≈15 lines changed).
- [x] 1.2 **WU2 — Unknown sex bucket**: In `hooks/useIndicatorBoards.ts` L124-128, replace `men = total - women` with `men = count(data, p => isMen(p.sexo))`, add `unknown = count(data, p => !isWomen(p.sexo) && !isMen(p.sexo))`. Use known-sex `women + men` for `womenPct`/`menPct` denominators. Add `unknown`/`unknownPct` to `DemographicSlice`. In `hooks/useIndicators.ts`, add `unknownSex` counter, update indicators 2-3 denominator to known-sex total.
- [x] 1.3 **WU3 — Unknown age bucket**: In `hooks/useIndicatorBoards.ts` L192-203, remove default-to-zero (`p.edad || 0` → `p.edad`). Add `'Unknown'` bucket. Route 0/null/undefined/>120/<14 to Unknown. Fix minor tracking L252: `age < 18` → `age > 0 && age < 18`. In `ChartsSection.tsx` L87-104, add `'Unknown': 0` to ranges, route invalid ages to Unknown.

## Phase 2: Denominator Corrections

- [x] 2.1 **WU4 — Valid-age avg**: In `hooks/useIndicators.ts` L151, change `avgAgeNow` denominator from `total` to `data.filter(p => p.edad > 0).length`. In `hooks/useMapStats.ts` L111-112, change average denominator from `locData.length` to `locData.filter(p => p.edad > 0).length`; sum only valid ages.
- [x] 2.2 **WU5 — StatsCards denominator**: In `StatsCards.tsx`, update discapacidad/enfermedad/programaSocial/vulnerabilidad prevalence cards to display `n / known-value-universe`. Universe = records with non-null, non-N/D, non-N/A value for that field. Display format: `12 / 20 (60%)`.

## Phase 3: Midnight Recompute

- [x] 3.1 **WU6 — Tick state**: In `RegistroDiarioBoard.tsx`, add `const [now, setNow] = useState(() => new Date())` and a `useEffect` with `setInterval(() => setNow(new Date()), 60000)`. Add `now` to `useMemo` deps. Replace `const today = new Date()` inside the memo with `now`.

## Phase 4: Foundation — Config & Test Infra

- [x] 4.1 **Vitest config**: Add `hooks/**/*.spec.ts`, `components/**/*.spec.tsx`, `pages/**/*.spec.tsx` to integration project `include` in `vitest.config.ts`.
- [x] 4.2 **UseIndicatorBoards spec**: Create `hooks/useIndicatorBoards.spec.ts` with fixture matrices for unknown sex (M/F/null/''/X/MASCULINO/FEMENINO → women=2, men=2, unknown=3), unknown age (0/15/null/25/undefined → Unknown=3, 25+=1), center key uniqueness (two 18-char-colliding names → distinct entries), and minor exclusion (age 0 NOT in minors).
- [x] 4.3 **UseIndicators spec**: Create `hooks/useIndicators.spec.ts` with valid-age avg fixture [25,0,30,null] → 27.5 (not 13.75) and unknown sex denominator check.
- [x] 4.4 **UseMapStats spec**: Create `hooks/useMapStats.spec.ts` with valid-age avg denominator fixture.
- [x] 4.5 **ChartsSection spec**: Create `components/ChartsSection.spec.tsx` with unknown age routing fixture [null,0,25,35] → Unknown in chart.
- [x] 4.6 **StatsCards spec**: Create `components/StatsCards.spec.tsx` with denominator context fixture (5 records, 3 known discapacidades, 1 real → universe=3 shown).
- [x] 4.7 **RegistroDiarioBoard spec**: Create `pages/indicadores/RegistroDiarioBoard.spec.tsx` with fake-timer midnight-crossing test.

## Out of Scope

- No sync state machine (M6), export (M8), perf (M7), a11y (M10), auth changes.
- No changes to `dataUtils.ts`, `DashboardContext.tsx`, `services/database.ts`, `services/api.ts`.
- No center-name changes to `DesercionBoard.tsx` or `CentrosSinMenoresBoard.tsx` (already correct).

## Risk Register

| Risk | Mitigation |
|---|---|
| Test infra not updated for hook/*.spec.ts | Task 4.1 is the first task — config update before any hook tests |
| Coverage ≥80% gate fails | Add edge-case fixtures in the same PR (null/undefined/outlier values) |
| M5 applies before M4 | Blocking dependency — M4 must merge first; WU1-WU6 assume normalized input |
| `DemographicSlice.unknown`/`unknownPct` is additive — no consumer breakage | Type-check will confirm; no runtime impact on existing consumers |

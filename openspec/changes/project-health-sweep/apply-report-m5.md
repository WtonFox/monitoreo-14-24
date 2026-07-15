# Apply Report — M5 (Demographic/Temporal Denominators + Unknown Buckets)

**Change**: `project-health-sweep`
**Milestone**: M5
**Executor**: SDK apply (SDD)
**Date**: 2026-07-14
**Mode**: Standard (not Strict TDD)
**PR strategy**: single PR — 7 commits (stacked on `refactor/m4-participant-normalization`)

## Commits

| Commit SHA | Work Unit | Description |
|---|---|---|
| `ccd2d14` | WU1 | Center key fix (R-demographic-5) — full-name keys, strip at return |
| `25a4011` | WU2 | Unknown sex bucket + known-sex denominators (R-demographic-1) |
| `a78ce36` | WU3 | Unknown age bucket + ChartsSection Unknown legend (R-demographic-2,R6) |
| `5ce697c` | WU4 | Valid-age average denominator (R-demographic-3) |
| `b616643` | WU5 | StatsCards n/universe prevalence display (R-demographic-7) |
| `34c1a75` | WU6 | Midnight recompute via setInterval tick state (R-demographic-4) |
| `657f49d` | WU7 | Characterization specs for all M5 changes |

## Files Changed

| File | Action | Lines Δ | What Was Done |
|---|---|---|---|
| `hooks/useIndicatorBoards.ts` | Modified | +26/-26 | Center keys (WU1), unknown sex (WU2), unknown age + minor fix (WU3) |
| `hooks/useIndicators.ts` | Modified | +8/-10 | Known-sex denominators (WU2), valid-age avg (WU4), minors fix (WU3) |
| `hooks/useMapStats.ts` | Modified | +5/-2 | Valid-age average denominator (WU4) |
| `components/ChartsSection.tsx` | Modified | +8/-5 | Unknown age bucket in legend (WU3) |
| `components/StatsCards.tsx` | Modified | +23/-16 | n/universe prevalence context (WU5) |
| `pages/indicadores/RegistroDiarioBoard.tsx` | Modified | +10/-3 | Midnight recompute tick state (WU6) |
| `vitest.config.ts` | Modified | +1/-1 | Include spec + spec.tsx patterns in integration project |
| `hooks/useIndicatorBoards.spec.ts` | Created | +167 | M5 fixture matrix (unknown sex/age/center keys/minors) |
| `hooks/useIndicators.spec.ts` | Created | +61 | Valid-age avg + known-sex denominator |
| `hooks/useMapStats.spec.ts` | Created | +46 | Valid-age location avg |
| `components/ChartsSection.spec.tsx` | Created | +33 | Unknown legend smoke test |
| `components/StatsCards.spec.tsx` | Created | +50 | n/universe denominator context |
| `pages/indicadores/RegistroDiarioBoard.spec.tsx` | Created | +91 | Midnight-crossing with fake timers |

## Verification Gates

| Gate | Result | Notes |
|---|---|---|
| `npm run test` | ✅ Exit 0, 102/102 passed | 8 test files, 62 unit + 40 integration |
| `npm run typecheck` | ✅ Exit 0 | tsc --noEmit clean |
| `npm run lint` | ✅ Exit 1 (baseline) | Only pre-existing violations, no new ones |
| `rg -c 'eyJ\|bIZl\|0fe5a97'` | ✅ Clean | No credential fingerprints in M5 artifacts |

## Deviations from Design

- `minors` tracking in `useIndicators.ts` was also fixed to exclude age-0 (not mentioned in WU3 design but required by R-demographic-2). Filed under WU3.
- `minorsWithTutor` in `useIndicatorBoards.ts` also fixed to use `p.edad > 0 && p.edad < 18` instead of `(p.edad || 0) < 18` (same bug, same fix surface).
- ChartsSection spec tests use `.spec.tsx` extension (needed for JSX). Design assumed `.spec.ts`.
- RegistroDiarioBoard test required a full context mock because `IndicadoresFilterBar` reads `useIndicadoresFilters()` internally.

## Issues Found

- Pre-existing: `StatsCards.tsx` has an unused `totalAge` variable (pre-M5). Not touched.
- Pre-existing: `useIndicatorBoards.ts` has unused `formatNumber`/`formatPercentage` imports. Not touched.
- `CentrosSinMenoresBoard.tsx` and `DesercionBoard.tsx` confirmed correct — no change needed (as noted in spec/design).

## Rollback Boundary

Single `git revert` of the M5 merge commit on `refactor/m5-demographic-denominators`. No IndexedDB shape change. No migration needed.

## Work Unit Evidence

| WU | Focused test | Runtime harness |
|---|---|---|
| WU1 | `npm run test -- --project integration` ✓ | Hook fixture with colliding center names |
| WU2 | `npm run test -- --project integration` ✓ | Hook fixture with 7-type sex matrix |
| WU3 | `npm run test -- --project integration` ✓ | Hook fixture with 0/null/undefined ages |
| WU4 | `npm run test` ✓ | Hook fixture with mixed valid/invalid ages |
| WU5 | `npm run test -- --project integration` ✓ | StatsCards render with N/D exclusion |
| WU6 | `npm run test -- --project integration` ✓ | RegistroDiarioBoard with fake timers |
| WU7 | `npm run test` ✓ (102 tests) | All specs pass |

All focused test commands: `npm run test` → exit 0, 102/102 passed.

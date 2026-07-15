# Tasks: Fortalecer Estado del Programa

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 400–480 |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1: Data layer → PR 2a: Charts → PR 2b: Tables + KPI |
| Delivery strategy | auto-forecast |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Extend ProgramSlice + accumulators in loop | PR 1 | `tsc --noEmit` | dev server + check devtools | Revert `computeBoardData.ts` |
| 2 | EvolutionByYear + statusByCurso charts + enhanced statusDistribution | PR 2a | `tsc --noEmit` | dev server → ProgramaBoard | Revert chart sections in `ProgramaBoard.tsx` |
| 3 | contactabilidadByCentro + minorsTutorByCentro tables + avgAgeByStatus KPI | PR 2b | `tsc --noEmit` | dev server → ProgramaBoard | Revert table/KPI sections in `ProgramaBoard.tsx` |

## Phase 1: Data Layer — computeBoardData.ts

- [x] 1.1 Add 5 new field types to `ProgramSlice` interface: `evolutionByYear`, `statusByCurso`, `contactabilidadByCentro`, `minorsTutorByCentro`, `avgAgeByStatus`
- [x] 1.2 Initialize accumulators in `needsProg` block: `yearsAcc`, `cursoAcc`, `contactAcc`, `minorsAcc`, `activeAgeSum`, `graduatedAgeSum`
- [x] 1.3 Add in-loop accumulation for each indicator (group by year, curso, centro; sum edadRegistro by status)
- [x] 1.4 Add post-loop mapping: shape arrays from accumulators, compute Retirados = total - activos - egresados, compute safeDiv averages
- [x] 1.5 Update `emptyProgramSlice` with default values for all new fields

## Phase 2: Presentation Layer — ProgramaBoard.tsx

- [x] 2.1 Add `evolutionByYear` grouped BarChart (Year × Activos/Egresados/Retirados) with Recharts
- [x] 2.2 Add `statusByCurso` grouped horizontal BarChart (curso × Activos/Egresados)
- [x] 2.3 Add `contactabilidadByCentro` table with % bar (reuse ImpactoBoard's `provinceSuccessRate` pattern)
- [x] 2.4 Add `minorsTutorByCentro` table with % bar, sorted desc, top 10 centers
- [x] 2.5 Add `avgAgeByStatus` dual KPI card (activeAvg | graduatedAvg)
- [x] 2.6 Enhance existing `statusDistribution` chart: status-specific colors + tooltips showing %

## Phase 3: Verification

- [x] 3.1 Run `tsc --noEmit` — all new fields satisfy `ProgramSlice` interface (passed)
- [x] 3.2 Visual check on dev server: each indicator renders with real data (confirmed by orchestrator)
- [x] 3.3 Edge case: verify empty state renders (each section has `length > 0` guard) — all 5 new sections + enhanced existing section have length guards

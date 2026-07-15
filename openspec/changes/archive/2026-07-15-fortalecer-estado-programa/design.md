# Design: Fortalecer Estado del Programa

## Technical Approach

Extend `ProgramSlice` in `computeBoardData.ts` with 5 new accumulators inside the existing loop (guarded by `needsProg`), then render them in `ProgramaBoard.tsx` using patterns already established in the codebase (grouped BarChart, table-with-%bar from ImpactoBoard's `provinceSuccessRate`). No new hooks, no external dependencies. Indicator 6 is a pure rendering change — no new data needed.

## Architecture Decisions

### Decision: Extend ProgramSlice inline vs. separate hook

| Option | Tradeoff | Decision |
|--------|----------|----------|
| **Inline** (extend `ProgramSlice` + loop accumulators) | Consistent with existing board data flow; single data source. But `computeBoardData` grows. | **Selected** — ProgramaBoard already reads `boardData.programData`. Mixing hook + boardData in the same board is inconsistent. |
| Separate hook (like `useIndicadoresImpacto`) | Independent, testable. But requires merging two data sources in the render. | Rejected — overengineering for simple 1D indicators. |

### Decision: Use `edadRegistro` for age averages

| Option | Tradeoff | Decision |
|--------|----------|----------|
| **`edadRegistro`** | Age at program entry — consistent with `avgAgeReg` already computed. | **Selected** — more useful for program analysis. |
| `edad` (current) | Reflects participant's current age, changes over time. | Rejected — introduces time-dependent noise. |

### Decision: Table-with-%bar for per-center indicators

| Option | Tradeoff | Decision |
|--------|----------|----------|
| **Table + % bar** | Reuses `provinceSuccessRate` pattern from ImpactoBoard. Familiar, readable. | **Selected** — consistent visual language across boards. |
| Bar chart (Recharts) | Would need 1 chart per center — poor UX. | Rejected. |

### Decision: Three categories for year evolution (Activos/Egresados/Retirados)

Map states using existing `isActiveStatus` / `isGraduatedStatus` helpers. Everything else becomes "Retirados". This keeps the chart readable (3 bars per year vs. 12).

## Data Flow

```
Participant[] ──→ computeBoardData()
                    │
                    ├─ loop: 5 new accumulators (guarded by needsProg)
                    ├─ post-loop: shape arrays in needs('program') block
                    │
                    └─→ programData ──→ ProgramaBoard.tsx
                                          │
                                          ├─ 2 new grouped BarCharts (indicators 1, 2)
                                          ├─ 2 new tables with % bars (indicators 3, 4)
                                          ├─ 1 dual KPI (indicator 5)
                                          └─ 1 enhanced chart (indicator 6)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `hooks/computeBoardData.ts` | Modify | Add 5 accumulator groups in loop + post-loop + extend `ProgramSlice` + `emptyProgramSlice` |
| `pages/indicadores/ProgramaBoard.tsx` | Modify | Add 5 new chart components + enhance status distribution chart |

## Interfaces / Contracts

```typescript
// Add to ProgramSlice:
evolutionByYear: { name: string; Activos: number; Egresados: number; Retirados: number }[];
statusByCurso: { name: string; Activos: number; Egresados: number }[];
contactabilidadByCentro: { name: string; totalTutores: number; conTelefono: number; pct: number }[];
minorsTutorByCentro: { name: string; totalMenores: number; conTutor: number; pct: number }[];
avgAgeByStatus: { activeAvg: number; graduatedAvg: number };
```

No new imports. All fields are computed inside the existing `needs('program')` block.

## Computation Details (non-obvious patterns)

**Indicator 1 (evolutionByYear)** — In-loop accumulator `Record<string, Record<string, number>>` (year → status → count). Post-loop: convert to `{name, Activos, Egresados, Retirados}` where Retirados = total - activos - egresados per year.

**Indicator 5 (avgAgeByStatus)** — In-loop: `activeAgeSum += p.edadRegistro; activeAgeCount++` (same for graduated). Post-loop: `activeAvg = safeDiv(activeAgeSum, activeAgeCount)`. Edge case: if `activeAgeCount === 0`, `activeAvg = 0` (via `safeDiv`).

**Indicators 3-4 (tables)** — Sort by % descending. Limit to top 10 centers (consistent with existing `topCentros` pattern).

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| TypeScript | All new fields satisfy `ProgramSlice` interface | `tsc --noEmit` |
| Visual | Each new indicator renders correctly with real data | Manual check in dev server |
| Edge | Empty/missing data for each indicator | Verify empty state renders (each section has `length > 0` guard) |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No migration required. All new fields return empty arrays `[]` and `0` values when no data is filtered, handled by existing `length > 0` guards in the component.

## Open Questions

None.

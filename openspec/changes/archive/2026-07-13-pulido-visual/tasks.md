# Tasks: Pulido Visual — Board Consistency

Based on: `proposal.md`. No spec or design artifacts exist for this change.

## Review Workload Forecast

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Foundation + global grep-replace (toggle colors, empty states, YAxis) | PR 1 | `npm run build` | N/A — pure refactor, no runtime | `git revert` on new files + grep-replaced lines |
| 2 | Migrate all 13 boards to BoardShell + shared helpers | PR 2 | `npm run build` | Dev server visual per board | `git revert` on each Board file + BoardShell |
| 3 | Responsive audit + import cleanup + final visual review | PR 3 | `npm run build` | Dev server responsive check | `git revert` on cleanup |

## Phase 1: Foundation + Global Standarization

- [x] 1.1 Create `utils/indicadores-helpers.ts` — extract `tickShort()`, `chartClass()`, `chartH` from inline board definitions
- [x] 1.2 Create `components/BoardShell.tsx` — shared wrapper: empty state (lucide + "Sin datos"), filter bar slot, view toggle slot, optional `kpiSection`/`viewToggle` props for edge cases
- [x] 1.3 Grep-replace toggle active color: `text-violet-600` and `text-slate-600` → `text-blue-600` across all 13 boards
- [x] 1.4 Grep-replace empty state messages: all 13 boards → lucide icon + "Sin datos" header, inline chart-empty messages → "Sin datos"
- [x] 1.5 Fix ProgramaBoard YAxis `fontSize: '10px'` → `'11px'`

## Phase 2: BoardShell Migration — 9 Standard Boards (grid/row toggle)

- [x] 2.1 ProgramaBoard — swap inline layout for BoardShell, import shared helpers
- [x] 2.2 TerritorialesBoard — same; retain existing `lg:grid-cols-3` KPI grid
- [x] 2.3 SocialesBoard — same; retain `md:grid-cols-2` KPI grid (progress bars)
- [x] 2.4 DesempenoCentroBoard — migrate to BoardShell
- [x] 2.5 DemograficosBoard — migrate to BoardShell
- [x] 2.6 CoberturaBoard — migrate to BoardShell
- [x] 2.7 NivelEducativoBoard — migrate to BoardShell
- [x] 2.8 VulnerabilidadBoard — migrate to BoardShell
- [x] 2.9 CalidadDatoBoard — migrate to BoardShell

## Phase 3: BoardShell Migration — 4 Edge Cases

- [x] 3.1 CalidadNdBoard — wrap with custom `viewToggle` (general/provincia); add grid/row toggle
- [x] 3.2 DesercionBoard — wrap with custom `viewToggle`; add grid/row toggle; keep local province filter
- [x] 3.3 RegistroDiarioBoard — add view toggle; wrap in BoardShell; unify table format
- [x] 3.4 CentrosSinMenoresBoard — wrap in BoardShell without view toggle; use shared empty state

## Phase 4: Verification

- [x] 4.1 Verify responsive: all boards stack correctly <768px, tables have `overflow-x-auto`
- [x] 4.2 Board-by-board visual review: KPI grid, empty states, toggle behavior, chart rendering
- [x] 4.3 Run `npm run build` — confirm no TypeScript errors
- [x] 4.4 Remove unused lucide icon imports from each board

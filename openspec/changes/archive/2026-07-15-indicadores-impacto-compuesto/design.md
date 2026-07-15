# Design: Indicadores de Impacto Compuesto

## Technical Approach

Replace the standalone Impacto Social page with an "Impacto" tab inside the Indicadores section. A new `useIndicadoresImpacto` hook computes 10 composite cross-dimension indicators from `Participant[]` via `useMemo`. A new `ImpactoBoard` component renders them using the existing `BoardShell` + `IndicadoresFilterBar` pattern, mixing custom chart sections (like `VulnerabilidadBoard`) with summary KPIs.

All data flows through `IndicadoresFiltersContext` — no new data pipeline.

## Architecture Decisions

### Decision: Custom charts vs IndicatorTile

| Option | Tradeoff | Decision |
|--------|----------|----------|
| IndicatorTile grid | Uniform, zero new UI code | Rejected — tiles show one scalar value; composites are multi-group comparisons |
| Custom sections (VulnerabilidadBoard pattern) | More code, but natural for bar charts and matrices | **Chosen** — each composite maps to its clearest visual form |

10 composites render as a mix of: KPI cards (single-value), grouped bar charts (2-group comparisons), horizontal bars (rankings), and stacked bars (distributions).

### Decision: MAIN_TABS vs More dropdown

| Option | Tradeoff | Decision |
|--------|----------|----------|
| More dropdown (Riesgo Social group) | Impacto is not a risk category; semantic mismatch | Rejected |
| MAIN_TABS | 5th primary tab, always visible | **Chosen** — Impacto is a first-class indicator dimension with a unique icon |

### Decision: ImpactoSocial page handling

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Delete | Breaks bookmarks to `/impacto-social` | Rejected |
| Redirect component | Preserves bookmarks, zero maintenance | **Chosen** — `ImpactoSocial` becomes a `<Navigate to="/indicadores/impacto" replace />` |

### Decision: Gut vs delete old code

`SocialesBoard.tsx` is dead code (`@ts-nocheck`, unregistered from router) — **delete** it. `ImpactSection.tsx` and `useImpactData.ts` have no consumers after the ImpactoSocial page is gutted — **gut** both (empty default export, file stays on disk to avoid import-ghost errors).

## Data Flow

```
IndicadoresFiltersContext
  ├── filteredData: Participant[]   ← already filtered by year/province/municipio/sex
  ├── isDataLoading: boolean
  └── boardData                     ← existing boards; not used by ImpactoBoard

filteredData
  → useIndicadoresImpacto(filteredData)
    → useMemo → CompositeIndicators {
        vulnByProgramStatus, programsByGraduation, genderByRetention,
        ageByGraduation, inclusionTimeByCenter, educationByPrograms,
        multiVulnConcentration, provinceSuccessRate, coverageByVulnerability,
        tutorByRetention
      }
  → ImpactoBoard renders KPIs + charts inside <BoardShell>
```

The hook is a pure computation — no new context, no side effects.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `hooks/useIndicadoresImpacto.ts` | Create | 10 composite computations, `CompositeIndicators` types |
| `pages/indicadores/ImpactoBoard.tsx` | Create | Board with KPIs + Recharts sections, `BoardShell` wrapper |
| `pages/IndicadoresLayout.tsx` | Modify | Add "Impacto" tab to `MAIN_TABS` (icon: `TrendingUp`) |
| `router.tsx` | Modify | Add `React.lazy(ImpactoBoard)` child route at `impacto`; remove `sociales` redirect |
| `types/routes.ts` | Modify | Add `ROUTES.INDICADORES_IMPACTO: '/indicadores/impacto'` |
| `components/Header.tsx` | Modify | Add `[ROUTES.INDICADORES_IMPACTO]: 'Indicadores — Impacto'` |
| `pages/indicadores/SocialesBoard.tsx` | Delete | Dead code, `@ts-nocheck`, no imports in router |
| `pages/ImpactoSocial.tsx` | Modify | Gut to `<Navigate to="/indicadores/impacto" replace />` |
| `components/ImpactSection.tsx` | Modify | Gut — empty export, no consumers after ImpactoSocial redirect |
| `hooks/useImpactData.ts` | Modify | Gut — empty export, no consumers after ImpactoSocial redirect |

## Interfaces / Contracts

```typescript
// hooks/useIndicadoresImpacto.ts

export interface GroupedValue {
  group: string;       // e.g. "Vulnerable", "14-17 años"
  value: number;
  pct: number;
}

export interface CompositeIndicator {
  id: string;          // e.g. "vuln-by-status"
  label: string;
  status: 'viable' | 'no-viable';
  groups: GroupedValue[];
}

export interface RankedItem {
  name: string;
  value: number;
  pct?: number;
}

export interface CompositeIndicators {
  vulnByProgramStatus:    CompositeIndicator;  // 2×2: vulnerable/not × active/graduated
  programsByGraduation:   CompositeIndicator;  // 2 groups: with/without programs
  genderByRetention:      CompositeIndicator;  // 3 groups: M / F / null
  ageByGraduation:        CompositeIndicator & { counts: GroupedValue[] };  // 3 age bands
  inclusionTimeByCenter:  RankedItem[];         // sorted avg days per centro
  educationByPrograms:    CompositeIndicator;   // education level distribution in programs
  multiVulnConcentration: CompositeIndicator;   // 3 tiers: 0, 1, 2+ conditions
  provinceSuccessRate:    RankedItem[];         // graduated/(active+graduated) per province
  coverageByVulnerability: { pct: number; status: 'viable' | 'no-viable' };
  tutorByRetention:       CompositeIndicator;   // with/without tutor × active %
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Type-check | All new/modified files | `tsc --noEmit` — compiles without errors |
| Computation | Edge cases (null data, single participant, all-filtered-out) | Manual verification via browser console, check `status: 'no-viable'` per R1–R10 edge cases |

## Threat Matrix

N/A — route changes are within the SPA's HashRouter. No shell commands, subprocesses, VCS/PR automation, executable-file classification, or process-integration boundary is added or modified.

## Migration / Rollout

Phased as stacked-to-main PRs (chained-pr skill):

- **Phase 1** (PR #1): Create `useIndicadoresImpacto` hook + `ImpactoBoard` component. No routes or navigation changes yet.
- **Phase 2** (PR #2): Register route + tab in `IndicadoresLayout`, `router.tsx`, `routes.ts`, `Header.tsx`. Delete `SocialesBoard.tsx`. Gut `ImpactoSocial`, `ImpactSection`, `useImpactData`.
- No data migration required.

## Open Questions

- [ ] Which icon from `lucide-react` for the Impacto tab? `TrendingUp` is the default choice, but `Activity` (currently used by "Estado del Programa") or `BarChart3` may fit better.
- [ ] Should `IndicadoresFilterBar` include `showSex` for the Impacto board? Gender-composite indicators (R3) need it, but the filter bar is shared with context filtering.

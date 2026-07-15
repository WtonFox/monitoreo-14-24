# Design: Top Indicators Improvements

## Technical Approach

Six file changes — purely presentational/structural. No API, data model, or new components. Add `topCount` to the `Indicator` interface, pass `n=10` for territorial/center indicators in computations, then apply conditional rendering in 4 components to suppress duplicate or redundant UI sections.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|-------------|-----------|
| Suppression strategy | Indicator-ID-based filter | Generic `topItems` overlap detection | ID-based is O(1), explicit, testable. Overlap detection would need deep comparison of rendered data vs table data — fragile and over-engineered. |
| `topCount` propagation | New field on `Indicator` | Separate config map | Keeps N-per-indicator decision local to computation where data lives. Extra field is trivially extensible. |
| Value block guard | `!indicator.topItems?.length` | Check `indicator.value` content | The `value` string can contain mixed data (percentages + top-N formatted text). Checking `topItems` presence is the semantic signal — if structured data exists, hide the text rendering. |
| Tab collapse for ID 61 | `indicator.id !== 61` on the Top centros section | Separate ternary for layout | Minimal diff: one `filter` or inline ternary on the section element. No layout-config abstraction needed. |

## Data Flow

No new data flows. Existing data (computed via `computeIndicators`) flows unchanged:

```
computeIndicators(data)
  └─→ Indicator.topCount = 10  (for IDs 11,12,15,16,17,18,61)
  └─→ buildTopItems(record, total, topCount ?? 5)
  └─→ calcResto(record, topCount ?? 5)
       │
       ▼
IndicatorModal ─→ conditional value block + dynamic header
  ├─→ OverviewTab  ─→ filter sections by indicator.id
  ├─→ DetailTab    ─→ filter sections by indicator.id
  └─→ TrendTab     ─→ hide Top centros for id 61
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `hooks/useIndicators.ts` | Modify | Add `topCount?: number` to `Indicator` interface |
| `utils/indicator-computations.ts` | Modify | Pass `n=10` to `buildTopItems`/`calcResto` for IDs 11,12,15,16,17,18,61 |
| `components/IndicatorModal.tsx` | Modify | Wrap value block (L97-111) behind `!indicator.topItems?.length`; change "Top 5" to `Top ${indicator.topCount ?? 5}` |
| `components/indicator-modal/OverviewTab.tsx` | Modify | Filter section array in territoriales case by `indicator.id` — suppress Top Municipios (11,12), Top Centros (15,16), Top Cursos (17,18) |
| `components/indicator-modal/DetailTab.tsx` | Modify | Filter "Top listas" sub-sections — suppress Discapacidades (44), Enfermedades (46) |
| `components/indicator-modal/TrendTab.tsx` | Modify | Hide "Top centros" grid cell when `indicator.id === 61` |

## Interfaces / Contracts

```diff
 export interface Indicator {
   id: number;
   name: string;
   category: IndicatorCategory;
   value: string | number;
   topItems?: { name: string; value: number; pct?: number }[];
   resto?: number;
+  topCount?: number;
   formula: string;
   description: string;
   status: 'viable' | 'pending' | 'no-viable';
   pendingReason?: string;
 }
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Computations pass n=10 for target IDs | Assert `indicator.topItems.length === 10` for IDs 11,12,15,16,17,18,61 in test data |
| Unit | Default remains n=5 for other IDs | Assert `indicator.topItems.length <= 5` for ID 44, 46, or 21 |
| Visual | Value block hidden when `topItems` present | Render IndicatorModal with/without `topItems` — assert value text not in DOM |
| Visual | Tab sections suppressed per ID | Render each tab with matching/non-matching IDs — assert section heading absence |
| Build | TypeScript strict | `tsc --noEmit` must pass |

No test infrastructure detected in the project (`config.yaml` confirms `testing.runner: null`). Testing strategy above is aspirational — only `tsc --noEmit` is executable today.

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No migration required. All changes are client-side only — no API, no schema, no data persistence.

## Open Questions

None.

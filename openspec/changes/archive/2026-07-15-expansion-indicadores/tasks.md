# Tasks: Expansion de Indicadores (IDs 66–83)

## Review Workload Forecast

```
Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main (user chose 3 sequential PRs)
400-line budget risk: High
```

**Estimated total delta**: ~900–1200 lines across 9 files (1 new + 8 modified).  
**Recommends splitting into 3 sequential PRs** (see chain strategy below).

---

## Chain Strategy

| PR | Scope | Est. Lines | Risk |
|----|-------|-----------|------|
| **PR 1** | Foundation + Core: types, categories, routes, 18 new indicators in indicator-computations.ts | ~350–450 | Medium — big computation block but isolated, zero collision with existing code |
| **PR 2** | Boards: create CalidadIntegradaBoard, expand DesercionBoard, CentrosSinMenoresBoard, NivelEducativoBoard, DemograficosBoard, TerritorialesBoard | ~400–550 | High — most visual diff, needs careful rendering review |
| **PR 3** | Routing + Layout + Tests: update router.tsx, IndicadoresLayout.tsx, write all tests | ~150–200 | Low — mostly wiring and assertions |

**Decision needed**: Do you want 3 sequential PRs or one large PR? If sequential, start with PR 1 (`sdd-apply` on Phase 1 + Phase 2).

---

## Phase Breakdown

### Phase 1: Foundation — Types, Categories, Routes, Helpers

**4 tasks**

| # | Task | File(s) | Description | Verifiable by |
|---|------|---------|-------------|---------------|
| ✓ 1.1 | Extend `IndicatorCategory` type with `'centros-sin-menores'` and `'desercion'` | `hooks/useIndicators.ts` | Append the two new literal types to the union so TypeScript validates the expanded category set | `tsc --noEmit` passes, type union includes both new strings |
| ✓ 1.2 | Update `ROUTES.INDICADORES_CALIDAD_ND` to point to `/indicadores/calidad-dato` | `types/routes.ts` | Change the ND route constant value from `/indicadores/calidad-nd` to `/indicadores/calidad-dato` (redirect target) | Constant resolves to `/indicadores/calidad-dato` |
| ✓ 1.3 | Add `ROUTE_PERMISSIONS` entry for any new route if needed | `types/routes.ts` | Verify all affected routes have correct role permissions (no change expected — existing entries cover the merged route) | No missing permission entries |
| ✓ 1.4 | Verify `findRegion()` is importable in `indicator-computations.ts` | `utils/geoUtils.ts` | Confirm `findRegion` is exported and `REGION_PROVINCES` is stable. No code change needed — just verification that the import path works | `computeIndicators` can call `findRegion()` without errors |

### Phase 2: Core — 18 New Indicator Computations in `indicator-computations.ts`

**1 task** (large — 18 indicators, ~300 lines)

| # | Task | File(s) | Description | Verifiable by |
|---|------|---------|-------------|---------------|
| ✓ 2.1 | Append 18 new Indicator objects (IDs 66–83) after ID 65 in `computeIndicators()` | `utils/indicator-computations.ts` | — | `tsc --noEmit` passes, all 83 indicators present, 2 new buildGroup entries added |

**Sub-tasks within 2.1:**

| Sub | ID | Range | Category | Computation Details |
|-----|----|-------|----------|---------------------|
| ✓ 2.1.1 | 66 | demograficos-expansion | `demograficos` | Age-bucket distribution: count and pct for buckets 14–17, 18–20, 21–24, 25+. `topItems` with 4 entries. |
| ✓ 2.1.2 | 67 | demograficos-expansion | `demograficos` | Sex ratio (women:men) per age bucket. Handle ∞ when men=0. `topItems` per bucket with ratio. |
| ✓ 2.1.3 | 68 | demograficos-expansion | `demograficos` | Marital status × sex cross-tabulation. Group unknown sex as "Sexo desconocido". `topItems` per combination. |
| ✓ 2.1.4 | 69 | territoriales-regiones | `territoriales` | Participation by planning region using `findRegion()`. Ranked. Unmapped → "Desconocido". |
| ✓ 2.1.5 | 70 | territoriales-regiones | `territoriales` | Sex distribution per planning region (women% / men%). `topItems` per region. |
| ✓ 2.1.6 | 71 | territoriales-regiones | `territoriales` | Age distribution per region (14–17% / 18–24%). Skip zero-participant regions. |
| ✓ 2.1.7 | 72 | centros-cobertura-gap | `centros-sin-menores` | Centers without 14–17 participants per planning region. Count + pct. |
| ✓ 2.1.8 | 73 | centros-cobertura-gap | `centros-sin-menores` | YoY trend in centers without 14–17 participants. Direction label: "Mejorando" / "Empeorando" / "Sin tendencia disponible". |
| ✓ 2.1.9 | 74 | centros-cobertura-gap | `centros-sin-menores` | Province-level gap detail — provinces with highest uncovered center concentration per region. |
| ✓ 2.1.10 | 75 | desercion-analytics | `desercion` | Desertion rate per `rutaFormativa` (course). `isDesertionStatus()` reusable. Sorted desc. |
| ✓ 2.1.11 | 76 | desercion-analytics | `desercion` | Desertion rate by age bucket (14–17, 18–20, 21–24, 25+). Skip empty buckets (no denominator). |
| ✓ 2.1.12 | 77 | desercion-analytics | `desercion` | Desertion rate by sex (women, men, unknown→"Otro"). |
| ✓ 2.1.13 | 78 | desercion-analytics | `desercion` | Desertion rate per planning region via `findRegion()`. Unmapped → "Desconocido". |
| ✓ 2.1.14 | 79 | desercion-analytics | `desercion` | YoY aggregate desertion rate trend. Direction label. Single year → "Sin tendencia disponible". |
| ✓ 2.1.15 | 80 | nivel-educativo-expansion | `nivel-educativo` | Top education level per province. Province entries ranked by participant count. |
| ✓ 2.1.16 | 81 | nivel-educativo-expansion | `nivel-educativo` | Education level distribution per planning region via `findRegion()`. |
| ✓ 2.1.17 | 82 | nivel-educativo-expansion | `nivel-educativo` | Desertion correlation by `nivelEstudio` — desertion rate per education level. |
| ✓ 2.1.18 | 83 | nivel-educativo-expansion | `nivel-educativo` | YoY trend of education level distribution. Highlight top level per year. |

**All sub-tasks share these constraints**:
- Must read from `filteredData` (already the input to `computeIndicators()` — no extra plumbing)
- Must NOT modify existing indicator objects (IDs 1–65) in any way
- Must use `findRegion()` from geoUtils for all region-based aggregation
- Must reuse existing utility functions: `count`, `pct`, `safeDiv`, `formatNumber`, `formatPercentage`, `isEmptyValue`
- Must append to the `all` array *after* ID 65 objects and *before* `evaluateStatus` loop
- In-loop accumulators must be added inside the existing `for (const p of data)` loop (before line 298)
- New `buildGroup` entries must be added for `centros-sin-menores` and `desercion` categories in the groups array

### Phase 3: Boards — Create + Expand

**6 tasks**

| # | Task | File(s) | Description | Verifiable by |
|--|--|--|--|--|
| ✓ 3.1 | Create `CalidadIntegradaBoard` compositing completeness + ND metrics | `pages/indicadores/CalidadIntegradaBoard.tsx` | New board showing: (a) Completitud KPI + 6-field ranking from `boardData.qualityData`, (b) ND KPI + 11-field ranking via internal FIELDS loop (reuse logic from `CalidadNdBoard`). Visually separated sections with headers. Respects filters. Empty state. ~300+ lines. | Renders both sections independently. Completeness and ND KPIs differ and are not averaged. |
| ✓ 3.2 | Add 4 `useMemo` sections to `DesercionBoard` | `pages/indicadores/DesercionBoard.tsx` | Sections: course ranking (by rutaFormativa), age breakdown (14–17/18–20/21–24/25+), region ranking (by findRegion), trend table (year-over-year). Each section respects `filteredData`. | Sections render below existing center ranking. Course section sorts by rate descending. Age bucket with no data shows "—". |
| ✓ 3.3 | Add 2 `useMemo` sections to `CentrosSinMenoresBoard` | `pages/indicadores/CentrosSinMenoresBoard.tsx` | Sections: region gap summary (centers w/o 14–17 per region), YoY gap trend (centers count per year). Sorted by gap% desc for regions. Direction label for trend. | Region summary shows "5/20 (25.0%)" format. Trend shows "Mejorando" / "Empeorando" / "Sin tendencia disponible". |
| ✓ 3.4 | Add 4 sections to `NivelEducativoBoard` | `pages/indicadores/NivelEducativoBoard.tsx` | Sections: province breakdown (top education per province), region aggregation (per planning region), desertion correlation (per education level), trend (YoY level distribution). | Province section shows top education level with pct. Desertion correlation ranked by rate desc. |
| ✓ 3.5 | Add sections to `DemograficosBoard` | `pages/indicadores/DemograficosBoard.tsx` | Add visual blocks for: detailed age-bucket distribution (5 buckets), sex ratio per age group, marital status × sex cross-tabulation. Use existing `demographicData` from `boardData` where available, otherwise compute new. | New chart/table sections appear below existing gender/age charts. |
| ✓ 3.6 | Add region-level sections to `TerritorialesBoard` | `pages/indicadores/TerritorialesBoard.tsx` | Add region-level participation, sex distribution, and age distribution sections using `findRegion()` on `filteredData`. New `useMemo` blocks. | Region sections render with planning region names. Cibao Norte, Ozama, etc. appear as rows. |

### Phase 4: Routing — Router + Layout Updates

**2 tasks**

| # | Task | File(s) | Description | Verifiable by |
|---|------|---------|-------------|---------------|
| ✓ 4.1 | Update `router.tsx` — replace lazy imports and add redirect | `router.tsx` | Change `/calidad-nd` lazy import to render `CalidadIntegradaBoard`. Change `/calidad-dato` lazy import to also render `CalidadIntegradaBoard`. Add a `<Navigate>` redirect for `/calidad-nd` → `/calidad-dato` (or inline redirect in the old route). | Navigating to `/indicadores/calidad-nd` redirects to `/indicadores/calidad-dato`. Both routes render `CalidadIntegradaBoard`. |
| ✓ 4.2 | Update `IndicadoresLayout.tsx` — merge Calidad ND dropdown | `pages/IndicadoresLayout.tsx` | Remove `INDICADORES_CALIDAD_ND` entry from `TAB_GROUPS` "Datos y Calidad" group. Rename existing "Calidad del Dato" label. Update `MORE_TABS_COUNT` if changed. | Dropdown shows single "Calidad del Dato" entry. No separate "Calidad ND" tab. |

### Phase 5: Tests

**4 tasks**

| # | Task | File(s) | Description | Verifiable by |
|---|------|---------|-------------|---------------|
| ✓ 5.1 | Add unit tests for new indicators (IDs 66–83) | `hooks/useIndicators.spec.ts` | Add test cases: age-bucket distribution matches scenario values, sex-ratio handles zero-men case, region mapping aggregates correctly, desertion-by-course sorts desc, education level by province. | `npx vitest run hooks/useIndicators.spec.ts` passes |
| ✓ 5.2 | Add unit tests for `findRegion()` mapping | `utils/geoUtils.spec.ts` | Test: all 10 regions map correctly, unmapped province → "Desconocido", null/undefined → "Desconocido", case-insensitive matching works. | `npx vitest run` passes for the test file |
| ✓ 5.3 | Add integration test for `CalidadIntegradaBoard` | `pages/indicadores/CalidadIntegradaBoard.spec.tsx` | Mount with mock `boardData` containing both `qualityData` and FIELDS enumeration. Verify completeness KPI renders independently from ND KPI. Verify empty state shows "Sin datos". | Test passes, both sections render with correct values |
| ✓ 5.4 | Snapshot test: verify IDs 1–65 values unchanged after expansion | `hooks/useIndicators.spec.ts` | Call `computeIndicators()` with a known dataset. Assert that indicator IDs 1–65 produce expected values, confirming zero-collision with new 18 indicators. | All 65 IDs present, key indicators match expected values |

---

## Execution Order

```
Phase 1 (Foundation) ──→ Phase 2 (Core) ──→ Phase 3 (Boards) ──→ Phase 4 (Routing) ──→ Phase 5 (Tests)
      1.1–1.4                 2.1               3.1–3.6              4.1–4.2                5.1–5.4
```

- **PR 1**: Phase 1 + Phase 2 (foundation + core computations)
- **PR 2**: Phase 3 (all board work)
- **PR 3**: Phase 4 + Phase 5 (wiring + tests)

---

## Total Tasks

| Phase | Tasks | Est. Lines |
|-------|-------|-----------|
| Phase 1: Foundation | 4 | ~10–30 |
| Phase 2: Core (18 indicators) | 1 (with 18 sub-tasks) | ~280–380 |
| Phase 3: Boards | 6 | ~450–600 |
| Phase 4: Routing | 2 | ~30–50 |
| Phase 5: Tests | 4 | ~150–200 |
| **Total** | **17** | **~920–1260** |

---

## Next Step

**Decision needed before apply**: Which PR strategy?

1. **Single PR** — all 5 phases at once (~1000+ lines). Risky review.
2. **3 sequential PRs** — PR 1 (Phases 1+2), then PR 2 (Phase 3), then PR 3 (Phases 4+5). Recommended.

Respond with your choice, then launch `sdd-apply` for the first PR's tasks.

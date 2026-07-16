# Tasks: 06-dashboard-configurable

| Review Workload Forecast | |
|---|---|
| Estimated changed lines | ~170 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Delivery strategy | single-pr |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

## Phase 1: Foundation

- [ ] 1.1 Create `constants/widgets.ts` — export `WidgetDefinition` interface, `WIDGET_CATALOG` array (12 entries with `id`, `label`, `defaultVisible: true`), and `DEFAULT_VISIBLE_WIDGET_IDS` helper (~30 lines)
- [ ] 1.2 Import `persist` from `zustand/middleware`; add `visibleWidgetIds: string[]` (default all IDs), `toggleWidget(id)` (min 1 guard), `resetWidgets()`. Wrap store in `persist(create(...), { name: 'ui-store', partialize })` (~15 new lines)

## Phase 2: Components

- [ ] 2.1 Extend `ChartsSectionProps` with `visibleWidgetIds: string[]` (default all IDs). Add `visibleSet = new Set(visibleWidgetIds)`. Guard each of the 12 widget blocks with `visibleSet.has('widget-id')` via JSX fragment wrappers. No `useMemo` changes (~30 new lines)
- [ ] 2.2 Create `components/DashboardEditor.tsx` — modal (backdrop + centered panel) following AdvancedFiltersModal pattern. Renders all 12 widgets from `WIDGET_CATALOG` with toggle buttons. Includes "Restablecer widgets" button. Changes apply immediately via `onToggleWidget`/`onReset` props (~80 lines)

## Phase 3: Wiring

- [ ] 3.1 `pages/Estadisticas.tsx` — add `useState(false)` for editor open state. Import DashboardEditor and useUiStore. Pass `visibleWidgetIds`, `toggleWidget`, `resetWidgets` to DashboardEditor. Add "Configurar dashboard" button in the header area. Wire `visibleWidgetIds` prop to `<ChartsSection>` (~15 new lines)

**Implementation order:** 1.1 → 1.2 → 2.2 → 2.1 → 3.1

**Files Summary:** 2 created (constants/widgets.ts, components/DashboardEditor.tsx), 3 modified (stores/uiStore.ts, components/ChartsSection.tsx, pages/Estadisticas.tsx). Total ~170 lines.

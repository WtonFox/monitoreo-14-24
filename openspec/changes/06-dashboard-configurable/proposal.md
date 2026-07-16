# Proposal: Dashboard Configurable

## Intent

Users currently see all 12 chart widgets on the dashboard regardless of relevance to their workflow. Let each user choose which widgets appear, persisted to localStorage so their selection survives reloads.

## Scope

### In Scope
- Define widget IDs + labels as a shared constant (`WIDGET_DEFINITIONS`)
- Add `visibleWidgets: string[]` to `uiStore` with Zustand `persist` middleware
- Refactor `ChartsSection` to read `visibleWidgets` and render only selected widgets
- Create `DashboardEditor` component (modal with toggle switches for each widget)
- Add "Configurar dashboard" button in `Estadisticas.tsx`

### Out of Scope
- Drag-and-drop reordering (v1: fixed order, toggle only)
- Per-role or per-user-server widget sets
- Adding/removing widgets from a server-side config

## Capabilities

### New Capabilities
- `dashboard-configurable`: Users may toggle visibility of each chart widget on the main dashboard, persisted locally. Provides `DashboardEditor` modal, `visibleWidgets` state, and conditional rendering in `ChartsSection`.

### Modified Capabilities
- None — no existing spec-level behavior changes

## Approach

1. Create `constants/widgets.ts` — export `WIDGET_DEFINITIONS` array with `{ id, label, icon }` for all 12 widgets
2. Extend `uiStore.ts` — wrap with `persist` middleware, add `visibleWidgets: string[]` (default all IDs), `toggleWidget(id)`, `isWidgetVisible(id)` getter
3. Refactor `ChartsSection.tsx` — wrap each widget block with a guard checking `isWidgetVisible(id)`. Keep all `useMemo` computations but skip render when hidden
4. Create `components/DashboardEditor.tsx` — modal with a list of toggle switches. Opens/closes via `uiStore` `isEditorOpen` prop or local state
5. Update `Estadisticas.tsx` — add "Configurar dashboard" button before `<ChartsSection>`, wire to open the editor

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `constants/widgets.ts` | **New** | Widget ID/definition constant |
| `stores/uiStore.ts` | **Modified** | Add persist middleware + visibleWidgets state |
| `components/ChartsSection.tsx` | **Modified** | Conditional render per widget |
| `components/DashboardEditor.tsx` | **New** | Toggle-switch modal |
| `pages/Estadisticas.tsx` | **Modified** | Add config button + editor state |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Persist middleware not yet imported in uiStore | Low | `zustand/middleware` is already in `package.json` from Zustand migration |
| Widget hidden but its data still computed | Low | Move guards before each `useMemo` / render block; hidden = skip fully |
| localStorage key collision with other persist stores | Low | Use unique store name `ui-store` in persist config |

## Rollback Plan

Revert individual file changes:
- Remove `constants/widgets.ts`
- Revert `uiStore.ts` to current non-persisted version (remove `visibleWidgets` and persist wrapper)
- Revert `ChartsSection.tsx` to unconditional rendering
- Remove `DashboardEditor.tsx`
- Revert `Estadisticas.tsx` (remove config button)

## Dependencies

- None. Zustand and `zustand/middleware` already in the dependency tree.

## Success Criteria

- [ ] All 12 widgets toggle independently in DashboardEditor modal
- [ ] Hidden widgets disappear from dashboard immediately on toggle
- [ ] Widget visibility survives page reload (localStorage)
- [ ] No console errors or data computation for hidden widgets

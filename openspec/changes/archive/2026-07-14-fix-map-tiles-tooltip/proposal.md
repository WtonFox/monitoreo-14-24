# Proposal: Fix Map Tiles Loading & Mobile Tooltip

## Intent

Two distinct UX bugs in the map section:
1. **Tiles don't load** — CSP `img-src` blocks OpenStreetMap tile images (polygons render as SVG, so the map looks almost functional but tiles are missing).
2. **Tooltip doesn't work on mobile** — the floating hover tooltip relies on `mouseover`/`mouseout`, which never fire on touch devices. Users on phones see no location info at all.

## Scope

### In Scope
- Fix CSP to allow OSM tile images
- Replace mobile-broken hover tooltip with a tap-to-select info box in the sidebar
- Move `useMapStats` from `DominicanRepublicMap` to `MapSection` so both map and info box share the data
- Add `click` handler on GeoJSON polygons for location selection
- Info box shows: location name, participants, %, age range, gender, top statuses, top centers

### Out of Scope
- Pin view (`viewMode='pin'`) — only affects polygon mode
- Swiping between info box and filters — user toggles via tap or close button
- Persisting selected location across page reloads

## Capabilities

### New Capabilities
- `map-location-info`: Panel that replaces the filter sidebar when a map location is tapped/clicked. Displays aggregated stats for that location. Dismisses on close button or re-tap.

### Modified Capabilities
- None — `indicators-board` is unrelated; no spec-level behavior changes in existing capabilities.

## Approach

1. **CSP fix** — `index.html` line 7: change `img-src 'self' data:` to `img-src 'self' data: https://*.tile.openstreetmap.org`
2. **Extract `useMapStats`** — move from `DominicanRepublicMap` up to `MapSection`. Pass `{ mapData, locationStats, getColor, maxCount }` as props to the map.
3. **Add `onLocationSelect` callback** — `DominicanRepublicMap` fires it on GeoJSON `click` (keeps existing hover for desktop). `MapSection` receives it.
4. **Add `selectedLocation` state** in `MapSection` — when set, renders `LocationInfoBox` instead of `MapFilters`. Clicking same location or close button clears it.
5. **Create `LocationInfoBox`** — new `components/LocationInfoBox.tsx`. Uses `locationStats` data. Shows name, total, %, age, gender, status breakdown, top centers.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `index.html` | Modified | Add `https://*.tile.openstreetmap.org` to CSP `img-src` |
| `components/MapSection.tsx` | Modified | Extract useMapStats, add selectedLocation state, conditional filter/info render |
| `components/DominicanRepublicMap.tsx` | Modified | Accept stats as props, add click handler, keep hover for desktop |
| `components/LocationInfoBox.tsx` | New | Info box component with location stats display |
| `hooks/useMapStats.ts` | Unchanged | Already self-contained, usable from MapSection as-is |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Props refactor breaks map rendering | Low | Keep existing interface alongside new props; verify both pin and polygon modes |
| Click handler conflicts with existing hover on desktop | Low | click is additive — hover/click coexist, no interference |
| Info box shows stale data on rapid taps | Low | React re-render handles it; useMemo guards |

## Rollback Plan

Revert commits per file:
1. `git revert <commit>` for `index.html` CSP change
2. `git revert <commit>` for the MapSection+MapInfoBox refactor
3. If urgent: restore `DominicanRepublicMap` to original props and call `useMapStats` internally again

## Dependencies

None — all Leaflet event APIs are already available in the current version.

## Success Criteria

- [ ] Map tiles render visible on first load (check DevTools Network tab for 200 from `tile.openstreetmap.org`)
- [ ] Tapping a province/municipality on mobile opens the info box with correct stats
- [ ] Clicking a polygon on desktop opens the info box (hover tooltip still works as preview)
- [ ] Close button / re-tap on same location restores the filter sidebar
- [ ] Info box shows: name, participants, %, age range, gender breakdown, top statuses, top centers
- [ ] No console errors related to CSP or Leaflet events

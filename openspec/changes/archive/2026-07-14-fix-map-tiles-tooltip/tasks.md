# Tasks: Fix Map Tiles & Mobile Tooltip

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~130–160 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR (6 commits) |
| Delivery strategy | auto-forecast → single-pr |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: single-pr
400-line budget risk: Low

## Phase 1 — CSP Fix

- [x] 1.1 `index.html` l.7: add `https://*.tile.openstreetmap.org` to `img-src`

## Phase 2 — Foundation

- [x] 2.1 Create `components/LocationInfoBox.tsx` — name, total, %, age, gender, top 3 statuses, top 3 centers, close button. Handle zero-participant edge case.

## Phase 3 — Refactor

- [x] 3.1 `DominicanRepublicMap.tsx`: accept optional `mapData`, `locationStats`, `getColor`, `maxCount`, `onLocationSelect` props. Skip internal hook when external props provided. Add `click` handler in `onEachFeature`.
- [x] 3.2 `MapSection.tsx`: import & call `useMapStats(filteredData, mapLevel, selectedProvince)`. Pass `mapData`, `locationStats`, `getColor`, `maxCount` to map.

## Phase 4 — Integration

- [x] 4.1 `MapSection.tsx`: add `selectedLocation` state + `handleLocationSelect` toggle (re-tap deselects). Pass `onLocationSelect` to map.
- [x] 4.2 `MapSection.tsx`: conditional render — `LocationInfoBox` when selected, else `MapFilters`.

## Phase 5 — Verification

- [x] 5.1 Run `tsc --noEmit` — verify optional props compile for ChartsSection call site
- [x] 5.2 Run `npm run build` — verify production bundle succeeds

## Commit Plan

| Commit | Tasks |
|--------|-------|
| `fix: add OSM tiles to CSP img-src` | 1.1 |
| `feat: create LocationInfoBox component` | 2.1 |
| `refactor: accept optional stats props in map` | 3.1 |
| `refactor: lift useMapStats to MapSection` | 3.2 |
| `feat: add location selection and conditional sidebar` | 4.1, 4.2 |
| `chore: verify types and build` | 5.1, 5.2 |

## Key Design Decisions

- **Re-tap in MapSection**: Map fires `onLocationSelect(name)` on every click; parent compares with `selectedLocation` to toggle. Map stays stateless.
- **Percentage in LocationInfoBox**: computed from `stats.total / totalParticipants` — not received as prop, avoiding coupling to a derived field `useMapStats` doesn't produce.
- **Optional fallback**: `DominicanRepublicMap` keeps internal `useMapStats` call; external props override it via `??`. `ChartsSection` unaffected.

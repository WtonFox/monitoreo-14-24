# Design: Fix Map Tiles Loading & Mobile Tooltip

## Technical Approach

Two-pronged fix: (1) one-line CSP update in `index.html` to unblock OSM tiles; (2) lift `useMapStats` from `DominicanRepublicMap` to `MapSection`, add tap/click selection on GeoJSON polygons, and render a new `LocationInfoBox` in the sidebar as a mobile-friendly replacement for the hover tooltip. The new map props are **optional** — `ChartsSection` (which uses `DominicanRepublicMap` with `viewMode='pin'`) keeps working unchanged via internal fallback.

## Architecture Decisions

### Decision: Lifting Stats vs Exposing via Ref/Callback

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Lift `useMapStats` to MapSection, pass stats as props | Clean unidirectional data flow; both `DominicanRepublicMap` and `LocationInfoBox` share same computed data | ✅ **Chosen** |
| Keep `useMapStats` inside map, expose via ref/callback | More indirection, breaks React data-flow conventions; harder to test | Rejected |

### Decision: Backward-Compatible Props Interface

| Option | Tradeoff | Decision |
|--------|----------|----------|
| New props optional — fallback to internal `useMapStats` | ChartsSection (line 236) unaffected; DominicanRepublicMap works standalone as before | ✅ **Chosen** |
| Require all callers to provide stats | Forces changes to ChartsSection which is out of scope | Rejected |

When `mapData` prop is provided, the map skips its internal `useMapStats` call and uses the parent's values. `onLocationSelect` is also optional — when absent, no click handler is registered.

### Decision: Click vs Hover Coexistence

**Choice**: Add `click` event in `onEachFeature` alongside existing `mouseover`/`mousemove`/`mouseout`. On desktop, hover still shows the floating tooltip as a preview. Click (tap or mouse) selects the location and opens the info box. The two events are independent — clicking doesn't suppress hover, and hovering doesn't trigger selection.

### Decision: CSP Change Safety

**Choice**: `img-src 'self' data: https://*.tile.openstreetmap.org` — minimal addition, same domain pattern OSM recommends. Wildcard covers all subdomains (`a`, `b`, `c`). Risk: if OSM tiles move to a different domain, CSP needs updating. Mitigation: trivial one-line fix, no rollout needed.

## Data Flow

```
MapSection
  │
  ├─ useMapStats(filteredData, level, selectedProvince)
  │    └─→ { mapData, locationStats, maxCount, getColor }
  │
  ├─ selectedLocation: string | null  (useState)
  │
  ├─ [Always] Map Controls Card ─── level toggle (region/prov/mun)
  │
  ├─ [selectedLocation ? LocationInfoBox : MapFilters]
  │    ├─ LocationInfoBox
  │    │    props: { locationName, totalParticipants, stats, level, onClose }
  │    │    stats = locationStats[selectedLocation]
  │    │
  │    └─ MapFilters (unchanged props)
  │
  ├─ [Always] Stats Summary Card (unchanged)
  │
  └─ DominicanRepublicMap
       new props: { mapData, locationStats, getColor, maxCount, onLocationSelect }
       existing props: { data, showLabels, viewMode, level, selectedProvince, selectedMunicipality }
         │
         └─ onEachFeature.click → onLocationSelect(locationName)
              (re-tap same → onLocationSelect(null))
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `index.html` | Modify | Line 7: `img-src` add `https://*.tile.openstreetmap.org` |
| `components/MapSection.tsx` | Modify | Lift `useMapStats` call, add `selectedLocation` state, conditional render of `LocationInfoBox` vs `MapFilters`, pass new props to map |
| `components/DominicanRepublicMap.tsx` | Modify | Accept optional `mapData`/`locationStats`/`getColor`/`maxCount` props (skip internal hook when provided); add optional `onLocationSelect` plus click handler in `onEachFeature` |
| `components/LocationInfoBox.tsx` | **Create** | New component — receives location stats, renders name/count/%/age/gender/status/centers, close button calls `onClose` |
| `hooks/useMapStats.ts` | Unchanged | Already stateless, no changes needed |

## Interfaces / Contracts

### New props on `DominicanRepublicMap`

```typescript
interface DominicanRepublicMapProps {
    // existing (unchanged)
    data: Participant[];
    showLabels: boolean;
    viewMode: 'pin' | 'polygon';
    level?: 'region' | 'province' | 'municipality';
    selectedProvince?: string | null;
    selectedMunicipality?: string | null;

    // NEW — optional. When provided, skip internal useMapStats.
    mapData?: Record<string, number>;
    locationStats?: Record<string, LocationStats>;
    getColor?: (count: number, useLocalScale?: boolean) => string;
    maxCount?: number;

    // NEW — optional callback
    onLocationSelect?: (locationName: string | null) => void;
}
```

### `LocationInfoBox` props

```typescript
interface LocationInfoBoxProps {
    locationName: string;
    totalParticipants: number;       // total in the map (for % calc)
    stats: {                         // locationStats[locationName]
        total: number;
        percentage: number;
        genderBreakdown: { M: number; F: number; other: number };
        ageRanges: { min: number; max: number; avg: number };
        statusBreakdown: Record<string, number>;
        topCenters: { name: string; count: number }[];
    };
    level: 'region' | 'province' | 'municipality';
    onClose: () => void;
}
```

Where `LocationStats` is the per-location shape already defined by `useMapStats` (from `hooks/useMapStats.ts`).

### New state in `MapSection`

```typescript
const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Type-check | All files compile | `tsc --noEmit` — catches prop interface mismatches |
| Build | App bundles without errors | `npm run build` — Vite production build |
| Visual (manual) | MapSection: tiles load, tap selects, info box renders, close restores filters, desktop hover still works | DevTools Network + responsive mode |
| Visual (manual) | ChartsSection: map still renders polygons and pins with correct colors | Navigate to charts page |

No automated test runner exists in the project (per `openspec/config.yaml`).

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No migration required. The CSP change takes effect on next deploy. New components render only when `selectedLocation` is set (initially `null`), so the existing UX is preserved until a user taps/clicks a polygon. Rollback: revert commits or restore `DominicanRepublicMap` to original props and internal `useMapStats` call.

## Open Questions

- [ ] The floating hover tooltip currently renders at the bottom on mobile (`fixed bottom-0 left-0 right-0`). After this change, the tooltip will still appear briefly on mobile before a user taps — should we suppress it on touch devices to avoid double-render? (Spec R4 says hover must coexist, but on mobile the floating tooltip was a broken UX band-aid.)

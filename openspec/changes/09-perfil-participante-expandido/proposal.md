# Proposal: Perfil de Participante Expandido

## Intent

The participant detail modal shows a flat list of fields with a few badge chips. Users lack spatial awareness of the participant's journey — how long ago they registered, when they were included, how their timeline relates to today. This proposal adds a visual timeline and reorganizes the modal for better scanning.

## Scope

### In Scope
- New `components/ParticipantTimeline.tsx` — visual SVG/CSS timeline
- Integrate timeline into `ParticipantDetailModal` header area
- Milestones: fechaRegistro, fechaInclusion, edadAlRegistrar, line to today
- Color-code timeline states by participant `estado` (Activo → green, Egresado → blue, etc.)
- Layout polish: move derived metrics into timeline, collapse large sections, better use of horizontal space

### Out of Scope
- Edit/update participant from modal (remains read-only)
- API or data-fetch changes to support the timeline
- User-configurable timeline preferences (deferred — `uiStore` profile prefs are future work)

## Capabilities

### New Capabilities
None — no standalone capability added.

### Modified Capabilities
- `participant-detail-modal`: R6 Grid layout — timeline becomes a new visual section between header and field grid. Existing R1-R5 (open/close/display/null/zero-fetch) unchanged.

## Approach

1. **Create `ParticipantTimeline.tsx`**: Pure presentational component. Accepts `fechaRegistro`, `fechaInclusion`, `edadRegistro`, `estado`. Renders a vertical timeline with:
   - Start node: "Registrado" (fechaRegistro)
   - Middle node: "Incluido" (fechaInclusion) — if present
   - Age-at-registration badge alongside start node
   - Connecting line extending to today
   - Color mapping based on estado (4-5 states max)
2. **Update `ParticipantDetailModal.tsx`**: Replace current derived-metrics badge bar with the timeline. Keep existing field sections unchanged below.
3. **Styles**: Pure Tailwind — no runtime CSS-in-JS.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `components/ParticipantDetailModal.tsx` | Modified | Integrate timeline, rework header |
| `components/ParticipantTimeline.tsx` | **New** | Visual timeline component |
| `openspec/specs/participant-detail-modal/spec.md` | Modified | R6 layout spec update |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Timeline breaks on null/future dates | Med | Guard with `isNaN()` checks, fallback to single-node view |
| Color mapping mismatch with estados | Low | Use same estado strings from `Participant.estado` — no new mapping |

## Rollback Plan

Revert `ParticipantDetailModal.tsx` to previous commit and delete `ParticipantTimeline.tsx`. No migration needed — data unchanged.

## Dependencies

- Existing `Participant` type (already has `fechaRegistro`, `fechaInclusion`, `edadRegistro`, `estado`)

## Success Criteria

- [ ] Timeline renders with correct milestones for every participant state
- [ ] Color-coding matches participant estado (green/gray/blue/red)
- [ ] Null/missing dates collapsed gracefully (shorter timeline, no gaps)
- [ ] Modal layout feels more spacious and scannable than current version

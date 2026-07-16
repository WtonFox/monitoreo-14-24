# Tasks: Perfil de Participante Expandido

## Review Workload Forecast

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

| Field | Value |
|-------|-------|
| Estimated changed lines | 130–180 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Timeline component + modal integration + spec | PR 1 | `tsc --noEmit` | Open modal on any participant in DataTable | Revert `ParticipantDetailModal.tsx` + delete `ParticipantTimeline.tsx` |

## Phase 1: Timeline Component

- [x] 1.1 Create `components/ParticipantTimeline.tsx` — pure presentational vertical timeline with: milestone nodes (Registrado, Incluido, Hoy), SVG/CSS connecting line, edad-al-registrar badge, color-coded dots by `estado` (Activo→green, Egresado→blue, default→gray)
- [x] 1.2 Export component with props `{ fechaRegistro, fechaInclusion, edadRegistro, estado }`; guard null/future dates with `isNaN` checks, fallback to single-node view when no valid dates

## Phase 2: Modal Integration

- [x] 2.1 Import `ParticipantTimeline` into `ParticipantDetailModal.tsx`; remove derived-metrics badge bar; render `<ParticipantTimeline>` below the header gradient bar
- [x] 2.2 Tweak modal body spacing after replacement — changed `space-y-8` to `space-y-6` for tighter rhythm

## Phase 3: Spec & Build

- [x] 3.1 Update `openspec/specs/participant-detail-modal/spec.md` — added R7 section with timeline milestone display, estado color-coding, null date fallback, and missing-inclusion scenarios
- [x] 3.2 Run `npm run build` to confirm zero type/compile errors

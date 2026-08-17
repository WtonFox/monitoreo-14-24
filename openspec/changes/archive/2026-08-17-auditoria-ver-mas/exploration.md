# Exploration: auditoria-ver-mas — "Ver más" modals + Q3 heuristic

**Verdict up front**: The "Ver más" modal feature needs ZERO new data-layer work — every signal in `AuditSignals` already carries its full, uncapped array (archive note confirmed "data layer uncapped"). The repo has NO shared modal primitive, so the change introduces one small local modal component following the established hand-rolled overlay recipe (`IndicatorModal`/`ParticipantDetailModal`). Q3 is implementable as a labeled heuristic using only existing variables: identity groups are already built inside `computeAuditSignals`, and `isGraduatedStatus` exists in `utils/normalize.ts`. Total change is borderline for the 400-line review budget → recommend 2–3 chained PR slices.

## Current State

`AuditoriaBoard.tsx` (pages/indicadores) computes 8 signals via a single `useMemo` → `computeAuditSignals(filteredData, corruptedItems, syncStats)` and renders:
- 8 KPI cards (top grid).
- 7 list-bearing `SignalCard` drill-downs (Duplicados de carga, Multi-ruta Q1, Re-inscripción Q2, ND Cédula, Anomalías fecha/edad, Vocabulario de estados, Corruptos) — each caps its list at `LIST_LIMIT = 50` with a passive `MoreNotice` ("…y N más").
- 1 count-only card (Centinelas — NOT list-bearing; correctly excluded from the user's 7-signal list).
- 1 static Q3 callout (AUD-10): "no respondible sin fecha de egreso".

## 1. Modal patterns in the repo

**There is no reusable modal primitive.** 16 overlays are hand-rolled across `components/`, `pages/`, and `App.tsx`, all sharing the same Tailwind recipe:

| Element | Convention |
|---|---|
| Backdrop | `fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4` (some `bg-opacity-50`) |
| Close on backdrop | `onClick={e => { if (e.target === e.currentTarget) onClose(); }}` |
| Panel | `bg-white rounded-2xl shadow-2xl max-w-* w-full max-h-[85vh] overflow-y-auto` + `animate-in fade-in zoom-in duration-200` (tailwindcss-animate) |
| Header | Title + lucide `X` close button; colored top border/accent |
| Escape | `window.addEventListener('keydown', ...)` → `onClose()` (IndicatorModal); `document` + focus close button (ParticipantDetailModal) |
| Body scroll lock | `document.body.style.overflow = 'hidden'` in IndicatorModal only (not universal) |
| Portals | **None** — no `createPortal`, no mount point in `App.tsx`; modals render inline in the component tree. z-index convention `z-50` (exceptions: MapInfoModal `z-[2000]`, ExportPDFButton/SyncStatus `z-[60]`) |

**Best pattern matches:**
- `components/IndicatorModal.tsx` — closest UX: title bar + icon + X close, scrollable `max-h-[85vh] overflow-y-auto` body, Escape + backdrop close, footer Cerrar button. NOT reusable as-is: coupled to `Indicator`/`BoardData`/export pipeline.
- `components/ParticipantDetailModal.tsx` — adds accessibility: `role="dialog" aria-modal="true"`, `aria-label`, focus on close button. Its `isOpen`/`onClose`/`participant` prop shape is the cleanest conditional-render contract.
- `components/BoardInfo.tsx` (line 57) — small overlay already used on this board; info-only, not a list container.

**Recommendation**: create ONE small component, e.g. `components/auditoria/AuditListModal.tsx`, with props `{ title: string; icon: React.ReactNode; tone: string; count?: string; onClose: () => void; children: React.ReactNode }`, implementing the recipe above (Escape + backdrop + X + body scroll lock + `max-h-[85vh] overflow-y-auto`, `role="dialog" aria-modal="true"`). Rendered inline from the board (no portal — matches repo convention). This keeps `SignalCard` untouched and gives all 7 signals the same modal affordance.

## 2. Data shapes per signal — what a full-list modal renders

All source arrays are already complete in `AuditSignals` (no new computation needed for the modal):

| Signal | Full list source (exact type) | Row content in modal |
|---|---|---|
| Duplicados de carga | `duplicados: DuplicateGroup[]` = `{ identity, ruta, rows: Participant[], fechas: string[], cedulaConfirmada: boolean }` | name (`personName(rows)`), ruta, N filas, IDs, fechas, cédula-confirmada note |
| Multi-ruta (Q1) | `q1: Q1Candidate[]` = `{ identity, rutas: string[], rows: Participant[], cedulaConfirmada: boolean }` | name, rutas (joined), N filas, cédula-confirmada note |
| Re-inscripción (Q2) | `q2: Q2Candidate[]` = `{ identity, ruta, rows: Participant[], fechas: string[] }` | name, ruta, fechas, N filas |
| ND Cédula | `ndCedula.rows: Participant[]` | `#id`, name, cedula |
| Anomalías fecha/edad | merged 4 arrays of `Anomalia` = `{ row: Participant }` + per-sub-check reason (futura / inclusionPrevia / edadMismatch / edadRegistroMenor) | `#id`, name, reason |
| Vocabulario de estados | `vocabulario.valores` filtered `!conocido` = `{ valor, count, conocido }[]` | valor + count filas (distinct values, not rows) |
| Corruptos | `corruptos.items: { id: number; reason: string }[]` | `#id` + reason |
| Centinelas | `centinelas: { centro, estado, provincia, rutaFormativa }` — **counts only, no row lists** | not list-bearing — excluded (matches the user's 7-signal list) |

`Participant` fields available for richer rows: `id, nombres, apellidos, cedula, estado, rutaFormativa, fechaRegistro, fechaInclusion, fechaNacimiento, edad, provincia, municipio, centro, ...` — **no `fechaEgreso`, no history arrays** (confirmed in `types.ts`).

## 3. Q3 heuristic — options with tradeoffs

Existing building blocks: `isGraduatedStatus(estado)` in `utils/normalize.ts` (substring match `'egresado'`/`'egresada'` → covers "Egresado pasantía" and "Egresado fase lectiva"), the `groups: Map<identity, Participant[]>` already built in `computeAuditSignals`, and full `Participant` rows (rutas, estados, fechas).

| Option | Rule | Pros | Cons | Effort |
|---|---|---|---|---|
| **A. Any egresado row (recommended)** | identity with ≥2 rows AND ≥1 row where `isGraduatedStatus(estado)` | Reuses `groups` Map directly (O(n), no new pass); strongest interpretable signal; distinct lens from Q1/Q2; trivial to explain | Overlaps Q1/Q2 by design (same person may appear in both — acceptable, different question); cannot confirm a *second* graduation — only repeated registration containing an egresado row | Low |
| B. Egresado + multi-ruta | ≥2 rows across ≥2 rutas AND ≥1 egresado row | Narrower, more "plausible" story (route switch + graduation) | Misses same-route re-enrollments; extra condition complexity; heavy overlap with Q1 | Low |
| C. Distinct egresado estados | ≥2 rows with ≥2 *distinct* egresado estados | Would directly suggest repeated graduation | NOT implementable meaningfully: a person graduating twice typically shows the same estado string twice; no `fechaEgreso` to differentiate | Low (but meaningless) |

**Recommendation: Option A.** Compute inside `computeAuditSignals` (pure function → unit-testable, respects filters automatically, zero extra passes since `groups` exists). New field `q3: Q3Candidate[]` on `AuditSignals`, where `Q3Candidate = { identity: string; rows: Participant[]; rutas: string[]; estados: string[]; fechas: string[]; cedulaConfirmada: boolean }`. Candidate row shows: name, N filas, rutas, estados (incl. which are egresado), fechas (`fechaRegistro`), cédula-confirmada.

**Mandatory labeling (AUD-12 extension)**: badge "candidato" + caveat — "sin fecha de egreso no se confirma un segundo egreso; solo registros repetidos con estado egresado, puede existir homonimia". Never an assertion. The AUD-10 static callout is REPLACED by this candidate card (spec change: AUD-10 MODIFIED + AUD-12 extended).

## 4. Scoping & slice estimate

Files touched: `utils/auditSignals.ts` (Q3 type + logic), `utils/auditSignals.spec.ts` (Q3 unit tests), `components/auditoria/AuditListModal.tsx` (new), `pages/indicadores/AuditoriaBoard.tsx` (LIST_LIMIT 50→15, Ver más button per card, modal state + content, Q3 card), `pages/indicadores/AuditoriaBoard.spec.tsx` (modal open/close + Q3 card), OpenSpec docs (Spanish per repo convention).

| Slice | Content | Est. changed lines |
|---|---|---|
| S1 | Q3 heuristic in `auditSignals.ts` + unit specs (pure logic) | ~100–120 |
| S2 | `AuditListModal.tsx` + LIST_LIMIT 50→15 + "Ver más" on all 7 list cards + board spec (modal open/close) | ~310–360 (borderline; may need size:exception or split S2a candidate-cards / S2b remaining cards) |
| S3 | Q3 candidate card in board (replaces callout) + board spec updates | ~120–150 |

**Total ~530–630 changed lines → 2–3 chained PRs (feature-branch-chain, same as auditoria-datos).** The modal infra (S2) is the bulk; Q3 logic (S1) is cleanly separable as a pure-utils slice.

## Recommendation

1. **Modal**: new `components/auditoria/AuditListModal.tsx` following the IndicatorModal recipe + ParticipantDetailModal a11y; rendered inline (no portal). Props: `{ title, icon, tone, count?, onClose, children }`.
2. **Ver más button**: per SignalCard, shown when the list is non-empty (open modal with FULL list). LIST_LIMIT 50 → 15.
3. **Q3**: Option A heuristic inside `computeAuditSignals` → `q3` field; candidate card replaces the static callout, with AUD-12 caveat.
4. **Delivery**: 2–3 chained PRs per the slice table.

## Risks

- **ND Cédula scale**: at 42% of the full 70,283-row dataset the modal would render ~29.5k `<li>` — heavy but workable in one scrollable paint; if slow, follow-up pagination/virtualization (same follow-up the archive flagged for LIST_LIMIT).
- **Q3 ↔ Q1/Q2 overlap**: by design (different question, same people); must be labeled clearly to avoid confusion.
- **Stale modal on filter change**: modal should close when `filteredData` changes (useEffect) to avoid showing a stale full list.
- **Vocabulario modal shows distinct values, not rows** — consistent with the card, but differs from the other 6 lists; surface in spec scenarios.
- **Windows vitest worker crash** (known infra): focused gates only; full suites not runnable.
- **e2e generator identity repetition** (~10 extra Q1 candidates) is harmless for `navigation.spec.ts` (title-only assertions), but any future count assertions must account for it.

## Ready for Proposal

**Yes.** Modal feature needs no data-layer change; Q3 (Option A) is implementable from existing variables with the AUD-12 candidate labeling. Tell the user: modal infra + all 7 "Ver más" + Q3 candidate card fit in 2–3 chained PRs (~600 lines total); Q3 stays explicitly labeled "candidato" — it flags repeated registration with an egresado estado, it cannot prove a second graduation (no `fechaEgreso`).
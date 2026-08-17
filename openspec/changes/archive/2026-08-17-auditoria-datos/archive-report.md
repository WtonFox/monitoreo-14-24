# Archive Report: auditoria-datos

**Archived**: 2026-08-17
**Change**: Auditoría y Calidad de Datos (AuditoriaBoard)
**Status**: success — intentional-with-warnings
**Mode**: both (OpenSpec + Engram)

## Summary

New capability `auditoria-datos`: a self-contained `AuditoriaBoard` under `/indicadores` (board "Auditoría", tab in the "Datos y Calidad" group) that audits dataset quality with 8 signals — carga duplicates, multi-route (Q1), re-inscription candidates (Q2), ND cédula, date/age anomalies, status vocabulary, sentinels, and corrupted records — plus a callout stating Q3 (repeated graduation) is not answerable without `fechaEgreso`. Q1/Q2 are heuristics over normalized identity (`nombres + apellidos`, cédula as secondary confirmation) and SHALL always be reported as candidate lists with caveats, never as assertions. Extends R11 of `indicators-board` (route + tab) without touching `computeIndicators` or `routeBoardMap`.

## Verification Summary (FINAL STATE)

- **Verdict**: ✅ PASS WITH WARNINGS — 13/13 requirements, 29/29 scenarios compliant
- **Verified TWICE**:
  1. Original pre-merge verification (before PR #15).
  2. Post-merge refresh against merged HEAD `4bd1a6a6` ("Merge pull request #15") — implementation byte-identical, only git history advanced; fresh evidence revision `sha256:837df2f8...` computed over re-run gates.
- **Gates re-run @ 4bd1a6a** (focused, per the Windows vitest worker-crash constraint):
  - `npm run typecheck` → exit 0
  - `npm run build` → exit 0 (vite 2704 modules, 16.08s)
  - unit (auditIdentity + auditSignals) → 33/33 PASS
  - integration (AuditoriaBoard.spec.tsx) → 5/5 PASS
  - e2e (navigation.spec.ts) → 21/21 PASS, incl. `/indicadores/auditoria renders`
- **Lint**: red repo-wide PRE-EXISTING; 0 findings introduced by this change (new files oxlint-clean)
- **CRITICAL findings**: 0

## Specs Synced

| Domain | Action | Details |
|--------|--------|---------|
| auditoria-datos | Created | 13 requirements (AUD-0..AUD-12) / 29 scenarios — main spec created from delta spec (verbatim mechanical copy) |
| indicators-board | Updated | R11 extended with 2 scenarios (Auditoría route renders `AuditoriaBoard`; tab "Auditoría" alongside "Calidad del Dato") — existing R11 scenarios preserved |

## Archive Contents

| Artifact | Status |
|----------|--------|
| exploration.md | ✅ |
| proposal.md | ✅ |
| specs/auditoria-datos/spec.md | ✅ (delta spec — merged to main) |
| design.md | ✅ |
| tasks.md | ✅ (13/13 tasks complete, 0 unchecked) |
| apply-progress.md | ✅ |
| verify-report.md | ✅ |
| archive-report.md | ✅ (this file, additive) |

## Commits & Delivery

Delivered via feature-branch chain, merged as **PR #15** (`feature/auditoria-datos` → `main`, merge commit `4bd1a6a`):

| Commit | Content |
|--------|---------|
| `79e4640` | S1 — `utils/auditIdentity.ts` + `utils/auditSignals.ts` + unit specs (33/33) |
| `bd8bdbf` | S2 — route `INDICADORES_AUDITORIA` + router lazy import + tab + board shell with 8 KPIs + Q3 callout |
| `c321f1d` | S3 — drill-downs ×8 + candidate caveats (AUD-12) + `AuditoriaBoard.spec.tsx` (5/5) |
| `d7eea96` | S4 — `e2e/mockData.ts` `AUDIT_FIXTURES` + `e2e/navigation.spec.ts` (21/21) |
| `5d33005` | SDD artifacts (explore, proposal, spec, design, tasks, apply-progress, verify-report) |
| `c94852c` | Verify-report refreshed against merged HEAD `4bd1a6a` (post-merge re-run) |
| `3a9f3b7` | Spec heading format corrected to `### Requirement:` (native dispatcher requirement-counting regex) |

**Final state**: local `main` and `origin/main` in sync at `3a9f3b7`.

## Merge Details

- **Main spec `openspec/specs/auditoria-datos/spec.md`**: created from the delta spec (new capability; main spec did not exist). 13 ADDED requirements (AUD-0..AUD-12) in `### Requirement:` heading format, 29 scenarios. Mechanical copy — byte-identical, verified by `diff -r` (empty).
- **Main spec `openspec/specs/indicators-board/spec.md`**: R11 ("Route and Tab Updates") MODIFIED — appended 2 scenarios for the Auditoría route/tab; all existing requirements (R1–R12) preserved unchanged.
- No REMOVED/RENAMED requirements. No destructive merge — nothing deleted.

## Source of Truth Updated

- `openspec/specs/auditoria-datos/spec.md` — now reflects the full auditoria-datos capability.
- `openspec/specs/indicators-board/spec.md` — R11 now covers the `/indicadores/auditoria` route and "Auditoría" tab.

## Reconciliation Notes (Warnings)

All warnings are environmental or pre-existing — none break a spec scenario:

1. **Full test suites not runnable on Windows** — vitest worker fork crash (`Worker exited unexpectedly`, 6+ min suites). Valid substitute evidence: focused gates re-run against merged HEAD (unit 33/33, integration 5/5, e2e 21/21, all exit 0).
2. **Lint red repo-wide, pre-existing** — ~100 oxlint findings in untouched files; scoped check over the 11 change-touched files found only 4 findings on pre-existing lines; the 6 new files are clean. Prettier fails on untouched files too (repo 4-space indent vs .prettierrc default).
3. **Design deviations (non-blocking)**: `anomalias.totalFilas` = distinct affected rows (design ambiguity resolved to distinct rows); S1/S3 exceeded slice line estimates (size:exception accepted by orchestrator; diffs slice-clean); apply-progress S1 note about `Q2Candidate.cedulaConfirmada` is stale — the real code has no such field (matches design).

## Known Follow-ups (SUGGESTIONS from verify, not blockers)

- **LIST_LIMIT=50 scaling** — drill-downs cap lists at 50 with "+N more"; data layer does not cap. Fine for ~51 real groups in the 2,000-row sample; scaling to 70,283 rows would need pagination/virtualization.
- **`isInvalid` stub activation** — `normalize.ts` `isInvalid()` always returns false (out of scope); status vocabulary audited via `AUDIT_STATUS_VOCABULARY` instead.
- **`corruptedItems` best-effort persistence** — `corruptedItems` is not persisted to IndexedDB; after cache restore the drill-down list can be empty while the official `syncStats.corrupted` count remains.
- **Full-suite reliability** — the vitest worker crash on Windows prevents `test:unit`/`test:int`/`test:e2e` full-suite runs; focused gate runs are the valid substitute.
- **AUD-7 cosmetic** — when all status values are known, the drill-down shows "Sin datos" instead of the full enumeration (signal data exists; UI choice).
- **AUD-11 UI filter test** — filter correctness proven by composition (pure function + unit tests + useMemo); no dedicated component test simulating provincia="Santiago".
- **e2e generator extra Q1** — with count=50 the generator creates ~10 extra Q1 candidates via identity repetition; harmless for navigation.spec.ts, noted for future count-asserting tests.

## Reconciliation Notes

- No CRITICAL issues in verify-report. Archive proceeds with intentional-with-warnings (warnings are environmental/pre-existing, explicitly listed above).
- Task Completion Gate: `tasks.md` 13/13 checked (persisted artifact); no stale unchecked implementation tasks; no archive-time reconciliation required.
- Native Review Receipt Gate: `reviewGate` structurally absent (no review was started for this candidate; `reviewOffer` present as an invitation only) — archive proceeded under ordinary repository policy.
- Mechanical Copy Contract: spec sync + archive move performed via native shell (`Copy-Item`/`git mv`), readback `diff -r` empty (DIFF_EXIT=0) — byte-identical; archive-report.md is additive-only and excluded from the comparison.

## Engram Traceability

Artifact store mode `both`: change artifacts lived in OpenSpec files (no Engram observation IDs for this change); the archive report is persisted to Engram as topic `sdd/auditoria-datos/archive-report`.

## SDD Cycle Complete

The change has been fully planned (explore/proposal/spec/design), implemented (4 slices, PR #15), verified (twice — pre-merge and post-merge refresh @ `4bd1a6a`), and archived. Ready for the next change.
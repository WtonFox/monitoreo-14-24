# Proposal: Project Health Sweep — Security-First Remediation Program

## Intent

The static sweep confirms a **critical security incident** (a live-looking bearer token committed, bundled to the browser, and used as a Bearer credential from client JavaScript) and a **forgeable client-only RBAC** boundary that loads the full PII/health dataset before any route check. Beyond those two findings, the codebase shows **fabricated analytics** (sanitization invents dates; corrupt records contaminate boards), **stale/incomplete synchronization** (refresh, pause, resume), **biased demographic formulas** (unknown sex/age routed into real buckets), **two racing dashboard hook instances**, **absent behavioral verification**, and a **67k-record responsiveness requirement with no benchmark**. The OpenSpec tree also retains a completed-but-unarchived change and prior verifications that ran build/typecheck in place of tests.

This change turns the sweep into a **program of ordered, reviewable milestones**, not one oversized implementation PR. We separate **immediate operational containment** (credential incident) from **code changes**, and we make **server-enforced authorization/data minimization** a hard prerequisite for trusting any future RBAC, and **behavioral test foundations** a hard prerequisite for any normalization, calculation, or sync refactor. Static findings stay classified `[confirmed]` vs `[risk]`; no finding is upgraded to runtime-confirmed in this phase.

## Outcomes (Measurable)

| # | Outcome | Evidence gate |
|---|---|---|
| O1 | Old bearer credential rejected by the API; no secret in Git history, deployment env, or built bundle | Rotation audit + secret-scan grep on `dist/` + Git history audit |
| O2 | API rejects calls without a server-issued, scope-limited credential; unauthorized roles see no PII in browser memory or IndexedDB | Per-role API contract tests + IndexedDB inspection fixtures |
| O3 | Behavioral test foundation in place: runner, fixtures, CI scripts (`test`, `test:unit`, `test:int`, `typecheck`, `lint`) | CI green on empty baseline + normalization fixture pass |
| O4 | Missing/invalid/corrupt data preserved as explicit states; corrupt records quarantined; deterministic IDs | Fixture matrix (missing/malformed/non-object) with frozen clock |
| O5 | Demographic/temporal KPIs use explicit Unknown buckets, valid-age denominators, midnight recompute, stable full entity keys | Numerator/denominator golden fixtures per formula |
| O6 | One sync state machine; both caches invalidated on force refresh; pause/cancel live; updates & deletions detected | Fake-API + fake-IndexedDB failure/reload suite |
| O7 | 67k-record responsiveness proven, not assumed | Deterministic 10k/67k/100k benchmarks; commit-to-paint, long-task, memory budget |
| O8 | Exports are correct, sanitized, and produce partial-failure receipts; XLSX truly produces XLSX | File signature/extension tests + injected-failure scenarios |
| O9 | Root and subpath builds smoke-test green; CSP + CDN policy documented; Vercel/.NET matrix verified | Smoke matrix + CSP report |
| O10 | Keyboard, dialog, focus, and responsive UX pass axe + screen-reader smoke | axe-core + keyboard walkthrough + viewport snapshots |
| O11 | Oversized modules split; dead code removed; OpenSpec tree reconciled (archive `indicator-detailed-boards`; refresh stale README/Engram stack context) | Characterization suite unchanged after each split |

## Scope

### In Scope
- Operational credential incident containment (rotation, history scrubbing, deployment audit, env policy).
- Server/BFF authorization contract and role-scoped, data-minimized DTO entry point.
- Test runner + deterministic API/IndexedDB fixtures + CI scripts (typecheck, lint, tests, build).
- Participant normalization contract: missing/invalid/corrupt preservation, deterministic IDs, center vs course separation, canonical ND vocabulary.
- Demographic/temporal denominator corrections and explicit Unknown buckets.
- Single-owner sync state machine with cache invalidation, cursor/checkpoint persistence, live pause/cancel, update/delete detection.
- 67k-record performance budget: benchmark first, then active-slice aggregation, map hotspot removal, Worker/idle scheduling where measured.
- Export correctness (format + sanitization + partial-failure receipts + formula-injection neutralization).
- Deployment matrix hardening: base path, asset paths, CSP/CDN policy, Vercel project settings.
- Accessibility, responsive, routing pass: semantic buttons/dialogs, focus mgmt, accessible names, route titles, not-found route.
- Module decomposition (after characterization tests) and reconciliation of `indicator-detailed-boards` + stale README/Engram stack context.

### Out of Scope (explicit non-goals)
- No visual redesign, analytics-policy change, database replacement, framework migration, or broad dependency upgrade.
- No new feature surface beyond what the existing specs already require.
- No production-side incident response beyond what the API/backend owner authorizes; we document and propose, never presume to act on production credentials.
- No runtime verification in this planning phase. Static `[risk]` items remain `[risk]` until a runtime test confirms them.

## Capabilities (Contract with `sdd-spec`)

### New Capabilities
- `auth-and-data-boundary`: server-issued, scope-limited credentials; role-scoped DTOs; PII minimization; access-log instrumentation; server-side session validation.
- `verification-foundation`: test runner, deterministic API/IndexedDB/time fixtures, CI scripts (`test`, `typecheck`, `lint`, `build`), coverage gate.
- `sync-state-machine`: single-owner provider, cursor/checkpoint persistence, live pause/cancel, page retry, update/delete detection, double-cache invalidation.
- `export-integrity`: format-correct export (real XLSX), full sanitization, partial-failure receipts, formula-injection neutralization, count reconciliation.
- `deployment-runtime-config`: base-path assets, CSP, CDN policy, hosting matrix (Vercel + .NET subpath).
- `accessibility-and-navigation`: semantic interactive primitives, dialog/focus management, accessible names/states, child-route titles, not-found route, responsive snapshots.

### Modified Capabilities
- `participant-data`: replace fabrication in sanitization (R3), enforce missing/corrupt preservation, deterministic IDs, exports route through sanitization.
- `indicators-board`: enforce R4 with measured evidence; add Unknown buckets and valid-age denominators to all formulas; active-slice aggregation only.
- `dashboard-enrichment`: KPI denominators use valid-age; charts route Unknown into explicit buckets.
- `registro-diario-fichas`: midnight recompute without reload; cover DST-neutral local dates and week boundaries.
- `calidad-dato-nd`: enforce canonical ND/Missing/None/Invalid policy at the spec level, not the board level.
- `centros-sin-menores`: stable full-name key; truncate only at render time.
- `desercion-centros`: same center-identity policy as above.

## Approach — Ordered Milestones

| # | Milestone | Type | Depends on | Lines (forecast) | Chained |
|---|---|---|---|---:|---|
| M1 | Credential incident containment | Operational + repo | — | 50–150 + ops | Yes (PR1) |
| M2 | Server/BFF auth contract + role-scoped DTO entry point | Architecture | M1, API owner answers | 250–400/client + backend dep | Yes (PR2/3) |
| M3 | Verification foundation (runner, fixtures, CI) | Foundation | M1 | 250–380 | Yes (PR3) |
| M4 | Normalization contract (missing/corrupt/ND, deterministic IDs, center/course) | Refactor | M3 | 250–380 | Yes (PR4) |
| M5 | Demographic/temporal denominators + Unknown buckets + midnight recompute | Refactor | M3, M4 | 300–400 | Yes (PR5) |
| M6 | Single-owner sync state machine | Refactor | M3, M4 | 350–400 | Yes (PR6) |
| M7 | 67k-record performance budget + active-slice aggregation | Perf | M4, M5, M6 | 300–400 | Yes (PR7) |
| M8 | Export integrity (format, sanitization, receipts) | Refactor | M4 | 180–300 | Yes (PR8) |
| M9 | Deployment matrix hardening (base path, CSP, Vercel) | Infra | M1 | 120–250 | Yes (PR9) |
| M10 | Accessibility + responsive + routing pass | UX | — | 300–400 | Yes (PR10) |
| M11 | Module decomposition + OpenSpec reconciliation + stale context | Cleanup | M4–M8 characterization | 200–350 each | Yes (PR11+) |

**Chained-PR strategy**: Each milestone ships as its own reviewable PR. PRs that touch overlapping files (e.g., M4–M6) ship in declared order with merge-only-after-green CI; `chained-pr` workflow governs. The 400-line authored budget is enforced per PR (fixtures/snapshots excluded).

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Static findings (H5, M5, M3) misclassified as runtime-confirmed | Med | Keep `[risk]` tags in specs; only `sdd-verify` upgrades them after benchmark evidence. |
| API/backend owner unavailable → M2 stalls | Med | Document required questions (below); propose a stub BFF path; treat M3 as parallelizable. |
| Test runner retrofit uncovers hidden behavior changes | High | Characterization-first for legacy code; gate refactors on characterization suite passing unchanged. |
| Credential rotation invalidates deployed bundles before env vars are re-issued | Med | Coordinated cutover window; freeze deploys during rotation; verify `dist/` fingerprint pre/post. |
| Module decomposition blurs correctness fixes | Med | M11 strictly follows M4–M8; never mixed with semantics changes. |
| 400-line budget too tight for M2 (server/BFF contract) | High | Split client contract and BFF implementation across two chained PRs. |

## Rollback

- **M1 (credentials)**: rotate is one-way. If old credential still valid, redeploy it; otherwise propagate new credential and document the rotation window.
- **M2 (BFF)**: feature-flag the BFF path; fall back to direct API only behind an explicit insecure-mode flag the team never enables in production.
- **M3–M11**: revert via `git revert` of the milestone commit; CI proves prior green; no schema migration in any milestone.
- **Index data**: no IndexedDB schema migrations proposed in this program (existing `DB_VERSION` policy preserved). On revert, IndexedDB records remain valid because the contract does not change shape.

## Dependencies

- **API/backend owner** answers the questions below before M2 starts.
- **Deployment owner** confirms Vercel branch/build/production env var ownership before M9.
- **No new third-party libraries** are introduced without an explicit per-milestone justification; the proposal deliberately avoids dependency upgrades.
- **OpenSpec** has one completed-but-unarchived change (`indicator-detailed-boards`) — archive it before M11 to keep the tree current.

## Backend / API Owner — Required Answers

| # | Question | Blocks |
|---|---|---|
| Q1 | Who owns the current `VITE_API_TOKEN` value and what is the rotation procedure and SLA? | M1 |
| Q2 | Can the API issue server-validated, scope-limited, short-lived credentials per role (ADMIN/SUPERVISOR/CONSULTOR)? What claims are available? | M2 |
| Q3 | Will the .NET team own a thin BFF/same-origin proxy, or does this team deploy one? | M2 |
| Q4 | Which fields are PII-minimized per role? Can the API return role-scoped DTOs (drop national ID, phone, address, health fields for CONSULTOR)? | M2 |
| Q5 | What access-log instrumentation exists or can be added (who, when, from where, scope, success/fail)? Retention and alerting? | M2 |
| Q6 | Vercel project: who owns branch/build/production env vars, current CSP, and CDN allowlist? Any current production issues? | M9 |
| Q7 | Pagination contract: page size, cursor vs offset, retry semantics, total count accuracy, update/delete signaling? | M6, M8 |
| Q8 | IndexedDB of PII for unauthorized roles is currently a leak. Will the API refuse those requests, or does this team filter post-call? | M2 |

## Planning-Phase Honesty

- **No implementation, build, test, typecheck, lint, deploy, package install, or runtime command** was executed during exploration or proposal. Static findings remain static; runtime confirmation is owned by `sdd-verify`.
- The committed token value is intentionally **not reproduced** in this artifact.
- No source, configuration, test, lockfile, or deployment state was changed. The pre-existing `.atl/.skill-registry.cache.json` modification was not touched.
- `CodeGraph` metadata was generated only because the required index was missing; no intelligence surface was used in this proposal.

## Success Criteria (Proposal-Level Acceptance)

- [ ] All P0 (M1, M2) outcomes O1, O2 have a defined verification path that does not depend on untested code.
- [ ] M3 precedes M4, M5, M6 in the chain — no normalization, calculation, or sync refactor merges without a passing test suite.
- [ ] Every milestone is sized under or equal to the 400-line authored budget; anything larger is split before `sdd-apply`.
- [ ] Chained-PR strategy is declared for every milestone.
- [ ] Backend owner questions Q1–Q8 are answered (or formally deferred) before M2 starts.
- [ ] OpenSpec tree is reconciled: `indicator-detailed-boards` archived; stale README/Engram stack context refreshed after CI confirms current stack.
- [ ] No static finding is escalated to runtime-confirmed by this proposal; classifications survive into `sdd-spec` and `sdd-verify`.
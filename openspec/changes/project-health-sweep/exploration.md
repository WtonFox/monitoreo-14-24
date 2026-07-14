# Exploration: Project Health Sweep

## Current State

The repository is a React 19 / Vite 8 / TypeScript 7 client SPA with HashRouter navigation, 13 lazy-loaded indicator boards, a shared full-dataset context, direct browser calls to a protected participant API, and IndexedDB persistence. The application currently has no test runner, linter, formatter, coverage gate, or strict TypeScript configuration (`package.json:6-10,24-33`; `tsconfig.json:2-27`; `openspec/config.yaml:13-34`).

Static structure is generally coherent: routes and boards are separated, indicator filters are deferred, boards are lazy-loaded, and recent visual/data changes are present. However, security boundaries, normalization semantics, refresh correctness, and large-dataset verification remain weak. The current OpenSpec tree also contains a completed but unarchived `indicator-detailed-boards` change (`openspec/changes/indicator-detailed-boards/tasks.md:21-41`) alongside recently archived work whose verification relied on build/typecheck rather than behavioral tests (`openspec/changes/archive/2026-07-13-pulido-visual/verify-report.md:31-46`; `openspec/changes/archive/2026-07-13-nuevos-reportes-indicadores/verify-report.md:31-54`).

This was a static-only sweep. No build, test, typecheck, lint, deploy, package install, or runtime command was executed.

## Evidence-based Findings

### Critical

#### C1 — [confirmed] A live-looking bearer credential is committed and intentionally bundled into the browser

- `.env` and `.env.example` are tracked as the same Git blob; `.gitignore` does not ignore environment files (`.gitignore:1-24`). The example contains a complete bearer token rather than a placeholder (`.env.example:5-10`). The token value is intentionally not reproduced here.
- Vite client variables are explicitly documented as browser-exposed (`.env.example:5-9`), then read by client code (`constants.ts:1-5`; `contexts/AuthContext.tsx:113-125`) and sent from browser JavaScript as an `Authorization` header (`services/api.ts:17-23,72-77`).
- Impact: repository readers and every deployed browser can recover the credential. Rotation is required; deleting it only from the current branch would not remove Git-history exposure.
- Proposed verification: revoke/rotate the credential with the API owner; inspect repository history and deployment variables without printing secrets; after remediation, build in a secure environment and search generated assets for the old token fingerprint.

#### C2 — [confirmed] Client-only RBAC is forgeable and the full sensitive dataset loads before authorization

- `decodeToken` base64-decodes a JWT but never verifies its signature or issuer/audience; a missing role defaults to `ADMIN` (`contexts/AuthContext.tsx:33-59`). Tokens from localStorage are trusted (`contexts/AuthContext.tsx:65-84`), and `login` persists any decodable three-part token (`contexts/AuthContext.tsx:174-180`). Route protection trusts the resulting client role (`components/ProtectedRoute.tsx:72-83`).
- The root layout starts participant synchronization before route authorization and wraps authorization inside the already-populated dashboard provider (`App.tsx:22-50,77-98`). The loaded model contains names, national IDs, phones, addresses, tutor IDs, vulnerabilities, allergies, disabilities, and diseases (`types.ts:1-28`), and the complete dataset is persisted in IndexedDB (`services/database.ts:78-95`).
- Impact: route hiding is not a security boundary. Even a role denied the Participants page receives the full PII/health dataset in browser memory/storage; a forged local token can also bypass route checks.
- Proposed verification: test authorization against a server-enforced session with ADMIN/SUPERVISOR/CONSULTOR fixtures; inspect IndexedDB for each role; verify the API rejects direct calls that lack a server-issued, scope-limited credential.

### High

#### H1 — [confirmed] Sanitization fabricates dates and lets corrupt records contaminate analytics

- Missing `fechaNacimiento` and `fechaRegistro` are replaced with the current timestamp (`utils/dataUtils.ts:76-104`). Structurally invalid records receive random IDs, current timestamps, and synthetic values (`utils/dataUtils.ts:41-73`).
- Sync marks `DATA_CORRUPTA` records but still adds them to `cleanBatch`, dashboard state, and IndexedDB (`hooks/useDashboardData.ts:214-240`).
- Impact: missing-date completeness is overstated, “today” registration counts can be inflated, temporal trends gain fabricated dates, and corrupted data participates in every board.
- Proposed verification: unit fixtures for missing, malformed, and non-object records with a frozen clock; assert missing values remain explicit and corrupt records are quarantined; compare fixture-derived dashboard totals with source rows.

#### H2 — [confirmed] Refresh, pause, and incremental synchronization can return stale or incomplete data

- Manual refresh clears React state and IndexedDB but not the five-minute in-memory request cache (`services/api.ts:44-50,99-100`; `hooks/useDashboardData.ts:349-368`), so a forced refresh can immediately reuse stale pages.
- The running sync reads `isPaused` from the callback closure; toggling state later does not update that invocation (`hooks/useDashboardData.ts:130-138,186-191,331,371-373`).
- Failed pages are skipped and the loop continues (`hooks/useDashboardData.ts:306-312`). Resume position is inferred from loaded-record count rather than persisted page/cursor state (`hooks/useDashboardData.ts:163-180`), which is unsafe after errors, duplicates, or partial pages.
- IndexedDB writes and metadata writes are launched without awaiting completion (`hooks/useDashboardData.ts:240-280`), while manual clear/restart is also not awaited (`hooks/useDashboardData.ts:349-368`), creating clear/write/restart races.
- Polling detects only growth in `totalItems`; updates and deletions are ignored (`hooks/useDashboardData.ts:333-347`).
- Proposed verification: fake API scenarios for page failure, update-with-same-count, deletion, pause/resume, and refresh within five minutes; use fake timers and a fake IndexedDB; assert an explicit sync checkpoint and final persisted dataset identity.

#### H3 — [confirmed] Unknown age and sex values are assigned to real demographic groups

- The detailed-board hook computes men as `total - women`, so unknown sex values become men; municipality male counts use the same subtraction (`hooks/useIndicatorBoards.ts:124-128,344-360`).
- Age defaults to zero, but unmatched values fall into `25+`; age zero also counts as a minor (`hooks/useIndicatorBoards.ts:191-203,251-252,325-326`). The dashboard chart similarly sends unknown age to `30+` (`components/ChartsSection.tsx:87-104`).
- The overview average current age divides by all participants, including zero/unknown ages (`hooks/useIndicators.ts:143-151`); map averages also divide valid-age sums by all location records (`hooks/useMapStats.ts:87-112`).
- Impact: sex, minor/tutor, older-age, and average-age KPIs can be materially biased.
- Proposed verification: table-driven fixtures containing `M`, `F`, full labels, null/ND sex, zero/null-like age, and out-of-range ages; require an explicit Unknown bucket and documented denominator policy.

#### H4 — [confirmed] Two dashboard hook instances run under the root layout

- `App` calls `useDashboardData` (`App.tsx:22-42`), then passes that value to `DashboardProvider`; the provider still unconditionally calls `useDashboardData` again even when an external value exists (`contexts/DashboardContext.tsx:35-42`).
- Both instances execute their IndexedDB startup effect. On stale-cache detection, the hidden provider instance can clear storage and schedule its own sync (`hooks/useDashboardData.ts:70-94`) while the App instance is already syncing (`App.tsx:47-51`).
- Impact: redundant full IndexedDB reads and a conditional duplicate network/database synchronization race.
- Proposed verification: instrument hook mounts, DB opens, clear calls, and API probes under React StrictMode and stale/fresh DB fixtures; assert exactly one data owner and one sync state machine.

#### H5 — [risk] The explicit 67k-record responsiveness requirement has no implementation or benchmark proof

- The main spec requires a Worker or `requestIdleCallback` for >10k records and <50 ms frame drops (`openspec/specs/indicators-board/spec.md:32-39`). Neither mechanism exists; only filter state is deferred (`contexts/IndicadoresFiltersContext.tsx:55-80`).
- Every indicators route computes the full nine-slice `boardData` (`contexts/IndicadoresFiltersContext.tsx:61-96`; `hooks/useIndicatorBoards.ts:120-553`). The overview additionally runs the 1,087-line `useIndicators` aggregation (`pages/Indicadores.tsx:87-92`; `hooks/useIndicators.ts:136-375`). Four newer boards then perform independent page-level aggregation.
- Map statistics perform a full `data.filter` for every discovered location (`hooks/useMapStats.ts:45-133`), an O(locations × records) hotspot explicitly acknowledged in source (`hooks/useMapStats.ts:94-108`).
- Proposed verification: production-build profiling with deterministic 10k/67k/100k fixtures; record commit-to-paint, long tasks, memory, filter latency, route-change latency, and map aggregation time. Treat failure as runtime-confirmed, not assumed here.

#### H6 — [confirmed] Behavioral verification is absent for security- and calculation-critical code

- No test/spec source files or test runner were found. `package.json` has only dev/build/preview scripts (`package.json:6-10`); OpenSpec records unit/integration/e2e/coverage/lint as unavailable (`openspec/config.yaml:19-34`).
- Type checking is “strict-lite”: no `strict`, with `skipLibCheck` and `allowJs` (`tsconfig.json:2-27`). The code has untyped API boundaries and many `any` values, including sanitization, API errors, metadata, charts, and GeoJSON (`utils/dataUtils.ts:7-41`; `services/api.ts:64,103`; `services/database.ts:134-144`).
- Archived reports contain zero scenarios and no coverage; one report declared pass while recording a nonzero typecheck exit (`openspec/changes/archive/2026-07-13-nuevos-reportes-indicadores/verify-report.md:1-15,43-54`).
- Proposed verification: add a test runner first; cover normalization, calculations, sync/cache, routing/auth, exports, and 13-board empty states; add dedicated `typecheck`, `lint`, and CI scripts before further broad refactors.

### Medium

#### M1 — [confirmed] Registration-day KPIs do not recompute when the calendar day changes

- `RegistroDiarioBoard` captures `new Date()` inside a memo that depends only on data and local province (`pages/indicadores/RegistroDiarioBoard.tsx:102-134,160-232`).
- This contradicts the requirement to recompute at day changes without reload (`openspec/specs/registro-diario-fichas/spec.md:65-74`). A tab left open over midnight retains stale “today/week/month” boundaries until data or filters change.
- Proposed verification: fake-timer test across midnight, month-end, year-end, DST-neutral local dates, and Monday/Sunday boundaries.

#### M2 — [confirmed] Export behavior can silently mislabel or omit data

- The Participants “Excel (XLSX)” action invokes the same CSV generator as the CSV action (`components/DataTable.tsx:402-438`); that generator always downloads a `.csv` file (`components/DataTable.tsx:170-184`).
- Mass export skips failed pages, then reports 100% complete and replaces the source total with the number actually downloaded (`services/exporter.ts:50-101`). It also exports raw API items without `sanitizeParticipant`, unlike dashboard data (`services/exporter.ts:31-36,57-66`; `utils/dataUtils.ts:38-105`).
- Proposed verification: inspect file signature/extension for each format; inject a failed middle page and PascalCase payload; require an explicit partial-failure receipt and record-count reconciliation.

#### M3 — [risk] Empty/ND semantics are duplicated and disagree

- Four classifiers exist with different vocabularies: `hasValue` excludes exact `Ninguna` (`utils/normalize.ts:61-66`), while two local `isEmptyValue` helpers exclude only exact N/A/N/D (`hooks/useIndicatorBoards.ts:107-116`; `hooks/useIndicators.ts:31-50`), and Calidad ND uses another case-sensitive/partially normalized set (`pages/indicadores/CalidadNdBoard.tsx:15-40`).
- `StatsCards` repeats exact string comparisons (`components/StatsCards.tsx:31-53`). Whether “Ninguna” is a completed negative answer or missing data changes completeness and prevalence denominators.
- Proposed verification: inventory real API value variants without exposing PII; approve a field-aware canonical policy for Missing, Not Available, None Reported, Invalid, and Present; enforce it with shared table-driven tests.

#### M4 — [confirmed] Center fallback and label truncation can corrupt center metrics

- Missing `centro` falls back to `rutaFormativa`, mixing courses into center dimensions (`utils/dataUtils.ts:91-95`).
- Center names are truncated before later lookups; matching by the truncated label selects the first collision (`hooks/useIndicatorBoards.ts:455-488`). Two names sharing the first 18 characters can receive duplicated/misattributed gender data.
- Proposed verification: fixtures with missing centers and colliding long center names; preserve a stable full-name key and truncate only at render time.

#### M5 — [risk] Base-path and hosting behavior is inconsistent across Vite, Vercel, static assets, and API proxying

- `VITE_BASE_PATH` configures Vite (`vite.config.ts:5-10`), and the README claims subdirectory support (`README.md:35-45`), but the logo and GeoJSON use root-absolute URLs (`components/Sidebar.tsx:108-114`; `hooks/useGeoJSON.ts:38-44`), risking 404s under `/monitoreo/`.
- Production API calls rely on the current origin because `API_BASE_URL` is empty (`constants.ts:1-5`; `services/api.ts:25-35`). Vercel has the required API rewrite (`vercel.json:1-8`), but no current `netlify.toml` exists despite stale comments/memory claiming Netlify support (`services/api.ts:54-62`).
- `index.html` depends on runtime third-party CDN assets and contains obsolete import-map versions that differ from installed packages (`index.html:7-23`; `package.json:12-22`), adding CSP, availability, and supply-chain risk.
- Proposed verification: build and serve root and `/monitoreo/` variants; request every public asset; smoke-test API proxy/auth on Vercel and .NET; inspect Vercel project branch/build settings; define a CSP and test the app with external CDN failures.

#### M6 — [confirmed] Important interactive UI is not keyboard/dialog accessible

- Indicator cards are clickable `<div>` elements without keyboard handlers, role, or tab stop (`components/IndicatorsBoard.tsx:120-135`).
- `BoardInfo` advertises ESC close but implements no key handler, dialog role, `aria-modal`, focus entry/trap, or focus return (`components/BoardInfo.tsx:14-70`). The advanced filter modal has the same missing dialog/focus semantics (`components/AdvancedFiltersModal.tsx:16-67`).
- The indicator “More” dropdown lacks `aria-expanded`/`aria-haspopup` and keyboard/Escape management (`pages/IndicadoresLayout.tsx:101-142`). Header/sidebar icon buttons also lack explicit accessible names (`components/Header.tsx:37-43,55-62`; `components/Sidebar.tsx:120-123`).
- Proposed verification: keyboard-only walkthrough, axe-core, screen-reader smoke test, focus-order/focus-return assertions, and 320/375/768 px responsive snapshots.

#### M7 — [confirmed] Map filters and map averages have current-data gaps

- Map years are hardcoded only through 2025, so 2026+ records cannot be selected (`components/MapFilters.tsx:46-50,69-96`).
- Map average age includes zero/unknown ages in the denominator (`hooks/useMapStats.ts:87-112`), while min/max skip them.
- Proposed verification: derive years from data; test 2026/future-year fixtures and locations containing mixed valid/unknown ages.

### Low

#### L1 — [confirmed improvement] Oversized modules and duplicated patterns increase change risk

- Major modules are large: `hooks/useIndicators.ts` (1,087 lines), `components/ChartsSection.tsx` (740), `components/IndicatorModal.tsx` (654), `hooks/useIndicatorBoards.ts` (555), `components/DataTable.tsx` (538), and `pages/indicadores/RegistroDiarioBoard.tsx` (498).
- `SyncStats` is declared four times (`hooks/useDashboardData.ts:13-18`; `contexts/DashboardContext.tsx:5-11`; `components/Sidebar.tsx:9-14`; `components/SystemStatusSection.tsx:29-35`). Empty-value logic and export/download logic are also duplicated (`utils/normalize.ts:61-66`; `hooks/useIndicators.ts:31-50`; `hooks/useIndicatorBoards.ts:105-116`; `utils/exportUtils.ts:1-40`; `services/exporter.ts:296-309`).
- Proposed verification: characterize behavior first, then split by domain calculator/presenter and centralize contracts without mixing this cleanup into correctness fixes.

#### L2 — [confirmed improvement] Dead and stale code/config remain

- `normalizeSexo` has no caller (`utils/normalize.ts:14-20`). `useTableData` is not used by the Participants page and has an unused `dashboardDataLength` parameter (`hooks/useTableData.ts:17-45`; `pages/Participantes.tsx:8-20`). Several IndexedDB helpers are unreferenced (`services/database.ts:97-129,162-191`).
- The README and Engram init context still describe TypeScript 5.8/Vite 6 while current packages are TypeScript 7/Vite 8 (`README.md:15-23`; `package.json:24-33`).
- Proposed verification: dependency/reference check plus build/typecheck after each removal; update project context only after the current stack is confirmed in CI.

#### L3 — [confirmed improvement] Route and title fallbacks are incomplete

- The router has no catch-all child route, so unknown hashes have no explicit not-found experience (`router.tsx:34-210`).
- Header titles cover only top-level routes, so all nested indicator boards fall back to “Monitoreo 14-24” (`components/Header.tsx:15-32`).
- Proposed verification: direct navigation to every registered route and an unknown route; assert title, selected tab, focus target, and not-found content.

#### L4 — [stale/resolved] Several prior-memory backlog items are no longer current defects

- Backlog observation #1300’s Impacto Social implementation is present (`hooks/useImpactData.ts:79-216`; `components/ImpactSection.tsx:31-59`) and its change is archived.
- The Sociales gender calculations now use `isWomen`/`isMen` (`hooks/useIndicatorBoards.ts:191-232`), although runtime chart verification is still worthwhile.
- Observation #1327’s active-tab issue is fixed with `location.pathname` (`pages/IndicadoresLayout.tsx:48-62,87-99`), and the dead `/index.css` reference is absent from current stylesheet links (`index.html:7-10`).
- Observation #247’s stack versions and Netlify proxy claim are stale relative to `package.json:12-33` and the current deployment files.

## Affected Areas

- Security and data boundary: `.env`, `.env.example`, `.gitignore`, `constants.ts`, `services/api.ts`, `contexts/AuthContext.tsx`, `components/ProtectedRoute.tsx`, `App.tsx`.
- Data contract and calculations: `utils/dataUtils.ts`, `utils/normalize.ts`, `hooks/useIndicators.ts`, `hooks/useIndicatorBoards.ts`, `hooks/useImpactData.ts`, `components/ChartsSection.tsx`, `components/StatsCards.tsx`, `pages/indicadores/*`.
- Cache/sync/storage: `hooks/useDashboardData.ts`, `contexts/DashboardContext.tsx`, `services/database.ts`, `services/api.ts`, `hooks/useGeoJSON.ts`.
- Navigation, responsive UI, accessibility: `router.tsx`, `pages/IndicadoresLayout.tsx`, `components/Header.tsx`, `components/Sidebar.tsx`, modal components, `components/IndicatorsBoard.tsx`.
- Deployment/static assets: `vite.config.ts`, `vercel.json`, `index.html`, `public/`, `README.md`.
- Verification and maintainability: `package.json`, `tsconfig.json`, `openspec/config.yaml`, oversized hooks/components, duplicated helper/type definitions.

## Recommended Backlog

Ordered by impact and dependency:

1. **P0 — Credential incident containment.** Revoke/rotate the committed token, remove real secrets from tracked env files and history, add env ignore/policy, and audit access logs. Verify no old-token fingerprint remains in Git, deployment variables, or bundles.
2. **P0 — Establish a server-enforced data/auth boundary.** Use a same-origin backend/BFF or existing .NET server to hold API credentials, validate sessions/roles, return role-scoped/minimized DTOs, and prevent full PII persistence for unauthorized roles. Verify direct API, route, and IndexedDB behavior for every role.
3. **P1 — Add a behavioral verification foundation.** Introduce unit/integration tests, deterministic API/IndexedDB fixtures, dedicated typecheck/lint scripts, and CI. This is a dependency for the calculation and sync fixes below.
4. **P1 — Define and implement the participant normalization contract.** Preserve missing/invalid states, quarantine corrupt records, use deterministic IDs, separate center from course, and centralize field-aware Missing/None/ND semantics. Verify with source-shape and vocabulary matrices.
5. **P1 — Correct demographic/temporal denominators.** Add Unknown buckets, valid-value denominators, midnight recomputation, and stable full entity keys. Reconcile every percentage formula with an approved numerator/universe fixture.
6. **P1 — Replace sync callbacks with one explicit sync state machine.** Own it in a single provider, invalidate both caches on force refresh, await storage transactions, persist cursor/checkpoint/completeness, retry rather than skip pages, detect updates/deletions, and make pause/cancel live. Verify crash/reload/offline/partial-page cases.
7. **P1 — Measure and budget 67k-record performance.** Benchmark first, then consolidate overlapping aggregations, compute only the active board slice, remove O(location × records) map work, and use a Worker/idle scheduling where the measured budget requires it.
8. **P2 — Repair export correctness and receipts.** Route XLSX to the XLSX exporter, sanitize all fetched pages, fail or explicitly mark partial exports, reconcile expected/actual counts, and neutralize spreadsheet-formula injection.
9. **P2 — Validate deployment matrices.** Test Vercel, .NET subpath, and any claimed Netlify target; make assets base-aware; remove obsolete import-map/config paths; establish CSP/CDN policy; verify actual Vercel branch/build settings.
10. **P2 — Accessibility, responsive, and routing pass.** Use semantic buttons/dialogs, focus management, accessible names/states, keyboard menus, responsive snapshots, child-route titles, and a not-found route.
11. **P3 — Decompose and remove debt.** Split oversized modules after characterization tests; centralize shared types/classifiers/export helpers; remove dead hooks/helpers; archive or reconcile the completed active OpenSpec change; refresh stale README/Engram stack context.

## Suggested Delivery Slices

Auto-forecast assumes a 400 authored-line review budget. Estimates exclude generated fixtures/snapshots but each slice still requires complete verification evidence.

| Slice | Autonomous outcome | Forecast | Verification gate |
|---|---|---:|---|
| 1 | Credential rotation, env/history policy, deployment secret cleanup | 50-150 lines plus operational work | Old token rejected; no tracked/bundled secret |
| 2 | Server/BFF auth contract and role-scoped DTO entry point | 250-400 per repository; backend dependency | Server-side role/API tests |
| 3 | Test runner + normalization fixture harness | 250-380 | Unit suite, typecheck, CI |
| 4 | Missing/corrupt/ND normalization and deterministic identity | 250-380 | Contract matrix passes |
| 5 | Demographic, age, center-key, and temporal formula corrections | 300-400 | Numerator/denominator golden fixtures |
| 6 | Single-owner sync state machine and cache invalidation | 350-400 | Fake API + IndexedDB failure/reload suite |
| 7 | Export format/partial-result correctness | 180-300 | File signature and failure-receipt tests |
| 8 | Active-slice aggregation + map performance optimization | 300-400 | 10k/67k benchmark budget |
| 9 | Base-path/assets/proxy/CSP deployment hardening | 120-250 | Root/subpath/Vercel smoke matrix |
| 10 | Shared modal/menu/card accessibility primitives | 300-400 | axe + keyboard/focus tests |
| 11 | Route titles/not-found/responsive indicator navigation | 150-280 | Route and viewport E2E matrix |
| 12 | Module decomposition/dead-code removal, one domain at a time | 200-350 each | Characterization suite unchanged |

Decision needed before apply: No

Chained PRs recommended: Yes

400-line budget risk: High

## Risks and Non-goals

- Static evidence proves code paths, not production incidence. Live API values, browser timing, Vercel project settings, backend token scopes, and real performance still require controlled verification.
- The committed token was not validated against the live API and is not reproduced in this artifact; rotation should be treated as incident response regardless of current validity.
- No backend repository was inspected, so the server/BFF recommendation requires ownership and deployment clarification during design.
- This exploration does not prescribe a visual redesign, analytics-policy change, database replacement, framework migration, or broad dependency upgrade.
- No source, configuration, tests, lockfiles, existing artifacts, or deployment state were changed. CodeGraph metadata was generated only because the required index was missing.
- The pre-existing `.atl/.skill-registry.cache.json` modification was not touched.

## Ready for Proposal

**Yes** — proceed with a security-first remediation proposal/program, not one oversized implementation PR. The proposal should make credential containment and server-enforced data access the first milestone, establish verification before calculation/sync refactors, and preserve the delivery slices above as chained review units.

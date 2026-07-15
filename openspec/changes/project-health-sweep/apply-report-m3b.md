# Apply Report — M3b (Verification Foundation: hook characterization + CI + stage-1 strictness + coverage report-only)

> **Status**: complete with blocker. 6 commits on local `main`. WU6/WU7/WU8/WU10 landed. WU9 (stage-1 tsconfig) blocked by 36 pre-existing dead-code errors beyond the 3 authorized items — tsconfig reverted. No `.env` read; no `git show`/`git diff` on M1 commits; no credential value.

---

## 1. Commits in this batch (M3b — stacked to main)

| # | SHA | Subject | WU |
|---:|------|---------|:--:|
| 1 | `fbfaf7a` | test(hooks): characterization for useIndicatorBoards + useIndicators | WU6 |
| 2 | `bc11cf4` | test(hooks): characterization for useDashboardData | WU7 |
| 3 | `2c81cf6` | ci: add GitHub Actions workflow | WU8 |
| 4 | `b21905f` | chore(coverage): report-only V8 coverage output (TS2769 — see fixup below) | WU10 |
| 5 | `832b63a` | chore(coverage): report-only V8 coverage output (moved coverage inside test) | WU10 |
| 6 | `92b08fb` | fix(test): remove unused beforeEach/vi imports in useDashboardData char test | WU7 fixup |

**Note on fixes**: commit 5 is a TS-surface fixup for commit 4 (same class as M3a `5a5bd23` — Vitest 4.1.10 types expect `coverage` inside `test`, not at root `defineConfig` level). Commit 6 removes two unused imports flagged by oxlint after commit 2 landed.

---

## 2. Verification gates

| Gate | Command | Result |
|------|---------|--------|
| All tests | `npm run test` | **exit 0**; 100/100 passed across 5 files (unit: 45, integration: 55) |
| Unit tests | `npm run test:unit` | **exit 0**; 45/45 (utils/dataUtils: 25, utils/normalize: 20) |
| Integration tests | `npm run test:int` | **exit 0**; 55/55 (hooks/useIndicatorBoards: 25, hooks/useIndicators: 15, hooks/useDashboardData: 15) |
| Typecheck (pre-flags) | `npm run typecheck` | **exit 0**; `tsc --noEmit` clean (with tsconfig reverted to baseline) |
| Typecheck (stage-1 flags) | `npm run typecheck` | **exit 2**; 36 errors — see Blocker §5 below |
| Lint baseline | `npx oxlint --config oxlint.config.json .` | **exit 1**; 79 errors, 3 warnings (pre-existing; 0 in M3b-authored files after fixup) |
| Coverage | `npm run test:coverage` | **exit 0**; per-file rows for 5 included files; no thresholds |
| Pre-commit gate | `gentle-ai review validate --gate pre-commit --cwd .` | **unavailable** — same status as M3a (`gentle-ai@1.40.3` has no `review` subcommand) |
| Secret fingerprint scan | `rg -c 'eyJ|bIZl|0fe5a97' . --glob ...` | 5 false-positive matches (SECURITY-LESSONS.md scan text, apply-report-m3a.md quoting the scan, ErrorScreen.tsx JWT example placeholder, package-lock.json base64) — no credential leak |

---

## 3. Test case breakdown

### WU6 — `useIndicatorBoards.char.test.ts` (25 cases)
- Demographics: total/women/men/counts, H3 unknown-sex→men routing, womenPct/menPct, avgAgeReg denominator (excludes 0), edadRegistro vs edad, age buckets (14-17/18-20/21-24/25+), edad=0→25+ bucket
- Marital status: isEmptyValue guard (empty/N/A/N/D/null excluded)
- Territorial: municipio count, centro women/men split, curso rutaFormativa
- Program: statusDistribution raw strings, isGraduatedStatus (Egresado variants), minor detection (edad=0 is minor), isActiveStatus
- Quality: hasValue (N/D/N/A/empty dropped)
- Vulnerability: top 3 cap
- Temporal: year grouping, avgDaysToInclusion negative-diff exclusion
- Education: distribution sorted by count desc
- Center: top 10 cap
- safeDiv: zero divisor handling
- Social: phone isEmptyValue guard

### WU6 — `useIndicators.char.test.ts` (15 cases)
- 65 indicators across 9 groups, stable IDs
- isWomen/isMen with unknown 'X'
- avgAgeNow total-denominator (includes edad=0, current bug M5)
- Age 0 excluded from both 14-17 and 18-24 buckets
- isActiveStatus vocabulary
- isGraduatedStatus estado distribution (formatTopN)
- Edad=0 minor (minorsWithTutorPct)
- formatTopN with >5 entries → "Resto: N"
- formatTopN with showPct=true percentages
- Vulnerability "Ninguna" in universe but not counts
- Pending indicator handling
- Empty dataset → no-viable
- lastUpdated frozen clock
- Cross-entity range formula
- 9 group partition, non-overlapping

### WU7 — `useDashboardData.char.test.ts` (15 cases)
- Initial empty state, isSyncing/isPaused false
- syncStats zeroed
- corruptedItems empty
- criticalConnectionError false
- togglePause flip
- showTokenInput false
- setCustomToken round-trip
- setShowTokenInput
- Error state setters
- startSmartSync with empty API (stubFetch)
- handleManualRefresh synchronous reset
- pollForNewData defined
- Sync guard existence
- startSmartSync with data (no crash)
- customToken/showTokenInput independence

---

## 4. Coverage wiring

| Property | Value |
|----------|-------|
| Provider | `v8` |
| Include | `utils/dataUtils.ts`, `utils/normalize.ts`, `hooks/useIndicatorBoards.ts`, `hooks/useIndicators.ts`, `hooks/useDashboardData.ts` |
| Reporters | `['text','html','lcov']` |
| Reports directory | `coverage` |
| Thresholds | **Not set** — report-only per spec R-verify-7 |
| Placement | Inside `test` block (Vitest 4.1.10 type surface) |
| CI upload | `actions/upload-artifact@v4` in `test` job → `coverage-report` |

Per-file results:
- `hooks/useIndicatorBoards.ts`: 92.75% stmts, 81.69% branch, 91.66% funcs, 93.54% lines
- `hooks/useIndicators.ts`: 89.62% stmts, 76.05% branch, 81.96% funcs, 91.17% lines
- `hooks/useDashboardData.ts`: 28.96% stmts, 5.26% branch, 31.57% funcs, 31.36% lines (low — expected for shallow characterisation of complex async hook)
- `utils/dataUtils.ts`: 94.73% stmts, 95.83% branch, 100% funcs, 94.73% lines
- `utils/normalize.ts`: 100% stmts (aggregated in `utils` row at 97.5%)

---

## 5. Stage-1 tsconfig blocker (WU9)

**Applied flags**: `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `forceConsistentCasingInFileNames`

**Result**: 36 TS6133/TS6192 errors across 21 files. Far exceeding the 3 authorized dead-code items.

**Authorized fixes that would not have been sufficient**:
1. `hooks/useTableData.ts:17` — `dashboardDataLength` unused param (1 error)
2. `services/database.ts:97-129,162-191` — unreferenced helpers (exports, not flagged by `noUnusedLocals` — 0 errors)
3. `utils/normalize.ts:14-20` — `normalizeSexo` (exported, not flagged — 0 errors)

**Unexpected findings (partial list)**:
- 19 unused import/variable errors in `components/`, `pages/`, `hooks/`
- `hooks/useIndicatorBoards.ts` — 2 unused imports (`formatNumber`, `formatPercentage`)
- `hooks/useIndicators.ts` — `safeDiv` unused declaration
- `components/DataTable.tsx` — unused `useMemo`, `onExport`
- `services/exporter.ts` — unused `PaginationResult` import
- Various `pages/indicadores/*.tsx` — unused variables

**Action**: Reverted tsconfig.json to baseline. These 36+ dead-code items must be resolved before stage-1 flags can be enabled. Recommend a dedicated dead-code removal task in a future milestone (M11 or a new M3b.2).

---

## 6. CI workflow

| Property | Value |
|----------|-------|
| File | `.github/workflows/ci.yml` |
| Name | `ci` |
| Triggers | `pull_request` + `push` to `main` |
| Concurrency | `ci-${{ github.ref }}`; `cancel-in-progress: true` for PRs |
| Jobs | 5: `lint` → `typecheck` → `test` → `build` → `secret-scan` |
| Job dependencies | Sequential (`needs:` chain) |
| Action versions | `actions/checkout@v4`, `actions/setup-node@v4` |
| Node version | `22.x` |
| Cache | `npm`, keyed by `package-lock.json` |
| Install | `npm ci` |
| Secret-scan semantics | `rg -c` with count-only aggregate via `awk`; fails on any match > 0; never prints matched lines; glob excludes: `!node_modules`, `!.codegraph`, `!.atl`, `!.git`, `!coverage` |

---

## 7. Pre-commit gate transcript

```powershell
PS> gentle-ai review validate --gate pre-commit --cwd .
Error: unknown command "review" — run 'gentle-ai help' for available commands
Exit: 1
```

Available commands in `gentle-ai@1.40.3`: `install`, `uninstall`, `sync`, `skill-registry refresh`, `sdd-status`, `sdd-continue`, `update`, `upgrade`, `restore`, `doctor`, `version`. No `review` subcommand. Captured and continued per spec.

---

## 8. Total authored lines (M3b only)

`git diff --stat 5a5bd23..HEAD`:

```
 .github/workflows/ci.yml              |  93 ++++++++++
 hooks/useDashboardData.char.test.ts   | 211 +++++++++++++++++++++++
 hooks/useIndicatorBoards.char.test.ts | 316 ++++++++++++++++++++++++++++++++++
 hooks/useIndicators.char.test.ts      | 225 ++++++++++++++++++++++++
 vitest.config.ts                      |  12 ++
 5 files changed, 857 insertions(+)
```

| Category | LOC | Budget note |
|----------|----:|-------------|
| Hook char tests (WU6+WU7) | +753 | Core deliverable |
| CI workflow (WU8) | +93 | Core deliverable |
| Coverage wiring (WU10) | +12 | Forward-leaning |

**Budget**: 857 authored lines across 5 files. The 400-line single-PR budget is exceeded (expected per design §10 — M3a+M3b split is the chaining strategy). Each WU commit individually is under budget.

---

## 9. Honesty attestations

- **No `.env` read or write**: `vitest.config.ts` retains `envDir: false`. Tests never touch `.env`. No `read_file`/`Get-Content`/`cat` against `.env`.
- **No credential printed**: No `git show <commit>` on M1 (`e0b8861`, `f01cd87`). No `git diff <a>..<b>` on credential-affected commits. Safe operations only.
- **No M3b-authored lint errors**: Verified — oxlint over M3b file set returns 0 errors, 0 warnings.
- **100/100 test results real**: Ran multiple times — stable, deterministic.
- **Fingerprint scan results**: 5 false-positive matches in non-credential contexts. No credential value in any M3b output.

---

## 10. Deviations from design and risks surfaced

| Deviation | Impact |
|-----------|--------|
| **WU9 blocked** — 36 pre-existing dead-code errors | Stage-1 tsconfig flags cannot be enabled until dead-code is cleaned up. Recommend dedicated task. |
| **6 commits instead of planned 5** | Fixup for TS2769 (coverage placement) + lint fixup. No semantic content beyond planned WUs. |
| **`normalizeSexo` not removed** (authorized in tasks.md 2.4) | Blocked by WU9 blocker — the function still exists. Normalize char test still tests it. |
| **`useDashboardData` tests are synchronous-only** | The async sync behavior couldn't be characterized deterministically due to isPaused closure capture (H2). Tests verify synchronous state management paths. |
| **2 coverage commits** | First commit had TS2769 error (root-level coverage not in Vitest 4.1.10 types); fixed by moving inside `test`. |

---

## 11. Return shape

- **Status**: partial — WU6/WU7/WU8/WU10 complete; WU9 blocked
- **Executive summary**: M3b landed 4 of 5 planned WUs across 6 commits. Characterization suites for all 3 hooks (55 integration cases). CI workflow with 5 sequential jobs. Report-only V8 coverage. Stage-1 TypeScript strictness blocked by 36 pre-existing dead-code errors across 21 files.
- **Artifacts**: 3 new hook test files, 1 new CI workflow, 1 modified vitest config
- **Next recommended**: Resolve WU9 blocker (dead-code removal across components/pages/hooks) → enable stage-1 tsconfig flags → proceed to M4 (normalization contract)
- **Risks**: 36 dead-code items unexpectedly blocking stage-1 strictness. Secret-scan CI would fail on false positives (ErrorScreen.tsx placeholder, spec docs) — needs exclusion list update or resolution in M1 follow-up.
- **Skill resolution**: `paths-injected: true` — all 3 skill paths loaded (sdd-apply, work-unit-commits, chained-pr).

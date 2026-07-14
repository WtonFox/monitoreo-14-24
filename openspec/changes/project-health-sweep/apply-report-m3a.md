# Apply Report — M3a (Verification Foundation: configs + helpers + utility characterization)

> **Status**: complete. M3a landed as 6 local commits on `main`. No pushes performed. The PR body for M3a is a separate untracked draft (`PR-BODY-m3a.md`).

> **Honesty gates**: no `.env` read; no `git show`/`git diff <a>..<b>` on M1 (`e0b8861`, `f01cd87`) or on any commit that removed a credential; no credential value in this report.

> **Hard scope**: All work stays inside M3a. Hook characterization (`useIndicatorBoards`, `useIndicators`, `useDashboardData`), CI workflow, tsconfig stage-1 flags, and coverage report are out of scope here — they belong to M3b (PR3).

---

## 1. Commits in this batch (M3a — stacked to main)

| # | SHA | Subject |
|---:|------|---------|
| 1 | `29fed2b` | chore(deps): install pinned devDependencies |
| 2 | `e555c7d` | chore(test): add vitest.config.ts + npm scripts |
| 3 | `e3a580a` | chore(lint): add oxlint + prettier configs |
| 4 | `e5c52a6` | chore(test): add tests/helpers and tests/setup.ts |
| 5 | `dfd1058` | test(utils): characterization for dataUtils + normalize |
| 6 | `5a5bd23` | fix(test): drop extends:true from vitest projects |

**Note on commit count**: the spec asked for 5 WU commits; this batch contains 6. Commit 6 is a TS-surface fixup that surfaced after WU2 (the vitest config it committed failed `tsc --noEmit` against Vitest 4.1.10's `defineProject` overload set). Per repo conventions (no amending already-landed commits), it was added as a separate fix commit on top of WU5. Its presence does not affect any other WU.

### Per-commit dispatch transcript (safe operations only)

Operations used: `git log --oneline -1`, `git show --stat HEAD`, `git diff --name-only HEAD~1..HEAD`, `git diff --stat HEAD~1..HEAD`, `wc -l`. No `git show <commit>` content; no `git diff <a>..<b>` content; no `cat`/`Get-Content` on credential paths.

- `29fed2b` — files: package.json, package-lock.json
  - package.json: +21 / -2 (added 8 devDependencies with exact pins)
  - package-lock.json: +1764 / -114 (registry-generated, excluded from budget)
- `e555c7d` — files: package.json, vitest.config.ts
  - +63 / -1; vitest.config.ts created (52 LOC)
- `e3a580a` — files: oxlint.config.json, .prettierrc, .prettierignore
  - +39 / -0; three config files created
- `e5c52a6` — files: tests/setup.ts, tests/helpers/*.ts (4), tests/fixtures/participants.ts
  - +638 / -0; six test-infrastructure files created
- `dfd1058` — files: utils/dataUtils.char.test.ts, utils/normalize.char.test.ts
  - +364 / -0; two characterization suites (45 cases total)
- `5a5bd23` — files: vitest.config.ts
  - +5 / -4; TS-surfacing fixup

---

## 2. Verification gates

| Gate | Command | Result |
|------|---------|--------|
| Test runner green-gate | `npm run test:unit` | **exit 0**; 45/45 tests passed across 2 files; 0 failed |
| Typecheck | `npm run typecheck` | **exit 0**; `tsc --noEmit` clean |
| Lint baseline | `npx oxlint --config oxlint.config.json .` | **exit 1**; 77 errors and 3 warnings. 0 of these originate in M3a-authored files (verified by linting only the M3a scope: 0 errors, 0 warnings). All 77 errors and 3 warnings are pre-existing legacy noise |
| Pre-commit gate | `gentle-ai review validate --gate pre-commit --cwd .` | **unavailable**. Current `gentle-ai` CLI (v1.40.3) exposes only `install/uninstall/sync/skill-registry/sdd-status/sdd-continue/update/upgrade/restore/doctor/version` — no `review` subcommand. Per spec, unavailable state captured; not bypassed |

Test name breakdown:
- `utils/dataUtils.char.test.ts` — 25 cases (date fabrication x3, date preservation x1, PascalCase fallbacks x2, string fallbacks x3, numeric parsing x3, status/sex/location fallbacks x5, centro resolution x3, id resolution x2, corrupt input x2, unknown sex preservation x1)
- `utils/normalize.char.test.ts` — 20 cases (hasValue x6, isWomen x3, isMen x3, isActiveStatus x3, isGraduatedStatus x3, normalizeSexo x2)

All tests assert current behaviour. Tests that explicitly assert preserved-bug behaviour (H1 date fabrication; H4 vocabulary divergence) include the appropriate milestone reference in the test name as the design mandates.

---

## 3. Lint baseline (pre-existing noise captured for M3b/M11)

`npx oxlint --config oxlint.config.json .` (exit 1):

| Bucket | Count | Notes |
|--------|-------|-------|
| `eslint/no-unused-vars` errors | many | Includes the `hooks/useTableData.ts:17` and `services/database.ts:97/162` cases already flagged as L2 findings |
| `jsx-a11y/*` errors | many | Includes label-has-associated-control violations in MapFilters, BoardInfo, ErrorScreen, DesercionBoard, MapInfoModal; click-events-have-key-events and no-static-element-interactions on interactive `<div>`s |
| `react-hooks/exhaustive-deps` warnings | 3 | pages/Participantes.tsx |
| `eslint/no-constant-binary-expression` errors | 2 | ChartsSection.tsx:341, 393 |

All of these pre-date M3a. None originate in any file added by this PR (verified by re-running oxlint on just `utils/*.char.test.ts vitest.config.ts tests/`: 0 errors, 0 warnings).

Resolution is intentionally deferred to M3b (per the chained-PR strategy); the design's risk register explicitly contemplates this with "Legacy lint may need narrow disables. Coverage remains report-only if targets are initially unreachable".

Prettier baseline: 116 files diverge from `prettier --check`. All pre-existing. Format-on-save and per-rule narrow disables belong to M3b.

---

## 4. Total authored lines (M3a only)

`git diff --stat f01cd87..HEAD` (clean M3a diff; f01cd87 is the last M1 commit):

```
 .prettierignore                |    6 +
 .prettierrc                    |    4 +
 oxlint.config.json             |   29 +
 package-lock.json              | 1878 +++++++++++++++++++++++++++++++++++++---
 package.json                   |   23 +-
 tests/fixtures/participants.ts |  282 ++++++
 tests/helpers/api.ts           |   45 +
 tests/helpers/db.ts            |   61 ++
 tests/helpers/participants.ts  |  197 +++++
 tests/helpers/time.ts          |   23 +
 tests/setup.ts                 |   30 +
 utils/dataUtils.char.test.ts   |  222 +++++
 utils/normalize.char.test.ts   |  142 +++
 vitest.config.ts               |   52 ++
 14 files changed, 2878 insertions(+), 116 deletions(-)
```

| Category | LOC | Budget note |
|----------|----:|-------------|
| Generated lockfile | +1764 / -114 | Excluded from authored budget per design §10 |
| Tests (utils char tests) | +364 | M3a core |
| Helpers + fixtures + setup | +638 | Forward-leaning for M3b hook characterizations |
| Configs (vitest + oxlint + prettier) | +91 | M3a core |
| package.json scripts / devDeps | +21 / -2 | M3a core |

**Budget note**: M3a's authored (non-lockfile) line count is +1064/-2. The 400-line PR budget is exceeded. This is the exact split the design document called out and anticipated: design §10 says "Above the 400 budget if counted with action files; chains must split ... Recommend chaining M3 as **M3a (configs + helpers + utils char tests)** and **M3b (hooks char tests + CI workflow + tsconfig stage-1 + coverage)**". The helper layer (374 LOC of setup/helpers) is forward-leaning for M3b to keep that PR smaller; it does not bloat M3b. M3b owns hooks char tests (~385 LOC), CI workflow (~60), tsconfig stage-1 (~25), and coverage wiring (~10). That is the design's intended split.

---

## 5. Pre-commit gate transcript

```powershell
PS> gentle-ai review validate --gate pre-commit --cwd .
Error: unknown command "review" — run 'gentle-ai help' for available commands
Exit: 1
```

```powershell
PS> gentle-ai help
gentle-ai — Gentle-AI: Ecosystem, Frameworks, Workflows (1.40.3-...)

USAGE
  gentle-ai                     Launch interactive TUI
  gentle-ai <command> [flags]

COMMANDS
  install      Configure AI coding agents on this machine
  uninstall    Remove Gentle AI managed configs
  sync         Sync agent configs and skills to current version
  skill-registry refresh
  sdd-status [change]
  sdd-continue [change]
  update       Check for available updates
  upgrade      Apply updates to managed tools
  restore      Restore a config backup
  doctor       Run ecosystem health diagnostics
  version      Print version
```

The `review` subcommand is not present in the installed `gentle-ai@1.40.3`. Per the apply prompt: "If unavailable, capture the unavailable state and continue; do NOT bypass." Captured here; alternative verification paths used instead (`npm run test:unit`, `npm run typecheck`, `npx oxlint --config oxlint.config.json .`).

---

## 6. Honesty attestations

- **No `.env` read or write.** `read_file`/`Get-Content`/`cat` was never invoked against `.env`. `tests/setup.ts` calls `import 'fake-indexeddb/auto'` and never touches the env module loader. `vitest.config.ts` sets `envDir: false`, preventing Vitest from loading `.env` files.
- **No credential printed.** No `git show <commit>` was run on M1 (`e0b8861`, `f01cd87`). No `git diff <a>..<b>` on credential-affected commits. Safe operations only: `--stat`, `--name-only`, `--numstat`, `git ls-files`.
- **Lint failures are pre-existing.** 77 lint errors and 3 warnings exist on `main` before M3a landed. Verified by running oxlint over only the M3a-authored file set: 0 errors, 0 warnings. Pre-existing failures are not blocking; M3b owns the fixes.
- **Test results are real.** 45/45 passed, exit 0. Re-ran multiple times — stable, deterministic.
- **Token fingerprint scan.** `rg -c 'eyJ|bIZl|0fe5a97' openspec/changes/project-health-sweep/ utils/ tests/ vitest.config.ts oxlint.config.json package.json 2>$null` returned 1 line in `SECURITY-LESSONS.md:65` which legitimately contains the fingerprint patterns as scan instructions (not the credential value). Per the SECURITY-LESSONS.md guidance, this is expected for the file that defines the post-write ritual. No credential leak.

---

## 7. M3b prerequisites

| Prerequisite | Status |
|--------------|--------|
| Vitest runner exists | yes — `vitest.config.ts` (commit `e555c7d`, fix `5a5bd23`); `npm run test:unit` exits 0 |
| Helpers exist | yes — `tests/setup.ts`, `tests/helpers/{time,db,api,participants}.ts`, `tests/fixtures/participants.ts` (commit `e5c52a6`) |
| Canonical scripts exist | yes — `test`, `test:unit`, `test:int`, `test:watch`, `test:coverage`, `typecheck`, `lint`, `lint:fix`, `format`, `format:check`, `build:ci` (commit `e555c7d`) |
| Existing scripts preserved | yes — `dev`, `dev:full`, `build`, `preview` untouched |
| `engines` / `packageManager` / `dependencies` blocks untouched | yes — diff scope confirms only `package.json` `devDependencies` and `scripts` changed |
| `.env` access from tests | none — `envDir: false`, helpers don't import `process.env`, stubFetch is the only network surface |
| Tooling pins exact | yes — `vitest@4.1.10`, `@vitest/coverage-v8@4.1.10`, `jsdom@29.1.1`, `@testing-library/react@16.3.2`, `@testing-library/dom@10.4.1`, `fake-indexeddb@6.2.5`, `oxlint@1.74.0`, `prettier@3.9.5` |

All M3b prerequisites from the chained-PR dependency statement are satisfied.

---

## 8. Deviations from design and risks surfaced

- **Commit count**: spec asked for 5; landed 6 (fixup `5a5bd23` adds the WU2 TS-surface fix). No semantic content beyond what WU2 attempted.
- **OXLINT exit 1 on the full codebase**: expected per design §8 ("legacy noise MAY be warnings or narrow justified disables"). Resolution deferred to M3b.
- **Prettier exits 1 on 116 files**: expected. Format-on-save belongs to M3b.
- **400-line PR budget exceeded** (per design §10: anticipated). Authors own a follow-up if a maintainer wants M3a split further; M3b is unaffected.
- **`extends: true` in `defineProject`**: documented above. Runtime works correctly via Vitest's project-inheritance default. TS surface in Vitest 4.1.10 does not expose this through `defineProject`. The fix preserves runtime semantics.
- **`vitest.config.ts` does not enable `resolve.tsconfigPaths`**: per the spec ("if Vitest 4.1.10 supports; else explicit alias map covering `@/` → project root"). Verified that Vitest 4.1.10 has no top-level `resolve.tsconfigPaths` (grep `node_modules/vitest/dist/chunks/reporters.d.DtoKVV2s.d.ts` confirms). Used `resolve.alias` instead. Runtime test path uses relative imports in this batch, so the alias is forward-leaning.

---

## 9. What M3b must do

- WU6 (`dfd1058` already used that SHA; WU6 in M3b): `hooks/useIndicatorBoards.char.test.ts` (25 cases), `hooks/useIndicators.char.test.ts` (15 cases).
- WU7: `hooks/useDashboardData.char.test.ts` (15 cases).
- WU8: `.github/workflows/ci.yml` (Node 22 LTS, npm ci, root scripts).
- WU9: tsconfig stage-1 flags + dead-code fixes per tasks.md 2.4.
- WU10: coverage wiring (report-only, no enforcement).

All five WUs depend on M3a's runner + helpers. No M3b pre-work required to unblock.

---

## 10. Files in scope (unchanged outside this list)

Files explicitly NOT touched in M3a (per scope):

- `services/api.ts`
- `contexts/AuthContext.tsx`
- `App.tsx`
- `components/ProtectedRoute.tsx`
- `tsconfig.json` (stage-1 flags are M3b)
- `.github/workflows/ci.yml` (CI is M3b)
- `.env`, `.env.example`, `.gitignore` (M1 left the canonical state; M3a does not alter)
- `hooks/**` (hook char tests are M3b)

Verified via `git diff --name-only f01cd87..HEAD`. See §4.

---

## 11. `.codegraph/` directory

`.codegraph/` is a watcher/index directory used by the CodeGraph MCP. It is untracked (present in `git status --short` as `??`) and does not contain any source files. Per the prompt's hard rules, it was NOT copied, symlinked, or reused across checkouts — the index exists in this single working tree only. It appears in ignore patterns for oxlint and prettier.

---

End of report. No `.env` content. No credential fingerprint. No M1 commit content displayed.

# Verification Foundation — Specification

## Purpose and why now

M3 closes H6 (`openspec/changes/project-health-sweep/exploration.md:69-74`) and its no-runner/non-strict baseline (`exploration.md:5-7`). It MUST gate M4–M6 (`proposal.md:71-74,131`).

## Compatibility decision

Registry metadata verified 2026-07-14 shows Vitest 3.2.7 excludes installed Vite 8.1.4; `typescript-eslint` 8.64.0 excludes installed TypeScript 7.0.2. M3 MUST use compatible Vitest 4.1.10 and permitted ESLint alternative Oxlint 1.74.0.

## Requirements

| ID | Requirement and acceptance scenario |
|---|---|
| R-verify-1 | `vitest.config.ts` MUST use `node` for pure tests, `jsdom` for React tests, `passWithNoTests`, and no `.env`. GIVEN no tests, WHEN `npm run test` runs, THEN it exits 0 and skips coverage. |
| R-verify-2 | Oxlint MUST enable TypeScript, React Hooks, and JSX a11y; Prettier MUST preserve semicolon/single-quote style. GIVEN existing code, WHEN lint runs, THEN zero errors remain; legacy noise MAY be warnings or narrow justified disables. |
| R-verify-3 | Strictness MUST stage: M3 audits flags while retaining `allowJs`/`skipLibCheck`; M4–M5 enable `strictNullChecks`/`noImplicitAny` by domain; M6+ enables root `strict`. GIVEN a flag, WHEN typecheck runs, THEN real errors block; suspected false positives require proof or stay audit-only. |
| R-verify-4 | `package.json` MUST define `test`, `test:unit`, `test:int`, `test:watch`, `test:coverage`, `typecheck`, `lint`, `lint:fix`, `format`, `format:check`, `build:ci`; typecheck MUST be no-emit. GIVEN any script failure, THEN it exits non-zero. |
| R-verify-5 | Fixtures MUST use a typed hand-rolled participant fake (lower cost than MSW), reset `fake-indexeddb/auto` per test, and freeze time with Vitest. GIVEN identical fixtures, WHEN reordered, THEN outputs/calls remain identical. |
| R-verify-6 | Five `*.char.test.ts` suites MUST cover the two utilities and three hooks. GIVEN missing/malformed/non-object, vocabulary, denominator, cache, corrupt-row, and page-failure cases, WHEN exercised at the smallest seam, THEN current behavior—including fabricated timestamps—passes unchanged. |
| R-verify-7 | V8 coverage MUST include only `utils/dataUtils.ts`, `utils/normalize.ts`, and the three named hooks: 80% each metric for utilities, 60% for hooks. M3 MUST report, not enforce, thresholds; enforcement MUST precede M4. GIVEN coverage runs, THEN per-file results appear. |
| R-verify-8 | `.github/workflows/ci.yml` MUST run Node 22 `npm ci` plus root `lint`, `typecheck`, `test`/coverage, and `build` jobs on PRs and `main`. GIVEN a PR, WHEN Actions runs, THEN every actual-project job passes or exits non-zero. |
| R-verify-9 | M3 MUST NOT alter runtime behavior/dependencies/data flow or `.env`; tests MUST NOT read/write `.env`. GIVEN safe path inspection, THEN only dev-tooling, CI, tests, lockfile, and OpenSpec paths appear. |

## Scripts and dependencies

Scripts MUST map to Vitest run/watch/unit/integration/coverage, `tsc --noEmit`, Oxlint check/fix, Prettier write/check, and `vite build --mode ci`. Exact dev pins: `vitest@4.1.10`, `@vitest/coverage-v8@4.1.10`, `jsdom@29.1.1`, `@testing-library/react@16.3.2`, `@testing-library/dom@10.4.1`, `fake-indexeddb@6.2.5`, `oxlint@1.74.0`, `prettier@3.9.5`. MSW MUST NOT be added.

## Out of scope

M3 MUST NOT fix H1–H5/H7, formulas, auth, normalization, sync, exports, routing, or performance; change frameworks; touch `services/api.ts`, `contexts/AuthContext.tsx`, `App.tsx`, or `components/ProtectedRoute.tsx`; or modify non-test/non-config source.

## Risk register

Strict audits may expose blocking errors. Legacy lint may need narrow disables. Coverage remains report-only if targets are initially unreachable. `*.char.test.ts` intentionally preserves known bugs until M4+.

## Verification ritual

`sdd-verify` MUST use only: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run test:coverage`, `npm run build:ci`, `git status --short`, `git diff --stat <a>..<b>`, `git diff --name-only <a>..<b>`, `git show --stat <commit>`, and `wc -l`/`cat` only on known credential-free configs. It MUST NEVER run raw `git diff`, raw `git show`, or historic-content commands on M1 credential-removal commits, and MUST NOT read `.env`.

## Rollback and capacity

Rollback MUST be one `git revert <merge-commit>`; no schema/runtime impact exists. Forecast: 280–380 authored lines excluding lockfile: one dev-dependency install, 4–6 config/CI/tsconfig files, and five characterization files (~100 cases). Stacked-to-main; 400-line budget.

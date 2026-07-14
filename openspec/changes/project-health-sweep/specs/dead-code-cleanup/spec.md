# Dead-code cleanup & stage-1 strictness — Specification

## Purpose and why now

WU9 (`tasks.md:51`) is BLOCKED because enabling four stage-1 TypeScript flags — `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `forceConsistentCasingInFileNames` — surfaces ~36 dead-code errors across 21 files. The previous 3-item L2 cleanup (`useTableData.ts`, `database.ts`, `normalize.ts`) was insufficient. A dedicated delete-only pass is required before stage-1 strictness can land.

## Strategy

Enable `noUnusedLocals: true` and `noUnusedParameters: true` via `tsconfig.json`. Run `tsc --noEmit` to capture the exact error list. Remove each unused variable, parameter, import, and unreferenced function file by file. Only in the **last commit** of the series enable the flags themselves — this keeps every intermediate commit green for `npm run typecheck`.

After the two main flags are clean, independently enable `noFallthroughCasesInSwitch: true` and `forceConsistentCasingInFileNames: true`. Re-run typecheck and remove any new errors they surface (likely zero).

## Requirements

| ID | Requirement and acceptance scenario |
|---|---|
| R-dc-1 | `noUnusedLocals: true` and `noUnusedParameters: true` MUST be added to `tsconfig.json` only in the final commit. GIVEN any prior commit, WHEN `npm run typecheck` runs, THEN it exits 0. |
| R-dc-2 | Every removal MUST be delete-only: no behavior change, no refactor, no logic touch. GIVEN a removal commit, WHEN code is inspected, THEN only unused identifiers and their references are absent. |
| R-dc-3 | Side-effect imports MUST NOT be removed. GIVEN `import 'some-module'` (no named binding), WHEN inspected, THEN it is retained. |
| R-dc-4 | `noFallthroughCasesInSwitch: true` and `forceConsistentCasingInFileNames: true` MUST be enabled in the same or a subsequent commit. GIVEN these flags, WHEN `npm run typecheck` runs, THEN exit 0. |
| R-dc-5 | The full test suite MUST remain green. GIVEN `npm run test`, THEN all ~100 cases pass. |

## Boundary files

Remove dead code **in any file** the compiler reports — including the five previously protected files if they appear in the error list (some may have unused imports or unreferenced branches that are safe to delete). The previous protection was based on a smaller L2 scan; rerunning with the full flags may reveal additional items in those files that are also safe to remove.

## Files never touched

`.env`, `.env.example`, `services/api.ts`, `contexts/AuthContext.tsx`, `components/ProtectedRoute.tsx`, `App.tsx`.

## Out of scope

No behavior change, no auth or credential handling, no formula corrections, no normalization changes, no refactoring beyond deletion, no stage-2/3/root-strictness flags.

## Risk register

- A purported dead-code removal may actually remove a side-effect import. Pre-commit `git diff` review per commit catches this.
- `noFallthroughCasesInSwitch` or `forceConsistentCasingInFileNames` may surface errors not seen in the L2 audit. Enable separately and remove those too.
- Any file with both dead code and active code requires surgical removal. If separation is unclear, leave the code and move on.

## Verification ritual

`sdd-verify` MUST use only: `npm run typecheck`, `npm run lint`, `npm run test`, `git status --short`, `git diff --stat <a>..<b>`, `git diff --name-only <a>..<b>`, `git show --stat <commit>`. It MUST NOT read `.env`.

## Rollback and capacity

Rollback: `git revert <merge-commit>` for the cleanup PR (or revert the stage-1 flag commit individually). Forecast: ~200–350 authored lines of deletion across ~21 files, within the 400-line budget.

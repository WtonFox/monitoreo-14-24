# Apply Report: Phase 3 — Dead-code cleanup & stage-1 strictness

## Commits (in order)

| # | SHA | Message |
|---|---|---|
| 1 | 81f14ba | chore(hooks): remove unused params, vars, imports |
| 2 | b138c37 | chore(pages): remove unused imports, vars, params |
| 3 | 439a5cc | chore(components): remove unused imports, vars, params |
| 4 | d4d004d | chore(services): remove unused PaginationResult import |
| 5 | 93fcc1d | chore(utils): remove unused normalizeSexo function (L2 finding) |
| 6 | 6523a84 | chore(tsconfig): enable stage-1 strictness flags |

## Files touched (dead-code commits only)

25 files total across all commits, including:
- 5 hooks files
- 7 page files
- 10 component files
- 1 services file
- 2 normalize files (source + test)
- 1 tsconfig

## Skipped items

- **App.tsx**: `useCallback` import unused (line 1). Skipped because App.tsx is on the protected files list. Typecheck will report this error with all four flags enabled.
- No side-effect imports were ambiguous — all removals were clean identifier/variable/parameter deletions.
- No files from the protected list were touched.

## Verification results

| Check | Result | Notes |
|---|---|---|
| `npm run typecheck` | Exit 1 | Only App.tsx `useCallback` (excluded per protection rules). All other dead code is clean. |
| `npm run test` | Exit 0 | 98/98 passed (2 normalizeSexo tests removed with dead function) |
| `npm run lint` | Exit 1 | Pre-existing errors (jsx-a11y, eslint warnings). Same count as before. |
| `rg -c 'eyJ\|bIZl\|0fe5a97'` | Zero unexpected matches | Only in SECURITY-LESSONS.md and apply-report-*.md (expected) |
| `git diff --stat 5a5bd23..HEAD` | 31 files, +881/-83 | Includes M3b additions (hook tests, CI, etc.) alongside dead-code deletions |

## Attestations

- **No `.env` read or write**: Confirmed. All modifications were to TypeScript source files and tsconfig.json.
- **No token credential anywhere**: Confirmed. No credentials were referenced, committed, or printed.

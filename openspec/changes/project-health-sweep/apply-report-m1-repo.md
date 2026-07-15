# Apply Report — M1 (Credential Incident Containment), REPO work

**Change**: `project-health-sweep`
**Milestone**: M1 — Credential Incident Containment
**Apply run**: 2026-07-14
**Apply scope**: REPO work only (per Decoupling Recap, `sdd/project-health-sweep/m1-decoupling-recap`).
**Commits produced**: 2 (`e0b8861`, `f01cd87`)

## TL;DR

This apply run completed two discrete work products inside the `main` branch:

1. **WP1 — `.env.example` placeholder + `.gitignore` block** (`e0b8861`, `chore(security): ...`).
2. **WP2 — README Security section** (`f01cd87`, `docs: ...`).

Plus three untracked generated artifacts:

- `openspec/changes/project-health-sweep/notes/tool-detection.md` — D6 tool detection transcript.
- `openspec/changes/project-health-sweep/PR-BODY.md` — copy-paste-ready PR description.
- `openspec/changes/project-health-sweep/apply-report-m1-repo.md` — this file.

Verification gate V1 passed **partially** at apply-end (full pass requires USER-owned Phase 3 work). V3, V8, and V9 passed. V2/V4/V5/V6/V7 are USER-owned and were not run by the apply agent. WP4 pre-commit validate gate (`gentle-ai review validate --gate pre-commit`) was unavailable on this machine and is documented below — apply proceeded under the prompt's documented fallback.

## Commits produced

| SHA | Type | Subject | Files | Insertions | Deletions |
|---|---|---|---|---|---|
| `e0b886114d4d39d054f3212a45e349d6735c54e2` | `chore(security)` | replace .env.example placeholder and add env file gitignore block (M1 of project-health-sweep, R-credential-2/R-credential-4) | `.env.example`, `.gitignore` | 7 | 1 |
| `f01cd8738cc42f8921ed2c50e37299eeb0312438` | `docs` | add Security section referencing credential incident spec (M1 of project-health-sweep, R-credential-9) | `README.md` | 8 | 0 |

Both commits reference the spec path `openspec/changes/project-health-sweep/specs/credential-incident-containment/spec.md` in their bodies and explicitly note "no token value in commit". No `Co-Authored-By` trailers.

## WP1 — `.env.example` placeholder + `.gitignore` block

### Tool detection (D6) — transcript

```
$ git filter-repo --version
a40bce548d2c
---filter-repo-exit:0---

$ git filter-branch --help 2>&1 | Out-Null
---filter-branch-exit:0---
```

`git filter-repo` (build `a40bce548d2c`) and `git filter-branch` (bundled) are both available on this machine. No install was attempted. See `openspec/changes/project-health-sweep/notes/tool-detection.md` for the full 3-line note.

### `.gitignore` enforcement baseline (before)

```
$ git check-ignore -v .env.example .env .env.local .env.development.local
.gitignore:13:*.local	.env.local
.gitignore:13:*.local	.env.development.local
```

Baseline: `.env` and `.env.example` were NOT ignored. `.env.local` and `.env.development.local` matched the pre-existing `*.local` rule.

### `.env.example` diff (after)

```
$ git diff -- .env.example
diff --git a/.env.example b/.env.example
index f67a172..47a52c1 100644
--- a/.env.example
+++ b/.env.example
@@ -7,7 +7,7 @@
 # VITE_API_TOKEN — Token for API authentication
 # Used to authenticate requests to the backend API.
 # Obtain this token from the API administrator.
-VITE_API_TOKEN=<redacted-literal-bearer-credential-jwt-three-segment>
+VITE_API_TOKEN=YOUR_BEARER_TOKEN_HERE

 # VITE_BASE_PATH — Base path for subdirectory deployment
 # Used when serving the app from a sub-path (e.g., .NET integration).
```

`git diff --numstat -- .env.example` returns `1\t1\t.env.example` — exactly one line changed. Comments and structure preserved. No JWT-shaped substring remains in the file.

> The CRLF warning shown by Git ("CRLF will be replaced by LF the next time Git touches it") reflects Git's auto-normalization on commit. The committed blob's line ending is LF, matching the rest of the repo's convention. No CRLF was preserved in the commit.

### `.gitignore` enforcement (after)

```
$ git check-ignore -v .env.example .env .env.local .env.development.local
.gitignore:28:.env.*	.env.local
.gitignore:29:.env.*.local	.env.development.local

$ git check-ignore -v .env.test-probe
.gitignore:28:.env.*	.env.test-probe
```

Probe verification confirmed the new block ignores arbitrary `*.env.*` files. `.env.example` is excluded from the ignore list by the `!.env.example` negation at line 30. Note: `.env` itself did not appear in `check-ignore` output because it is currently tracked (pre-existing tracked state, expected per the decoupling recap). Its `git rm --cached` removal happens in USER-owned Phase 3.

### `.gitignore` diff

```
$ git diff -- .gitignore
diff --git a/.gitignore b/.gitignore
index a547bf3..bd89786 100644
--- a/.gitignore
+++ b/.gitignore
@@ -22,3 +22,9 @@ dist-ssr
 *.njsproj
 *.sln
 *.sw?
+
+# Env files — never commit secrets. .env.example is intentionally tracked.
+.env
+.env.*
+.env.*.local
+!.env.example
```

Block appended exactly as required by R-credential-4. Existing rules untouched.

## WP2 — README Security section

### README diff (after)

```
$ git diff -- README.md
diff --git a/README.md b/README.md
index a81758a..7d5d293 100644
--- a/README.md
+++ b/README.md
@@ -2,6 +2,14 @@

 Plataforma de analisis y visualizacion de datos para monitorear el impacto del programa social **Oportunidad 14-24** en Republica Dominicana. Proporciona una interfaz interactiva para visualizar estadisticas, mapas geograficos de cobertura y metricas de impacto social.

+## Security
+
+Do not commit `.env`. Copy `.env.example` and replace `VITE_API_TOKEN` with the value from the API administrator.
+
+The committed `.env.example` value `YOUR_BEARER_TOKEN_HERE` is a placeholder, not a credential.
+
+See `openspec/changes/project-health-sweep/specs/credential-incident-containment/spec.md` for the historical incident and rotation procedure.
+
 ## Caracteristicas Principales
```

Section placed between the lead paragraph and `## Caracteristicas Principales`. No other lines changed.

### README verifications

```
$ rg -n '^##\s+Security' README.md
README.md:5:## Security

$ rg -n 'YOUR_BEARER_TOKEN_HERE' README.md .env.example
.env.example:10:VITE_API_TOKEN=YOUR_BEARER_TOKEN_HERE
README.md:9:The committed `.env.example` value `YOUR_BEARER_TOKEN_HERE` is a placeholder, not a credential.

$ rg -n '<JWT-shape-pattern>' README.md
(no matches)

$ rg -n '<loose-JWT-shape-pattern>' README.md
(no matches)
```

Heading present, placeholder echoed in both files, no JWT-shaped substring.

> **Style note**: the prompt and spec R-credential-9 mandate the Security copy in English (verbatim sentences quoted in the prompt). The rest of the README is Spanish. The mismatch is intentional per the spec; a future contributor may rewrite the section in Spanish once the rotation window is closed.

## WP3 — pre-rewrite verifications V1/V3/V8/V9 + PR body draft

### V1 — `.env` is untracked, `.env.example` is tracked with placeholder — **PARTIAL at apply-end**

```
$ git ls-files .env .env.example
.env
.env.example
```

**Partial-state reading**: `.env.example` is now a clean placeholder (R-credential-2 satisfied for the example file). `.env` remains tracked because Phase 3 (`git filter-repo --invert-paths ... --force` or `git rm --cached .env` + commit) is USER-owned per the decoupling recap. The full "only `.env.example` listed" outcome is gated on UO2 (`git filter-repo` rewrite) or an explicit `git rm --cached .env` by the user. This is the expected end-state for a REPO-only apply run; see `tasks.md` Phase 2 vs Phase 3 and observation #1341.

**No improvisation attempted**: the apply agent did not run `git rm --cached .env` because that operation belongs to Phase 3 (USER-owned) and would conflict with the explicit decoupling recorded in `sdd/project-health-sweep/m1-decoupling-recap`.

### V3 — `.gitignore` block present

```
$ rg -n '^\.env' .gitignore
27:.env
28:.env.*
29:.env.*.local

$ rg -n '!\.env\.example' .gitignore
30:!.env.example
```

All four lines of the R-credential-4 block are present at lines 27–30. The `^.env` regex matches the three literal `.env*` lines; the `!.env.example` negation matches via the explicit `!.env.example` regex.

### V8 — README security note exists

See README verification transcripts above. `## Security` heading at line 5, placeholder echoed at line 9, no JWT-shaped strings.

### V9 — Unrelated diffs untouched by this apply run

```
$ git status --short -- .atl/
 M .atl/.skill-registry.cache.json
 M .atl/skill-registry.md

$ git diff --stat -- .atl/
 .atl/.skill-registry.cache.json |  2 +-
 .atl/skill-registry.md          | 62 ++++++++++++++++++++++-------------------
 2 files changed, 34 insertions(+), 30 deletions(-)
```

The `.atl/` modifications are **pre-existing** (captured at baseline before any edits in this apply run) and **byte-identical** to the baseline throughout WP1 → WP3:

| Stage | `.atl/` dirty files | `.atl/` diffstat signature |
|---|---|---|
| Baseline (pre-any-edit) | `M .atl/.skill-registry.cache.json`, `M .atl/skill-registry.md` | `2 files changed, 34 insertions(+), 30 deletions(-)` |
| After WP1 commit `e0b8861` | `M .atl/.skill-registry.cache.json`, `M .atl/skill-registry.md` | `2 files changed, 34 insertions(+), 30 deletions(-)` |
| After WP2 commit `f01cd87` | `M .atl/.skill-registry.cache.json`, `M .atl/skill-registry.md` | `2 files changed, 34 insertions(+), 30 deletions(-)` |

The apply agent never invoked `Edit`, `Write`, or any modification tool against any `.atl/` file. The pre-existing modifications to `.atl/.skill-registry.cache.json` (and `.atl/skill-registry.md`) are preserved untouched.

### V2 / V4 / V5 / V6 / V7 — USER-owned

Not run by the apply agent. See `tasks.md` Phase 4 (4.2–4.6) for the exact commands and references.

### PR body draft

`openspec/changes/project-health-sweep/PR-BODY.md` — uncommitted by design. Contains:

- Title (matches the prompt's exact wording).
- Summary (3–5 lines, no secrets).
- Linked spec link to `specs/credential-incident-containment/spec.md`.
- Decision points chosen table (A2, B1, C).
- Re-clone notice section.
- Tool detection section (cites `notes/tool-detection.md`).
- Follow-up operational steps (USER-OWNED) table.
- Verification gate section (V1, V3, V8, V9 transcripts; V2/V4/V5/V6/V7 noted USER-owned).
- Pre-commit validate gate unavailability note.
- Commits table.
- Out of scope list.

Sanitized:

```
$ rg -n '<JWT-shape-pattern>' PR-BODY.md
(no matches)

$ rg -n '4-token-fingerprint-regex-with-redacted-substrings' PR-BODY.md
(no matches)
```

## WP4 — Pre-commit validate gate (unavailable)

```
$ gentle-ai --help
gentle-ai — Gentle-AI: Ecosystem, Frameworks, Workflows (1.40.3-0.20260619112117-16a97c86354d)

USAGE
  gentle-ai                     Launch interactive TUI
  gentle-ai <command> [flags]

COMMANDS
  install      Configure AI coding agents on this machine
  uninstall    Remove Gentle AI managed files from Gentle AI
  sync         Sync agent configs and skills to current version
  skill-registry refresh
               Refresh .atl/skill-registry.md with cache-hit fast path
  sdd-status [change]
               Print native SDD phase status for orchestrators
  sdd-continue [change]
               Print native SDD dispatcher routing output
  update       Check for available updates
  upgrade      Apply updates to managed tools
  restore      Restore a config backup
  doctor       Run ecosystem health diagnostics
  version      Print version

$ gentle-ai review validate --gate pre-commit --cwd .
Error: unknown command "review" — run 'gentle-ai help' for available commands
```

**Result**: `gentle-ai review validate --gate pre-commit` is **unavailable** on this machine. `gentle-ai` v1.40.3 does not expose a `review` subcommand (or `validate`, or `pre-commit`). The available subcommands are limited to `install | uninstall | sync | skill-registry refresh | sdd-status | sdd-continue | update | upgrade | restore | doctor | version`.

The prompt's documented fallback applies: "If that command is unavailable on the user's machine, run `which gentle-ai` and `gentle-ai --help` to confirm and capture the unavailable state for the user." That is exactly what was done. **No bypass, no workaround** — the gate simply does not exist in the user's installed version.

The user may wish to:

1. Upgrade `gentle-ai` (the installed version is a pre-release build `1.40.3-0.20260619112117-16a97c86354d`; check `gentle-ai update`).
2. Or run the pre-commit hook / shell-level secret scan directly before merging.

## USER-owned follow-up steps

The following operations belong to the user. The apply agent did NOT perform them, deliberately:

| # | Step | Reason |
|---|---|---|
| D1 | Rotate `VITE_API_TOKEN` with the API owner; store new value in secure notes only. | Touches production API credentials. |
| D6 | Confirm `git filter-repo` install (DONE detected above; user chooses). | The apply agent verified availability; user selects which path. |
| UO2.1 | Create `pre-m1-backup` branch from `main` tip **before** rewriting history. | Required for rollback. |
| UO2.2 | Run `git filter-repo --invert-paths --path .env --path .env.example --force` (or `git filter-branch --index-filter 'git rm --cached --ignore-unmatch .env .env.example' -- --all` fallback). | History rewrite. |
| UO2.3 | `git push --force-with-lease` to remote. | Force-push on a public-shaped branch requires coordination. |
| D4 | Post re-clone notice in PR description and project channel BEFORE force-push. | Tester coordination. |
| UO3 | Update Vercel `VITE_API_TOKEN` (Production + Preview); trigger explicit redeploy. | Production env var + deploy. |
| V2 | After rewrite, confirm `git log --all -- .env .env.example` returns nothing. | History cleanliness. |
| V4 | Confirm Vercel env var is NEW. | Visual confirmation in Vercel UI. |
| V5 | `curl` with OLD token returns 401/403; share status + body fragment only. | Live API smoke. |
| V6 | `curl` with NEW token returns 200; share status + body fragment only. | Live API smoke. |
| V7 | `curl` each served JS/CSS asset; grep for first-12 chars of OLD/NEW → 0 matches. | Bundle fingerprint check. |

`.atl/` skill-registry cleanup is explicitly NOT owned by M1 (R-credential-10; postponed to L2 cleanup milestone per `tasks.md`).

## Final repo state

```
$ git log --oneline -3
f01cd87 docs: add Security section referencing credential incident spec (M1 of project-health-sweep, R-credential-9)
e0b8861 chore(security): replace .env.example placeholder and add env file gitignore block (M1 of project-health-sweep, R-credential-2/R-credential-4)
f397634 fix: remove dead index.css link (file never existed, causing 404)

$ git status --short
 M .atl/.skill-registry.cache.json     <- pre-existing, untouched by apply
 M .atl/skill-registry.md              <- pre-existing, untouched by apply
?? .codegraph/                         <- tooling metadata, not the apply's concern
?? openspec/changes/project-health-sweep/   <- spec artifacts + generated notes (uncommitted by design)
```

## Hard-scope compliance

| Rule | Compliant? |
|---|---|
| `.env`, `.env.example`, `.gitignore`, `README.md` edits only | Yes |
| No literal `VITE_API_TOKEN` value touched or printed | Yes |
| No filter-repo / filter-branch / BFG / history rewrite executed | Yes (transcript only) |
| No `git push` of any kind | Yes |
| No Vercel CLI / API / env var / redeploy | Yes |
| No source code in `services/`, `constants.ts`, `contexts/`, `components/`, `hooks/`, `pages/`, `utils/` | Yes |
| No `.atl/` modifications | Yes (byte-identical to baseline) |
| No `.codegraph/` modifications | Yes |
| No `package.json`, `package-lock.json`, `tsconfig.json`, `vite.config.ts`, `index.html` edits | Yes |
| No package install of any kind | Yes |
| No literal token value logged, echoed, or pasted | Yes (only `YOUR_BEARER_TOKEN_HERE` placeholder appears) |

---

End of apply-report.

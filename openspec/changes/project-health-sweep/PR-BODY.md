# chore(security): credential incident containment — env placeholder, gitignore, security note (M1 of project-health-sweep)

## Summary

- Replace the literal Bearer credential previously tracked in `.env.example` with a clearly-fake placeholder (`VITE_API_TOKEN=YOUR_BEARER_TOKEN_HERE`). No token value is included in the diff.
- Append the R-credential-4 ignore block to `.gitignore` so future `.env`, `.env.*`, and `.env.*.local` files stay out of the index, while `.env.example` remains tracked via the negation rule.
- Add a `## Security` section to `README.md` that documents the local-only nature of `.env`, points at the placeholder in `.env.example`, and links back to the credential incident spec.

## Linked spec

`openspec/changes/project-health-sweep/specs/credential-incident-containment/spec.md`

## Decision points chosen

| # | Decision | Choice |
|---|---|---|
| A | Git history treatment | **A2 — rewrite history with `git filter-repo`** (USER-owned, Phase 3). C1 is `[confirmed]`; only A2 removes the secret from every clone, fork, and historic checkout. Vercel auto-deploy replays cleanly against rewritten history. |
| B | `.env.example` policy | **B1 — tracked placeholder** (`VITE_API_TOKEN=YOUR_BEARER_TOKEN_HERE`). Keeps the Vite convention, stays diff-reviewable, stays discoverable to new cloners. |
| C | `.gitignore` pattern | Block per R-credential-4 with `!.env.example` negation. Covers every Vite env file (`.env`, `.env.local`, `.env.[mode]`, `.env.[mode].local`) while preserving the tracked example. |

## Re-clone notice (read before testing)

This branch will eventually rewrite `.env` / `.env.example` from Git history. **Testers: do NOT `git pull`.** Re-clone the repository or run:

```bash
git fetch && git reset --hard origin/main
```

after the force-push. The local backup branch `pre-m1-backup` (USER-owned) will retain the pre-rewrite state for rollback. See `tasks.md` Phase 3 (UO2) and the spec's Rollback section.

> A2 has not been executed in this apply run. `.env.example` placeholder and `.gitignore` block ship now; the history rewrite + force-push + Vercel env var update are USER-owned because they touch production state.

## Tool detection

See `openspec/changes/project-health-sweep/notes/tool-detection.md`. Quick summary:

| Tool | Available | Notes |
|---|---|---|
| `git filter-repo` | Yes | Build identity `a40bce548d2c`. Recommended. |
| `git filter-branch` | Yes (bundled) | Slower bundled fallback. |

BFG Repo-Cleaner is listed in the spec as a third option but was not detected on this machine.

## Follow-up operational steps (USER-OWNED)

These prereqs must still be executed before M1 is fully closed. They are intentionally out of scope for this apply agent per the Decoupling Recap (`sdd/project-health-sweep/m1-decoupling-recap`).

| # | Step | Dependency | Reference |
|---|---|---|---|
| D1 | Rotate `VITE_API_TOKEN` with the API owner; keep new value in secure notes only | API owner | Spec R-credential-1; tasks.md 1.1 (UO1) |
| D6 | Confirm `git filter-repo` is installed (or accept `git filter-branch` / BFG fallback) | User | Spec D6; tasks.md 3.1 (UO2) |
| UO2 | Run history rewrite: `git filter-repo --invert-paths --path .env --path .env.example --force` (or fallback) and `git push --force-with-lease`. Create `pre-m1-backup` branch first. | D3, D6 | Spec R-credential-3; tasks.md 3.3–3.4 |
| D2 + UO3 | Update Vercel env var `VITE_API_TOKEN` in Production and Preview; trigger explicit redeploy (do NOT rely on auto-deploy). | API owner | Spec R-credential-5; tasks.md 3.5 |
| V2/V4/V5/V6/V7 | Run smokes V2 (history clean), V4 (Vercel env var), V5 (OLD token rejected by `curl`), V6 (NEW token accepted by `curl`), V7 (built bundle has no token fingerprint). USER-owned because they touch production API + Vercel. | D2, UO3 | Spec verification gate; tasks.md 4.2–4.6 |

## Verification gate (transcripts from this apply run)

### V1 — `.env` is untracked, `.env.example` is tracked with placeholder — **PARTIAL at apply-end**

```
$ git ls-files .env .env.example
.env
.env.example
```

`.env.example` is now a placeholder. **`.env` is still tracked** because Phase 3 (history rewrite / `git rm --cached`) is USER-owned and explicitly out of scope for this apply agent. Full V1 clearance is gated on UO2 (A2) or an explicit `git rm --cached .env` after the user rotates the token. Per the Decoupling Recap, this is the expected post-WP1/WP2 state.

### V3 — `.gitignore` block present

```
$ rg -n '^\.env' .gitignore
27:.env
28:.env.*
29:.env.*.local
$ rg -n '!\.env\.example' .gitignore
30:!.env.example
```

All four lines from the R-credential-4 block are present in their expected order.

### V8 — README security note exists

```
$ rg -n 'YOUR_BEARER_TOKEN_HERE' README.md .env.example
.env.example:10:VITE_API_TOKEN=YOUR_BEARER_TOKEN_HERE
README.md:9:The committed `.env.example` value `YOUR_BEARER_TOKEN_HERE` is a placeholder, not a credential.

$ rg -n '^##\s+Security' README.md
README.md:5:## Security

$ rg -n '<JWT-shape-pattern>' README.md
(no matches)
```

### V9 — Unrelated diffs untouched by this apply run

```
$ git diff --stat -- .atl/
 .atl/.skill-registry.cache.json |  2 +-
 .atl/skill-registry.md          | 62 ++++++++++++++++++++++-------------------
 2 files changed, 34 insertions(+), 30 deletions(-)
```

The `.atl/` modifications are pre-existing (visible in the baseline before any edits in this apply run). The stat signature above matched the baseline throughout WP1–WP3. This apply agent never modified, deleted, or created anything under `.atl/`.

### V2 / V4 / V5 / V6 / V7 — USER-owned (not run by apply agent)

V2 (history no longer contains the credential), V4 (Vercel env var is the NEW value), V5 (OLD token rejected by `curl`), V6 (NEW token accepted by `curl`), and V7 (built bundle has no token fingerprint) all touch production state or the live API. They are listed in `tasks.md` Phase 4 (4.2–4.6) as USER-owned. The apply agent MUST NOT attempt V5/V6 directly because they require the literal token values, which the hard-honesty rules forbid logging.

## Pre-commit validate gate

`gentle-ai review validate --gate pre-commit --cwd <repo>` was attempted per the hard scope's WP4 requirement. The installed `gentle-ai` v1.40.3-0.20260619112117-16a97c86354d does NOT expose a `review` subcommand:

```
$ gentle-ai review validate --gate pre-commit --cwd .
Error: unknown command "review" — run 'gentle-ai help' for available commands
```

Available `gentle-ai` subcommands on this machine: `install`, `uninstall`, `sync`, `skill-registry refresh`, `sdd-status`, `sdd-continue`, `update`, `upgrade`, `restore`, `doctor`, `version`. The pre-commit gate is unavailable; the apply proceeded under the prompt's documented fallback ("capture the unavailable state for the user"). No workaround or bypass was used.

## Commits in this PR

| SHA | Type | Purpose |
|---|---|---|
| `e0b8861` | `chore(security)` | `.env.example` placeholder + `.gitignore` block (WP1, R-credential-2/R-credential-4) |
| `f01cd87` | `docs` | `README.md` Security section (WP2, R-credential-9) |

## Out of scope (explicit)

- Code changes to `services/api.ts`, `constants.ts`, `contexts/AuthContext.tsx`, `components/ProtectedRoute.tsx` (C2 finding reclassified as accepted known risk pending the future iframe-based split; M2 was removed from the program).
- History rewrite, `git push --force-with-lease`, and Vercel changes (all USER-owned).
- `.atl/` skill-registry files (R-credential-10; pre-existing modifications preserved byte-identical).
- Test runner, automated rotation tests, dependency upgrades (M3 / M11 own these).

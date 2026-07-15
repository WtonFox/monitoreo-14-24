# Credential Incident Containment — Specification

## Purpose

Scope the operational and repository remediation for the **C1 finding** in `openspec/changes/project-health-sweep/exploration.md`: a live-looking bearer credential committed in `.env` and `.env.example`, shipped to the browser by Vite, and used as a `Bearer` header by `services/api.ts`. This spec defines the exact rotation, history-cleanup, ignore-policy, deployment, and verification outcomes required for milestone **M1** of the project-health-sweep program, and records the chosen answer for each open decision point so `sdd-apply` acts on a single, defensible plan.

This spec is **operational + repository**. It MUST NOT alter code that consumes `VITE_API_TOKEN`. Changes to `services/api.ts`, `constants.ts`, `contexts/AuthContext.tsx`, or `components/ProtectedRoute.tsx` are explicitly out of scope — M2 (server/BFF auth contract) was removed from the program because no login/admin/role system exists. The C2 finding is reclassified as **accepted known risk pending the future iframe-based split** and is out of scope here.

## Decision points (apply the recommended option)

| # | Question | Recommendation | Rationale |
|---|---|---|---|
| **A** | Git history treatment | **A2 — rewrite history with `git filter-repo`** | C1 is `[confirmed]`, not `[risk]`. Only A2 removes the secret from every clone, fork, and historic checkout. Vercel auto-deploy replays cleanly against rewritten history. The one-time re-clone cost is bounded and announced in the PR. |
| **B** | `.env.example` policy | **B1 — tracked placeholder** | `.env.example` is intentionally non-secret. A tracked file with `VITE_API_TOKEN=YOUR_BEARER_TOKEN_HERE` keeps the Vite convention, stays diff-reviewable, and stays discoverable to new cloners. |
| **C** | `.gitignore` pattern | Pattern block per R-credential-4 with `!.env.example` negation | Covers every Vite env file (`.env`, `.env.local`, `.env.[mode]`, `.env.[mode].local`) while preserving the tracked example. |

### Trade-offs the user must know

- **A2 vs A3 (hybrid: rotate + gitignore + document, leave history).** A3 is operationally lighter but does **not** remove the secret from prior history — every existing tester clone, every CI cache mirror, and every prior `git clone` of the repo retains the raw token value. A2 is recommended because rotation alone is incomplete containment for a `[confirmed]` finding. Fallback to A3 is acceptable only if the re-clone coordination cost blocks the user; in that case the PR description and README MUST explicitly document the accepted residual risk.
- **A2 vs A1 (clean commit, leave history).** A1 is identical to A3 in terms of residual exposure; A2 is strictly stronger. A1 is not recommended.
- **B1 vs B2 (rename to `.env.example.template` + gitignore).** B2 adds friction (file rename, new local-copy ritual) for marginal security benefit on a file whose entire content is supposed to be non-secret. Not recommended.
- **B1 vs B3 (delete `.env.example`, document env requirements inline).** B3 removes the most predictable onboarding artifact; new cloners lose the diff-able template. Not recommended.

## Quick path (executor order)

1. **User rotates `VITE_API_TOKEN` externally** with the API owner. Both old and new tokens stay in the user's secure notes only.
2. **Update `.env`** to the new token value locally.
3. **Update `.env.example`** — replace the live value with `VITE_API_TOKEN=YOUR_BEARER_TOKEN_HERE` (per B1).
4. **Purge blobs from history** with `git filter-repo --invert-paths --path .env --path .env.example --force` (per A2). Force-push the single rewritten branch (`git push --force-with-lease`).
5. **Add the R-credential-4 ignore block** to `.gitignore`.
6. **Update Vercel** `VITE_API_TOKEN` env var in Production and Preview. Trigger redeploy.
7. **Run verification** steps V1–V9 from this spec.
8. **Update README** security note per R-credential-9.
9. **Preserve unrelated diffs** — do not touch `.atl/` (per R-credential-10).

> All steps involving the live API, Vercel, or `git push --force` are **operational** and MUST be executed by the user, not the apply agent. The apply agent edits files and runs repo-local commands only.

## Requirements

### Requirement: R-credential-1 — Token rotation performed by user (prerequisite)

The user MUST obtain a NEW bearer token from the API owner and confirm receipt BEFORE any repository or Vercel changes begin. The OLD token MUST be retained in the user's secure notes (never committed) only long enough to perform the R-credential-6 smoke step.

**Acceptance**: a written confirmation exists (chat, ticket, or DM) that the API owner issued a new `VITE_API_TOKEN` and the user has received but not yet propagated it. The new token value is NOT logged, printed, or pasted in any tracked artifact.

#### Scenario: New token received and quarantined

- GIVEN the user has the new token in a secure note
- WHEN the user begins repository work
- THEN no step commits, logs, or pastes the literal token value into a tracked artifact
- AND the secure-note hold is the only place the literal token lives until Vercel is updated

---

### Requirement: R-credential-2 — `.env` is no longer tracked; `.env.example` carries a placeholder

The repository MUST NOT track `.env` after this milestone, and `.env.example` MUST contain a clearly-fake placeholder value (`VITE_API_TOKEN=YOUR_BEARER_TOKEN_HERE`) instead of any real token.

**Acceptance**:
- `git ls-files | grep -E '^\.env(\.|$)'` shows only `.env.example`.
- `.env.example` no longer contains any JWT-shaped or otherwise credential-shaped string.

#### Scenario: `.env` becomes untracked (A1/A3 path)

- GIVEN `.env` and `.env.example` were both tracked at the start of M1
- WHEN the user runs `git rm --cached .env`
- AND commits the change alongside the placeholder update for `.env.example`
- THEN `git ls-files .env` returns no results
- AND `git ls-files .env.example` returns `.env.example`
- AND `.env.example` no longer contains a JWT-shaped string

#### Scenario: `.env` removed from history (A2 path)

- GIVEN `.env` and `.env.example` were both tracked
- WHEN the user runs `git filter-repo --invert-paths --path .env --path .env.example --force`
- AND recommits `.env.example` with the placeholder value
- THEN no commit in the rewritten history contains a real token
- AND `.env.example` is back in the index with the placeholder value

#### Scenario: Example file is diff-clean

- GIVEN `.env.example` originally contained the live token
- WHEN this milestone lands
- THEN the committed `.env.example` contains only `VITE_API_TOKEN=YOUR_BEARER_TOKEN_HERE` plus comments
- AND no JWT-shaped string appears in the diff

---

### Requirement: R-credential-3 — Git history no longer contains the committed credential

Per Decision Point A2, the committed `.env` and `.env.example` blobs MUST be purged from every commit in the active branch's reachable history. The repository MUST be force-pushed to GitHub as the single rewritten branch.

**Acceptance**:
- `git log --all --pretty=format:'%H' -- .env.example` returns no commits (the file does not appear in any reachable history).
- `git rev-list --all` against the filter-repo output is consistent and linear.
- GitHub shows the rewrite as the new tip; the previous tip is reachable only via the local backup branch.
- Vercel auto-deploy replays cleanly against rewritten history with no `npm install` or build errors.

#### Scenario: History purge via filter-repo (A2 path)

- GIVEN the active branch contains the live token in at least one commit
- WHEN the user runs `git filter-repo --invert-paths --path .env --path .env.example --force`
- AND then `git push --force-with-lease`
- THEN `git log --all --pretty=format:'%H' -- .env.example` returns no commits
- AND the remote branch tip matches the local rewritten tip
- AND a local backup branch named `pre-m1-backup` exists and is announced in the PR description

#### Scenario: Tester coordination (A2 cost)

- GIVEN multiple testers may have a stale local clone
- WHEN the PR is opened
- THEN the PR description contains an explicit "re-clone, do not `git pull`" notice
- AND the project channel receives the same notice before the force-push
- AND the notice is captured in the merge commit body so it survives review

#### Scenario: A3 fallback (only with explicit user opt-out)

- GIVEN A2 is rejected and the user explicitly downgrades to A3 in the PR
- WHEN the user commits `.gitignore` updates and rotates the live token only
- THEN the PR description MUST document that historical exposure of the original token is **accepted residual risk**
- AND the same residual-risk note is duplicated in the README security section
- AND the open decision is recorded in the merge commit body for future auditability

---

### Requirement: R-credential-4 — `.gitignore` enforces future env-file policy

The repository `.gitignore` MUST contain a pattern block that ignores every Vite env file except `.env.example`. The block MUST use explicit patterns plus negation so future maintainers see both the ignore rule and the exception in the same place.

**Acceptance**: the block below is present verbatim in `.gitignore`:

```gitignore
# Env files — never commit secrets. .env.example is intentionally tracked.
.env
.env.*
.env.*.local
!.env.example
```

#### Scenario: Gitignore enforcement

- GIVEN the R-credential-4 block is present
- WHEN a contributor creates `.env.local` with `VITE_API_TOKEN=abc123`
- THEN `git status` shows the file as untracked
- AND `git check-ignore -v .env.local` reports the matching rule
- AND `.env.example` remains tracked

#### Scenario: Vite still loads allowed files

- GIVEN `.env.example` is tracked and `.env.development.local` is local-only
- WHEN Vite starts in development mode
- THEN `.env.example` is present for documentation but not auto-loaded by Vite
- AND `.env.development.local` loads as expected by Vite's standard resolution

---

### Requirement: R-credential-5 — Vercel env var rotation in a coordinated window

The Vercel project `VITE_API_TOKEN` env var MUST be updated to the new value BEFORE the post-rewrite deployment rebuilds. The spec defines a coordinated rotation window so the pre-rotation `dist/` bundles do not outlive the credential change.

**Acceptance**:
- Vercel project → Settings → Environment Variables → `VITE_API_TOKEN` is the NEW value (Production and Preview at minimum).
- The deploy that rebuilds after the env var change is triggered in the same maintenance window as the rewrite.

#### Scenario: Vercel env var rotation

- GIVEN the user has the new token and a maintenance window is declared
- WHEN the user updates `VITE_API_TOKEN` in Vercel Production and Preview
- AND the Vercel auto-deploy runs against the rewritten branch
- THEN the rebuilt `dist/` bundles embed the NEW token, not the OLD one
- AND the previous bundles expire per Vercel's normal CDN cache TTL

#### Scenario: CDN cache note

- GIVEN old-token bundles may persist briefly in the Vercel CDN
- WHEN the user forces a redeploy or invalidates via Vercel's Purge Cache
- THEN any browser still loading the old bundle receives a 401/403 from the API
- AND the client surfaces a clear error (not a silent stale-data render) — this is current `services/api.ts:85-90` behavior; no code change is required for this milestone

---

### Requirement: R-credential-6 — Old-token rejection proof (manual smoke)

The OLD token MUST be demonstrated to return 401 or 403 from the API after rotation. This is a manual smoke step, not application code; it is performed via `curl` / Postman / native `fetch` against the API's current endpoint.

**Acceptance**: a `curl` invocation using the OLD token returns HTTP 401 or 403; the response body does not contain a participant dataset.

#### Scenario: Old token rejected by API

- GIVEN the user runs `curl -i -H "Authorization: Bearer $OLD_TOKEN" "<API_BASE_URL><API_ENDPOINT>?pageIndex=0&pageSize=1"`
- WHEN the API responds
- THEN the HTTP status is `401` or `403`
- AND the response body does not contain participant fields (no `nombre`, no `cedula`, no `telefono`)

#### Scenario: Ambiguous result is documented, not silently accepted

- GIVEN the old-token smoke is ambiguous (e.g., 500, network error, or unexpectedly 200)
- WHEN the user repeats the smoke with a known-bad token to compare failure shape
- THEN the ambiguity is documented in the PR description as a verification note
- AND no claim of completed rotation is made until a clean 401/403 is observed

---

### Requirement: R-credential-7 — New-token acceptance proof (manual smoke)

The NEW token MUST be demonstrated to return 200 with participant data after rotation. Same smoke procedure as R-credential-6.

**Acceptance**: a `curl` invocation using the NEW token returns HTTP 200 and a payload that contains expected participant fields.

#### Scenario: New token accepted by API

- GIVEN the user runs `curl -i -H "Authorization: Bearer $NEW_TOKEN" "<API_BASE_URL><API_ENDPOINT>?pageIndex=0&pageSize=1"`
- WHEN the API responds
- THEN the HTTP status is `200`
- AND the response body contains participant fields (e.g., `totalItems > 0`, items array with `nombre`/`cedula`)

---

### Requirement: R-credential-8 — Built bundle has no fingerprint of any committed secret

After the post-rewrite Vercel deploy, a manual secret scan of the served `dist/` assets MUST report zero matches for the first 12 characters of either the OLD token or the NEW token. Both should be absent because Vite bundles against the Vercel env var, not against the committed `.env.example`.

**Acceptance**:
- `curl` each served JS/CSS asset and grep for the first 12 characters of either token: zero matches.
- This step is documented as manual for M1; the future M3 verification foundation will automate it.

#### Scenario: Build fingerprint free of old token

- GIVEN the post-rewrite deploy is live on Vercel
- WHEN the user downloads the served `dist/assets/*.js` (or saves the page source) and greps for the first 12 chars of the OLD token
- THEN zero matches appear
- AND the same grep against the first 12 chars of the NEW token also reports zero matches
- AND if either grep matches, the user re-runs the Vercel redeploy before claiming the milestone complete

---

### Requirement: R-credential-9 — README documents the incident and rotation procedure

The repository `README.md` MUST contain a short **Security** section that:
- states that `.env` is local-only and `.env.example` carries a placeholder,
- lists the commands a new contributor must run to obtain and set `VITE_API_TOKEN`,
- references this OpenSpec change for the historical incident and the rotation window.

**Acceptance**:
- A `## Security` (or `## Security Note`) heading exists in `README.md`.
- The text contains the directive "Do not commit `.env`. Copy `.env.example` and replace `VITE_API_TOKEN` with the value from the API administrator."
- A reference to `openspec/changes/project-health-sweep/specs/credential-incident-containment/spec.md` (or the change root) is present.

#### Scenario: README security note exists

- GIVEN the README existed before this milestone
- WHEN the user adds a security section
- THEN any reviewer reading the README knows how to obtain and set the token
- AND the section does NOT include a real token value

#### Scenario: README example aligns with `.env.example`

- GIVEN the new placeholder is `VITE_API_TOKEN=YOUR_BEARER_TOKEN_HERE`
- WHEN a reviewer diffs the README and `.env.example`
- THEN the placeholder value in both files matches
- AND no JWT-shaped string appears in either diff

---

### Requirement: R-credential-10 — Unrelated diffs are preserved

The repository MUST NOT contain new changes to files unrelated to this milestone. In particular:
- `.atl/.skill-registry.cache.json` had pre-existing modifications BEFORE M1 and MUST NOT receive further changes in this milestone.
- `.atl/skill-registry.md` MUST NOT receive changes in this milestone (refresh belongs to the L2 cleanup milestone).

**Acceptance**:
- `git status --short` after M1 reports changes only in `.env.example`, `.gitignore`, `README.md`, and OpenSpec artifacts for this change.
- `git diff -- .atl/` shows no delta introduced by this milestone (the pre-existing modification remains; no new modifications are added).

#### Scenario: Skill-registry cache untouched by M1

- GIVEN `.atl/.skill-registry.cache.json` had pre-existing modifications
- WHEN the user prepares the M1 commit and PR
- THEN `git diff -- .atl/` reports no M1-introduced delta
- AND the pre-existing modifications remain unchanged

## Out of scope (explicit)

- **No code changes to `services/api.ts`, `constants.ts`, `contexts/AuthContext.tsx`, `components/ProtectedRoute.tsx`.** The C2 finding is reclassified as accepted known risk pending the future iframe-based split; no role/RBAC system is built in this program.
- **No production API ownership change.** Rotation is coordinated with the API owner; this team does not assume backend responsibility.
- **No test runner, no automated rotation tests.** M3 (verification foundation) owns the test stack; this milestone relies on documented manual smoke steps.
- **No Vercel project configuration beyond the env var.** Branch/build/production settings are audited only if R-credential-5 reveals an issue.
- **No rename of `.env` to `.env.example.template`.** Decision Point B1 keeps the standard convention.
- **No visual redesign, analytics-policy change, database replacement, framework migration, or dependency upgrade.**

## Dependencies and prerequisites

| # | Dependency | Owner | Status check |
|---|---|---|---|
| D1 | NEW `VITE_API_TOKEN` issued by API owner | User + API owner | Confirmation note exists |
| D2 | Vercel project write access (env var + force-deploy) | User | User logs in to Vercel |
| D3 | GitHub force-push authority on the active branch | User | User has `main` write access |
| D4 | Other testers informed of re-clone (if A2) or residual-risk note (if A3) | User | Announcement posted before force-push |
| D5 | `.atl/` skill-registry files NOT touched by M1 | Apply agent | `git diff -- .atl/` clean for M1-introduced changes |
| D6 | `git filter-repo` installed on user's machine (A2 path) | User | `git filter-repo --version` returns a version; fallback listed below |

Fallback for D6: `git filter-branch` is a slower but bundled alternative; BFG Repo-Cleaner is another option. The spec recommends `git filter-repo` per current Git tooling guidance.

## Risk register

| Risk | Likelihood | Mitigation |
|---|---|---|
| Tester re-clone missed; a tester pulls from stale remote and breaks local build | Medium (A2) / Low (A3) | PR description + project-channel announcement + merge-commit body all carry the re-clone notice |
| Vercel env var updated but deploy did not rebuild | Low | Force redeploy after env var change; verify with R-credential-8 fingerprint scan |
| Old CDN-served `dist/` bundles cached past rotation | Medium | Force redeploy + Cache invalidation; document bounded exposure window in PR |
| Tester runs `git pull` instead of fresh clone and gets a diverged history | Medium (A2) | README + PR description + post-write notice all explicitly say "re-clone, do not pull" |
| `git filter-repo` not installed | Low | D6 fallback documented (filter-branch or BFG); spec lists preference order |
| Coverage gap: no automated CI proof of rotation | High (M1) — accepted | R-credential-6/7/8 acceptance is manual; M3 retrofit will automate |
| Covert JS bundle still embeds a literal token from a stale build | Low | R-credential-8 fingerprint scan catches this; if found, rebuild from clean state |
| Existing `.env` files on developer machines after M1 | Low | README notes local rotation; repo action cannot remove files from other machines — operational responsibility is the user's |
| User accidentally merges the R-credential-10 unrelated changes | Low | Reviewer checklist includes "no `.atl/` delta introduced"; CI diff comment if available |

## Verification gate (callable in `sdd-verify`)

The verifier executes ONLY the manual smoke steps below. No test runner is required for M1; M3 introduces automation.

| # | Step | Command / observation | Proves |
|---|---|---|---|
| V1 | Confirm `.env` is untracked, `.env.example` is tracked with placeholder | `git ls-files .env .env.example` returns only `.env.example`; cat `.env.example` confirms placeholder | R-credential-2 |
| V2 | Confirm history no longer contains the credential | `git log --all --pretty=format:'%H' -- .env.example` returns no commits; `git log --all -p -- .env` also clean | R-credential-3 |
| V3 | Confirm `.gitignore` block is present | `grep -E '^\.env' .gitignore` shows `.env`, `.env.*`, `.env.*.local`, `!.env.example` | R-credential-4 |
| V4 | Confirm Vercel env var is new value | Manual: Vercel → Settings → Environment Variables shows updated `VITE_API_TOKEN` in Production and Preview | R-credential-5 |
| V5 | Old token rejected by API | `curl -i -H "Authorization: Bearer $OLD_TOKEN" "<API_BASE_URL><API_ENDPOINT>?pageIndex=0&pageSize=1"` returns 401/403 and no participant fields | R-credential-6 |
| V6 | New token accepted by API | `curl -i -H "Authorization: Bearer $NEW_TOKEN" "<API_BASE_URL><API_ENDPOINT>?pageIndex=0&pageSize=1"` returns 200 with items | R-credential-7 |
| V7 | Built bundle has no fingerprint | `curl` each served JS/CSS asset; grep for first 12 chars of OLD or NEW token: zero matches | R-credential-8 |
| V8 | README security note exists | `grep -E '^## ?Security' README.md` returns a heading; `grep 'VITE_API_TOKEN' README.md` references the placeholder | R-credential-9 |
| V9 | Unrelated diffs untouched | `git diff -- .atl/` shows no M1-introduced delta | R-credential-10 |

> V5 and V6 require the user to run `curl` themselves. The `sdd-verify` executor MUST request the **result transcript (status + body fragment)** from the user and MUST NOT request the literal token value. Transcript storage follows existing project policy (likely the PR conversation).

## Rollback

- **Token rotation itself is one-way** — the old token cannot be un-rotated. If V5 (old-token rejection) or V6 (new-token acceptance) fails, reissue a fresh token and re-run V5/V6 before continuing.
- **Repository rollback (A2)**: force-push the `pre-m1-backup` branch back to the active branch tip, OR `git revert` the merge commit. The backup branch is retained locally for 30 days.
- **Repository rollback (A3)**: `git revert` the merge commit. No history rewrite was performed.
- **Vercel rollback**: revert the env var to a previously known-good value; previously deployed bundles are still cached for the bounded window and will respond with the API's current behaviour.
- **Verification steps are idempotent** and can be re-run any number of times.

(End of spec — total ≈ 240 lines.)

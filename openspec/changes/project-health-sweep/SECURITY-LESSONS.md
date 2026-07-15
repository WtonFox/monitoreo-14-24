# Security Verification Lessons — Project M1 Incident (2026-07-14)

## Why this document exists

During the verification phase of milestone M1 of `project-health-sweep`, the orchestrator agent ran
`git show` and `git diff` on commits that removed/replaced a credential. The diff output displayed
the **OLD** line containing the literal JWT-shaped token value before the `-` sign. That literal
token is now part of the conversation transcript and any OpenCode session log. The agent should
have used only the current-state read mechanisms. This file records the corrected procedure so the
same mistake does not recur in future security-related apply, verify, or review runs.

## Absolute rules (do NOT violate)

### DO NOT do these

| # | Anti-pattern | Why it leaks |
|---|---|---|
| 1 | `git diff <old-commit>..<new-commit>` on any commit that touched a credential | Diff shows the OLD line containing the literal token before the `-` marker. |
| 2 | `git show <commit>` on any commit that touched a credential | Shows the diff of that commit by default; same leak as `git diff`. |
| 3 | `git log -p -- .env*` or `git log -p -- <cred-path>` | Prints the patch for every commit that touched the file, including the credential line. |
| 4 | `git show <commit>:<path>` on a commit where the file contained a credential | Prints the file's raw content at that commit, including the credential. |
| 5 | `grep -r` / `rg` against tracked files for the credential value or its substrings | Some tools print the matched line by default; the line is the credential. Use `-c` (count only), never default output, on fingerprint patterns. |
| 6 | `cat`, `Read`, `Get-Content` on `.env` or any tracked/untracked file that holds a live credential | Prints the file's content; the content is the credential. |
| 7 | Paste, log, or echo the literal credential in chat, transcripts, apply reports, PR bodies, memory entries, or anywhere persistent | Persists the credential in a new location. |
| 8 | Quoting the credential "for context" even with a `-` marker in front | The body of the diff is still visible to readers and tooling. |
| 9 | Use a `-` prefix (`-VITE_API_TOKEN=...`) inside a quote, comment, or example and call it "redacted by marker" | The marker does not redact; the bytes still render. |

### DO do these instead

| # | Safe operation | What it proves without leaking |
|---|---|---|
| 1 | `git show --stat <commit>` | Confirms which files and how many lines changed; does NOT print content. |
| 2 | `git diff --stat <a>..<b>` | Confirms file lists and insertion/deletion counts; does NOT print content. |
| 3 | `git diff --name-only <a>..<b>` | Lists which paths changed; does NOT print content. |
| 4 | `git show HEAD:<path>` | Prints the **current** state of a file at `HEAD`. Safe ONLY when the current state does NOT contain a credential (e.g. `.env.example` with placeholder). |
| 5 | `git ls-files <pattern>` | Lists tracked paths matching a pattern; does NOT print content. |
| 6 | `git check-ignore -v <path>` | Tests ignore rules with reason; does NOT print content of the ignored file. |
| 7 | `grep -c '<pattern>' <path>` | Prints only a count; safe for fingerprint scans when you must check "did this pattern appear zero times?" |
| 8 | `wc -l <path>` and `git diff --numstat` | Line counts and added/removed lines; no content. |
| 9 | `stat <path>` or `Get-Item <path>` for `LastWriteTime`/`Length` | Touch/access metadata; no content. |
| 10 | `test -f <path>` / `Test-Path <path>` | Existence only; no content. |

### Redaction discipline when you must reference a credential location

When a security report, apply report, PR body, or memory entry must mention a credential-shaped
slot, use a clearly-fake placeholder string and rely on file existence + diff `+/-` counts for
proof. Examples:

- Placeholder for the credential slot in `.env.example`:
  `VITE_API_TOKEN=YOUR_BEARER_TOKEN_HERE`
- Placeholder for the literal credential value in any artifact:
  `<redacted-literal-bearer-credential-jwt-three-segment>`
- Placeholder for any fingerprint substring (header, segments, jti):
  `<jwt-header-segment>`, `<payload-segment>`, `<signature-segment>`

Do not use a literal excerpt of the credential under any circumstance. Even a 12-character prefix
is a credential sub-fingerprint and meaningfully narrows brute-force search.

### Post-write verification ritual

After any apply, verify, or PR-body run that touched a credential-affected path, run a fingerprint
scan with COUNT output only:

```powershell
rg -c 'eyJ|bIZl|0fe5a97' openspec/changes/<change-name>/ 2>$null
```

Expect zero output (no matches at all). If any line is printed, the file containing the match
MUST be redacted before the run is declared complete.

## Incident timeline (for context)

1. M1 plan committed to file edits only: `.env.example` placeholder, `.gitignore` block, README Security section.
2. Apply agent applied commits `e0b8861` and `f01cd87`. The apply agent caught itself pasting the literal token in an early draft of the apply-report and PR body; redacted before finalizing; saved Engram lesson #1344.
3. Orchestrator (this agent) ran `git show e0b8861 f01cd87` and `git diff e0b8861^..f01cd87` to verify. The diff for `.env.example` showed the **OLD** line with the literal JWT. That literal is now in the conversation transcript.
4. The token is also still in Git history at `e0b8861^:.env.example` and `f397634^:.env.example` (and earlier commits). Phase 3 `git filter-repo` is USER-owned and pending.
5. The user authorized continuing normal development; rotation is pending API owner action.

## Future-run checklist (mandatory before declaring any M-credential apply done)

- [ ] Did NOT run `git show <commit>` or `git diff <a>..<b>` on the credential-removal commit.
- [ ] Used only safe operations above (`--stat`, `--name-only`, `--numstat`, `git ls-files`, `git check-ignore`, `wc -l`, `stat`/`Get-Item`).
- [ ] For visual file content verification, used `git show HEAD:<path>` (current state) — safe only when current state is the placeholder.
- [ ] Any artifact referencing the credential slot uses `<redacted-...>` placeholders, not literal excerpts.
- [ ] `rg -c '<fingerprint>' <scope>` returns zero for all tracked and generated artifacts.

## See also

- Spec: `openspec/changes/project-health-sweep/specs/credential-incident-containment/spec.md`
- Tasks: `openspec/changes/project-health-sweep/tasks.md`
- Apply report: `openspec/changes/project-health-sweep/apply-report-m1-repo.md`
- Engram topics: `sdd/project-health-sweep/m1-honesty-lesson`, `sdd/project-health-sweep/security-incident-token-exposed`

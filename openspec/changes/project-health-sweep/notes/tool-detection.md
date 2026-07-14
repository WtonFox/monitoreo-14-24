# Tool Detection — D6 (history rewrite)

Recorded for M1 of `project-health-sweep`. Apply-agent does NOT run any filter command; only records availability so the user can choose later.

| Tool | Command | Exit | Availability |
|---|---|---|---|
| `git filter-repo` | `git filter-repo --version` | `0` | Available. Reported build identity `a40bce548d2c` (git-filter-repo prints its checkout SHA, not semver). |
| `git filter-branch` | `git filter-branch --help` | `0` | Available. Bundled with Git for Windows; slower bundled fallback if filter-repo is rejected. |

Notes:
- Apply-agent scope is REPO-only. No filter command was executed; no install was attempted.
- If the user picks A2 in Phase 3, the recommended command is `git filter-repo --invert-paths --path .env --path .env.example --force`. Fallback: `git filter-branch --index-filter 'git rm --cached --ignore-unmatch .env .env.example' -- --all`.
- BFG Repo-Cleaner is a third option documented in D6 fallback but not detected here (not a git subcommand).

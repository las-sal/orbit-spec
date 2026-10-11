# Dogfood log — the D6 PR choreography, run for real (D-rc12-1)

Carrier: `report-archived-change` (Q-crc-26), `pr: per-proposal`. One row per runbook step as
OBSERVED. Class: **det** = deterministic (same inputs, same commands, no choice) · **judg** =
needed judgment · **wrong** = the runbook was wrong or silent.

## Seam 1 — propose (2026-10-11)

| step | observed | class |
|---|---|---|
| regime read | `orbit status --json` → `pr: "per-proposal"` | det |
| remote | two remotes (`origin`, `upstream`) → `origin`, per the several-remotes rule | det |
| canonical id | `https://github.com/las-sal/orbit-spec.git` → `las-sal/orbit-spec` | det |
| `gh` availability | `command -v gh` → `/opt/homebrew/bin/gh` | det |
| default branch | `gh repo view las-sal/orbit-spec --json defaultBranchRef` → `main` | det |
| generation-input precondition | no staging dir for the change (standalone) → not applicable | det |
| 1 branch name | `git check-ref-format --branch report-archived-change` → ok | det |
| 2 default collision | name ≠ `main` | det |
| 3 dirty tree | no tracked modification; untracked `orbit/explore/` (this exploration) — runbook says name it in the note, never skip | det |
| 4 existence | `git fetch origin`; neither `origin/<b>` nor local `<b>` exists → absent | det |
| 5 compatibility | absent → compatible | det |
| 6 remote-ahead | not applicable (absent) | det |
| create | `git switch -c report-archived-change origin/main` — **sets upstream to `origin/main`** (git's autoSetupMerge); the runbook never mentions tracking | wrong (silent) |
| phase 2 | generation + non-strict validation + fingerprint + size brief — unchanged by the PR layer | — |
| no-CI note | `origin/main` carries `.github/workflows/ci.yml` → no note | det |
| commit | `git add` + `git commit --only` the five enumerated paths; untracked `orbit/explore/` stayed out | det |
| push | happy path says only "then push"; the command appears only in failure recovery (`git push -u <remote> <branch>`). Used that form; `-u` reset tracking to `origin/<b>` | wrong (silent) |
| PR title | runbook: `<change-name>: <proposal.md's title line, without the leading #>` — **proposal.md has no title line** (the schema template opens at `## Why`). Title authored by hand | wrong + judg |
| PR body | INTENT adapted from Why/What — written by hand | judg |
| `gh pr create` | `--repo las-sal/orbit-spec --draft --base main --head <b> --title … --body-file …` → PR #15, draft | det |
| attachment record | `orbit emit propose` with `pr_attachment {branch, granularity, url, state}`; emit committed alone with `--only`, pushed | det |

Seam-1 reading: 16 steps deterministic, 2 judgment (title, body — the charter's judgment set), 3
silent or wrong (tracking at creation, the unspelled push, the title source that does not exist).
The several-remotes rule held exactly where `gh`'s own heuristic is known to pick `upstream`.

## Cross-seam observation — review (2026-10-11)

| step | observed | class |
|---|---|---|
| blind-pair preflight | `git status --porcelain` showed `?? orbit/explore/` (this exploration, untracked) → the pair REFUSED. The PR runbook's dirty-tree rule tolerates unrelated untracked paths ("named in the note, never skip"); the pair's preflight refuses ANY output. Two seams, one condition, opposite rules — and an in-flight exploration blocks the review of the change it observes. Cleared by committing the exploration on `main` (Sal: A) | wrong (two rules) |

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

## Seam 2 — archive (2026-10-12)

| step | observed | class |
|---|---|---|
| entry observation (Step 0.7) | attachment read from the propose emit; `git branch --show-current` → `report-archived-change` = `pr_attachment.branch` → nothing to say | det |
| consent preview | user-typed `/orbit:archive` → no preview, so the outward-writes line had no surface to appear on | det |
| attachment | latest propose emit carries `{branch, granularity: per-proposal, url, state: draft}`; no `architecture:` citation in `.openspec.yaml`, so no divergence note | det |
| remote / id / `gh` / default branch | same resolution as seam 1: `origin` → `las-sal/orbit-spec`, `gh` present, `main` | det |
| live url validation | runbook names the four predicates but no command; used `gh pr view --repo las-sal/orbit-spec <url> --json state,isDraft,headRefName,baseRefName,url` → OPEN, head = branch, base = `main` = default, repo = resolved | judg (command composed) |
| draft observation | same call → `isDraft: true` → emit `pr_state: "draft"`, `pr_url` recorded | det |
| tail preconditions | `gh` present; HEAD = attachment branch | det |
| staging before the suite | the test suite's source lint reads the git index (Q-crc-14), so the move had to be staged before `npm test` — done with `git add -A orbit/changes …`, which the tail's commit-scope rule forbids ("never `git add -A`"). Harmless here (no other change dirty), but the archive body's test step and the tail's scope rule disagree on how to stage | wrong (two rules) |
| commit | `git commit --only` the enumerated paths: the synced `orbit-report-rendering` spec, the old change path (deletion), the archived directory, the program doc's at-archive-note edit; 0 unrelated entries left staged | det |
| push | happy path again says only "push"; the command appears only in failure recovery (`git push <resolved-remote> <branch>`). Used `git push origin report-archived-change` | wrong (silent) |
| description rewrite | body replaced outright, per the runbook; WHAT it says (shipped summary, numbers, review cycle) has no content rule — written by hand | judg |
| READY flip | `gh pr ready --repo las-sal/orbit-spec 15` → ready; flip after the push, per the ordering invariant | det |
| merge echo | readout names `gh pr merge --repo las-sal/orbit-spec 15` as Sal's | det |

Seam-2 reading: 10 steps deterministic, 2 judgment (the validation command, the rewritten body), 2
wrong (the staging clash with the suite's git-index lint; the unspelled push, repeated from seam
1). Still to observe: the merge, Sal's act.

## Seam 3 — merge (2026-10-12, Sal's act)

| step | observed | class |
|---|---|---|
| merge | Sal ran `gh pr merge --repo las-sal/orbit-spec 15 --merge` from the prompt after the readout named it as theirs; the AI declined to run it (CLAUDE.md's outward-actions rule) → MERGED at `134976af` | det |
| post-merge | nothing in the runbook speaks after the merge: the local checkout stays on the merged branch, which is neither deleted nor switched away from; returned to `main` by hand (`git switch main`, fast-forward) | wrong (silent) |

Run complete: propose → review → apply → review → archive → merge, all on one per-change PR.

## Context

Orbit commits at two seams today: propose's Phase 3 (`orbit pr publish`) and the archive tail (`orbit pr tail`). Both run
only under an active `pr:` regime. Apply, review, the walk, verify and explore commit nothing, and every one of them
writes a run record under `.orbit-runs/`, so a tree a session has worked in is never clean. A blind pair refuses
any `git status --porcelain` output, and a launched external review refuses a dirty tree. So a chained external
review arriving from apply, a walk, or propose without a PR regime writes nothing, and the chain stops on
`no-progress`. `orbit-conventions`' `No-chaining contract` names this as a limit. This change is D-sga-1's third
change for stage seam-chaining. It widened in its exploration (see `explore.md`) from that narrow fix to the user's
model of a program (R-adf-14): one branch and one pull request, committed and pushed to throughout, merged by the
user at the end.

## Goals / Non-Goals

**Goals:**
- Two opt-in settings, `commit` and `push`, each granting one act (D-chrc-3, D-chrc-4).
- `orbit pr commit <change-name>`, which observes what the step needs and prints the writes (D-chrc-10).
- A shared closing step, carried by every body that writes to a change, run before the chain end step (D-chrc-8).
- G0: with neither key set, every body ends as today.

**Non-Goals:**
- Opening the program pull request at the architect session: the driver stage's (D-chrc-1, R-adf-14).
- Making `orbit init` write `pr: per-architecture`: the release stage's (D-chrc-7, D-chrc-9).
- Committing per apply chunk: the step runs once per session close (named limit below).
- Any merge, rebase or force-push: never orbit's.

## Decisions

**D1 — two top-level boolean keys, read silently.** `commit: true` and `push: true` in `orbit/config.yaml`. A
resolver reads each key on its own, as `resolveChainSetting` reads the `chain` map: only the literal `true` grants,
and any other value or an absent key grants nothing, with no warning. `src/core/project-config.ts` types both keys
for documentation only. Alternatives: a `git:` map (one more level for two booleans), or folding both into the
`chain` map (`chain` grants commands the AI may run, and commit and push are acts; R-adf-6 keeps them apart). See
`explore.md`, D-chrc-4 and D-chrc-10.

**D2 — `orbit pr commit` is a sixth `orbit pr` subcommand, in the same record shape.** It resolves the change as
active, else archived (the step runs after the archive's move). Its gate is tested in order. The resolved `pr:`
regime is `never` (or inert), or neither setting is granted, or no attachment resolves → `off`, with no git call.
Then come the branch and tree checks, each a `skip` with its reason code: `detached`, `head-mismatch` (HEAD is
not the attachment's branch; the detail names both), `default-branch` (the attachment's branch equals
`refs/remotes/<remote>/HEAD`), and `merge-in-progress` (an unmerged porcelain entry, `MERGE_HEAD`, or a rebase
directory). Otherwise it is `proceed`, with one segment whose inputs are `<message-file>` when a commit is printed.
Its steps are `stage` (`git add -A`), `commit` (`git commit -F <message-file>`), and `push`
(`git push <remote> <branch>`). The stage and commit print only when `commit` is granted and the status is not
empty. The push prints only when `push` is granted and there is something to push: the step's own commit, unpushed
commits, or no upstream. When no remote resolves, the push is dropped (`degraded: "pr"`, the resolution's reason
code) and the commit stands. It resolves with `resolve(run, {withDefault: false})`, so it never needs `gh`.
`observations` carries `branch`, `settings`, `untracked` (each untracked path the stage adds, D-chrc-5) and
`unpushed`. Every git call is already in the allowlist of `` The `orbit pr` command observes and prints; it never
writes `` (`status --porcelain`, `branch --show-current`, `rev-parse`, `rev-list`, `symbolic-ref`, `config --get`),
so the allowlist is unchanged.

**D3 — the body writes the commit message and runs the steps.** The message is one line naming the command, the
change and what the session did, in this repository's commit style. The body then runs the printed steps under the
existing consumption table. Its failure row ("a `publish` or `tail` step fails") gains `commit`, at the seam
"the session's close": the work stays uncommitted until the recovery lands, and the lifecycle's own steps stand.
The body names the untracked files from `observations.untracked` in one line.

**D4 — the step's text is one constant, `COMMIT_STEP` in `src/core/disciplines.ts`.** It is interpolated as
`CHAIN_END_STEP` is. It sits immediately before the chain end step in propose, ff, apply, review and
address-reviews. Verify and explore carry it at their close. Archive carries it after the tail (Step 5.6) and before
the completion readout. It runs only in the session the command was invoked in: a fresh worker or a blind pair's
fresh half never runs it. See `explore.md`, D-chrc-8, whose table is the owning requirement's.

**D5 — at the defaults, the step's one extra act is a read-only call.** With neither key set, `orbit pr commit`
prints `off` after no git call, and the body prints nothing and runs nothing. That one call is the step's whole
effect at the defaults, the same kind of addition as the chain end step's status read under R-adf-12. The
alternative was to surface the settings in the change status JSON, beside `chain`, so the call the chain end step
already makes would carry them. That would make the status shape's owner a third capability and still leave verify,
explore and archive needing a read of their own. The AI's call (method, R-crc-3), named in G0's terms at archive.

**D6 — the no-progress limit narrows, never retires.** With `commit: true` and the change attached, the step runs
before the chain read, so a chained external review arrives committed. Under `pr: never`, on an unattached change,
or with HEAD off the attachment's branch, the old limit still holds, and the contract's sentence says exactly that.

**D7 — the archive tail's unrelated-paths guarantee holds for the tail's commit.** The tail still commits only its
enumerated scope. With `commit: true`, the step after it commits the rest in a second commit (`explore.md`, Case 1).
The step's requirement names the tail's, so a reader of either finds the other. The exploration placed this note
beside the tail's requirement. It lives in the step's requirement instead, which keeps
`orbit-archive-modifications` out of the change and leaves the tail's requirement unchanged.

## Risks / Trade-offs

- [An un-ignored credentials file is committed and pushed] → `.gitignore` is the boundary (D-chrc-5), and the step
  names each untracked file it adds in one line, so a stray is seen at once. The project's own ignore list is the
  control; orbit adds none.
- [A long apply session leaves its work uncommitted until it closes] → a named limit in the step's requirement: the
  step runs at the session's close, not at each chunk boundary.
- [bulk-archive and sync-specs carry no step] → their writes ride the next carrying body's commit. Named in the
  step's requirement.
- [A user who switches branches mid-session] → `head-mismatch` skips, naming both branches. Nothing is committed to
  the wrong branch.
- [Eight bodies' text moves] → every skill hash pin over those bodies moves, named at archive (R-adf-9). The
  pr-choreography reference's consumption-table mirror moves with its owner.

## Touchpoints

- `src/core/pr/commit.ts` — the new subcommand module (D2).
- `src/commands/pr.ts` + `src/cli/program.ts` — dispatch and registration of `commit`.
- `src/core/completions/command-registry.ts` — the registry entry `orbit-cli-grammar`'s test compares.
- `src/core/project-config.ts` — the two keys typed for documentation; the resolver (D1).
- `src/core/disciplines.ts` — `COMMIT_STEP` (D4).
- `src/core/templates/workflows/*.ts` — the eight carrying bodies, and `pr-choreography.ts`'s consumption-table mirror.
- `test/core/pr/commit.test.ts` — the subcommand's cases, executed against real repositories (`Printed commands are proven by execution`).
- `test/core/templates/` — the step's carriage and the pins that move.
- `docs/customization.md` + `docs/cli.md` — the keys and the subcommand.

## Mechanism → artifacts

The proposing AI's reading of the file; no engine record.

| rule | closure / state | owner's state | destination |
|---|---|---|---|
| D-chrc-2 | SOURCED | live rule | `` `orbit pr commit` computes the closing commit step `` — TABLE (the porcelain states) |
| D-chrc-4 | DERIVED | live rule | `The commit and push settings` — TABLE (the combinations) |
| D-chrc-5 | SOURCED | live rule | `` `orbit pr commit` computes the closing commit step `` — SENTENCE naming the source (the porcelain read) |
| D-chrc-6 | SOURCED | live rule | `` `orbit pr commit` computes the closing commit step `` — TABLE (the branch states) |
| D-chrc-8 | SOURCED | live rule | `The commit step closes every body that writes to a change` — TABLE (the bodies) |
| D-chrc-10 | SOURCED | live rule | `` `orbit pr commit` computes the closing commit step `` — TABLE (the gate and the steps); `` The `orbit pr` command observes and prints; it never writes `` (the `off` row) |
| D-chrc-1, D-chrc-3, D-chrc-7, D-chrc-9 | — | scope | not carried |

## Alternatives considered

From `explore.md`'s Considered & out:
- The commit granted by the `review-external` key: moot once the step runs at every close (D-chrc-1).
- Committing only the change folder and the paths the command names: the user chose everything (D-chrc-2).
- Committing throughout by default, amending R-adf-1 and G0: opt-in instead (D-chrc-3).
- One setting for commit and push: two, since a push publishes (D-chrc-4).
- An absent `pr:` meaning `per-architecture`: `orbit init` writes it for new projects instead (D-chrc-7).

From this design:
- Settings surfaced in the change status JSON (D5).
- The body running git itself, with no subcommand (D-chrc-10).

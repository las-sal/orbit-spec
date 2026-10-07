> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: rc17b-blind-pair-command

## Premise

Stage `rc17b-blind-pair-command` (`clean-up-review-cycle.md`, declared 2026-10-05 from the rc17
exploration's split, D-bpc-9). Charter: `/orbit:review --as <mode> --reviewer blind-pair` runs both
halves in one invocation; the external runner is the USER's, recorded in the per-user global config at
`orbit init`; a recorded and reachable runner launches every external half, single or pair; the
`--reviewer` axis gains `--in-context`, `--external`, `--blind-pair` shorthands. Its rules were settled
in rc17a's archived exploration and ASSIGNED here: D-bpc-1, -2, -3, -4, -11, -13 (rules) and D-bpc-5,
-14 (scope readings). Exit: (1) one invocation, both pass files, each committed alone, no walk between,
pushed; (2) a recorded runner launches with no paste and its return commits without hand edits; (3) an
adopter without a runner gets today's handoff, unchanged.

**Narrowed by D-rc17b-1 (2026-10-06).** The runner half — the record, init's step, auto-launch of every
external half (D-bpc-1's dispatch, -2, -5, -11, -14) — SHIPPED as `rc17d-external-runner`, and the
paragraph above is the pre-split charter, kept as written. This stage keeps D-bpc-3, -4 and -13, the
three shorthands, the `blind-pair` presentation row, and rc17d's two-sentence `orbit-review` residual.
Its exits are now (1) as above and (2) with no runner recorded, the invocation runs the fresh half,
prints the external prompt for paste, and ends with the pair open (`openPair: {missing: "external"}`).
The re-read below is now against rc17a AND rc17d (D-rc17b-2).

This exploration does not re-litigate those decisions. It has two jobs: (a) re-read them against what
rc17a actually SHIPPED (its design D2 and D4 changed two of the facts they cite), and (b) measure the
stage's size against R-crc-1 BEFORE propose, as the charter asks.

### Measured 2026-10-06 — what rc17a shipped that the assigned rules predate

- rc17a D2: the pair LAUNCH is the external half's T0 written with `pair: true` — D-bpc-13's rows 2
  (launch record) and 3 (packaging) are ONE act.
- rc17a D4: membership is by ORDER for both classes, revising D-bpc-10's stamp — D-bpc-13 row 6c
  ("its emit stamped with L") is stale; the fresh emit carries no launch token.
- rc17a D6: until this stage ships, the `blind-pair` preference presents the fresh review; switching
  that one row of `orbit-engine-gates`' `The first review slot covers what the user invoked` is this
  stage's edit.

### Measured 2026-10-06 — capabilities whose text the charter makes false or must extend

| capability | why |
|---|---|
| `orbit-review` | the `blind-pair` reviewer value, the three new shorthands (beside `--fresh`), the one-command step order |
| `orbit-review-external` | `Command does not run the review or ingest findings` is false once a recorded runner launches; the handoff/preflight requirements gain the launched branch |
| `orbit-engine-gates` | the `blind-pair` preference's presentation row (rc17a D6 handoff) |
| `orbit-conventions` | `Review mode decision framework`'s class 3 says the external is "reached by a packaged prompt a human carries across vendors" |
| `orbit-onboard` | named by the charter for the setup note (D-bpc-2) |
| init's setup step + the runner record + its `orbit status --json` field | NO baseline capability owns `orbit init`'s prompts or the global config (`src/core/global-config.ts`); this is an ADDED capability |

Six against a ceiling of three. Resolved by D-rc17b-1 (split).

## Mechanism

### D-rc17b-3 — the one command's step order, as rc17a and rc17d shipped its parts
Domain: the steps of `/orbit:review --as <proposal\|system> --reviewer blind-pair <change>`, each with its failure handling
| member | covered by |
|---|---|
| 1. preflight | rc17d's dirty-tree block (D5), unchanged; `--as architecture` is a usage error before anything is written |
| 2. the launch | ONE act: the external-handoff packaging with its T0 written `pair: true` (rc17a D2) — prompt file + T0, token L |
| 3. handoff commit + push = BASE | rc17d's handoff commit on the two files; a failed push is reported and the run goes on |
| 4. runner resolution | `orbit external runner --json`; reachable → 5a, otherwise → 5b |
| 5a. the external half, launched | rc17d's Step 9b–9c unchanged: worktree at BASE in `<run-dir>`, background launch, return to `<run-dir>/return.md` — NOT yet saved |
| 5b. the external half, no runner or unresolved | the paste output, its pull line naming BASE (D-rc17b-4); the command ends after step 9 with `openPair: {missing: "external"}` — exit (2) |
| 5c. the fresh half | a clean-context subagent dispatched AFTER L is written, briefed per rc03b's brief rule; it emits through `orbit emit review` like any fresh pass — no launch stamp (rc17a D4: membership by order) |
| 6. wait | both background completions; a half that fails or times out is MISSING |
| 7. commit the fresh pass file alone | `git commit --only` on its one path, BEFORE the external return is saved |
| 8. save the external return | `orbit external save … --launch L` only now, after step 7 (or after the fresh half is known missing); a refusal is rc17d's failed-run row, the paste fallback naming BASE |
| 9. commit the saved return alone | rc17d's commit (`-F` message quoting removed lines); push once, after both commits; failed push reported, commits stand |
| 10. remove the worktree | `--force`; a failure is reported, never fatal |
| 11. render both reports | `orbit status --change <name> --report <TS>` per landed pass |
| 12. end | the position readout and the engine's eligibility line; the walk is never invoked (no-chaining) |
Closure: DERIVED — the steps are the decisions' acts in dependency order (L before both halves; BASE contains L; the external reads BASE; the fresh pass is committed before the external return enters the repository), each step one row, its failure in the row
Moves:
- READ: applied — rc17d's Step 9 (`review.ts`, 9a–9d and the failed-run paragraph), `orbit-review-external`'s `A recorded runner launches the external review` and `A launched return is committed alone and pushed`; `orbit external save` needs no clean tree (`external-runner.ts`: its checks are token shape, heading, readers, apply-after-launch); `orbit-engine-gates`' membership requirement (first fresh and first external after L, by order)
- ENUMERATE: applied — this table; D-bpc-13's thirteen rows mapped onto it (rows 2+3 merged; 6c's stamp dropped; 8–9 split into the save-after-fresh ordering)
- COHERE: applied — saving the external AFTER the fresh commit makes token order, commit order and the residual check's base agree on every run (fresh then external), where saving on arrival would order them by which finished first
- EXECUTE: not applied — nothing built; a disposable-repo run of steps 1–10 with a stub runner is owed at apply
- FALSIFY: applied — the fresh subagent runs in the live checkout, so a return saved into the trail on arrival would be readable by a still-running fresh half; deferring the save is what keeps D-bpc-4's second row physical
- CONFORM: applied — no-chaining; D-bpc-3 (the command commits and pushes); D-d6-7 (zero engine git); R-crc-14 (rc17d's steps are named and pointed at, never restated)
- FEASIBILITY: applied — both halves run in the background with completion notifications; the external outlasts the foreground limit
- CONSUME: applied — the emit surface's collision bump clears a token against every trail file (rc03c), so the fresh emit can never share L's token; `--launch L` is the T0 token rc17d's save already takes
- INVOKE: applied — `--reviewer blind-pair` or `--blind-pair`, typed by the user, or presented by the engine under the default preference (D-rc17b-6)

### D-rc17b-4 — every external half of a pair reads the pair's BASE
Domain: the routes by which a pair's external half reads the repository, and the fresh half's partner exposure
| member | covered by |
|---|---|
| first run, launched | rc17d's worktree at the handoff commit, which IS BASE — unchanged |
| first run, pasted (no runner, or launch failed) | the pull line names BASE's commit, as rc17d's failed-run line already names the handoff commit |
| re-run of a missing external half, launched | the worktree is added at the commit that added the open pair's launch T0 (a hash-only `git log --diff-filter=A` read), NOT at the re-run's own handoff commit, which contains the committed fresh partner; the prompt arrives on stdin from the live checkout's copy |
| re-run of a missing external half, pasted | the pull line names that same BASE commit |
| first run, fresh half | the live checkout at BASE; the partner stays outside the repository until step 7 (D-rc17b-3) |
| re-run of a missing fresh half | its brief names a worktree at BASE as the tree to read; instructed, not physical — the subagent can still read the live checkout, where the external partner is committed |
Closure: BOUNDED — the routes are the launch, the paste, and the two re-runs; physical isolation reaches only the launched routes
Residual kind: a reader that goes past the commit it was told to read — a human-carried external AI that pulls HEAD, or a fresh re-run subagent that reads the live checkout
Residual method: reading the walked return's `**Reviewer**:` line and file citations for paths that exist only after BASE, when a re-run or a paste completes a pair
Moves:
- READ: applied — rc17d's 9b adds the worktree at `<handoff-sha>`; nothing shipped places a re-run at the original BASE, though D-bpc-4's fourth row assumed it; `orbit-engine-gates`: a re-run writes no launch and refills the open pair, so its return IS a member
- ENUMERATE: applied — this table (two halves × first run / re-run, the external split by launched / pasted)
- COHERE: applied — one BASE serves every external route; the re-run's own handoff commit holds only its prompt and T0, which the stdin redirect supplies
- EXECUTE: not applied — nothing built; a disposable-repo re-run whose partner is committed is owed at apply
- FALSIFY: applied — the engine's blindness is walk-ordering only, so a re-run that read its committed partner would complete a pair the gate counts as blind; nothing downstream catches it
- CONFORM: applied — D-bpc-4 (physical where possible); rc03b's brief rule and its BOUNDED residual; R-crc-10 (the pasted and fresh re-run routes are a RECORD, not a check)
- FEASIBILITY: applied — one hash-only read and the existing worktree add
- CONSUME: applied — rc17d's save takes `--launch <the re-run's T0 token>`, unchanged; the apply-after-launch refusal still applies
- INVOKE: applied — whenever the external branch runs while the gate reports `openPair: {missing: "external"}`, and at every pair launch

### D-rc17b-5 — the reviewer shorthands
Domain: the reviewer-selecting flags one invocation may carry
| member | covered by |
|---|---|
| none | `--reviewer in-context`, the default, as today |
| exactly one of `--in-context`, `--fresh`, `--external`, `--blind-pair` | exactly `--reviewer <that class>` |
| `--reviewer <class>` alone | as today, plus the value `blind-pair` |
| two shorthands, or a shorthand with an explicit `--reviewer` | a clean usage error naming the equivalence, as `--fresh` has today — even when the two agree |
| `--external`, `--blind-pair`, or their `--reviewer` values, with `--as architecture` | the existing usage error, widened to `blind-pair` |
| an unknown `--reviewer` value | a usage error naming the four values |
Closure: DERIVED — the flags are four shorthands and one valued option; each combination class is a row
Moves:
- READ: applied — the review body's argument table and trunk paragraph (`--fresh`'s clean usage error, `--reviewer external` requires `--as proposal|system`)
- ENUMERATE: applied — this table
- COHERE: applied — the agreeing-pair case errors too, so the rule is "at most one selector", never a comparison of values
- EXECUTE: not applied — body prose; the review skill parses its own arguments
- FALSIFY: not applied — the flags change spelling, not behaviour
- CONFORM: applied — Sal, 2026-10-05 (the charter: one shorthand per class, `--fresh` stays)
- FEASIBILITY: not applied — prose rows
- CONSUME: applied — the engine presents commands in one fixed spelling per class (D-rc17b-6); the shorthands are input, never output
- INVOKE: applied — every `/orbit:review` invocation

### D-rc17b-6 — the default preference presents the pair command
Domain: what the `invoked` slot presents per preference, once a pair command exists
| member | covered by |
|---|---|
| nothing standing, preference `blind-pair` (the default) | `/orbit:review --as <mode> --reviewer blind-pair <change>` — replaces rc17a D6's interim fresh row |
| nothing standing, preference `fresh` or `external` | that single, unchanged |
| PAIR-OPEN `{missing}` | the missing half's single command, unchanged (a re-run refills; D-rc17b-4 governs where it reads) |
| PAIR-OPEN, both missing | unchanged: the fresh review (a new pair command would write a second launch, which also works) |
| the `models:` hint | keyed on the presented class, so the pair row reads the key `blind-pair` |
Closure: SOURCED — the rows of `orbit-engine-gates`' `The first review slot covers what the user invoked` presentation table, only the first changing
Moves:
- READ: applied — `gates.ts` `commandForClass` (the `invoked` case returns `--fresh`, commented as rc17a D6's interim) and `presentInvoked` (its `cls` is `fresh | external`); the presentation table's first row and its revision note
- ENUMERATE: applied — this table
- COHERE: applied — the external's presented spelling is `--reviewer external`; the pair's is `--reviewer blind-pair`, the same form
- EXECUTE: not applied — nothing built
- FALSIFY: applied — presenting the pair while the user has no runner is still right: exit (2) makes the no-runner pair a fresh half plus a paste, and the pair stays open rather than a half covering alone
- CONFORM: applied — single-voiced canonical next; R-crc-13 (the preference shapes only the presented command)
- FEASIBILITY: not applied — one row and a widened type
- CONSUME: applied — `presentInvoked`'s `cls` widens to `blind-pair`; every reader of the presented class (the hint keys, the diagnosis column "the presented command's class") is in the same file and is swept at propose
- INVOKE: applied — every status read of a gate whose `invoked` slot is uncovered under the default preference

## Decisions

- **2026-10-06 — D-rc17b-1: rc17b splits into a runner stage and the pair-command stage** — Sal: "yes split", resolving Q-rc17b-1. The measurement (Premise table) found six capabilities against R-crc-1's ceiling of three; the rules divide by dependency. The RUNNER stage carries D-bpc-1's dispatch, D-bpc-2, -5, -11 and -14 — the per-user runner record, init's setup step and its note, the record's `orbit status --json` field, and auto-launch of every external half — across an ADDED runner capability, `orbit-review-external` and `orbit-conventions`; it serves charter exits (2) and (3). The PAIR-COMMAND stage carries D-bpc-3, -4, -13, the three shorthands and the `blind-pair` presentation row across `orbit-review` and `orbit-engine-gates`, depends on the runner stage, and serves exit (1). The setup note lives in init's output, owned by the new capability, so `orbit-onboard` is not touched. R-crc-9's ninth preventive application, caught at exploration. Leaning on ids, for the architect session to settle: the precedent of rc04d split from rc04c — `rc17b` keeps its title and the pair command and gains `Depends-on` the new runner stage (e.g. `rc17d-external-runner`), so this exploration's citation stays valid. Settled at the architect session the same day: `rc17d-external-runner`, declared before rc17b with `Depends-on: (none)`; rc17b depends on it.
  Kind: scope

- **2026-10-06 — D-rc17b-2: re-read of the assigned rules against rc17a and rc17d** — D-bpc-13's rows 2 and 3 are one act (rc17a D2); row 6c's launch stamp is stale (rc17a D4); rows 1, 4, 5, 6a, 8, 10 and 11 SHIPPED for a single external in rc17d's Step 9 and are pointed at, not rebuilt; row 9's "commit each pass alone in token order" needs one new act, deferring the external save until the fresh pass is committed (D-rc17b-3). D-bpc-3's table holds as written. D-bpc-4's fourth row (a re-run reads the ORIGINAL BASE) never shipped — rc17d adds every worktree at its own handoff commit, so a re-run of the missing external reads its committed partner (D-rc17b-4).
  Kind: fact
- **2026-10-06 — D-rc17b-3: the one command's step order, as rc17a and rc17d shipped its parts** — supersedes D-bpc-13 for this stage: twelve steps, the launch one act, the external return saved only after the fresh pass file is committed, one push after both. A method call (R-crc-3).
- **2026-10-06 — D-rc17b-4: every external half of a pair reads the pair's BASE** — the launch (shipped), the paste line, and a re-run of the missing half, whose worktree sits at the commit that added the launch; a fresh re-run is told to read BASE (instructed, the BOUNDED residual). A method call (R-crc-3), carrying D-bpc-4's unshipped row.
- **2026-10-06 — D-rc17b-5: the reviewer shorthands** — `--in-context`, `--external`, `--blind-pair` beside `--fresh`, each exactly `--reviewer <class>`; at most one selector per invocation, a clean usage error otherwise. Sal's charter word (2026-10-05), written as a decision table.
- **2026-10-06 — D-rc17b-6: the default preference presents the pair command** — the `invoked` slot's first presentation row becomes `--reviewer blind-pair`, retiring rc17a D6's interim; every other row unchanged. The charter's handoff from rc17a D6.
- **2026-10-06 — D-rc17b-7: the capability measurement, re-taken after the split** — `orbit-review` (the `blind-pair` value, the shorthands, the step order, rc17d's two residual sentences), `orbit-review-external` (the pair's deferred save in `A launched return is committed alone and pushed`; D-rc17b-4's worktree base in `A recorded runner launches the external review`), `orbit-engine-gates` (D-rc17b-6) — three, at R-crc-1's ceiling — PLUS `orbit-onboard`, whose scenario enumerates the axis as `--reviewer in-context|fresh|external` and becomes incomplete once `blind-pair` is a value. `orbit-conventions`' class 3 was corrected by rc17d (measured: it now names the recorded runner). Four against three: Q-rc17b-2.
  Kind: fact
- **2026-10-06 — D-rc17b-8: four capabilities, declared over R-crc-1's ceiling** — Sal: "a, ok to go over if you think it makes sense", resolving Q-rc17b-2. `orbit-onboard` joins as the fourth: its axis enumeration is replaced by a POINTER to `orbit-review` (R-crc-14), enumerating no values, and the same sentence's "the external AI commits findings back" is corrected to name both routes by pointer — one MODIFIED block plus `onboard.ts`. Declared at exploration under R-crc-9, as rc07b was; the stage stays one stage because the fourth edit is a single pointer sentence.
  Kind: scope

## Open questions

_(none open)_

## Considered & out

- **2026-10-06** — Q-rc17b-2 (B): keep three and hand `orbit-onboard` to a later sweep as a named residual. Out: it leaves a known-incomplete enumeration on the surface an adopter reads first, to save one pointer sentence.
- **2026-10-06** — Q-rc17b-2 (C): split the shorthands and onboard into their own stage. Out: a stage for one pointer sentence and four flag rows costs a full cycle; the size is in D-rc17b-3/-4, not here.
- **2026-10-06** — saving the external return on arrival (rc17d's single-external order) inside a pair. Out: a still-running fresh half in the live checkout could read it, and token order would follow whichever half finished first (D-rc17b-3 FALSIFY).

## References

- `orbit/architecture/clean-up-review-cycle.md` — Stage rc17b-blind-pair-command (charter), Stage
  rc17-blind-pair-command (split parent), R-crc-1, R-crc-9.
- `orbit/changes/archive/2026-10-06-rc17a-invoked-coverage/explore.md` — D-bpc-1..17 with Mechanism
  entries for the assigned rules (D-bpc-1, -2, -3, -4, -11, -13).
- `orbit/changes/archive/2026-10-06-rc17a-invoked-coverage/design.md` — D2 (launch = `pair: true` T0),
  D4 (membership by order), D6 (preference presentation interim).
- `orbit/specs/orbit-engine-gates/spec.md` — `The first review slot covers what the user invoked`.
- `orbit/specs/orbit-review-external/spec.md` — `Handoff preflight blocks unusable pull invocations`,
  `Command does not run the review or ingest findings`.
- `orbit/specs/orbit-conventions/spec.md` — `Review mode decision framework` (the three classes).
- `src/core/global-config.ts` — the per-user XDG global config, D-bpc-11's home.
- `src/core/templates/workflows/review.ts` — the `--reviewer` axis and the external-handoff reference.
- `orbit/changes/archive/2026-10-06-rc17d-external-runner/design.md` — D2 (save command), D3 (body
  choreography), D4 (single external in a worktree), D5 (dirty tree blocks).
- `src/core/templates/workflows/review.ts` — the external-handoff reference's Step 9 (9a–9d, failed run).
- `src/core/external-runner.ts` — `orbit external save`'s checks (no clean-tree requirement).
- `src/core/artifact-graph/gates.ts` — `commandForClass`, `presentInvoked` (D-rc17b-6).
- `orbit/specs/orbit-onboard/spec.md`, `src/core/templates/workflows/onboard.ts` — the axis enumeration (Q-rc17b-2).

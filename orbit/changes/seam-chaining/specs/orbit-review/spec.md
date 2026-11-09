## MODIFIED Requirements

### Requirement: The blind-pair reviewer runs both halves in one invocation

`/orbit:review <change> --as proposal|system --reviewer blind-pair` SHALL run a blind pair — one `fresh` pass and one
`external` pass of the mode, blind to each other — in ONE invocation, by the steps of this table in this order. The pair's
git acts are body steps (zero engine git); every commit adds named paths only (`git add` then `git commit --only`), so
work the user stages during the run stays out. The external half's launch, save and commit are
`orbit-review-external`'s and are named here, never restated; what the launch record means is `orbit-engine-gates`'
`A pair's membership is computed from its launch`.

| member | covered by |
|---|---|
| 1. preflight and the runner | `git status --porcelain` non-empty refuses the pair: nothing is written — no prompt, no launch — and the output names the uncommitted paths; unpushed commits are allowed and ride step 3's push. Then `orbit external runner --json`, read ONCE: its result decides the route the packaging writes for (the `## Repo` line, the T0's `target`) and row 4, and is never read again in the run |
| 2. the launch | the external-handoff packaging, its T0 written with `pair: true` (per `orbit-emit-composition`'s "The review-external payload carries `pair`"): ONE act, the prompt file and the launch T0, token L |
| 3. BASE | the prompt file and the T0 committed alone as the HANDOFF COMMIT — BASE — and pushed, on BOTH external routes; a failed push or no remote is reported and the run goes on |
| 4. the route | row 1's runner reading: a reachable runner takes row 5a, anything else row 5b |
| 5a. the external half, launched | per `orbit-review-external`'s `A recorded runner launches the external review`, at BASE, in the background; its return stays at its output path outside the repository and is NOT saved yet |
| 5b. the external half, pasted | the chat invocation snippet per `orbit-review-external`'s `Prompt written to versioned file with chat invocation snippet`, printing whichever of its outputs the state step 3 left selects — the attestation and the pull line when the push landed, the handoff-blocked line when it did not; its prompt's `## Repo` line per `A pair's external half reads the pair's reviewed state` |
| 5c. the fresh half | a clean-context subagent dispatched after step 3, briefed per the REVIEW-genre brief rule of `orbit-conventions`' `Review mode decision framework`, in the background; it persists through `orbit emit review` with `reviewer_class: "fresh"` like any fresh pass, carrying no launch token |
| 6. wait | both background completions (row 5b: the fresh half only). A half ends when its process exits or the user stops it — no timeout is invented. Whether the fresh half LANDED is read from the trail, never from the worker's exit: a `review-<mode>-*.json` with `reviewer_class: "fresh"` later than L in the live checkout IS the landed member and goes to row 7, however the worker ended; with no such file the fresh half is MISSING. The external half is MISSING when its run exits non-zero or `orbit external save` refuses it; nothing is committed for a missing half |
| 7. the fresh pass file | committed ALONE, BEFORE row 8 |
| 8. the external return | saved through `orbit external save … --launch L` only after row 7, or once the fresh half is known MISSING; a refusal is the launch requirement's failed-run row |
| 9. the saved return | committed alone per `orbit-review-external`'s `A launched return is committed alone and pushed` |
| 10. push | once, after rows 7 and 9; a failed push is reported, the commits stand, no retry |
| 11. the worktree | removed per the launch requirement (row 5a only); a failed removal is reported, never fatal |
| 12. reports | `orbit status --change <change> --report <TS>` rendered for each landed pass |
| 13. end | the position readout and the engine's eligibility line; the walk is invoked only when the change status's `chain` object allows `/orbit:address-reviews` (`orbit-conventions`' `No-chaining contract`), and never otherwise (no-chaining). When a half is missing — after row 5b, or a half that failed or wrote nothing — the pair ends OPEN and no half covers alone: with one half landed the gate reports `openPair` naming the missing class (after row 5b, `{missing: "external"}`); with both missing it reports no `openPair` and a reason saying neither member has landed |

Closure: DERIVED — the steps are the pair's acts in dependency order (the launch before both halves; BASE holds the
launch; the external reads BASE; the fresh pass file is committed before the external return enters the repository;
the push after both), one row each, its failure in the row.

Saving the external return only after the fresh pass file is committed (rows 7–8) keeps the halves blind — a return
saved on arrival would sit in the live checkout a still-running fresh half reads — and, on the launched route, makes
token order, commit order and the VERIFICATION residual check's base agree on every run: the fresh pass first, the
external return second. On the pasted route the external AI picks its own token and may commit its return itself, so
the order there follows its commit.

Every other flag of the command applies to each half exactly as it applies to that half's single run — the fresh half
as under `--reviewer fresh`, the external half as under `--reviewer external`.

#### Scenario: A launched pair commits each half alone

- **WHEN** `/orbit:review foo --as system --blind-pair` runs on a clean tree with a reachable runner recorded, and both halves return well-formed
- **THEN** exactly three commits are added, in order — BASE (the prompt file and the `pair: true` T0), the fresh pass file alone, the saved external return alone — the fresh pass's token is earlier than the external return's, both are later than the launch, no walk record is written, the branch is pushed once after the third commit, and the gate's `invoked` slot is covered by the COMPLETE pair

#### Scenario: The external return waits for the fresh commit

- **WHEN** the launched external half returns while the fresh half is still running
- **THEN** its return stays at its output path outside the repository, and `orbit external save` runs only after the fresh pass file's commit

#### Scenario: With no runner the pair ends open

- **WHEN** the same invocation runs with no runner recorded
- **THEN** BASE is committed and pushed, the chat invocation snippet is printed, the fresh pass file is committed alone and pushed, and the run ends with the gate reporting `openPair: {missing: "external"}` and the `invoked` slot uncovered

#### Scenario: A failed external half leaves the pair open

- **WHEN** the launched runner exits non-zero
- **THEN** nothing is committed for the external half, the fresh pass file is committed alone and pushed, the launch requirement's paste fallback is printed, and the gate reports `openPair: {missing: "external"}`

#### Scenario: A dirty tree refuses the pair

- **WHEN** `--blind-pair` runs and `git status --porcelain` reports uncommitted changes
- **THEN** no prompt file, no T0 and no pass is written, no subagent is dispatched, no runner is launched, and the output names the uncommitted paths

#### Scenario: The pair does not walk its findings

- **WHEN** a pair run ends with findings in either half and the `chain` object reports `may_run: false`
- **THEN** the run ends at the position readout and the eligibility line; `/orbit:address-reviews` is not invoked

#### Scenario: A granted walk follows the pair

- **WHEN** a pair run ends with findings, both halves landed, and the `chain` object reports `may_run: true` for
  `/orbit:address-reviews <change>`
- **THEN** after the position readout and the eligibility line the AI names the walk and the key `address-reviews`, and
  runs the walk in the same turn

#### Scenario: A fresh worker stopped after it persisted is the landed member

- **WHEN** the fresh worker is stopped after `orbit emit review` wrote its pass file, and the external half returns well-formed
- **THEN** that pass file is committed alone as the fresh member at row 7, then the external return is saved and committed, and the gate's `invoked` slot is covered by the COMPLETE pair

#### Scenario: A missing fresh half lets the external return land

- **WHEN** the fresh worker ends without writing a pass file, and the launched external half returns well-formed
- **THEN** the external return is saved and committed alone, and the gate reports `openPair: {missing: "fresh"}`

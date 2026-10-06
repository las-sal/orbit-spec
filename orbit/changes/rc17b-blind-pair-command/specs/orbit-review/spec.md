## MODIFIED Requirements

### Requirement: Review command available with `--as` mode flag

The system SHALL expose a single `/orbit:review` command that runs an editorial review. The `--as proposal` flag reviews a change's pre-implementation artifacts (proposal/design/specs/tasks); the `--as system` flag reviews the whole product state after a change has been applied; the `--as architecture` flag reviews an architecture doc (the positional resolves to a doc name under `orbit/architecture/`, not a change name — D-arc Stage D2). The command additionally carries the REVIEWER axis (D-arc Stage D5): `--reviewer in-context|fresh|external|blind-pair` (default `in-context`). The first three are the three reviewer classes the gate cadence, the emit `reviewer_class` field and the report header already share; `blind-pair` is not a class but an INVOCATION of both independent classes at once — a fresh pass and an external pass as one pair, per `The blind-pair reviewer runs both halves in one invocation`. Each value has one shorthand flag that is exactly `--reviewer <value>`: `--in-context`, `--fresh`, `--external`, `--blind-pair`. An invocation carries AT MOST ONE reviewer selector, by this table:

| member | covered by |
|---|---|
| no selector | `--reviewer in-context`, the default |
| exactly one shorthand | exactly `--reviewer <its value>` |
| `--reviewer <value>` alone | that value |
| two shorthands, or a shorthand with an explicit `--reviewer` | a clean usage error naming the shorthand equivalence — even when the two agree: agreeing forms are redundant, conflicting forms ambiguous; neither runs a pass and nothing is written |
| `external` or `blind-pair`, by either spelling, with `--as architecture` | the clean usage error below |
| a `--reviewer` value outside the four | a clean usage error naming the four values |

Closure: DERIVED — the selectors are four shorthands and one valued option; each combination class is one row.

`--reviewer external` dispatches to the external-handoff branch (packaging a prompt for an external AI and, when the user has recorded a runner, launching it — per `orbit-review-external`'s requirements; the behavior formerly invoked as the separate `/orbit:review-external` command), whose full instructions load from `references/external-handoff.md` ONLY when `external` or `blind-pair` is selected. `--reviewer blind-pair` additionally loads `references/blind-pair.md`, which carries the pair's step order; the in-context and fresh branches load neither. `--reviewer external` and `--reviewer blind-pair` REQUIRE `--as proposal|system`: architecture mode supports the in-context and fresh classes only, and `--as architecture` with either exits with a clean usage error naming the constraint (the external handoff's downstream — T0 WAITING arithmetic, the shared pass axis, cadence slots, the `external-<as>-*.md` ingest vocabulary — is change-scoped machinery the gate-less architecture mode does not participate in; defining architecture external packaging is a future change if the need arises). The per-mode pass definitions likewise load from per-mode references (`references/passes-<mode>.md`) for the RESOLVED mode only — the body carries the shared trunk (resolution, disciplines, persistence, render protocol), and a run loads only the material its mode and reviewer class need.

#### Scenario: Invoke with change name and explicit mode

- **WHEN** the user invokes `/orbit:review <change-name> --as proposal` or `/orbit:review <change-name> --as system`
- **THEN** the command reads the change's artifacts, loads the resolved mode's pass reference, and runs the appropriate set of passes for that mode

#### Scenario: Invoke architecture mode with doc name

- **WHEN** the user invokes `/orbit:review --as architecture <doc-name>`
- **THEN** the command resolves `<doc-name>` against `orbit/architecture/` (prompting via `AskUserQuestion` over parseable docs when omitted or ambiguous) and runs the architecture passes; a `<doc-name>` resolving to a LEGACY doc (zero stage-prefixed headings) is an error suggesting retrofit, and one resolving to a MALFORMED doc (fails `orbit architecture validate`'s near-miss rule) is an error naming the grammar violation — architecture mode requires a parseable doc

#### Scenario: Invoke without change name

- **WHEN** the user invokes `/orbit:review` with no argument (proposal/system context)
- **THEN** the command runs `orbit list --json`, presents the active changes via `AskUserQuestion`, and uses the user's selection as the change scope

#### Scenario: Mode inference when `--as` omitted

- **WHEN** the user invokes `/orbit:review <change-name>` without `--as`
- **THEN** the command infers the mode from `tasks.md` state: ALL task boxes unchecked → `proposal`; all tasks checked and code exists → `system`; ambiguous (mixed checked/unchecked, or checked without visible code changes) → prompt the user via `AskUserQuestion` to pick; the inferred mode is shown in the report header. Architecture mode is NEVER inferred — it requires the explicit `--as architecture` flag (a positional that happens to match a doc name does not trigger it)

#### Scenario: External reviewer class dispatches to the handoff branch

- **WHEN** the user invokes `/orbit:review <change-name> --as system --reviewer external`
- **THEN** the command loads `references/external-handoff.md` and follows `orbit-review-external`'s requirements — it packages the prompt file and the T0 emit, then either prints the chat invocation snippet for paste or, with a reachable recorded runner, launches that runner and saves its return; no pass of the internal classes runs in this invocation, and the internal-class branches never load the external reference

#### Scenario: Blind-pair reviewer dispatches to the pair reference

- **WHEN** the user invokes `/orbit:review <change-name> --as system --reviewer blind-pair` (or `--blind-pair`)
- **THEN** the command loads `references/blind-pair.md` and `references/external-handoff.md` and runs the pair per `The blind-pair reviewer runs both halves in one invocation`

#### Scenario: Architecture mode rejects the external and blind-pair reviewers

- **WHEN** the user invokes `/orbit:review --as architecture <doc-name> --reviewer external` (or `--external`, `--reviewer blind-pair`, `--blind-pair`)
- **THEN** the command exits with a clean usage error stating that the selected reviewer requires `--as proposal|system` and that architecture mode supports in-context and fresh only; no prompt file and no T0 emit are produced

#### Scenario: Shorthand and explicit reviewer flags do not combine

- **WHEN** the user invokes `/orbit:review foo --fresh --reviewer external` (or `--fresh --reviewer fresh`, or `--external --blind-pair`)
- **THEN** the command exits with a clean usage error naming the shorthand equivalence; no pass runs and no file is written

#### Scenario: Each shorthand is its reviewer value

- **WHEN** the user invokes `/orbit:review foo --as proposal --in-context`, `--external` or `--blind-pair`
- **THEN** the run is exactly the run of `--reviewer in-context`, `--reviewer external` or `--reviewer blind-pair` respectively

#### Scenario: Per-mode reference loading

- **WHEN** a proposal-mode review runs
- **THEN** the body loads `references/passes-proposal.md` and does NOT load the system or architecture pass references — pass CONTENT is unchanged by the split (an organizational move only)

### Requirement: `--fresh` runs pass work in a clean execution context

The system SHALL support a `--fresh` flag (all modes — proposal, system, and architecture) as shorthand for `--reviewer fresh` (D-arc Stage D5): the main pass work runs in a fresh execution context (e.g., a clean-context subagent) rather than the invoking conversation — mitigating anchoring when the invoking context authored or extensively discussed the artifacts under review. Findings, scorecard rollup, and run-summary persistence are unchanged; the flag affects only where pass work executes. A fresh-context pass fills the review cadence's independent slot (per `orbit-engine-gates`' reviewed-gate model) as the lighter-weight of the two independent classes: `--fresh` is the SAME MODEL in a CLEAN CONTEXT; `--reviewer external` is a DIFFERENT AI in a SEPARATE SESSION (the class descriptions, including how an external pass is reached, are `orbit-conventions`' `Review mode decision framework`'s; this sentence names them and restates nothing else). The engine's computed canonical next command names whichever the cadence needs. A fresh pass is REVIEW pass genre (per the same requirement's pass-genre table), so its launching brief carries no finding and no trail pointer — the review-genre read rule (`Review-genre passes read the artifacts and the code, never the trail's findings`) says how.

#### Scenario: Fresh pass execution

- **WHEN** the command runs with `--fresh` (or the equivalent `--reviewer fresh`)
- **THEN** the passes execute in a clean context that did not author the artifacts under review; the report and run summary are produced identically to a non-fresh run, with `fresh: true` recorded in the run summary's `flags` object and `reviewer_class: "fresh"` on the emit

## ADDED Requirements

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
| 13. end | the position readout and the engine's eligibility line; the walk is never invoked (no-chaining). When a half is missing — after row 5b, or a half that failed or wrote nothing — the pair ends OPEN and no half covers alone: with one half landed the gate reports `openPair` naming the missing class (after row 5b, `{missing: "external"}`); with both missing it reports no `openPair` and a reason saying neither member has landed |

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

- **WHEN** a pair run ends with findings in either half
- **THEN** the run ends at the position readout and the eligibility line; `/orbit:address-reviews` is not invoked

#### Scenario: A fresh worker stopped after it persisted is the landed member

- **WHEN** the fresh worker is stopped after `orbit emit review` wrote its pass file, and the external half returns well-formed
- **THEN** that pass file is committed alone as the fresh member at row 7, then the external return is saved and committed, and the gate's `invoked` slot is covered by the COMPLETE pair

#### Scenario: A missing fresh half lets the external return land

- **WHEN** the fresh worker ends without writing a pass file, and the launched external half returns well-formed
- **THEN** the external return is saved and committed alone, and the gate reports `openPair: {missing: "fresh"}`

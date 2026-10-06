## Context

`spec-driven` v5 (rc17a) made the first reviewed slot `invoked`: a single fresh or external pass covers it, and so does a
COMPLETE pair, whose launch is a `review-external` T0 written with `pair: true` and whose members are the first fresh
pass and the first external return after it, by order. rc17d made the external half a recorded launch: the external
branch commits the prompt and T0 as a handoff commit, adds a worktree there outside the repository, launches the
user's runner, saves the return with `orbit external save --launch`, commits it alone, pushes and removes the worktree
(`src/core/templates/workflows/review.ts`, the external-handoff reference's Step 9). What no command does is run both
halves at once.

The exploration (`explore.md`) re-read rc17a's assigned rules against both stages (D-rc17b-2). Most of the old step
order (D-bpc-13) now exists as rc17d's Step 9 and is pointed at; the launch record and the packaging are one act
(rc17a D2); the fresh emit's launch stamp is gone (rc17a D4). Two acts are new, and both decide blindness:

- rc17d saves a return on arrival. In a pair the fresh half is a subagent in the live checkout, still running, so the
  save must wait (D-rc17b-3).
- rc17d adds every worktree at the run's own handoff commit. A re-run of a pair's missing external half therefore
  reads a tree holding its committed fresh partner, and the gate — whose blindness rule reads walk order only — counts
  the pair blind (D-rc17b-4). D-bpc-4's fourth row assumed a re-run at the original BASE; it never shipped.

One fact measured at this propose: on today's no-runner route the external branch writes the prompt and T0 and never
commits them (its preflight-failed output tells the user to). A pair needs BASE committed before its fresh half starts,
so the pair commits it on both routes (D3).

## Goals / Non-Goals

**Goals:**
- One invocation produces both pass files on one reviewed state, each committed alone, with no walk between, and
  pushed (exit 1).
- With no runner, the invocation runs the fresh half, prints the external prompt for paste and ends with the pair open
  (`openPair: {missing: "external"}`), never a half covering alone (exit 2).
- Every external half of a pair — first run or re-run, launched or pasted — reviews the pair's state.
- The default preference presents the pair command; the reviewer axis gains its shorthands.

**Non-Goals:**
- Any change to coverage, membership or the gate's blindness rule (rc17a's, unchanged).
- Any change to the runner record, its resolution or `orbit external save` (rc17d's, unchanged).
- Making a pasted or fresh re-run half physically blind (the named limit).
- A launch-aware T0 `next_recommended` (rc17d's named limit D-rc17d-7, unchanged).

## Decisions

### D1 — the pair's steps live in their own reference

The review trunk carries the reviewer axis and dispatch only; `--reviewer blind-pair` loads a new
`references/blind-pair.md` carrying the thirteen steps of `orbit-review`'s `The blind-pair reviewer runs both halves in
one invocation`, plus `references/external-handoff.md` for the external half's launch, save and commit. The pair
reference names the handoff reference's steps (9a–9d, the failed-run paragraph) and the trunk's "Dispatching a fresh
pass" section rather than repeating them (R-crc-14). The per-mode pass references already set the pattern: a run loads
only what its mode and reviewer need. The orchestrating session never runs passes itself; it is neither half.

### D2 — the external return is saved after the fresh pass file is committed (D-rc17b-3)

Rows 7–8 of the step table. Saving on arrival, as a single external does, would put the return inside the live
checkout while the fresh subagent may still be reading it, and would order the two files by whichever half finished
first. Waiting makes the order fixed on the launched route — fresh, then external — so token order, commit order and the
VERIFICATION residual check's base agree on every launched run; on the pasted route the external AI picks its own token
and may commit its return itself (proposal walk, fresh S1). `orbit external save` needs no clean tree (its checks are token shape,
heading, the readers and apply-after-launch, `src/core/external-runner.ts`), so the save can follow the fresh commit
directly. One push follows both commits.

### D3 — BASE is committed on both routes, and the pair's preflight refuses a dirty tree on both

rc17d's dirty-tree block guards the launch route only, and its paste route never commits the prompt. A pair needs BASE
— the launch and the prompt — committed before either half reads anything, on either route: the fresh half reads the
live checkout, and the gate needs the launch on the trail before either member. So the pair's step 1 refuses a dirty
tree whatever the runner state, and step 3 makes the handoff commit and pushes on both routes. On the paste route the
chat snippet then prints whichever of its outputs that state selects — the attestation and the pull line when the push
landed, the handoff-blocked line when it did not (proposal walk, fresh S2). The runner is read ONCE, at step 1, before
packaging, because the packaging already depends on the route (the `## Repo` line, the T0's `target`) (proposal walk,
external W1).

### D4 — the open pair's BASE is found from the trail, not a new engine field

A re-run must know BASE. The engine already reports that a pair is open (`openPair` on the mode's reviewed gate row)
but not which launch. The body finds the launch by the same rule the engine uses — the latest `review-external-<TS>.json`
of the mode carrying `pair: true` — and BASE by a hash-only `git log --diff-filter=A` read of that file. The two agree by
construction while `openPair` stands, because the open pair IS the latest launch's. A `launch` field on `openPair` would
be the cleaner read, but it modifies a second `orbit-engine-gates` requirement (the outstanding-passes row) and the
readers that pin its shape, for a fact the trail already holds.

### D5 — a pasted half names the reviewed commit in the prompt, not in the chat line (refines D-rc17b-4)

The exploration's row said the pull line names BASE. At propose, `Prompt written to versioned file with chat
invocation snippet` was found to pin the chat items byte for byte, and the pasted reviewer reads the prompt, not the
chat. The prompt's `## Repo` line is filled per route already (rc17d fills it with the worktree on a launch), so the
pasted half's line names the repository and the REVIEWED COMMIT. The prompt cannot name BASE, the commit that contains
it; the reviewed commit is BASE's first parent and differs from it only by the prompt and the T0.

### D6 — a fresh re-run is briefed with the reviewed commit (refines D-rc17b-4)

The exploration's row had a fresh re-run briefed to read a worktree at BASE. The proposal first dropped that for the
brief rule alone; the proposal walk restored it (external W3): the brief rule keeps the partner's FINDINGS out of the
brief, but says nothing about WHICH STATE to review, so a fresh re-run would review HEAD while its external partner
reviewed BASE. The brief now names the pair's REVIEWED COMMIT as the state to read — the change's files read at that
commit — and the worker still emits from the repository root, so no worktree moves its emit. The isolation stays
instructed, and the residual says what it cannot stop.

### D7 — the presented pair command uses the long form

The engine presents the external review as `--reviewer external` and the fresh review as `--fresh`. The pair is
presented as `/orbit:review --as <mode> --reviewer blind-pair <change>`, the same form as the external. Its presented
class — `nextSlot` and the `models:` hint key — is `blind-pair`, a token the cadence vocabulary already carries, and a
`blind-pair` hint describes the pair command as a whole (proposal walk, fresh W1; Sal: A — `Single-voiced
canonical-next computation` named the presented class as `fresh` or `external` and is modified for it).
`presentInvoked`'s class type widens to it, and so does `canonicalNextForReviewed`'s local `forClass`, which renders
the presented command; `commandForClass`'s `invoked` case, commented as rc17a D6's interim, returns the pair command
too (proposal walk, fresh S3). Rows that present a missing half stay single.

### D8 — onboard points instead of enumerating

`orbit-onboard`'s Identity scenario and three body sentences enumerate `--reviewer in-context|fresh|external` and say
the external AI "commits findings back". Adding a value makes the list incomplete, and rc17d made the second claim
partial. Both become pointers to `orbit-review` (R-crc-14): the next value added breaks nothing here.

### D9 — four capabilities, declared

`orbit-review`, `orbit-review-external`, `orbit-engine-gates`, and `orbit-onboard` for one pointer sentence: one over
R-crc-1's ceiling, declared at exploration (D-rc17b-8; Sal: "a, ok to go over if you think it makes sense"). Nine
requirements (two ADDED, seven MODIFIED), ~55 KB of delta. The ninth arrived at the proposal walk: the restatement
count missed the hint-key sentence in `Single-voiced canonical-next computation`, inside a capability already in scope,
and modifying one sentence of that 10 KB requirement carries the whole block — the reason the delta passes R-crc-1's
~40 KB guide (bytes are the weakest of its predictors; capabilities, the strongest, are unchanged). The count found
no fifth capability: `orbit-conventions`' class 3 was corrected by rc17d, and the `--fresh` presentations in
`orbit-engine-gates`' `independent`/`blind-pair` cadence rows and `orbit-run-summary-emit`'s verify scenario are stated
for the v4 cadence tokens, which this change does not touch.

### D10 — a re-run checks supersession against the pair's launch (proposal walk; Sal: A)

A re-run reviews the pair's BASE, so whether an apply overtook it is measured from the pair's launch L, never from the
re-run's own T0: the re-run saves with `--launch L`. The external pass's CRITICAL reproduced the alternative — an apply
between L and the re-run, a fresh member emitted after the apply, a re-run saved against its own later token — to a
gate computing `passed` over two reviews of the superseded state. With an apply already later than L, the run is not a
re-run at all: it says the pair's reviewed state is superseded and proceeds as an ordinary single on the current state,
so the gate never loops on a refusal it keeps presenting. The re-run test (`openPair` plus no apply later than L) is the
body's reading of the trail; the gate stays authoritative. One edge is left in the named limit: a fresh half that
STARTED before an apply and emitted after it reads as current by the freshness rule — orbit is single-user, and an apply
while a pair is open is that user racing their own review.

## Mechanism → artifacts

the proposing AI's reading of the file; no engine record

| rule | closure / state | owner's state | destination |
|---|---|---|---|
| D-rc17b-1 | — | scope | not carried |
| D-rc17b-2 | — | fact | not carried (the Context above) |
| D-rc17b-3 | DERIVED | live rule | `orbit-review` · `The blind-pair reviewer runs both halves in one invocation` (TABLE) |
| D-rc17b-4 | BOUNDED | live rule | `orbit-review-external` · `A pair's external half reads the pair's reviewed state` (TABLE; both residual lines verbatim as its named limit) |
| D-rc17b-5 | DERIVED | live rule | `orbit-review` · "Review command available with `--as` mode flag" (TABLE) |
| D-rc17b-6 | SOURCED | live rule | `orbit-engine-gates` · `The first review slot covers what the user invoked` (TABLE — its presentation row) |
| D-rc17b-7 | — | fact | not carried (D9 above) |
| D-rc17b-8 | — | scope | not carried (D9 above) |

Three tables are revised from the exploration's. D-rc17b-3's twelve steps are thirteen: the preflight's refusal is
widened to both routes and BASE is committed on both (D3), and the end row names the open pair. D-rc17b-4's paste rows
name the reviewed commit in the prompt (D5); at the proposal walk it gained the failure-fallback row, the save token and
the apply-after-launch row (D10), its fresh re-run row names the reviewed commit (D6), and its residual kind was widened
to a launched runner that reads outside its worktree — the worktree shares the repository's object store and refs
(fresh W5); the spec carries the widened line, and the exploration keeps the original as history. D-rc17b-5's
architecture row covers both spellings of both values.

## Touchpoints

- `src/core/artifact-graph/gates.ts` — `presentInvoked`'s class widens to `blind-pair`; `commandForClass`'s `invoked` case returns the pair command.
- `src/core/templates/workflows/review.ts` — the trunk's reviewer axis, shorthands and dispatch; the new `blind-pair.md` reference and its registration; the external-handoff reference's re-run base, deferred save and pasted `## Repo` line.
- `src/core/templates/workflows/onboard.ts` — the axis and external-route sentences by pointer.
- `test/core/artifact-graph/` — the presentation scenarios and every expectation of the default presented command.
- `test/core/templates/` — trunk, pair-reference, handoff-reference and onboard fidelity; the skill parity pins.
- `test/integration/external-runner/` — the pair's transcribed git steps in a disposable repository.

## Risks / Trade-offs

- **D-rc17b-4's named limit** — a reader that goes past the commit it was told to read. → Stated once, in
  `orbit-review-external`'s `A pair's external half reads the pair's reviewed state`.
- **The gate counts a non-blind pair blind.** Its blindness rule reads walk order only, so the limit above is invisible
  to it. → Named in the same requirement; making the engine read content exposure is not observable from the trail
  (R-crc-10: a record, not a check).
- **The orchestrating session holds both returns.** It dispatches the fresh subagent and launches the runner, so it
  could read either return early. → It is neither half; it writes no pass, and nothing it reads reaches a half.
- **A session that ends mid-pair leaves work outside the record.** An uncommitted fresh pass file in the tree, or a raw
  return outside the repository. → rc17d's recovery line already names the raw return's save; the pair reference adds
  the fresh file's commit to it, in the same output.
- **The pair's push can be rejected** if a pasted external AI pushes its own return first. → The failed push is
  reported and the commits stand (row 10), as every designed push in orbit.
- **The no-runner pair commits and pushes BASE** where today's paste route leaves that to the user. → The pair is a
  designed step and may commit and push (D-bpc-3); single external runs are unchanged.

## Migration Plan

None. No record shape changes; archived trails and pairs launched by hand read as before. The default presented
command changes from the fresh review to the pair command; a project that wants the old behaviour sets
`review_preference` to `fresh` per gate.

## Open Questions

None open. Q-rc17b-1 and Q-rc17b-2 were resolved in the exploration.

## Alternatives considered

- **Keep three capabilities and hand `orbit-onboard` to a later sweep** (Q-rc17b-2 B, 2026-10-06). Out: it leaves a
  known-incomplete enumeration on the surface an adopter reads first, to save one pointer sentence.
- **Split the shorthands and onboard into their own stage** (Q-rc17b-2 C). Out: a full cycle for one pointer sentence
  and four flag rows; the size is in the step order and the reviewed-state rule.
- **Save the external return on arrival inside a pair**, as a single external does. Out: a still-running fresh half in
  the live checkout could read it, and token order would follow whichever half finished first.
- **An engine `launch` field on `openPair`** (D4). Out for this stage: a second gate requirement and its readers, for a
  fact the trail holds.
- **Name BASE in the chat pull line** (the exploration's row; D5). Out: the chat items are pinned byte for byte, and the
  pasted reviewer reads the prompt.
- **A worktree for a fresh re-run** (the exploration's row; D6). Out: instructed either way, and it moves the emit's
  working directory.
- **Leave the `blind-pair` hint key unread on the pair command** (proposal walk, fresh W1 option B). Out (Sal: A): the
  v4 meaning of the key was the pair's slot too, so garnishing the pair command keeps one meaning, and no active change
  is on v4.
- **Save a re-run against its own T0 token** (proposal walk, D10's option B). Out (Sal: A): the external pass's
  reproduction reached a gate computing `passed` over two reviews of a superseded state.


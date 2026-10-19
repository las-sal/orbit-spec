# orbit-propose-modifications Specification

## Purpose
Orbit's additions to upstream's propose, which is preserved when no exploration exists, apart from the orbit steps that run in both modes: consuming a staging exploration into the change's artifacts (validating its structure, mapping its sections, carrying its open questions and Mechanism entries, and keeping `explore.md` as the record), name inference, and the config-gated PR choreography with its branch preconditions.
## Requirements
### Requirement: Upstream propose behavior preserved in standalone mode

The system SHALL preserve upstream `/orbit:propose`'s behavior when no `orbit/explore/<name>/` staging directory exists, except for the orbit steps that run in both modes, among them the baseline read of `Propose-shaped bodies read the baseline before writing proposal.md`, the `## Touchpoints` section of `design.md`, and the size brief of `Size brief after generation`.

#### Scenario: Standalone mode

- **WHEN** the user invokes `/orbit:propose <name>` and `orbit/explore/<name>/` does not exist
- **THEN** the command behaves as upstream, apart from the orbit steps that run in both modes: takes a description, generates `proposal.md` / `design.md` / `specs/<capability>/spec.md` / `tasks.md` into `orbit/changes/<name>/`

### Requirement: Consume mode when staging directory exists

The system SHALL detect the presence of `orbit/explore/<name>/explore.md` and switch to consume mode — UNLESS the file's first non-blank line carries the `concluded` token (per `orbit-conventions`' status-header production), in which case mode detection REFUSES: the command halts stating the conclusion date and the recorded re-entry trigger ("this exploration concluded on <YYYY-MM-DD>. Re-entry: <the live CONCLUDED entry's `Re-entry:` slot, verbatim — per `orbit-conventions`' entry-identity requirement's live-carrier rule; first in file order when two entries carry one, as the readout resolves it; `(no Re-entry: slot found)` when none>") and stops — no prompt, nothing written, nothing moved. Stating the trigger is not offering a reopen: it is the conclusion's own recorded sentence, read from the same file; the explore-side behaviour propose agrees with is `orbit-explore-modifications`' `Re-entry resolution and the conclude verb` requirement, pointed at and not restated. PRECEDENCE within Step 0, in this order, first match wins: (1) both `orbit/explore/<name>/` and `orbit/changes/<name>/` exist AND the staging file's header is `concluded` → REFUSED naming BOTH paths, with no prompt (a second claim on one truth, the shape the explore body's re-entry table already refuses; propose neither deletes nor overwrites a concluded record, so none of the conflict prompt's choices may be offered — the user resolves the state by hand, deliberately); (2) both exist and the staging file is live → the conflict prompt of the conflict scenario fires, with its existing three choices; (3) the staging file's header is `concluded` → REFUSED as above; (4) otherwise → consume mode. Consume mode is entered ONLY for a live file with no unresolved conflict, and no Step 0 path deletes or overwrites a concluded staging directory. The refuse is a Step 0 outcome, resolved BEFORE the PR layer's phase 1 (select + switch) — which runs between mode detection and the structure check — so a refused promotion never cuts a branch. Propose neither reopens the exploration nor offers to: the reopen edit has one owner (`orbit-conventions`' concluded-outcome requirement) and one executor (the explore body, per `orbit-explore-modifications`' re-entry requirement), and this requirement points at both without restating them. A staging directory with no `explore.md`, or whose header is neither fixed token, is not concluded and resolves as today. A `concluded` header inside `orbit/changes/<name>/explore.md` (a name promoted before this requirement existed) is not a propose input at all — consume mode reads the STAGING file only; the explore body's re-entry requirement owns that row.

#### Scenario: Consume mode activated

- **WHEN** the user invokes `/orbit:propose <name>`, `orbit/explore/<name>/explore.md` exists, its first non-blank line is not the `concluded` token, and `orbit/changes/<name>/` does not exist
- **THEN** the command reads `explore.md` as the authoritative seed for artifact generation rather than asking for a description

#### Scenario: A concluded staging directory is refused before any branch is cut

- **WHEN** the user invokes `/orbit:propose <name>`, `orbit/changes/<name>/` does not exist, and `orbit/explore/<name>/explore.md`'s first non-blank line is `> **Status**: concluded 2026-09-25.` with its live CONCLUDED entry carrying `Re-entry: a third withdrawn stage`
- **THEN** mode detection halts with "this exploration concluded on 2026-09-25. Re-entry: a third withdrawn stage" and stops; no `AskUserQuestion`, no change directory, no metadata, no move, and no branch switch (the PR layer's phase 1 is never reached); the reopen path is not offered

#### Scenario: A concluded staging directory beside an active change

- **WHEN** both `orbit/explore/<name>/` (header `concluded`) and `orbit/changes/<name>/` exist
- **THEN** mode detection REFUSES before any prompt, naming both paths and the conclusion date, and stops; no conflict choice is offered (neither "Regenerate from explore" nor "Continue from change" can run), nothing is deleted, overwritten or moved, and no branch is cut

#### Scenario: A header that is neither token is not concluded

- **WHEN** the staging `explore.md`'s first non-blank line matches neither `exploring.` nor `concluded <date>.`
- **THEN** the command proceeds in consume mode exactly as before this requirement was modified

#### Scenario: Conflict — both dirs exist

- **WHEN** both `orbit/explore/<name>/` and `orbit/changes/<name>/` exist at invocation and the staging `explore.md` is live (not `concluded`)
- **THEN** the command halts with a conflict report and asks the user to choose: regenerate from explore (overwrite change), continue from change (discard explore staging), or abort

### Requirement: Section-to-artifact mapping

The system SHALL map `explore.md` sections to the generated artifacts as follows. Additionally
(D-arc Stage D5), the generated `design.md` SHALL carry a `## Touchpoints` section — the
PREDICTED map of where the work lands in the codebase (files/modules to be created or
modified), seeded in consume mode from leanings and references captured in `explore.md` and
authored fresh in standalone mode. The predicted map is revised only through normal artifact
revision (the proposal review cadence bounds its staleness like any design claim) and is
FROZEN once apply begins — from the first apply commit onward it reads as "the plan", while
the ACTUAL map is engine-computed from the diff (per `orbit-orientation`'s boot render and
`orbit-run-summary-emit`'s `files_touched`); prose never tracks what git knows, and
predicted-vs-actual divergence is a computed check (per `orbit-audit-drift`), not a
maintenance chore.

**Touchpoints ENTRY GRAMMAR** (the closed form the computed checks parse — authored here, one
voice; `orbit-audit-drift`'s matching semantics reference this grammar, never redefine it):
each entry is a markdown list item whose LEADING inline-code span(s) name the predicted
targets — one span, or several `+`-joined spans recording grouped alternatives; everything
after the spans (the ` — annotation` tail, parentheticals like "(or the existing config
loader)") is prose the checks never parse. Each target is one of exactly three forms: (a) an
exact repo-relative file path; (b) a DIRECTORY PREFIX, written with a trailing `/`; (c) a
GLOB containing `*` (single-segment wildcard, fnmatch semantics). An actual path MATCHES a
target when it equals the exact path, sits under the directory prefix, or fnmatch-matches
the glob; a grouped entry is satisfied when ANY of its targets matched. Every form is
REPO-RELATIVE: an absolute path, a parent-resolving `..` segment, a backslash separator, or a
`./`-prefixed spelling is malformed — such a target could never match a repo-relative actual
path, so accepting it would create a prediction the arithmetic silently never satisfies. A
list item whose leading spans parse as none of the three forms (or carry a non-repo-relative
target) is a malformed entry — surfaced by the
divergence check as a SUGGESTION naming the line, and excluded from set arithmetic (never a
false drift source).

#### Scenario: Mechanism → the consumption requirement's table

- **WHEN** `explore.md` has a `## Mechanism` section
- **THEN** each entry is carried per the `Mechanism section consumption` requirement's decision table (closure token × owner state), and `design.md` carries the `Mechanism → artifacts` record that requirement specifies; this mapping names that requirement and does not restate its rows

#### Scenario: Grammar covers the canonical map's forms

- **WHEN** the divergence check parses a Touchpoints section containing `src/cli/index.ts` (exact), `src/commands/` (prefix), `src/core/templates/workflows/*.ts` (glob), and `src/core/orientation.ts` + `src/core/artifact-graph/gates.ts` (grouped alternatives)
- **THEN** every entry parses; an actual path under `src/commands/` or matching the glob counts as predicted, and the grouped entry is satisfied by either of its two paths

#### Scenario: Premise → proposal motivation

- **WHEN** `explore.md` has a Premise section
- **THEN** the content is used to seed `proposal.md`'s "Why" / motivation section

#### Scenario: Decisions → spec deltas + design + tasks

- **WHEN** `explore.md` has Decisions
- **THEN** the decisions inform spec requirements, design.md decisions, and tasks; specific wording from the Decisions is preserved where artifact format permits

#### Scenario: Considered & out → design alternatives

- **WHEN** `explore.md` has Considered & out entries
- **THEN** they are surfaced in `design.md`'s "Alternatives considered" or equivalent section to prevent rediscovery

#### Scenario: References → contextual reads

- **WHEN** `explore.md` lists References
- **THEN** those files/URLs are read during artifact generation as context (not copied verbatim)

#### Scenario: Touchpoints authored at propose

- **WHEN** artifacts are generated (consume or standalone mode)
- **THEN** `design.md` includes a `## Touchpoints` section with the predicted file/module map — seeded from the exploration's leanings in consume mode — and the section is never hand-updated after apply's first commit (the actual map is the engine's to compute)

### Requirement: Open question handling

The system SHALL prompt the user per Open question in `explore.md` with three resolution paths: resolve now, defer as `@review:` marker, or abandon.

#### Scenario: Resolve now

- **WHEN** the user resolves an Open question during the prompt
- **THEN** the question's resolution becomes a Decision and informs the generated artifacts; the Open question is moved to Decisions in the persisted `explore.md` as a CONFORMING entry per `orbit-conventions`' `Decision entry identity and classification` requirement — the dated ID opener, `Kind:` per the answer's normative force, `Disposition: live` — never a bare bullet (an entry without the opener has no ID and parses as an open rule nobody can name)

#### Scenario: Resolve now, and the answer is a rule

- **WHEN** a resolve-now answer PRESCRIBES how something must be done across a set of situations (a rule under the entry-identity requirement's test)
- **THEN** the entry is written with `Kind: rule` and NO Mechanism entry is authored at propose; the prompt tells the user the rule will stand as an open domain, and the design's `Mechanism → artifacts` record lists it as UNACCOUNTED with state `absent`

#### Scenario: Defer

- **WHEN** the user defers an Open question
- **THEN** a `@review: <question text>` marker is inserted at the most relevant location in the generated artifacts (typically design.md or the relevant spec); the Open question is moved to a "Deferred to markers" note or remains in Open questions with a "deferred" tag

#### Scenario: Abandon

- **WHEN** the user abandons an Open question (decides it doesn't apply to this change)
- **THEN** the question is moved to Considered & out with a brief rationale; no marker is created

#### Scenario: Default for unprompted bulk

- **WHEN** many Open questions exist and the user chooses "defer all"
- **THEN** all open questions become `@review:` markers in the generated artifacts

### Requirement: Move staging directory to changes

The system SHALL move `orbit/explore/<name>/` to `orbit/changes/<name>/` after generating the artifacts, with the staged metadata MERGED — never bulk-moved: `orbit new change` has already written the change's `.openspec.yaml` (schema, created, schema_version), so the staged `orbit/explore/<name>/.openspec.yaml` (when present, per `orbit-explore-modifications`) is handled explicitly BEFORE the content move — its `architecture:` citation (and any other explore-side fields future capabilities add) carries forward into the change's metadata via the read/write helpers; the change's fresh `schema`/`created`/`schema_version` win; the staged metadata file itself is then discarded so the bulk move can never clobber the change's metadata (precedent: `.orbit-runs/` is already moved explicitly for the same dotfile-glob reason).

#### Scenario: Standard move

- **WHEN** consume mode completes artifact generation successfully
- **THEN** the contents of `orbit/explore/<name>/` (including `explore.md` and any sibling files like `sketches/`) are moved into `orbit/changes/<name>/`; the source staging directory no longer exists

#### Scenario: Citation carries forward by merge

- **WHEN** the staged `.openspec.yaml` carries `architecture: {doc: d-arc-arbitered-flow, stage: d2-architect}` and consume-mode propose completes
- **THEN** the change's `.openspec.yaml` contains that citation alongside its fresh `schema`/`created`/`schema_version`, written through the metadata helpers (never by file overwrite)

#### Scenario: Conflicting citations — staged metadata is authoritative

- **WHEN** the freshly-created change metadata already carries an `architecture:` value (manual edit or future scaffold behavior) that differs from the staged metadata's citation
- **THEN** the staged citation wins (the exploration's citation is the captured decision; the merge is deterministic and loss-free) and the merge step notes the override in chat

#### Scenario: No staged metadata, no merge step

- **WHEN** the staging directory has no `.openspec.yaml` (a pre-D2 exploration)
- **THEN** the move proceeds exactly as before this capability; the change's metadata is untouched

#### Scenario: Generated artifacts coexist with moved content

- **WHEN** the move completes
- **THEN** `orbit/changes/<name>/` contains both the moved exploration files (`explore.md`, `sketches/`, etc.) AND the generated artifacts (`proposal.md`, `design.md`, `specs/`, `tasks.md`)

### Requirement: explore.md persists as historical record

The system SHALL preserve `explore.md` and its sibling files unchanged in the change directory after the move.

#### Scenario: No paraphrasing during move

- **WHEN** `explore.md` is moved into `orbit/changes/<name>/`
- **THEN** its content is unchanged; specific decision wording is preserved exactly

#### Scenario: Cite explore source

- **WHEN** the generated `design.md` references background or decisions originally captured in `explore.md`
- **THEN** the generated text cites `explore.md` rather than paraphrasing without attribution

### Requirement: Validate explore.md structure before consuming

The system SHALL check the basic structure of `explore.md` — the sections `orbit-conventions`' `` `explore.md` five-section format `` requirement lists, in its order (that requirement OWNS the list and its count; this requirement states neither) — and warn (but not block) on issues. The generated body carries the list as a CHECKED MIRROR of that requirement (R-crc-14's mirror corollary: an adopter's body cannot resolve this repository's spec at runtime), held byte-equal to the owner's stated order by a parity test. The Mechanism section is one of the listed sections: its absence warns like any other and, because every live rule is then without an entry, the design's record lists each as UNACCOUNTED (per `Mechanism section consumption`) — a format note with a visible consequence, never a block.

#### Scenario: All listed sections present

- **WHEN** `explore.md` has every section the owning format requirement lists
- **THEN** the command proceeds normally

#### Scenario: Mechanism section absent

- **WHEN** `explore.md` was written before the Mechanism section joined the format and has no `## Mechanism` section
- **THEN** the command warns naming the missing section, prompts proceed-anyway (default proceed), and — on proceed — the design's `Mechanism → artifacts` record lists every live rule as UNACCOUNTED with state `absent`

#### Scenario: Missing section warning

- **WHEN** `explore.md` is missing one or more expected sections
- **THEN** the command warns about the missing sections and prompts the user to confirm proceed-anyway (default proceed)

#### Scenario: Malformed file

- **WHEN** `explore.md` cannot be read or parsed
- **THEN** the command halts with a clear error and exit; user fixes and re-invokes

### Requirement: Naming inference fallback

The system SHALL attempt to infer the change name when invoked without one.

#### Scenario: Recent explore activity

- **WHEN** `/orbit:propose` is invoked with no name and exactly one LIVE `orbit/explore/<name>/` directory exists — a directory whose `explore.md` header carries the `concluded` token is NOT a candidate (per `Consume mode when staging directory exists`)
- **THEN** the command proposes that name to the user; on accept, proceeds in consume mode

#### Scenario: A concluded directory is never inferred

- **WHEN** `/orbit:propose` is invoked with no name, one staging directory is live and one is concluded
- **THEN** the command proposes the live name without a pick prompt; the concluded directory is not mentioned

#### Scenario: Multiple or no candidates

- **WHEN** zero or multiple LIVE staging directories exist
- **THEN** the command prompts via `AskUserQuestion` to specify a name (zero candidates) or pick among them (multiple)

### Requirement: PR choreography at propose (config-gated)

The propose flow's PR choreography SHALL run in THREE ORDERED PHASES whenever `pr:` config
activates the PR layer (`per-proposal` or `per-architecture`, per `orbit-pr-lifecycle`),
and the order is normative because a simpler one cannot execute:

1. **BRANCH SELECTION (local only, BEFORE artifact generation).** Resolve remote and default
   branch, derive and validate the branch name, run the collision, ref-format, and
   dirty-tree preconditions, resolve reuse-vs-create against local AND remote refs, and
   SWITCH to (or create) the target branch. No NETWORK writes occur in this phase, but the
   switch is not merely a HEAD move: `git switch` also rewrites every TRACKED path that
   differs between HEAD and the target commit, so phase 1 changes worktree CONTENT and must
   be guarded accordingly (see the generation-input precondition below).
2. **ARTIFACT GENERATION + VALIDATION**, performed ON that branch exactly as it is
   performed without the PR layer.
3. **OUTWARD WRITES, only after (2) SUCCEEDS.** Commit the generated artifacts (and moved
   staging material) IN ISOLATION — `git commit --only <the enumerated paths>`, so a
   pre-staged unrelated index entry never rides — push, and open the DRAFT PR with the agent-written INTENT description
   — or, on the cited program path, land on the program branch and adopt-or-open the
   program PR. Then record the attachment in the propose (or ff) emit and — ONLY when a PR
   opened or was adopted, i.e. every phase-3 step succeeded — COMMIT (in isolation) + PUSH
   that emit file as the seam's FINAL act: the record is the authority the archive tail
   dereferences, and an uncommitted record is lost to any fresh checkout between the seams,
   stranding the PR draft with no designed recovery. Same seam, same invocation, no new
   consent; the seams-only refresh rule is untouched. After a mid-flight failure the emit
   stays local — the flow never retries a rejected outward write in the same invocation —
   and landing it is a named line of the manual recovery; the recovery for the record's own
   commit/push is step-dependent (push only when the commit already succeeded).

GENERATION-INPUT PRECONDITION (phase 1, checked BEFORE the switch, on BOTH the reuse and
the create path). Because the switch rewrites TRACKED content and phase 2 now runs after it,
the flow SHALL verify that every input generation will need survives the target ref. The
check keys on TRACKED state, never on worktree presence: when a consume-mode staging
directory `orbit/explore/<change-name>/` is TRACKED in HEAD, the TARGET REF must carry the
same content — absent or different on the target means the switch would delete or rewrite
the exploration, and the choreography SKIPS the PR layer ENTIRELY — the switch never
happens — with artifacts generated on the current branch, the change proceeding unattached,
and one note naming the reason. An UNTRACKED staging directory — the ordinary state, since
`/orbit:explore` commits nothing — NEVER triggers the skip: `git switch` rewrites only
tracked paths, so untracked content survives it intact. Checking BEFORE rather than
recovering after is deliberate: it preserves the property phase 1 is supposed to have, that
it destroys nothing. The dirty-tree precondition does NOT cover this case, since it detects
uncommitted modifications while the hazard is COMMITTED content that exists on the current
branch and not on (or differs from) the target — reachable whenever propose runs from a
branch other than the resolved default, or from a local default carrying unpushed commits,
and the flow makes no assumption about where the user is standing.

Selection MUST precede generation because the reuse path is otherwise IMPOSSIBLE: a
compatible per-proposal branch is DEFINED as one carrying this change's artifact commits, so
it already tracks the very paths that generation has just written as untracked files in the
worktree, and `git switch` REFUSES rather than overwrite them. Generating first and
switching after mandates a step that stops on a git error — reachable by the MID-FLIGHT
FAILURE this same requirement specifies: propose creates the branch and commits the
artifacts, then the push or `gh pr create` fails, and the user re-proposes. (The branch now
exists carrying this change's artifact commits, which is exactly the compatible-reuse case.
A `gh`-absent first run is NOT that route — availability resolution degrades the layer to
`never` before any branch work, so no branch is created to reuse.) Selecting first
means nothing untracked exists at switch time and the collision cannot arise.

The guarantee this reordering must NOT weaken is preserved exactly: NOTHING LEAVES THE
MACHINE until generation and validation succeed. Phase 1 is local-only, so a validation
failure at phase 2 leaves the user on the target branch with no commit, no push, and no PR
— and the failure note SHALL NAME THE BRANCH they are now on, since the flow moved them
there. Recovery is `git switch <default>`; the branch is discardable. Under
`per-architecture` for a CITED change — land the work on the doc's program branch (creating
it off the default branch if absent) and open the program PR if it does not yet exist
(first-configured-touch birth). EXISTENCE IS RESOLVED BY QUERY, never assumed from the
branch's newness or from a `gh pr create` duplicate error: run the SAME four-axis
constrained query the archive tail uses (per `orbit-archive-modifications`' discovery rule —
the resolved remote's repository, `--head <program-branch>`, `--state open`, and candidates
DISCARDED unless their base is the resolved default branch). Exactly one survivor: ADOPT it
— record its identity in this propose's `pr_attachment` and create nothing (Shape A's
one-PR-per-program rule is what makes adoption correct, not a fallback). Zero survivors:
create the draft program PR. More than one: SKIP the PR step with a one-line ambiguity note
listing the candidates, exactly as the tail does. A query that ERRORS is degradation, not a
zero result — skip with the failure note rather than creating a PR that may duplicate an
existing one, since a duplicate program PR is the one outcome Shape A cannot represent. With `pr: never` or degraded (no remote/no
`gh`) the choreography is skipped with a one-line note — but ONLY on the DEGRADED-BUT-ACTIVE
path. Under `pr: never`, an absent key, or an inert unrecognized value/shape, the PR layer
produces NO output at all and probes nothing, per `orbit-pr-lifecycle`'s config-first
resolution order: `never`'s promise is silence, and a note would break byte-identity with
pre-capability behavior. A step that FAILS mid-flight (push
rejected for auth, branch protection, or divergence; `gh pr create` erroring) SHALL skip the
remaining choreography with a one-line note naming completed vs skipped steps, elide
`pr_attachment`'s `url`/`state` from the emit (the object persists with `branch`,
`granularity`, and — on the program path — `doc`, which the write gate requires whenever the
granularity is `per-architecture`, when the branch work succeeded), and never block or roll back artifact
generation — the same apply-parity degradation the archive tail carries. RECOVERY IS MANUAL
BY DESIGN (v1): there is no retry entry point and no idempotent re-run surface. The failure
note SHALL name the exact commands that complete the interrupted work — the push
(`git push -u <resolved-remote> <branch>`) and, when PR creation was what failed, the
creation (`gh pr create --draft --base <resolved-base> --head <branch>`) — and SHALL state
the consequence of leaving it: the change proceeds UNATTACHED, and its archive tail will
find no PR, note it, and skip. This is deliberate: orbit is single-user and single-session
(see `orbit-pr-lifecycle`'s operating-assumption requirement), so the user is present at the
moment of failure and a precise message serves better than a retry surface. The invocation NEVER carries a "pr"
word — the config is the standing declaration; behavior after entry is identical on every
provenance path. The choreography's outward writes ride the user's OWN invocation of propose
— propose is NOT promoted to the consent-scoped set and fires NO consent prompt: the
no-chaining contract (`orbit-conventions`) already bars the AI from invoking propose unbidden,
so every propose is user-typed or chat-ratified (both user-invoked provenance), and the
outward write it performs — a DRAFT PR on a NEW branch — is reversible in two commands,
unlike the consent-marked `→ apply` and `→ archive` seams D1 backstops. When opening a
change's FIRST PR on a repository with no `.github/workflows/`, the body SHALL note in one
line that no CI is configured (the PR's checks section will be empty). The check is BOUND TO
ONE REF — the RESOLVED REMOTE's default-branch ref, the same ref branch creation uses and one
the existence check has already fetched — never the pre-switch worktree and never the target
branch. Those three can disagree (a long-lived program branch may carry workflows the base
lacks, or the reverse), and the note describes the CI context the NEW PR INHERITS, which is
the base's — reporting, never
scaffolding, never prompting.

#### Scenario: The attachment record reaches the branch

- **WHEN** the choreography opens (or adopts) a PR and the propose emit records `pr_attachment`
- **THEN** that emit file is committed and pushed to the change's branch before propose completes, so a later archive from a fresh checkout of that branch resolves the attachment

#### Scenario: A switch that would delete the exploration is not performed

- **WHEN** propose runs in consume mode from a branch where `orbit/explore/<change-name>/` is committed, and that path does not exist on the resolved target ref (or exists with different content)
- **THEN** the PR layer is SKIPPED ENTIRELY — no switch occurs, so the staging input is never removed or rewritten — and artifacts are generated on the current branch with the change proceeding unattached, one note naming the reason

#### Scenario: An uncommitted exploration does not trigger the skip

- **WHEN** propose runs in consume mode with `orbit/explore/<change-name>/` present but UNTRACKED (the ordinary explore-then-propose session), and the target ref — an existing compatible branch or the resolved default for a new one — does not carry that path
- **THEN** the precondition does NOT fire: the switch proceeds, the untracked exploration survives it intact, and the change attaches normally

#### Scenario: Reusing an existing branch is possible because selection precedes generation

- **WHEN** propose runs from the default branch while a compatible `<change-name>` branch already exists carrying this change's earlier artifact commits (the re-propose-after-degradation case)
- **THEN** the branch is selected and switched to BEFORE any artifact is written, so no untracked file blocks the switch; artifacts are then generated on that branch and the outward writes follow validation

#### Scenario: Validation failure leaves the user on a named branch, nothing pushed

- **WHEN** artifact generation or validation fails after phase 1 has switched to the target branch
- **THEN** no commit, push, or PR occurs, and the failure note NAMES the branch the flow moved the user to, with `git switch <default>` as the recovery — the branch is local-only and discardable

#### Scenario: Typed propose opens the draft silently

- **WHEN** the user types `/orbit:propose my-feature` in a repo with `pr: per-proposal`
  and a remote
- **THEN** artifacts generate, the `my-feature` branch is created/committed/pushed, a draft
  PR opens with an intent description, and no PR-related prompt fires

#### Scenario: Program PR is adopted, not duplicated

- **WHEN** a second citing change is proposed under `per-architecture` and the constrained query finds exactly one open PR from the program branch into the resolved base
- **THEN** that PR is ADOPTED — its identity is recorded in this propose's `pr_attachment` and no PR is created; a query returning several candidates skips with an ambiguity note, and a query that errors skips with the failure note rather than creating a possible duplicate

#### Scenario: Uncited change under per-architecture takes the fallback

- **WHEN** `pr: per-architecture` and a change with no `architecture:` citation is proposed
- **THEN** the choreography runs the per-proposal path — own branch, commit, push, draft PR
  — and no program branch is sought

#### Scenario: Push failure degrades, artifacts stand

- **WHEN** the push is rejected mid-choreography (auth, branch protection, or divergence)
- **THEN** the PR step is skipped, one note names completed vs skipped steps, `pr_attachment`'s `url`/`state` keys are elided from the propose emit (the object persists carrying `branch` and `granularity`), and the generated artifacts remain intact

#### Scenario: Failure note carries manual recovery

- **WHEN** the push succeeds but `gh pr create` fails
- **THEN** the note names the completed and skipped steps, gives the exact `gh pr create --draft --base <base> --head <branch>` command that completes the work, and states that leaving it unattached means the archive tail will find no PR and skip; no retry surface is offered and nothing is rolled back

#### Scenario: No-CI note on first PR

- **WHEN** the first PR for a change opens on a repo lacking `.github/workflows/`
- **THEN** the completion output contains a single note that no CI is configured; nothing
  is scaffolded and no prompt fires

### Requirement: Branch preconditions at propose

Branch creation SHALL resolve its preconditions explicitly, never by implementer choice.
Every precondition in this requirement belongs to PHASE 1 of the choreography — before any
artifact is generated — so each one that SKIPS does so having written nothing at all: the
flow then proceeds without the PR layer, generating artifacts on the current branch exactly
as it would with `pr: never`. A precondition skip is therefore never a partial state.

The REMOTE and the DEFAULT BRANCH are resolved FIRST, by the shared algorithm defined in
`orbit-pr-lifecycle`'s `Remote and default-branch resolution` requirement — the single
definition both PR seams consume, so propose and archive can never disagree about which
repository owns the PR or which branch it targets. An unresolvable remote or default branch
degrades exactly as that requirement states: the choreography SKIPS with the one-line note
it prescribes, and the lifecycle never blocks. The preconditions below are propose's OWN —
they govern creating a branch, which the archive seam never does.

Wherever this capability says a branch is created "off the default branch", the BASE REF is
the RESOLVED REMOTE's default-branch ref (`<resolved-remote>/<default>`), never the local ref
of the same name. The existence check below already fetches, so that ref is current, while
the local ref may be arbitrarily stale in a checkout the user has not pulled — and two
implementers would otherwise reasonably write `git switch -c <name> <default>` and
`git switch -c <name> <resolved-remote>/<default>` and cut the branch from different commits.
Naming it once here binds every creation site, per-proposal and program alike.

A mechanical branch name that COLLIDES with
the resolved default branch (a change literally named `main`, or an architecture doc whose
stem is the default branch) makes `<head> → <base>` impossible: the choreography SKIPS with
a one-line note naming the collision rather than creating an unmergeable PR or misclassifying
the default branch as an unrelated existing branch. A DIRTY working tree at phase 1 (any
tracked modification outside the change's own generated artifacts and moved staging
material) SHALL skip the branch/PR steps with a one-line note rather than carry unrelated
edits onto a new branch — and because phase 1 precedes generation, the skip costs nothing:
artifacts are generated on the current branch and the change proceeds unattached.
Unrelated UNTRACKED paths do not trigger the skip (a fresh working tree routinely carries
them), but they are NAMED in that same note when the choreography proceeds, so nothing the
commit deliberately leaves behind is silent.

The propose COMMIT SCOPE is an ENUMERATED FILE LIST on the same discipline the archive tail
carries, and for the same reason — this commit becomes the first commit of a PR: stage the
change's own generated artifacts, the moved staging material now under
`orbit/changes/<change-name>/`, and the staging-directory DELETIONS the move produced
(`orbit/explore/<change-name>/`), and nothing else. `git add -A` is PROHIBITED, as is
staging a bare directory prefix: the obvious reach for `-A` (the artifacts are newly created
and therefore untracked) is exactly what would sweep an unrelated untracked file into a PR
the user is about to publish.
"EXISTING" means EXISTING ANYWHERE — locally OR on the resolved remote. The choreography
SHALL fetch the resolved remote and check `<resolved-remote>/<branch>` BEFORE concluding a
branch is absent, because the common fresh-checkout case (a program branch that exists on the
remote from an earlier stage, with no local ref) would otherwise be read as "absent",
creating a divergent local history off the default branch that can only reach a REJECTED
push. When only the remote ref exists, create a LOCAL TRACKING BRANCH from it
(`git switch -c <branch> --track <resolved-remote>/<branch>`) and proceed on the reuse path —
resuming a program branch from a clean checkout is ordinary, not exceptional. "Absent" means
absent both locally and on the resolved remote; only then is a branch created off the default
branch.

An EXISTING branch of the target name is REUSED when it is COMPATIBLE, and compatibility is
defined PER PATH because the two paths mean opposite things by "expected history":

- **Per-proposal branch** — compatible when it is either absent, or present and containing
  no commits beyond the resolved default branch other than this change's own artifact
  commits. A same-named branch carrying unrelated work is a COLLISION: skip with a one-line
  note naming it.
- **Program branch** — compatible when it exists and SHARES ANCESTRY with the resolved
  default branch. The test is EXACTLY `git merge-base <program-branch> <resolved-default>`
  SUCCEEDING (a common ancestor exists) — NOT "the default branch's tip is an ancestor of
  the program branch". The stricter reading holds only at the instant the branch is created:
  a program branch is DESIGNED to be long-lived, so the default branch advancing underneath
  it is the EXPECTED condition at every stage after the first, and a tip-ancestry test would
  reject healthy program work in any active repository. Commits authored by OTHER citing
  changes are likewise EXPECTED, not disqualifying — a program branch accumulates every
  stage's work by design. Only a branch with NO common ancestor (an unrelated root) is a
  collision.

  **Base-ahead policy — CONTINUE WITH DETECTION.** When the resolved default branch has
  advanced beyond the merge-base, the choreography PROCEEDS on the branch and emits a
  one-line note stating that the default branch is ahead by N commits and that the program
  PR's diff will carry that gap until the user integrates. It NEVER merges, rebases, or
  fast-forwards the program branch to catch it up — the same restraint the remote-ahead rule
  carries — and it never SKIPS on this basis: blocking propose because the default branch
  moved would make `per-architecture` unusable in an active repository, and a stale diff-base
  is visible in the PR itself, which is what the PR is for. Integration is the user's act,
  reported and never performed.

Before reusing any existing branch the choreography SHALL fetch and compare against the
resolved remote's tip; when the remote is AHEAD, it fast-forwards if possible and otherwise
SKIPS with a one-line note naming the divergence rather than committing onto a stale local
branch. orbit never force-moves, renames, rebases, or force-pushes a user's branch.

#### Scenario: New branches are cut from the remote ref, not a stale local one

- **WHEN** a branch is created in a checkout whose local default-branch ref is behind the resolved remote's
- **THEN** it is cut from `<resolved-remote>/<default>` — the ref the existence check already fetched — so the base commit does not depend on when the user last pulled

#### Scenario: Default branch resolved, not assumed

- **WHEN** the choreography runs in a repo whose default branch is not `main`
- **THEN** the branch is created off the resolved default branch, and a repo where neither resolution method succeeds skips the choreography with a note instead of guessing

#### Scenario: Remote resolved, never assumed

- **WHEN** the repository has exactly one remote not named `origin`, or has several remotes with no `origin`
- **THEN** the single remote is used in the first case; the second SKIPS the choreography with a one-line note naming the ambiguity and the candidate remotes — push target, default base, and `gh` repository never disagree

#### Scenario: Mechanically derived name that Git rejects skips

- **WHEN** the derived branch name is valid on disk but rejected by `git check-ref-format --branch` (an architecture stem ending in `.lock`, a name containing `..`)
- **THEN** the choreography SKIPS with a one-line note naming the name and the reason; no branch is created under a silently transformed name

#### Scenario: Branch name colliding with the default branch skips

- **WHEN** the mechanical branch name equals the resolved default branch (a change named `main`, or a program doc whose stem is the default branch)
- **THEN** the choreography skips with a one-line note naming the collision; no unmergeable `<head> → <base>` PR is attempted and the default branch is never treated as an unrelated existing branch

#### Scenario: Propose stages an enumerated list, never `-A`

- **WHEN** the choreography commits with unrelated UNTRACKED files present in the working tree
- **THEN** only the change's generated artifacts, the moved staging material, and the staging-directory deletions are staged; the unrelated untracked paths are left alone and named in the note; `git add -A` and bare directory-prefix staging are never used

#### Scenario: Dirty tree skips rather than sweeps

- **WHEN** unrelated tracked modifications exist at the choreography step
- **THEN** no branch is created and no commit is made; the artifacts remain generated and validated, and one note names the skipped steps

#### Scenario: Remote-only branch is tracked, not recreated

- **WHEN** a citing change is proposed in a fresh checkout where the program branch exists on the resolved remote but has no local ref
- **THEN** the fetch/remote-ref check finds it, a local TRACKING branch is created from the remote ref, and the reuse path proceeds — no divergent branch is created off the default branch and no push is left to be rejected

#### Scenario: Default branch advancing does not reject the program branch

- **WHEN** a second citing change is proposed after the resolved default branch has advanced beyond the program branch's merge-base
- **THEN** `git merge-base` still succeeds, the branch is REUSED, and one note states the default branch is ahead by N commits and that integration is the user's act — nothing is merged, rebased, or skipped; only a branch with NO common ancestor is reported as a collision

#### Scenario: Program branch reused across stages

- **WHEN** a second (and third, and tenth) citing change is proposed onto an existing program branch already carrying earlier stages' commits
- **THEN** the branch is REUSED — commits by other citing changes are expected history, never a collision — and only a branch unrelated to the default branch's history is reported and skipped

#### Scenario: Remote-ahead branch is not committed onto blindly

- **WHEN** the resolved remote's tip is ahead of the local branch at the choreography step
- **THEN** the choreography fast-forwards when possible, and otherwise SKIPS with a one-line note naming the divergence — never committing onto a stale local branch, never rebasing or force-pushing

#### Scenario: Existing branch reused or reported

- **WHEN** a branch of the target name already exists
- **THEN** it is reused when compatible; when it is unrelated the choreography is skipped with a note naming the collision — never force-moved, renamed, or committed onto blindly

### Requirement: Mechanism section consumption

In consume mode the system SHALL carry `explore.md`'s Mechanism section into the generated artifacts by the decision table below, reading the section from the FILE — the entry set under `## Mechanism`, each entry's `Closure:` token, and a BOUNDED entry's `Residual kind:` and `Residual method:` lines VERBATIM — as it reads Decisions: by the grammar `orbit-conventions`' Mechanism-entry requirement owns, which this requirement points at and does not restate. Propose fires NO emit of its own before its one-shot completion emit (per `orbit-run-summary-emit`'s one-shot rule, which this requirement leaves untouched) and reads NO prior emit as a cross-check: git preserves neither file's modification time, so no observable a workflow body has can establish that a trail record was written against the file's current bytes. The proposing AI's reading of the file is the SOLE source of the record, and the record's header says so. The engine's form parse (the readout's `rules_open` / `key_defects` / `residuals`, `orbit-emit-composition`'s fields) remains the reviewer's cross-check after the fact; a read-only print of it for a staging name is the follow-on this requirement names and does not build. Propose consumes FORM, as the readout renders form: whether an enumeration is TRUE, a residual honest, or a rule written down at all remains the reviewer's judgement.

**The decision table** — a PARTITION of the entries and live rules propose meets, over two facts: the owning Decisions entry's live-rule status (per `orbit-conventions`' entry-identity requirement: `Kind:` rule or absent AND `Disposition:` live or absent) and the rule's accounting state as the readout's parser judges it (`orbit-emit-composition`'s `rules_open` and `key_defects` fields — pointed at, never re-listed here). A live rule is ACCOUNTED exactly when it is COUNTED in `rules_total` AND NOT in `rules_open` — a duplicate-ID second entry is counted in neither and is a key defect (row 1), so it never reaches a carrier row. Read from the FILE alone (an adopter's skill has neither this repository's specs nor its parser), the same fact is: the rule has an entry that CONFORMS to the Mechanism grammar in FULL — a heading whose ID matches its Decisions entry, a `Domain:` line and a table with at least one member row, a `Closure:` token from the closed set, the two residual slots present exactly when BOUNDED, and nine move lines each exactly once (`orbit-conventions` owns that grammar; the propose body carries a checked mirror of its production); an entry failing ANY clause, or no entry, is OPEN, and the readout's state word — when a readout is at hand — names which clause. A key defect is an entry whose heading ID matches no Decisions entry (an orphan) or a second entry or heading under an already-used ID (a duplicate). The `Closure:` token an entry carries is consulted ONLY on an accounted entry, because an entry can carry a token and still be open (a BOUNDED entry missing a slot; a SOURCED entry with a bad table). Rows are tested IN ORDER and the first match wins:

| row | owner's Decisions state | accounting state | lands in |
|---|---|---|---|
| 1 | any, or none — tested FIRST | in `key_defects` (an orphan entry whose heading ID matches no Decisions entry; a second entry or heading under an already-used ID) | reported in chat at the Mechanism read (after Step 0b's last write, before generation); no carrier — a key with no owner has nowhere to land, and a duplicate is excluded from `rules_total`. Its record row: the heading's ID plus `line N`, the defect kind (`orphan` / `duplicate`) in the state column, owner `none` (orphan) or `duplicate` (a second claim on an owned ID), destination `none` |
| 2 | NOT a live rule (`Kind: fact` / `scope`, or `Disposition: superseded` / `assigned`) | any — an entry or none, well-formed or not | nowhere — permitted history; `explore.md` travels unchanged; the record lists it as not carried with NO state word (the engine assigns none to a non-live owner) |
| 3 | live rule | OPEN — in `rules_open` (any state that field defines, whatever `Closure:` token the entry carries); from the file alone: no entry, or an entry failing any clause of the Mechanism grammar | UNACCOUNTED: ONE `design.md` Risks entry naming the rule as the readout names it — the ID, or `line N` for an ID-less entry, per `orbit-run-summary-emit`'s identifier rule — with the state word (the readout's when one is at hand; else the failing grammar clause, in the grammar's vocabulary); the spec delta carries nothing for it; never blocking |
| 4 | live rule | accounted, `Closure: DERIVED` or `SOURCED` | the spec delta requirement the rule derives: the domain table as one of the CLOSED shapes below, the `Closure:` justification as the sentence naming the source |
| 5 | live rule | accounted, `Closure: BOUNDED` (both residual slots present, by construction) | `Residual kind:` and `Residual method:` VERBATIM in that requirement's text as a named limit (the OWNER — only spec text survives archive); ONE `design.md` Risks entry naming the rule ID and POINTING at the requirement, restating nothing |

**The CLOSED shapes.** A CLOSED domain table lands in requirement text as one of four shapes, each observed on the record: a normative TABLE (the re-entry table in `orbit-explore-modifications`), a GRAMMAR or production block (the Mechanism grammar's fences in `orbit-conventions`), a SCENARIO SET — one scenario per member (the maturity rungs in `orbit-run-summary-emit`), or a SENTENCE naming the source with the members in prose (the concluded outcome's reader sentence in `orbit-conventions`). Which shape fits is the author's judgement; the record says which was chosen. This set is BOUNDED, and its named limit is stated here, once:

- Residual kind: a destination shape for a CLOSED domain table that none of the four names
- Residual method: classify the spec deltas of the next archived change that consumed a Mechanism section (this stage's own is the first through the mapping) against the four; a delta whose domain landed in none is a fifth row and a revision of this table

**The record.** The generated `design.md` SHALL carry a `## Mechanism → artifacts` section: one table row per Mechanism entry (and per live rule with none) — the rule as the readout names it (ID, or `line N`; a key defect by ID plus `line N`), its closure token or its state word (the readout's when one is at hand; else the failing grammar clause; the defect kind for a key defect), its owner's state (`none` for an orphan; `duplicate` for a second claim), and its destination named as a requirement title (and the shape, for CLOSED entries; `none` for a key defect) — plus a header line stating the source: "the proposing AI's reading of the file; no engine record" — always that sentence, because no engine record is consulted at propose. Before the staging directory is moved, the body verifies by grep that every BOUNDED entry the table sent to row 5 (a live, accounted rule — never a history row) has its two residual lines in a delta spec under `specs/`; a miss is reported and fixed before the move.

#### Scenario: A BOUNDED entry's residual travels to spec text with a design pointer

- **WHEN** a live rule's Mechanism entry is `Closure: BOUNDED` with both residual slots, and propose generates the artifacts
- **THEN** the two slot lines appear verbatim in the owning requirement's text in the delta spec, `design.md`'s Risks carries one entry naming the rule ID and pointing at that requirement, and the record's row for the entry names both carriers

#### Scenario: A CLOSED entry informs the requirement it derives

- **WHEN** a live rule's Mechanism entry is `Closure: DERIVED` or `Closure: SOURCED`
- **THEN** the record names the requirement the domain table landed in and which of the four shapes it took; the `Closure:` justification is the requirement's sourcing sentence

#### Scenario: A non-live owner is history

- **WHEN** a Mechanism entry's owning Decisions entry carries `Kind: fact`, `Kind: scope`, `Disposition: superseded <ID>` or `Disposition: assigned <stage>`
- **THEN** nothing is generated from it; the record lists it as not carried; `explore.md` is unchanged

#### Scenario: An unaccounted live rule is recorded, never blocking

- **WHEN** a live rule is in `rules_open` (any state), whatever `Closure:` token its entry carries
- **THEN** row 3 applies: `design.md`'s Risks carries one entry naming the rule as the readout would (ID, or `line N`) and the state word, the record lists it as UNACCOUNTED, no spec text is generated for it, and generation proceeds

#### Scenario: A BOUNDED entry missing a slot is unaccounted, not a residual

- **WHEN** a live rule's entry reads `Closure: BOUNDED` and carries `Residual kind:` but no `Residual method:`
- **THEN** the rule is `bounded-incomplete` in `rules_open`, row 3 applies and row 5 does not: nothing is copied into spec text, and the record names the rule UNACCOUNTED with that state word

#### Scenario: A malformed entry on a non-live owner is history

- **WHEN** a Decisions entry carries `Kind: fact` and its Mechanism entry has a `Domain:` table with no member rows
- **THEN** row 2 applies: nothing is generated, the record lists it as not carried with no state word, and no Risks entry is written

#### Scenario: A duplicate-ID entry is a key defect before it is anything else

- **WHEN** two Decisions entries carry the same ID and the second is a live rule with a well-formed, accounted-looking Mechanism entry
- **THEN** row 1 applies to the second entry (it is in `key_defects` and excluded from `rules_total`): it is reported and nothing is carried from it; the first entry is judged by rows 2–5 on its own state

#### Scenario: An orphan Mechanism entry has a record row and no carrier

- **WHEN** the Mechanism section carries `### D-x-9 — …` and no Decisions entry has ID `D-x-9`
- **THEN** row 1 applies: the record carries the row `D-x-9 at line N` / `orphan` / owner `none` / destination `none`, the defect is reported in chat at the Mechanism read, and nothing is generated from it

#### Scenario: A duplicate Mechanism heading has a record row naming the second claim

- **WHEN** two `### D-x-2 — …` headings exist under `## Mechanism`
- **THEN** the first is judged by rows 2–5 on its own state; the second gets row 1's record row — `D-x-2 at line N` / `duplicate` / owner `duplicate` / destination `none` — and is reported, not carried

#### Scenario: Accounted is decidable from the file alone

- **WHEN** a live rule's entry reads `Closure: SOURCED` and its `Domain:` table has no member rows, and the proposing AI has no readout at hand
- **THEN** the entry fails the grammar's member-row clause, is OPEN, and row 3 applies with the state column reading that clause; row 4 is never reached

#### Scenario: No prior emit is read as a cross-check

- **WHEN** the staging `.orbit-runs/` holds one or more explore emits when propose runs in consume mode
- **THEN** propose reads none of them as a source for the record and fires none; the record's header line reads "the proposing AI's reading of the file; no engine record"

### Requirement: Size brief after generation

The propose body SHALL read the `size` object from `orbit status --change <name> --json` after every artifact is
generated and `orbit validate <name>` passes NON-STRICT — which size never fails, so a breach never stops the flow before
the brief that handles it — in consume mode and standalone mode alike — BEFORE Step 0d's move, before the PR
choreography's Phase 3 (commit, push, draft PR) and before the completion emit, so a declaration it writes lands in
the proposal that Phase 3 commits (the object is owned by `orbit-change-size`'s `Status carries the size figures`),
and act by this table:

| `size` | the body |
|---|---|
| `ceiling` is `null` (the check is OFF) | says nothing about size |
| `breaches` is empty | says nothing about size |
| every breach `declared` | states each declared breach in one line, at the completion summary |
| any breach not `declared` | BRIEFS the user before the completion emit: each undeclared dimension with its figure and maximum, and the two routes below |

The two routes for an undeclared breach, asked with `AskUserQuestion`, the user's answer deciding:

- **Split** — the change is split before review (R-crc-9). Propose does not split it: it says which dimensions are
  over and recommends returning to `/orbit:explore <name>` or the architecture doc. The artifacts stay in place. The
  split recommendation REPLACES the body's completion prompt to review the change. The rest of the flow runs
  unchanged — Step 0d's move, the PR choreography's Phase 3 and the completion emit — so only the closing chat line
  differs; the body says that the emit's pointer names the review only because the artifacts are complete, and that
  `orbit validate <name> --strict` keeps failing on the undeclared breach until the change is split.
- **Declare** — the body writes a `## Size` section into `proposal.md` (or adds to it), one item per undeclared
  dimension, carrying the user's reason in the user's words, and runs `orbit validate <name> --strict`.

The body carries the declaration's production as a CHECKED MIRROR of `orbit-change-size`'s `A breach is declared in
the proposal's Size section`, because an adopter's installed skill has neither this repository's specs nor its parser;
a parity test holds the copy byte-equal to the owner's fence. Propose never writes a declaration the user did not
choose, and never chooses a split for the user. The brief REPORTS: it blocks nothing, and the change's artifacts are
complete whichever route is taken.

#### Scenario: A check that is off says nothing

- **WHEN** `orbit/config.yaml` carries no `size_ceiling` key and propose generates a change touching five capabilities
- **THEN** the propose body's output says nothing about size

#### Scenario: An undeclared breach is briefed before the emit

- **WHEN** the check is ON with `capabilities: 3` and the generated change touches four capabilities
- **THEN** before the completion emit the body names capabilities, 4 and 3, and asks the user to split or declare

#### Scenario: Declare writes the user's reason

- **WHEN** the user answers declare with a reason
- **THEN** `proposal.md` carries `## Size` with a `capabilities` item holding that reason, and `orbit validate <name> --strict` passes on size

#### Scenario: Split leaves the artifacts in place

- **WHEN** the user answers split
- **THEN** the body recommends `/orbit:explore <name>` or the architecture doc, writes no `## Size` section, and leaves every artifact in place

#### Scenario: Split replaces the review prompt

- **WHEN** the user answers split
- **THEN** the body's closing chat line is the split recommendation, not the prompt to run `/orbit:review <name>`

#### Scenario: A declaration lands before the PR commit

- **WHEN** `pr:` is `per-proposal` and the user answers declare
- **THEN** the `## Size` section is in `proposal.md` before the PR choreography's Phase 3 commits it

#### Scenario: The mirror matches its owner

- **WHEN** the generated propose skill is rendered
- **THEN** the parity test finds its `## Size` production byte-equal to the fence in `orbit-change-size`'s declaration requirement

### Requirement: Propose-shaped bodies read the baseline before writing proposal.md

The propose body and the ff body SHALL each carry, in upstream step 4a, the two lines fenced below, immediately after
the line `- Read any completed dependency files for context` and before the line ``- Create the artifact file using
`template` as the structure``. This is a named in-place edit of the upstream portion of each body, per
`orbit-conventions`' `Generated-file disposition`: it replaces the step's dependency-read line with that line followed
by these two, and no `# Orbit additions` text restates them. The bodies are the propose-shaped ones that
`orbit-run-summary-emit`'s `Propose-shaped and artifact-completion-aware recommendation logic` names, `/orbit:propose`
and `/orbit:ff`; `/orbit:continue`, which writes one artifact per invocation, does not carry them.

```
- Before writing the proposal artifact: list the capabilities the change will modify, grep `orbit/specs/` for the rule the change alters and list each spec that restates it too, then read each listed capability's whole baseline spec (`orbit/specs/<capability>/spec.md`)
- Before writing the specs artifact: copy each MODIFIED requirement whole from its baseline block, as the instruction's MODIFIED requirements workflow says; a scenario left out is dropped from the baseline at archive
```

The lines are an instruction and nothing checks that an agent follows them: no artifact section and no validation or
emit check records the read. Whether agents read is measured outside this repository, by `propose-reads-specs`'
`measure` stage.

#### Scenario: Both generated bodies carry the two lines in step 4a

- **WHEN** the propose and ff skills are generated
- **THEN** each body carries the fence's two lines, in order, on the lines immediately after `- Read any completed dependency files for context`, and before ``- Create the artifact file using `template` as the structure``

#### Scenario: A body missing a line fails

- **WHEN** a generated body lacks either line, or carries them anywhere other than immediately after the dependency-read line
- **THEN** the test fails, naming the body and the line


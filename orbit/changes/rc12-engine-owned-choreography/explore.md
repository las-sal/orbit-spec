> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: rc12-engine-owned-choreography

## Premise

The charter (clean-up-review-cycle, Stage rc12): move the DETERMINISTIC sequences of D6's PR
choreography (remote and default-branch resolution, tip comparison, the isolated commit, the
attachment record's push) into an `orbit pr` engine command, leaving the bodies only judgment
(titles, landmark prose, degradation notes). Governed by R-crc-5, the CONDITIONAL reversal of
D-d6-7: "effective only for steps rc05 has shown to be deterministic by executing them." Exits:
(1) deterministic steps engine-tested; (2) the three PR references shrink by more than half;
(3) consent properties unchanged. Pre-split (Q-crc-9): engine command first, body adoption second.

Measured at scaffold (2026-10-11): the PR layer has NEVER RUN. `orbit/config.yaml` carries no
`pr:` key; no archived change carries `pr_attachment`; D6's dogfood (task 6.3) waits on `main`
carrying the work, and `main` is 638 commits behind `d-arc`. rc05/rc05b executed the GRAMMAR of
documented `git`/`gh` lines, never the SEQUENCES; D6's phase-1 harness (33 cases) ran branch
selection against real git, LOCAL only — every outward-write case was rescoped to 6.3. The
references today: propose/ff `pr-choreography.md` 18,456 bytes each, archive `pr-archive-tail.md`
12,898, architect `pr-resolution.md` 4,611 (one source, `pr-choreography.ts`, 32,873 bytes).

Update 2026-10-11T23:26Z: Sal merged PR #14 (`d-arc → main`, merge commit `d781b810`), so `main`
now carries the D6 lifecycle and every rc stage; `d-arc` is fully contained in `main` (main is one
merge commit ahead). The dogfood's blocker — no default branch carrying the work — is gone.
`pr: per-proposal` was then committed and pushed to `origin/main` (`abbf8c9b`, Sal's word), so
phase 1's branch — created from `<remote>/<default>`, never the local ref — carries the regime.

The question this exploration has to answer first: is R-crc-5's condition met, and if not, what
evidence would meet it before any mechanism is designed?

## Mechanism

### D-rc12-2 — the engine command RESOLVES and PRINTS; every write stays in the body
Domain: every step of the three PR references, by what the engine owns
| member | covered by |
|---|---|
| regime read (`pr:`), remote, canonical id, `gh` availability, default branch | engine computes, reports as JSON |
| phase-1 branch logic (name check, default collision, existence, compatibility, remote-ahead, generation-input precondition) | engine computes the branch state |
| dirty-tree observation | engine reports the paths; the body names them in the note |
| no-CI observation | engine reports presence of a workflow file on the default branch |
| attachment read, live url validation (four predicates), draft observation, HEAD-is-branch | engine computes; the validation command the dogfood had to compose becomes code |
| branch create, isolated commit, push, READY flip | body runs the line the engine PRINTS as data (the silent tracking and push spellings fixed in the printed form) |
| `gh pr create`, description rewrite | body runs the printed line with the title and body it authored (judgment) |
| merge, post-merge return to the default branch | the user's act; the engine may print the return line, never run it |
Closure: BOUNDED — the domain is the references' steps, and the dogfood found steps the references never wrote
Residual kind: a step the runbook is silent on, so no row names it (tracking at creation, the post-merge return were two)
Residual method: the dogfood log's rows classed "wrong (silent)", and every later live run's log classified the same way
Moves:
- READ: applied — the three references read by heading and measured per section (propose 10.2K of 18.4K read-only, archive 6.7K of 12.9K, architect 4.6K of 4.6K); Case 1
- ENUMERATE: applied — this table, from the references' sections joined with every row of the dogfood log
- COHERE: applied — the printed write lines are derived from the same resolution the JSON reports, in one call, so a body never re-resolves what it then writes against
- EXECUTE: applied — every happy-path row ran by hand on PR #15 (the dogfood log); no command exists yet to execute
- FALSIFY: applied — resolve-only may miss exit (2): the read-only share is 52–55%, borderline; D-rc12-3 is the measured fallback
- CONFORM: applied — R-crc-5 permits writes and does not require them; D-d6-7 kept for every write; R-crc-13 (the command reports); R-crc-14 (one resolution source for three references); the outward-actions rule (merge never)
- FEASIBILITY: applied — read-only `git`/`gh` calls; `gh` absent is a reported fact, never an error
- CONSUME: applied — consumers are the propose/ff, archive and architect bodies (change 2); architect consumes resolution only
- INVOKE: applied — runs at propose/ff phase 1, the archive preflight and the architect readout, only inside the user's own invocation of those commands

### Case 1 — the read-only share, measured 2026-10-12
`pr-choreography.md` (propose/ff, 18,456 bytes): shared resolution 2,893 + config order 1,393 + phase 1 5,870 = 10,156 read-only; phases 2–3 5,081 and the attachment record 2,650 hold the writes and the judgment. `pr-archive-tail.md` (12,898): resolution 2,893 + preflight 3,755 = 6,648 read-only; the tail 5,615. `pr-resolution.md` (architect, 4,611): resolution only. Byte counts by heading range on the generated surface.

### D-rc12-4 — R-crc-5's "shown deterministic by executing" is met by the live run for the happy path and by engine tests for every other branch
Domain: the deterministic steps, by what executes each
| member | covered by |
|---|---|
| happy-path rows of propose, archive and merge (per-proposal) | the dogfood log, PR #15, seams 1–3 |
| branch states 4–6 (exists, incompatible, remote ahead) | engine tests against real temporary git repositories (exit (1)) |
| `gh` absent or unauthenticated | engine tests with `gh` off the path / the recorded stub |
| `ff` seam | engine tests; it shares phase 1 with propose |
| `per-architecture` regime (program PR, architect resolution) | engine tests; no live run |
Closure: BOUNDED — the live run covered one regime and one path; the rest is covered by tests, whose reach is their own
Residual kind: deterministic behaviour of a real remote host neither the live run nor a local temporary repository reaches (e.g. branch protection, `gh` auth expiry, a renamed default branch)
Residual method: a second live run under `per-architecture`, logged with the dogfood log's classes
Moves:
- READ: applied — R-crc-5's text names rc05; rc05/rc05b executed grammar, never sequences (D-rc12-1), so this is a reading of the condition, stated rather than assumed
- ENUMERATE: applied — this table, from the dogfood log's "never fired" set
- COHERE: applied — D6's phase-1 harness (33 local cases against real git) is the same instrument this extends
- EXECUTE: applied — the happy path, by hand; the test rows wait for the command
- FALSIFY: applied — a test against a local repository cannot see host-side behaviour; hence the residual
- CONFORM: applied — R-crc-5; R-crc-12 (a criterion's measuring instrument is stated, not silently swapped)
- FEASIBILITY: applied — temporary repositories with a bare remote are cheap; D6 already does it
- CONSUME: applied — exit (1)'s grading reads this table
- INVOKE: applied — fires at propose, when the stage's exit (1) is written into tasks

### D-rc12-8 — the record separates what the engine saw, what the body runs, and what the user does
Domain: every kind of item an `orbit pr` record carries
| member | covered by |
|---|---|
| the decision for the seam | `action`: `off` \| `skip` \| `proceed` |
| why a skip or a degradation happened | `reason: {code, detail}` — a closed code set per subcommand (D-rc12-13) |
| a PR half that degraded while the own writes stand | `degraded: "pr"` on a `proceed`; the segments omit the PR steps |
| facts and reads a later step consumes (resolution, branch state, scope, the current program-PR body) | `observations` |
| writes the body runs, between the points where it must author something | `segments: [{inputs, steps}]`; `inputs` names the authored files a segment's argv consumes (`<message-file>`, `<title>`, `<body-file>`, `<emit-path>`); a segment ends wherever a later step needs something the body authors from an earlier step's result |
| acts that are the user's alone (READY flip at arc-done, merge, the post-merge return) | `human_acts: [{act, argv}]` — never run by the body, never run by a test |
Closure: SOURCED — every row of the three references' steps and of the dogfood log maps to exactly one member; the external pass's flat-list finding was the test
Moves:
- READ: applied — the external pass found the flat `commands` list held writes, a read (the program body) and copy-text (`program`'s acts); the fresh pass found `after_merge` unspecified
- ENUMERATE: applied — this table, one member per item kind the references and the dogfood log produce
- COHERE: applied — `degraded` and `segments` are one mechanism: a degradation removes the PR segment's steps, never the land segment's
- EXECUTE: not applied — no command exists; the publish segments were run by hand on PR #16 (create, then the emit, then the record commit)
- FALSIFY: applied — a single flat list cannot express "write the emit from the create's URL, then commit it"; segments with inputs can
- CONFORM: applied — D-rc12-2 (writes printed, never run); R-crc-13 (the record reports); the outward-actions rule (`human_acts` are never run)
- FEASIBILITY: applied — at most three segments per subcommand
- CONSUME: applied — change 2's bodies run segments in order, authoring each segment's inputs first; the tests fill inputs per segment and write a real emit between publish's two
- INVOKE: applied — every subcommand emits one record per call

### D-rc12-9 — the tail takes preflight's outcome and reads the archive emit, never observes again
Domain: what `tail` needs from earlier in the archive, by source
| member | covered by |
|---|---|
| preflight's outcome (one of its closed set) | `--outcome`, passed verbatim by the body from preflight's `observations.outcome` |
| `valid`, `discovered` | PR half runs against the emit's `pr_url`; `pr_state: "ready"` means no flip |
| a positive invalidation or `not-found` | `proceed` with `degraded: "pr"` — commit and push only |
| `none`, `several` (a URL-less attachment's fallback missed) | `proceed` with `degraded: "pr"` — commit and push only |
| `unobserved`, `gh-absent` | `skip`, per the owner's availability rule |
| a code outside the set, or one the emit's fields contradict | a usage error naming both |
| no attachment | `off`, whatever the code |
| the capabilities the sync changed | the emit's `sync_specs.capabilities_updated`; each spec file staged whether new or modified (untracked included) |
| edits inside a synced spec file that predate the sync | not distinguished — the owner's own limit, stated, not solved |
Closure: SOURCED — the outcome rows are preflight's closed set (D-rc12-12), every code in exactly one row; the scope is one emit field
Moves:
- READ: applied — the archive payload table carries `pr_url`, `pr_state` and `sync_specs` (`src/core/emit-composition.ts`; `archive-summary-schema.md`); the archive body runs the preflight at Step 5.45, after the sync, before the emit
- ENUMERATE: applied — this table; the first version keyed on the two emit fields alone and missed that `none`/`several` and `unobserved`/`gh-absent` both write neither (the proposal verification pass, Case 2)
- COHERE: applied — the owner's "one observation feeds the emit and the tail" holds: the outcome and the emit both come from preflight's one call, and a disagreement between them is refused
- EXECUTE: not applied — no command exists
- FALSIFY: applied — the external pass's no-op-sync case: a dirty delta-named spec the sync did not change is out of scope here because `capabilities_updated` names only what changed
- CONFORM: applied — R-crc-13 (an emit records; a later step reads the record); `orbit-archive-modifications`' `PR-attached archive tail`
- FEASIBILITY: applied — one file read and one argument
- CONSUME: applied — the archive body runs preflight, writes the emit, then runs `tail` with the outcome; change 2 carries the value between the two calls
- INVOKE: applied — runs after the archive emit, once

### Case 2 — the two-field reading, refuted 2026-10-12
Preflight's `none`, `several`, `unobserved` and `gh-absent` all leave the archive emit without `pr_url` and `pr_state`; the first two degrade the PR half, the last two skip the tail. Two presence bits cannot carry four outcomes onto two behaviours. Sal: A — `tail --outcome`, over a new emit field (a second capability) or reading the owner's fallback "SKIP" as a whole-tail skip.

### D-rc12-10 — `select` needs no change directory
Domain: the inputs `select <name>` resolves, by creation path
| member | covered by |
|---|---|
| consume mode (propose from an exploration) | `orbit/explore/<name>/` exists; the staging dir feeds the generation-input guard |
| the citation on that path | `orbit/explore/<name>/.openspec.yaml`'s `architecture:` block |
| standalone propose or ff | no staging dir; uncited, so the per-proposal path |
| an active change of that name (a re-run after generation) | its `.openspec.yaml` citation; not consume mode |
| an invalid name | the one usage error (the change-name rule) |
Closure: SOURCED — the creation paths are propose's two modes and ff, per `orbit-propose-modifications`
Moves:
- READ: applied — the external pass: `phase1.ts` takes `stagingDir` and the mode explicitly through `Phase1Input`; the proposed CLI took only a name and called an unknown change a usage error
- ENUMERATE: applied — this table
- COHERE: applied — the citation is read from wherever the metadata lives at that moment, so branch naming and the program path agree with what propose later merges
- EXECUTE: not applied — no command exists
- FALSIFY: applied — a staging-only cited exploration selects the program branch; a standalone change never does
- CONFORM: applied — `orbit-propose-modifications`' Step 0 order: mode detection, then Phase 1, then generation
- FEASIBILITY: applied — two path checks and one YAML read
- CONSUME: applied — the propose and ff bodies call it at Step 0.5
- INVOKE: applied — once per propose or ff, before generation

### D-rc12-11 — the engine's fetch names its destinations and fetches no tags
Domain: the ways a `git fetch` could move refs other than the two remote-tracking refs `select` needs
| member | covered by |
|---|---|
| a configured `remote.<r>.fetch` refspec targeting `refs/heads/` | an explicit refspec on the command line overrides the configured ones |
| tag auto-following | `--no-tags` |
| a ref absent on the remote (fetch would fail) | `git ls-remote --heads <r> <default> <branch>` first; fetch only refs that exist |
| the fetched form | `git fetch --no-tags <r> +refs/heads/<x>:refs/remotes/<r>/<x>`, one refspec per existing ref |
Closure: BOUNDED — git's fetch side effects are git's to define; the named members are the ones a refspec and a flag control
Residual kind: a fetch side effect configured outside the refspec and tag settings (e.g. `fetch.prune`, hooks, `remote.<r>.mirror`)
Residual method: a test per configuration key, added when a run log names one; the shim records the exact argv so a changed form is visible
Moves:
- READ: applied — the external pass: fetch follows `remote.<name>.fetch`, and tags follow by default
- ENUMERATE: applied — this table
- COHERE: applied — `ls-remote` is a pure read, so existence is decided before anything moves
- EXECUTE: not applied — to run as the test the instrument requirement names (a remote with a `refs/heads/` refspec)
- FALSIFY: applied — a bare `git fetch <r>` passes the allowlist and still moves a local branch; the exact argv form closes that
- CONFORM: applied — D-rc12-2 (the one ref-store update, bounded)
- FEASIBILITY: applied — one ls-remote and at most two fetches
- CONSUME: applied — the existence and remote-ahead checks read the two refs
- INVOKE: applied — `select`, and `publish` on the program path

### D-rc12-12 — the outcome sets are closed, and `program` never skips
Domain: every outcome of a PR observation, per subcommand
| member | covered by |
|---|---|
| a stored URL that passes the four predicates | `valid` |
| a predicate fails | `closed`, `merged`, `retargeted`, `head-mismatch`, `repository-mismatch` |
| the URL resolves to nothing | `not-found` — `gh pr view` exits non-zero with "Could not resolve to a PullRequest", recorded in the gh contract as a third error rule |
| any other non-zero exit | `unobserved` |
| no `gh` on PATH | `gh-absent` |
| a URL-less attachment's query | `discovered`, `none`, `several` (with every candidate) |
| `preflight` and `tail` on any non-`valid`, non-`discovered` outcome | the owner's skip or PR-half degradation, per D-rc12-8's table for that subcommand |
| `program` on `unobserved` or `gh-absent` | `proceed` with the record's PR and state `unverified` — never `skip` |
| `program` on a positively invalid record | falls through to the query, per the owner; `several` lists every candidate |
| `program`'s record choice | the latest URL-BEARING per-architecture record, never merely the latest |
Closure: SOURCED — the four predicates and the fall-through rules are `orbit-archive-modifications`' and `orbit-pr-lifecycle`'s `Program PR (Shape A) semantics`
Moves:
- READ: applied — the external pass: no head-mismatch value, and the URL-bearing record rule contradicted; the fresh pass: the never-suppressed readout and the not-found discriminator
- ENUMERATE: applied — this table
- COHERE: applied — `preflight` answers (no second chance) while `program` falls through; the owners differ by risk, and the table keeps both
- EXECUTE: not applied — no command exists; the stub scripts every outcome (task 1.1)
- FALSIFY: applied — keying not-found on exit status alone would class an auth failure as not-found and keep a dead URL in the emit
- CONFORM: applied — the owners named above; R-crc-14 (point, never restate)
- FEASIBILITY: applied — one `gh pr view`, and one `gh pr list` at most
- CONSUME: applied — preflight's outcome becomes the archive emit's fields (D-rc12-9); the architect readout renders `program`'s
- INVOKE: applied — preflight once per attached archive; program on every architect invocation that observes arc-done

### D-rc12-13 — the engine decides precondition skips; the body writes every note
Domain: the parts of R-crc-5's "degradation notes, when to skip", by who owns each
| member | covered by |
|---|---|
| a skip an owner precondition decides (ref-format, default collision, dirty tree, divergence, collision, no remote, unparseable URL, no `gh`, unresolvable default) | the engine; `reason.code` names the precondition |
| the one-line note the user reads | the body, written from `reason.code` and `reason.detail` |
| a skip no owner rule decides | none exists in the three references today; if one appears, it stays the body's |
Closure: SOURCED — the precondition list is `orbit-propose-modifications`' `Branch preconditions at propose`, `orbit-pr-lifecycle`'s resolution requirement and the archive tail's preconditions
Moves:
- READ: applied — R-crc-5's text and the fresh pass's finding that the change moved its letter without a record
- ENUMERATE: applied — this table
- COHERE: applied — `reason` (D-rc12-8) carries codes, never prose, so the engine writes no note
- EXECUTE: not applied — no skip fired on the live run, which is why note wording stays judgment
- FALSIFY: applied — an engine-written note would be untested prose in an engine string; a code is testable
- CONFORM: applied — narrows R-crc-5's letter, ratified by Sal 2026-10-12 (this entry)
- FEASIBILITY: applied — a closed code set per subcommand
- CONSUME: applied — change 2's bodies render notes from codes
- INVOKE: applied — every `skip` and every `degraded`

## Decisions

- **2026-10-11 — D-rc12-1: dogfood the PR choreography once before designing any engine command**
  Q-rc12-1 resolved, Sal: option (2). R-crc-5's condition ("steps rc05 has shown deterministic by
  executing them") is NOT met — rc05/rc05b executed command GRAMMAR, never the SEQUENCES, and D6's
  outward cases were rescoped to an unrun 6.3. One real change runs under `pr: per-proposal`, and each
  choreography step is recorded as observed (deterministic / judgment / runbook wrong); rc12's
  mechanism is designed from that record. Carrier (Sal: A): Q-crc-26, `orbit status --change <name>
  --report` falling back to an archived change. The carrier deliberately does not touch
  `pr-choreography.ts`, so the runbook under test is not also edited by the change running it.
  Kind: scope
- **2026-10-12 — D-rc12-2: the engine command resolves and prints; every write stays in the body** (Sal: took the recommendation, option A.) `orbit pr` computes every resolution fact and branch state and validates the attachment, reporting JSON plus the exact write commands as data; the body runs them. Option B (engine performs local writes) is a measured fallback only (D-rc12-3). See Mechanism.
  Kind: rule
- **2026-10-12 — D-rc12-3: local writes move into the engine only if resolve-only misses exit (2) when measured** Resolve-only's read-only share is 52–55% of propose's and archive's references — borderline. Measured at change 2's apply; if a reference does not shrink by more than half, `switch -c` and `commit --only` move into the engine (option B); outward writes never do.
  Kind: scope
- **2026-10-12 — D-rc12-4: R-crc-5's execution condition is met by the live run plus engine tests** The dogfood executed the happy path; every unfired branch is covered by engine tests against real temporary repositories. See Mechanism.
  Kind: rule
- **2026-10-12 — D-rc12-5: the dogfood reading** 27 deterministic, 4 judgment, 7 wrong across four seams. No deterministic step produced a wrong answer; the 7 are silences (push spelling, tracking at creation, post-merge, the validation command) and two-rule conflicts (pair preflight vs the dirty-tree rule; the archive test's staging vs the tail's commit scope).
  Kind: fact
- **2026-10-12 — D-rc12-6: the PR-title source bug is fixed now, outside rc12** The title rule reads `proposal.md`'s `#` line, which the schema template never writes. A small standalone repair (fix what we see now), not deferred to change 2.
  Kind: scope
- **2026-10-12 — D-rc12-7: the cleanliness predicate conflicts are out of rc12** The blind-pair preflight vs the PR dirty-tree rule, and the archive suite's staging vs the tail's commit scope, each touch a capability outside rc12's (`orbit-review`, `orbit-archive-modifications`); they are their own small fix, so rc12 stays within R-crc-1.
  Kind: scope
- **2026-10-12 — D-rc12-8: the record separates observations, body-run segments and the user's acts** The blind pair on the first proposal (fresh `2026-10-12T00-40-25Z`, external `2026-10-12T00-40-46Z`) found the three-action flat record could express neither a PR-half degradation nor a step that needs an earlier step's result. Redesigned here (R-crc-6's redesign lane). See Mechanism.
  Kind: rule
- **2026-10-12 — D-rc12-9: the tail takes preflight's outcome and reads the archive emit, never observes again** Preflight's outcome arrives as `--outcome`; `pr_url`, `pr_state` and the commit scope come from the written archive emit (amended at the proposal walk 2026-10-12, Sal: A; see Case 2). See Mechanism.
  Kind: rule
- **2026-10-12 — D-rc12-10: `select` needs no change directory** See Mechanism.
  Kind: rule
- **2026-10-12 — D-rc12-11: the engine's fetch names its destinations and fetches no tags** Narrows D-rc12-2's "one ref-store update" to an exact argv form. See Mechanism.
  Kind: rule
- **2026-10-12 — D-rc12-12: the outcome sets are closed, and `program` never skips** See Mechanism.
  Kind: rule
- **2026-10-12 — D-rc12-13: the engine decides precondition skips; the body writes every note** (Sal: took the recommendation.) A narrowing of R-crc-5's letter: "when to skip" stays judgment only where no owner rule decides it; "degradation notes" stay the body's. See Mechanism.
  Kind: rule
- **2026-10-12 — D-rc12-14: the change is re-proposed from this mechanism** The walk routes the pair's record-shape findings here; the proposal, design, spec delta and tasks are regenerated from D-rc12-8..13, and the local repairs the pair named (the stale count, the commit-isolation case's home, the `ghurl` hook, the sweep's site list) land in the regenerated artifacts.
  Kind: scope

## Open questions

## Considered & out

- **2026-10-12 — option B as the primary design** (engine performs the local writes). Out as primary: resolve-only may already meet exit (2); kept as D-rc12-3's measured fallback.
- **2026-10-12 — option C** (engine performs outward writes too: push, `gh pr create`, `gh pr ready`). Out: makes the engine an outward actor, so exit (3) has to be proven by tests instead of holding by construction; buys size the charter does not need.

## References

- `sketches/dogfood-log.md` — the live run, one row per step, classed.

- `orbit/architecture/clean-up-review-cycle.md` — Stage rc12 charter; R-crc-5; Q-crc-9.
- `orbit/changes/archive/2026-09-11-d6-pr-lifecycle/` — D-d6-7, tasks 6.2d/6.2e/6.3 (outward cases rescoped to the dogfood).
- `src/core/templates/workflows/pr-choreography.ts` — the one source of the three PR references.
- `test/integration/cli-contracts/git-contract.json`, `test/integration/pr-lifecycle/gh-contract.json` — rc05b/rc01 recorded grammar.

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

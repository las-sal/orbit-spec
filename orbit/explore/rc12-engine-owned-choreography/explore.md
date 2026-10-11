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

## Open questions

## Considered & out

## References

- `orbit/architecture/clean-up-review-cycle.md` — Stage rc12 charter; R-crc-5; Q-crc-9.
- `orbit/changes/archive/2026-09-11-d6-pr-lifecycle/` — D-d6-7, tasks 6.2d/6.2e/6.3 (outward cases rescoped to the dogfood).
- `src/core/templates/workflows/pr-choreography.ts` — the one source of the three PR references.
- `test/integration/cli-contracts/git-contract.json`, `test/integration/pr-lifecycle/gh-contract.json` — rc05b/rc01 recorded grammar.

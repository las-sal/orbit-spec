## Why

`/orbit:review` and `/orbit:address-reviews` are the two most-run bodies on this repository's trails (176 fresh and 156
in-context passes, 459 walks), and they are the two largest over the 5,000 estimated tokens Claude Code keeps of an
invoked skill after a compaction: address-reviews 10,921 and review 9,602 by `npm run size:report` at `19f2b6f2`. A long
walk or review that compacts loses its closing steps, the emit, the commit step and the chain end step among them.
`reduce-orbit-phase2`'s stage `cut-review-walk` applies the inventory's cut lists for the two bodies
(`orbit/explore/inventory/sketches/review.md` and `address-reviews.md`) and Sal's removal of batch mode and the blind-pair
disagreement test (R-rop2-12), so both bodies fit (G1), their ceilings come down (G2), and every removal and every other
edit is named (G0).

## What Changes

- **address-reviews' body** keeps each step's basic content and moves its procedure to reference files read at the
  moment the step names (`skill_body_convention.md`): discovery and the `--from-file` ingest (Step 1, every walk);
  several sources and a rediscovered pass (when discovery yields more than one source, or a pass a log already names);
  hybrid detection and ratification recording (into the existing `resolution-detail.md`, when a finding enters the
  decision lane); the sweep record with its CHECK SCOPE / PATH production and ripple-miss attribution (when an entry
  resolves); reading findings against a decision record or an account (when a finding's `pass` is `reading`); the
  REDESIGN route (when a remedy is `redesign`); the report template (Step 5); one log per source and the emit scope forms
  (into the existing `run-summary-emit.md`, before the first emit); the ripple cascade's tables and rules (when a fix
  edits a normative artifact). Constraints drop their two restatements of Step 3's defaults; the prose that stays is
  tightened, no step removed.
- **review's body** likewise moves: the VERIFICATION procedure, its verdicts and the CHECK SCOPE / PATH production (when
  the pass genre is VERIFICATION, or when the emit's refusal says the engine computed it); dispatching a fresh pass and
  re-running a pair's missing fresh half (when the reviewer is `fresh`, alone or as a pair's half); architecture mode's
  target, context and hand-rendered shape (with `--as architecture`); the flag and reviewer-selector tables (into the
  existing `flags-detail.md`, at Step 3). The duplicated "Output format (change modes)" section and the preamble's
  branch-by-branch dispatch detail go; the prose that stays is tightened.
- **The chain end step's tag paragraph** — what the three prompt tags mean and what a chained command records — leaves
  the basic content of the five chaining bodies (propose, ff, apply, review, address-reviews) for
  `references/chain-end-step.md`, which already carries it; each body keeps a one-line pointer (R-rop2-14, amending
  phase 1's R-rop-6). Propose, ff and apply shrink by the same paragraph.
- **REMOVED (G0, R-rop2-12): address-reviews' batch mode** — the `--batch` flag, the verbal invocation phrase and the
  command-shaped mid-walk switch, their records `walk_mode_source` and `walk_mode_shifted_at_finding` (dropped from the
  emit surface's payload table), and every batch clause in the body, its references, onboard's command table and
  `docs/commands.md`. Every walk runs finding by finding; new logs record `walk_mode: "per_finding"`, and logs written
  before keep their `"batch"` values and fields, which readers still read. A mid-walk delegation ("handle the rest") is
  not batch mode and stays.
- **REMOVED (G0, R-rop2-12): the blind-pair disagreement test** — the rule that settled two halves' contradictory claims
  by one test at triage, and its `disagreement` record. A contradiction between a pair's halves is walked like any two
  findings; logs that carry `disagreement` keep it.
- **The ledgers.** A cut ledger records each edited body's hash before the first edit and names every edit as a pair the
  test undoes, so an unnamed edit fails (G0); phase 1's tighten-bodies ledger undoes it first. The bodies' character
  ceilings come down to their new sizes plus 5% (G2).

Not in this change: the epitome's decision-writing bullet, which the inventory shortens in every body (D-inv-2), since
neither of this stage's cut lists needs it; it lands with the first cut stage whose body does. No cut is postulated to
change significantly what a session does, so none is replayed (R-rop2-10); the baseline stays available to run.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `orbit-address-reviews`: batch mode and the disagreement test are removed (the walk-mode requirement renamed and
  rewritten, the disagreement requirement removed, the batch clauses dropped from the lifecycle, the decision lane, the
  log shape, the sweep record and the one-log-per-source rule); the DISCOVERY fence is carried by the skill's
  `references/discovery.md` rather than its body.
- `orbit-review`: the fresh-dispatch brief and the VERIFICATION branch, with its verdicts mirror, are carried by the
  skill's references; the brief-region rule names the dispatch reference.
- `orbit-emit-composition`: the Verdicts and the CHECK SCOPE / PATH fences are carried as checked mirrors by the review
  and walk skills' references rather than their bodies.
- `orbit-decision-records`: the replacement rule's pointer follows the renamed walk-mode requirement.
- `orbit-conventions`: the chain end step's basic content carries a pointer to the tag paragraph instead of the
  paragraph (No-chaining contract); a cut ledger names every body edit a cut stage makes, and the tighten-bodies ledger
  undoes it first.

## Impact

- `src/core/templates/workflows/address-reviews.ts`, `review.ts` (bodies, references and the address-reviews launcher's argument hint), `onboard.ts` (the command
  table's `[--batch]`), `src/core/disciplines.ts` (`CHAIN_END_STEP_BASIC`), `src/core/emit-composition.ts` (two
  address-reviews payload fields).
- `docs/commands.md` (the `--batch` row).
- Tests that read the moved text follow it to its reference: `orbit-content-fidelity`, `walk-routing`,
  `discovery-parity`, `sweep-path-parity`, `verification-verdict-parity`, `review-verification-branch`,
  `review-genre-brief`, `blind-pair-command`, `chain-prompt-tags`, `conditional-steps-results`, `moved-blocks` (the
  address-reviews emit block's recorded hash moves with the batch removal), `emit-schema-parity` and `reference-roundtrip`
  (the executed payload examples); the per-skill reference lists in `orbit-generated-surface` and `config-profile`;
  `skill-templates-parity`' hashes; `skill-body-budget`' ceilings; `tightened-bodies` (undoes the cut ledger first).
- A new test file holds the cut ledger.
- No engine behaviour changes beyond the emit surface refusing the two retired batch fields on a new payload.

## Size

- capabilities: One stage, one change (the program's stage rule; conditional-steps declared on the same ground): splitting would separate the moves from the ledger and budget test that hold them, and the shared steps were decided once for both bodies. Declared by Sal at propose, 2026-11-24.
- requirements: The same reason: most of the sixteen re-point where a fence or step lives (body to reference), and the rest carry the removals R-rop2-12 rules. Declared by Sal at propose, 2026-11-24.

## Why

rc12's first change shipped `orbit pr`, which observes with read-only `git`/`gh` and prints every
PR write. No body calls it yet: propose, ff, archive and architect still carry D6's hand-run runbook,
and three generated references (18,458, 12,900 and 4,613 bytes) teach an AI to re-derive steps the
engine already computes. This is the stage's second change (Stage `rc12-engine-owned-choreography`,
exit (2): the three PR references shrink by more than half). Change 1's own archive also found that
`orbit pr preflight` reports a false citation divergence on every cited per-proposal change, and that
defect must be fixed before a body renders the note (see explore.md).

## What Changes

- The propose/ff, archive and architect bodies call `orbit pr select`, `publish`, `preflight`,
  `tail` and `program` at their seams and act on the printed record's fields alone. The hand-run
  runbook is deleted from the three references, not kept as a fallback (D-rba-4).
- `orbit pr preflight`'s citation divergence compares what the CURRENT `pr:` regime and citation
  would select, through the targeting predicate `orbit pr publish` already uses, against the frozen
  attachment. A per-proposal change cited since creation no longer reads as diverged (D-rba-1).
- The per-change PR title becomes `<change-name>: <a one-line summary written from proposal.md's
  Why>`. The old rule named a `#` title line the proposal template never writes (D-rba-2; D-rc12-6's
  fix, which never landed).
- The archive's closing summary shows `orbit pr tail`'s `human_acts` verbatim, labelled as the
  user's: the merge and the return to the default branch after it (`git fetch`, `git switch`,
  `git merge --ff-only`). That closes dogfood seam 3's silence. The engine has printed these since
  change 1; only the body was silent (D-rba-3, D-rba-7).
- Exit (2) is measured at apply against the baseline above. Only a reference that misses triggers
  D-rc12-3's fallback, where the engine performs `switch -c` and `commit --only`; outward writes
  never move into the engine (D-rba-6).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `orbit-pr-lifecycle`: preflight's citation divergence is defined (would-select vs frozen) and
  runs before the archive's move; the freeze requirement's citation note points at it; the
  per-change title rule names an input that exists; the choreography requirement states how a body
  consumes an `orbit pr` record (which carries D-rba-3's post-merge line through `human_acts`).
- `orbit-cli-grammar` (entered at apply): deleting the runbook left three declared inventory
  exemptions (`command`, `argument`, `unknown`) with no line using them, which the inventory's
  exactness rule fails, and one sweep scenario named the architect's `gh pr view` snippet, which
  the rewrite deletes; the exemptions are retired and the scenario places its line instead.

## Impact

- `src/core/pr/select.ts`, `src/core/pr/publish.ts`, `src/core/pr/preflight.ts`: the targeting
  predicate is extracted and shared, so the three cannot disagree.
- `src/core/templates/workflows/pr-choreography.ts`: the one source of the three references,
  rewritten around `orbit pr` calls.
- `src/core/templates/workflows/{propose,ff-change,archive-change,architect}.ts`: the PR sections
  that summarise the reference.
- Tests: preflight divergence cases; the reference-content, parity and generated-surface pins the
  rewrite moves; the recorded-contract and tool-inventory sweeps over the new snippets.
- No change to the `orbit pr` record's top-level fields, the `pr_attachment` shape, or any consent
  property (preflight's `observations.citation` gains `would_select`):
  propose and ff stay draft-only, merge stays the user's, and every write still runs under the
  user's own invocation.

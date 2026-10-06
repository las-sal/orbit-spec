## Why

A blind pair is the recommended first review on both reviewed gates (R-crc-4 as amended; `spec-driven` v5), and no
command runs one. Every pair since rc17a has been driven by hand: write the `pair: true` launch, commit it, start the
external half, dispatch a fresh subagent, keep the two returns apart, commit each alone in token order, push. rc17d made
the external half a recorded launch, so the remaining hand steps are the orchestration around it — and two of them
decide whether the pair is blind at all. A launched return is saved into the trail as soon as it arrives, where a
still-running fresh subagent in the live checkout could read it. And a re-run of a missing external half launches at its
own handoff commit, which already holds the committed fresh partner, while the gate still counts the completed pair as
blind (its blindness check is walk order only).

This is stage `rc17b-blind-pair-command` of `clean-up-review-cycle`, narrowed at its exploration when the runner half
split out as `rc17d-external-runner` (D-rc17b-1), on which it depends. Its exploration (`explore.md`, D-rc17b-2..8) re-read
rc17a's assigned rules (D-bpc-3, -4, -13) against what rc17a and rc17d shipped; that re-read is the design input.

## What Changes

- **`--reviewer blind-pair` runs both halves in one invocation** (`--as proposal|system` only). One step order: a dirty
  tree refuses and writes nothing; the external-handoff packaging writes its T0 with `pair: true` (the launch); the
  prompt and the T0 are committed as BASE and pushed, on BOTH routes; the external half launches through rc17d's path
  when a runner is reachable and is printed for paste otherwise; a fresh subagent runs beside it; the fresh pass file is
  committed ALONE first, and only then is the external return saved and committed alone; one push; both reports
  rendered; the walk left to the user. With no runner, the invocation ends with the pair open
  (`openPair: {missing: "external"}`), never a half covering alone.
- **Every external half of a pair reads the pair's reviewed state.** A re-run of a missing external half launches its
  worktree at the commit that added the pair's launch, not at its own handoff commit; a pasted half's prompt names the
  pair's reviewed commit in its `## Repo` line. A fresh re-run rides the existing review-genre brief rule. What cannot
  be made physical is stated as a BOUNDED named limit.
- **Reviewer shorthands.** `--in-context`, `--external` and `--blind-pair` join `--fresh`, each exactly
  `--reviewer <class>`; at most one reviewer selector per invocation, a clean usage error otherwise.
- **The default preference presents the pair.** With nothing covering an `invoked` slot and the preference
  `blind-pair` (the default), the engine presents `/orbit:review --as <mode> --reviewer blind-pair <change>`, retiring
  rc17a's interim fresh-review row.
- **Two stale sentences corrected** (handed from rc17d): `orbit-review` no longer describes the external class as
  packaging-only or as a handoff a human carries.
- **Onboard points instead of enumerating.** Its reviewer-axis list is replaced by a pointer to `orbit-review`.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `orbit-review`: the reviewer axis gains `blind-pair` and the three shorthands; the external-dispatch scenario stops
  saying no pass runs; the `--fresh` requirement's class sentence points instead of describing a hand relay; ADDED —
  the one-command pair's step order.
- `orbit-review-external`: the launch requirement's worktree base gains the re-run case; the commit requirement gains
  the pair's deferred save; ADDED — a pair's external half reads the pair's reviewed state, with its named limit.
- `orbit-engine-gates`: `The first review slot covers what the user invoked` — the default preference's presentation
  row and the requirement's closure note.
- `orbit-onboard`: `Identity statement section` — the reviewer axis by pointer.

## Impact

- `src/core/artifact-graph/gates.ts` — the presented class widens to `blind-pair`; its command string.
- `src/core/templates/workflows/review.ts` — the trunk's reviewer axis and shorthands; a new `references/blind-pair.md`
  carrying the step order; the external-handoff reference's re-run base, deferred save and pasted `## Repo` line.
- `src/core/templates/workflows/onboard.ts` — three sentences by pointer.
- Tests: the presentation scenarios and every golden that prints the default presented command; template fidelity for
  the trunk, the new reference and the handoff edits; a disposable-repo run of the pair's git steps.
- **Size.** FOUR capabilities, one over R-crc-1's ceiling, DECLARED at exploration (D-rc17b-8; Sal: "a, ok to go over
  if you think it makes sense"): the fourth is one pointer sentence. Eight requirements (two ADDED, six MODIFIED).
- No migration. Archived trails and pair records are read unchanged; adopters without a runner get a pair that ends
  open after its fresh half, by design.

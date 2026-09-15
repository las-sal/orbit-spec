# Proposal: rc03a-blind-prompt

## Why

A `blind-pair`'s two members are required to be blind to each other. The gate's blindness
predicate observes WALK RECORDS between their two tokens — it cannot see what either member was
told to read. And the engine's canonical command for an empty pair names the FRESH half first, so
the ordinary path is: fresh lands, then the external prompt is composed from a trail that now holds
its partner's findings. The pair is anchored and the gate certifies it blind.

rc02's pair escaped by ordering luck: its external prompt was written 24 minutes before the fresh
pass existed. The only measurement this program has produced survives because the operator did not
do what the tool said.

Two proposal-review iterations established what the fix is NOT. Suppressing the leak site by site
does not work: there are ELEVEN channels by which a member can reach its partner's findings — three
cycle-context bullets, an iteration count that reads the trail directory, a project-context
pointer, a write-path instruction to avoid colliding with files already there, two system-mode diff
instructions, a prior-run read, the disciplines epitome's own comparison, and a launching brief with
no artifact behind it at all. Every one is the same instruction wearing different clothes: READ THE
CHANGE'S OWN HISTORY. A deny-list over that is a chore that rots on the next body edit, and the
eleventh cannot be denied in prose because there is no prose to edit.

## What Changes

- **The canonical command for an EMPTY blind pair names the external half, not the fresh one.**
  This is the whole mechanism. Ordering does not suppress the channels — it EMPTIES them: a prompt
  composed while the trail holds no pair member has nothing of its partner to carry, because the
  partner's findings do not yet exist. Six sites close at once, with no prose change. The converse
  order has no equivalent exposure: the fresh half reads prior passes by the `review-<mode>-*.json`
  glob, which an external findings file cannot match.
- **The system-mode commit range a blind-pair member reads excludes the change's `.orbit-runs/`.**
  The one residual ordering leaves: those files are committed, and the handoff preflight requires a
  clean, pushed tree, so by the time the fresh half runs its partner's findings file is inside the
  diff by construction.
- **A dispatched blind-pair member's brief names no prior finding, count, severity or trend.** The
  one channel with no artifact. Under external-first the orchestrator holds the external half's
  findings when it dispatches the fresh half, so it is the orchestrator's own context that must be
  withheld — ordering cannot empty this one.

The property delivered is R-crc-4's — blind TO EACH OTHER. Not blindness to all prior history:
findings from earlier, already-walked iterations are legitimate shared context. The stronger
property is what generated the eleven-channel problem, and it is deliberately not pursued here.

## Capabilities

**New Capabilities**: none.

**Modified Capabilities**:
- `orbit-engine-gates` — `Single-voiced canonical-next computation` states the empty-pair ordering
  and why it is a correctness property.
- `orbit-review` — an ADDED requirement covering the two residual channels ordering does not empty.

`orbit-review-external` is NOT touched. Its `Cycle context populated from prior runs` requirement
is correct as written; the earlier shape of this change proposed modifying it and that shape was
abandoned.

## Impact

- `src/core/artifact-graph/gates.ts` — the empty-pair branch's rendered command.
- `src/core/templates/workflows/review.ts` — the system-mode read instruction (diff exclusion) and
  the dispatch-brief constraint.
- No schema-version bump. No migration: the ordering change alters a recommendation, and every
  older trail simply receives the new one.
- Unblocks rc03-review-genres, which `Depends-on` this stage.

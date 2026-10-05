## Why

A walk fixes a finding and misses the other places the same claim lives, and the next pass pays to find
the leftover. Since rc13a nearly every stage's confirm pass or system review has found at least one
leftover of this kind ("'seventeen' survives at three places", "still says 'pristine upstream body'",
"walk 2 made verify run validate, falsifying three premises"). The walk log cannot show why: across 205
logs and 1404 resolutions, `ripple_cascade` records the files a walk EDITED and nothing about how it found
them. A site never examined and a site examined and judged unaffected leave the same record (see
explore.md, Premise and D-rc08-5). This is stage `rc08a-sweep-evidence` of
`orbit/architecture/clean-up-review-cycle.md`, split from rc08 under R-crc-9 (D-rc08-1).

## What Changes

- Every `resolved` walk entry carries a **`sweep` record**: `retired` (strings the fix removed),
  `introduced` (`{path, text}` the fix added), `searched` (what the walker looked for), `scope` (paths it
  looked in beyond the entry's file and cascade) and `kept` (`{path, why}`: files that must keep a
  retired string: history quoting it, or a test asserting its absence). Any array may be empty; an empty array is the written way
  to say there is nothing of that kind (D-rc08-2).
- **`orbit emit address-reviews` checks the two observable halves.** A retired string still present in
  the check scope, or an introduced text absent from its path, refuses the log, naming the string, the
  path and the line. Matching is literal and case-sensitive after whitespace runs collapse to one space,
  so a phrase wrapped across lines still matches. `searched` and the judgement behind it are a record,
  never checked (D-rc08-3). Job (3) of rc08's charter, an edit set that half-applied, is caught by the same
  check: an edit that did not land leaves its retired string present or its introduced text absent.
- **A ripple miss is attributed where it is found.** A walk resolution may carry `ripple_miss_of: {walk,
  title, file, kind}`, `kind` one of `query` | `scope` | `judgement`. The gate checks that the pointer
  names a `resolved` entry of an earlier walk on the same trail, and the engine computes `ripple_misses`
  on the walk emit. VERIFICATION passes keep their existing `regressed` verdicts and `walk_entry` links
  (D-rc08-4).
- The VERIFICATION pass's **sweep scope** widens from `file` ∪ `ripple_cascade.applied` to include
  `sweep.scope`, so the confirm grades where the walk says it looked. The residual check, which names edits no walk entry lists, still keys only on what the walk edited.
- Prior-generation walk logs are untouched: the check runs at write time only, and their absence of
  `sweep` is never re-graded.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `orbit-address-reviews`: ADDED requirements for the walk recording its sweep evidence and attributing
  ripple misses (the field shapes are stated there, once); MODIFIED the lifecycle and resolution-log
  shape requirements by one pointer line each.
- `orbit-emit-composition`: ADDED requirements for the walk write gate's evidence check (including the
  refusal of a legacy `status`-only entry), the `ripple_miss_of` pointer check, and the computed
  `ripple_misses`.
- `orbit-review`: MODIFIED `Verification-genre passes grade the walk record`, where an entry's sweep scope
  gains `sweep.scope`.

Three capabilities, at R-crc-1's ceiling, as the stage charter declared.

## Impact

- `src/core/emit-composition.ts`: the `address-reviews` write gate gains resolution-level checks, the
  first the walk emit has had, and the `ripple_misses` computed extension.
- `src/core/templates/workflows/address-reviews.ts`: a new walk step that records the sweep; triage
  attributes ripple misses; the run-summary schema reference documents `sweep` and `ripple_miss_of`
  with `json example` blocks the rc07b round trip executes.
- `src/core/templates/workflows/review.ts`: the VERIFICATION branch's sweep-scope sentence.
- `src/core/artifact-graph/trail.ts`: `stripLineSuffix` exported for reuse.
- Tests: a write-gate suite, the schema-parity and round-trip suites, the template hash pins, and the
  module pins in `test/core/rc03b-untouched-modules.test.ts`.
- No migration. No new capability. Archived walk logs are never re-validated.

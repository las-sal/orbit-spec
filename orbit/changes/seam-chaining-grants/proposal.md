## Why

Stage seam-chaining's first change (archived `2026-11-10-seam-chaining`) let a chain run the review-and-walk loop
unasked, but stopped at apply and archive: no `chain` key grants either, and a consent-scoped command reached any
way but by the user's typing always fires its consent prompt. A program can therefore never cross the two seams
where most of the loop's waiting happens, even for a user who has said in their config that it may (R-adf-1,
R-adf-6). This change carries what the first one split off by grant (D-sc-19): the `apply` and `archive` keys, and
a third consent value, `setting`, that records a granted arrival honestly instead of claiming the user typed it or
was asked (see explore.md, Premise and D-sga-2).

## What Changes

- **Two new `chain` keys, `apply` and `archive`.** Each grants its command and every write its designed flow makes.
  The `archive` row names the archive tail's outward writes (the push to the attachment's branch, the description
  rewrite or the program PR's stage entry, and a per-change PR's ready flip), so the grant is exact; the merge and
  the return to the default branch are never granted (D-sga-4, D-sc-17).
- **A granted arrival records `consent: "setting"` and fires no consent prompt.** An arrival at apply or archive
  the user did not type records `setting` exactly when the change status's `chain` object names that command with
  `may_run: true`; otherwise the consent prompt fires as today. A typed arrival stays `user-invoked` (D-sga-5).
- **The consent value is one of three, and the write gate checks it.** `orbit emit apply` and `orbit emit archive`
  refuse `setting` when the project's `chain` map does not grant the emit's command, naming the key, and refuse any
  value outside `user-invoked`, `prompted` and `setting`. The two self-reported values stay self-reported; the field's
  absence stays audit-drift's tripwire, unchanged (D-sga-6).
- **The apply and archive bodies treat each prompt by its kind.** Their prompts join the list of
  `A chain treats each prompt by its kind` and carry a `(chain: …)` tag at their site; the tag test extends to the
  two bodies. The sync assessment takes its marked default; incomplete artifacts or tasks, unresolved `@review:`
  markers, and every anomaly prompt stop the chain (D-sc-12's apply and archive rows).
- **A chained apply or archive records its grant in its `consent` value**, not in a `Chained:` sentence: the key and
  the command are one-to-one (D-sga-6).
- **The docs say what the two keys grant**: `docs/customization.md`'s `chain` row and the `consent` explanations in
  `docs/workflow-engine.md`.

Out of scope: committing before a chained external review (the third change, D-sga-1), and merging or returning to
the default branch (the driver's, D-sc-17).

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `orbit-lifecycle-consent`: the provenance rule and the consent prompt gain the granted arrival; the recorded value
  becomes one of three, `setting` checked by the write gate (`Invocation-provenance rule`,
  `Consent prompts at consent-marked seams`, `Consent recorded in consent-scoped lifecycle emits`).
- `orbit-engine-gates`: the key table gains the `apply` and `archive` rows, and the sentence saying no key grants
  them is replaced (`The chain setting grants each command on its own key`).
- `orbit-archive-modifications`: the archive summary's consent scenario, its schema reference's field list, and the
  consent prompt's granted arrival (`Archive run summary written`, `Archive summary schema reference ships with the
  skill`, `Consent prompt on AI-mediated archive entry`).
- `orbit-run-summary-emit`: the apply emit's consent field takes the third value (`Consent field on the apply emit`).
- `orbit-conventions`: the prompt list gains apply's and archive's prompts, the tag test reaches their bodies, and a
  chained apply or archive records its grant in its consent value (`A chain treats each prompt by its kind`,
  `Each chained prompt states its kind`, `No-chaining contract`).
- `orbit-pr-lifecycle`: the single-session assumption no longer says every lifecycle command is user-invoked
  (`Single-session operating assumption and v1 limits`).

## Impact

- `src/core/project-config.ts` (`CHAIN_KEYS`) and `src/core/chain.ts` (`CHAIN_KEY_TABLE`, `chainKeyFor`): the two
  keys. `CHAIN_END_STEP` in `src/core/disciplines.ts` interpolates the table, so the five bodies carrying it gain the
  two rows by regeneration.
- `src/core/emit-composition.ts`: the consent check at the write gate for apply and archive.
- `src/core/templates/workflows/apply-change.ts` and `archive-change.ts`: Step 0's granted arrival, the `consent`
  payload notes, the archive summary schema reference, and the prompt tags.
- Tests: `test/core/templates/chain-prompt-tags.test.ts` (the inventory and the scanned bodies), the chain object's
  and the config resolver's tests, and new write-gate cases.
- Docs: `docs/customization.md`, `docs/workflow-engine.md`.
- No new dependency, no new payload field, no change to the human readout or to any gate.

## Size

- capabilities: the consent value and the grants that write it are one feature (D-sga-1); four of the six capabilities carry only a restated consent value or sentence (Declare, chosen at propose 2026-11-10).

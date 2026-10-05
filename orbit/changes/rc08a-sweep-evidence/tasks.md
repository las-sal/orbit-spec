## 1. The write gate (`orbit-emit-composition`)

- [ ] 1.1 Red first: a new `test/core/emit-walk-sweep.test.ts` drives `composeAndWriteEmit('address-reviews', …)` in a disposable project with a change directory, covering every scenario of `The walk write gate checks sweep evidence` and `A ripple-miss pointer resolves and is counted`: a missing `sweep` on a resolved entry; a `status`-only entry with no `outcome`; a `sweep` on a stale entry; a malformed key or element; a surviving retired string wrapped across two lines (refused with path and first line); the same string only in a `kept` path (writes); an absent introduced text; an unresolved `sweep.scope` path (refused); a free-text `ripple_cascade.applied` path (writes, stderr warning); a change-relative `file` and an `orbit/changes/<name>/` ripple path both resolving; a containment escape (`../`) refused; the pointer resolving, missing, naming a non-resolved entry, sitting on a stale entry, and carrying an unknown `kind`; an archived-fallback walk checked as change-scoped; `ripple_misses` computed at 0 and 1 and refused when supplied. Confirm they fail.
- [ ] 1.2 Implement in `src/core/emit-composition.ts` (design D2–D6): one path resolver (strip `:<line>…` through `stripLineSuffix`, exported from `src/core/artifact-graph/trail.ts` (design D6), the `orbit/changes/<name>/` mapping, project root, then change directory, containment-checked); the shape check; the retired / introduced / scope checks over the computed check scope with whitespace-run collapsing; the legacy-`status` refusal (design D6a); the pointer check against the trail's earlier walk logs; `ripple_misses` as a computed extension. 1.1 goes green.
- [ ] 1.3 Move the `src/core/emit-composition.ts` and `src/core/artifact-graph/trail.ts` hashes in `test/core/rc03b-untouched-modules.test.ts`, each with a dated comment naming this change, as recorded acts.

## 2. The walk body (`orbit-address-reviews`)

- [ ] 2.1 Red first, in the address-reviews template tests: the generated `orbit-address-reviews` skill carries Step 3d.5 "Record the sweep" composing the five keys, each with its one-line meaning and the pointer to `A resolved walk entry records its sweep evidence`; Step 2 carries the attribution read with the three `kind` values; the run-summary schema reference documents `sweep` and `ripple_miss_of` in its schema block and its field notes, and names `ripple_misses` as engine-computed. Confirm they fail.
- [ ] 2.2 Edit `src/core/templates/workflows/address-reviews.ts` (design D7): Step 2's attribution read; Step 3d.5 after the cascade and before marker removal; the schema reference's resolution entry, its field notes (pointing at the two owners, restating no rule), and `sweep` in every `json example` with `introduced: []` and `scope: []`. 2.1 goes green, and `test/core/emit-schema-parity.test.ts` and `test/core/reference-roundtrip.test.ts` stay green with the new keys added to their nested-key sets where they require it.
- [ ] 2.3 Move the address-reviews hashes in `test/core/templates/skill-templates-parity.test.ts` (template and generated skill), each with a dated comment naming this change, as a recorded act.

## 3. The verification sweep scope (`orbit-review`)

- [ ] 3.1 Red first: the generated `orbit-review` skill's VERIFICATION branch names an entry's sweep scope as `file`, `ripple_cascade.applied` and, when present, `sweep.scope`, and keys the residual check on the edit record (`file` plus `ripple_cascade.applied`) only (design D6b), and the review body's checked mirror of the verdict fence is unchanged. Confirm it fails.
- [ ] 3.2 Edit the sweep-scope sentence(s) in `src/core/templates/workflows/review.ts`; 3.1 goes green. Move the review hashes in the parity pin as a recorded act.

## 4. Declare this change's scenarios (design D8)

- [ ] 4.1 Tag every ADDED scenario in the `orbit-emit-composition` and `orbit-address-reviews` deltas at the test that exercises it (`behaviour` for the gate's, `text` for the body's), and the new `orbit-review` scenario at 3.1's test.
- [ ] 4.2 For the MODIFIED blocks' carried scenarios (`orbit-review`'s verification requirement; `orbit-address-reviews`' lifecycle and resolution-log shape requirements), tag an existing test that exercises each, or add an `orbit/scenario-ledger.yaml` entry (`untestable` with a `why`, or `observed` with a `record`).
- [ ] 4.3 Run `orbit status --change rc08a-sweep-evidence --scenarios` and confirm zero UNCOVERED, ORPHAN and MALFORMED; run `orbit validate rc08a-sweep-evidence --strict` and confirm no `scenario-map` issue at any level.

## 5. Close-out

- [ ] 5.1 `npm run build && node bin/orbit.js update --force`, then sweep the generated `.claude/skills/orbit-address-reviews/` and `.claude/skills/orbit-review/` for `sweep` (the step, the reference, the scope sentence) and confirm the old two-part sweep-scope wording ("its `file` plus every path in its `ripple_cascade.applied`", as `src/core/templates/workflows/review.ts` carries it today) survives nowhere in `src/` or the generated skills.
- [ ] 5.2 Run the FULL `npm test` and confirm the `Test Files` line reports no failures.
- [ ] 5.3 (User-validation) The first walk after apply, on this change's own review findings, writes `sweep` on every resolved entry and passes the gate; a refusal on that walk is fixed in the files, never by trimming `retired`.

At-archive note (not a task): rc08's exit (3) is measured on the cadence of the stage after rc08a, from `ripple_misses` plus the `regressed` verdict count, and recorded in that stage's archive, not this one's.

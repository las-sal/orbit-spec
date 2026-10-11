## Context

rc06a shipped the scenario map: `orbit status --change <name> --scenarios [--json]`, computed at read time, stored nowhere, opt-in by `scenario_map:` in `orbit/config.yaml`. Its owner, `orbit-scenario-map`, names three consumers: `orbit validate <change>` (shipped with it), verify-change's Scenario Coverage step, and system review Pass 0 through verify. This change builds the last two. Facts measured at exploration (see explore.md, Premise):

- No workflow body names `--scenarios` today.
- Verify's test-tracing line sits in its upstream portion, step 6, which is still identical to `upstream/v1.3.1` after the rename.
- Two specs forbid editing that portion: `orbit-conventions`' `Generated-file disposition` ("left intact") and `orbit-run-summary-emit`'s `Emit-layer wraps upstream skills without modifying them`. The rule is already false in fact: apply-change and archive-change carry semantic edits in their upstream portions (diffed against `upstream/v1.3.1` with the rename normalized), and the propose and bulk-archive additions override upstream steps.
- System mode has no validate step of its own, so after apply, Pass 0 (through verify) is the only agent-flow reader of an undeclared scenario. Since system walk 2, verify's fail-mode classification runs `orbit validate <name>`, so one verify run after apply surfaces an undeclared delta scenario twice: the map's WARNING row, and a mode-③ `fail_mode` whose recommendation carries validate's ERROR message. That is the classification working, not a block.
- The external prompt's item 0 ("the external AI runs its own equivalent of upstream verify-change") lives in `references/mode-sections.md`, and no spec owns its text.

## Goals / Non-Goals

**Goals:**
- Verify reads the map instead of tracing by prose, by one closed table (exit (1)).
- Every Pass 0 reader, internal and external, consumes the map rather than rebuilding it (exit (2)).
- The rider: the two unkeyable shapes are presented truthfully, and the engine behaviour is pinned by a test.
- The pristine-upstream rule is stated once, true going forward, with its past exceptions named.

**Non-Goals:**
- Stopping an archive on an undeclared scenario: rc10's (D-rc06b-8).
- Changing the map's surface, grammar or levels (`orbit-scenario-map` is untouched).
- Backfilling declarations for baseline scenarios (D-rc06-7 stands).
- Naming deltas for the upstream-portion edits made before this rule. They become a named limit, not a migration.

## Decisions

**D1 — Edit verify's step 6 in place; narrow the rule and state it once** (explore D-rc06b-1, corrected at propose). The test-tracing bullet in step 6 is replaced by the surface read; "Check if conditions are handled in code" stays. `Generated-file disposition` (the owner) gains the narrowed rule: an upstream portion changes only through a change whose delta names the edit, edited in place with no additions-section override of a step so edited. The wrapper requirement and `Verify fail-mode recommendations` narrow their sentences to the EMIT LAYER and point at the owner. Why in place: an AI handed an upstream instruction and a later override for the same step can follow either, and exit (1) asks for no prose-tracing instruction at all. The cost is that a future verify cherry-pick re-applies one named edit, a deliberate act under this repo's upstream policy anyway.

**D2 — The reader table** (D-rc06b-2). The verify body carries the eleven-row table from `Verify's Scenario Coverage step reads the scenario map` as a CHECKED MIRROR, held byte-equal by a parity test (R-crc-14's mirror corollary; an installed skill cannot open the spec), rather than in its own words, so the response column cannot drift from its owner unseen. The calls it makes:
- With the check OFF, verify prints one note naming the config key as absent or malformed, and NO other row applies. The surface still scans the default globs when OFF and returns orphans and malformed entries, but an adopter who never opted in gets no findings from a check they did not turn on. Verify does not fall back to prose, because "not configured" is the truth and the prose check is the thing being retired.
- UNCOVERED, ORPHAN and MALFORMED are WARNINGs. Pass 0 grades verify's findings as their author under its existing rule; the severity ladder gives an uncovered scenario WARNING (the rule names it) and gives orphan and malformed findings the same WARNING by consequence, so `orbit-review` needs no delta.
- They are warnings for the verify emit's fail-mode classification, which `orbit-run-summary-emit`'s `Verify fail-mode recommendations` owns, precedence included (the emit consumes `fail_mode` and `warnings_count` to compose `next_recommended` and persists neither). `scenarios-fail` stays reserved for failing scenarios.
- A declared scenario of any kind raises nothing. The kinds are listed, never summed and never re-graded (R-crc-10, R-crc-11(h)).
- Unkeyable entries are grouped by joined triple: the surface returns one entry per OCCURRENCE of a repeated title, so the reader makes one finding per distinct triple, naming the number of entries, with matching orphans listed under it.
- An orphan's recommendation stays true from the map alone. The surface resolves orphans against the baseline plus THIS change's delta only, and an orphan entry carries source, location and key, nothing that tells a renamed, removed or mistyped key from another active change's scenario. So the finding names the possible causes without choosing one, and recommends correcting the tag unless it names another active change's scenario. A read of the other active changes would decide it, but that is new mechanism a walk does not author (R-crc-6).
- The step's implementation check keeps its own finding, retitled `Scenario not handled in code`, so the upstream sub-bullets no longer collide with the map's `Scenario not covered`.

**D3 — `orbit-review` carries no delta** (D-rc06b-3). Pass 0 already invokes `/orbit:verify` and already grades an uncovered scenario as WARNING. Exit (2) is met through that invocation and measured by a body test asserting it plus the absence of any review-body test-tracing text. Pass 0 composes no block: it folds verify's findings and fail mode, and a block would be a reader re-stating `orbit-scenario-map`'s level. Since system walk 2 verify runs validate for its classification, so the level reaches the verify emit's `fail_mode`; it still never reaches Pass 0's `blocks`.

**D4 — The rider, in the reader** (D-rc06b-4, D-rc06b-5). `splitKey` returns `null` for a key whose title contains ` :: `, so that tag is MALFORMED. A repeated title keys normally and, being outside the resolvable set, renders ORPHAN with a key equal to the unkeyable entry's joined triple. The reader pairs only on that exact string equality. A behaviour test in `test/core/scenario-map.test.ts` pins both shapes, tagged to `orbit-scenario-map`'s existing scenarios `A tag naming no scenario is an orphan` and `A near-miss tag is malformed, never ignored`. Baseline scenarios outside this change's delta may carry tags; they are reported, never failing.

**D5 — External item 0 names the surface** (D-rc06b-6). One line in `REVIEW_EXTERNAL_MODE_SECTIONS_REFERENCE`. The rule's owner is the new capability, because `orbit-review-external`'s template leaves the pass list a placeholder. The brief rule allows it: the surface reads specs, the ledger and tests, and the one trail path it can return, an `observed` declaration's `record`, is an instance of the brief rule's existing named residual (prior-pass content arriving through what a brief legitimately names).

**D6 — How this change's own scenarios are declared.**
- Body scenarios get `text` tags on tests asserting the generated skill or reference carries the instruction, in a new `test/core/templates/verify-scenario-map.test.ts`.
- The MODIFIED blocks' unchanged scenarios are tagged at an existing test that exercises them where one exists.
- Otherwise they get a ledger entry: `untestable` with a why for process rules (e.g. `Per-skill disposition is documented`), or `observed` citing a record.
- The new conventions scenario gets a `text` test asserting verify's additions section carries no Scenario Coverage override.

## Alternatives considered

From explore.md, Considered & out:
- **B, an additions-section override of step 6.** Rejected: two contradictory instructions for one step.
- **C, Pass 0 reads the surface itself.** Rejected: it fails exit (1), and standalone verify keeps prose.
- **A prose fallback when the check is OFF.** Rejected: it reports a guess.
- **Pass 0 composes post-apply UNCOVERED into `blocks`.** Rejected: a reader re-stating a level it did not read.
- **Pairing inside the surface.** Rejected: interpretation in the reporting layer, a fourth capability, and the separator shape has no key.

## Risks / Trade-offs

- [Adopters lose verify's prose scenario heuristic] → It matched 1 of 34 on the record. The "not checked" note names the key that turns on a check that works.
- [Pre-rule upstream edits name no delta, and pre-rule additions-section overrides exist] → The narrowed clause governs steps edited under the rule only; both kinds are named as limits in `Generated-file disposition` itself, with the bodies and the method that found them.
- [An undeclared scenario after apply stops nothing in the agent flow] → Out of scope (D-rc06b-8). The archive's readiness record names it as a residual, and it is proposed to rc10-apply-closure as a rider at archive.
- [The reader table is AI-followed prose] → A body test asserts every row's condition is named. Whether an AI follows it is observed at the first system review after apply. That review's Pass 0 runs over this change's own map.
- [An external reviewer without the orbit CLI] → It reports the check as not run (the table's row), rather than rebuilding the map.

## Migration Plan

None. No data or engine change. A repo that re-runs `orbit update` gets the new verify body.

## Touchpoints

- `src/core/templates/workflows/verify-change.ts` — step 6's Scenario Coverage bullet replaced by the surface read and its table.
- `src/core/templates/workflows/review.ts` — `REVIEW_EXTERNAL_MODE_SECTIONS_REFERENCE`, system item 0.
- `test/core/templates/verify-scenario-map.test.ts` — new: body tests for both reader requirements, `text`-tagged.
- `test/core/scenario-map.test.ts` — the rider pin, `behaviour`-tagged.
- `test/core/templates/skill-templates-parity.test.ts` — the verify skill template and generated `orbit-verify-change` hashes move.
- `orbit/scenario-ledger.yaml` — entries for scenarios no test can run.

## Mechanism → artifacts

the proposing AI's reading of the file; no engine record

| rule | closure / state | owner's state | destination |
|---|---|---|---|
| D-rc06b-2 | SOURCED | live rule | `orbit-verify-modifications` / `Verify's Scenario Coverage step reads the scenario map` (shape: normative TABLE) |
| D-rc06b-6 | SOURCED | live rule | `orbit-verify-modifications` / `Every Pass 0 reader reads the scenario map` (shape: normative TABLE) |
| D-rc06b-1, -3, -4, -5, -7, -8 | — | not a live rule (scope / fact) | not carried |

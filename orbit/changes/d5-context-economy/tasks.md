<!--
Implementation chunks:
  Chunk 1 (groups 1-3):  Emit surface engine (parsers, composition, CLI, write gate)
  Chunk 2 (groups 4-5):  Engine surfaces (boot render, gates vocabulary, model hints)
  Chunk 3 (groups 6-7):  Review merge + body-economy pass
  Chunk 4 (groups 8-9):  Workflow-layer hardening, audit checks, verification sweep
-->

# Tasks: d5-context-economy

## 1. Grammars and counters (engine parsers)

- [ ] 1.1 Chunk-preamble parser (`src/core/parsers/` per Touchpoints): the tasks.md HTML-comment
      grammar (`Chunk N (groups X[-Y]): <name>`), contiguous-range constraint, the documented
      malformed-preamble stderr warning + no-chunking fallback; unit tests incl. malformed forms.
- [ ] 1.2 Explore counter: fence-aware parse of `explore.md` — decisions count, open-questions
      count, standing-recommendation attestation ("n of m"); unit tests incl. fenced decoys and
      slot-less entries.
- [ ] 1.3 Checkbox arithmetic + apply-diff helper: task totals from tasks.md; `files_touched`
      from `git diff --name-only` since the previous apply emit (null degradation outside git /
      no reference); unit tests.

## 2. Emit composition module

- [ ] 2.1 `src/core/emit-composition.ts`: payload ingestion (stdin/`--payload`), engine-owned
      field rejection (named error), required nullable `model` key, unknown-command error naming
      the supported set.
- [ ] 2.2 Spine composition: command→kind taxonomy table, timestamp, trail-location resolution
      (change/explore/architecture), filename token + collision bump-forward (token and JSON
      timestamp agree).
- [ ] 2.3 Deterministic facts: review counts sentence + findings-dependent pointer; T0
      paste/save/ingest template from `prompt_path`; explore maturity-grid recommendation
      (Early/Mid/Mature/Stalled as engine data).
- [ ] 2.4 Atomic next_recommended: pre-computable class (single write) vs post-write class
      (write → recompute status → stamp); test that a post-write emit's `next_recommended`
      equals the engine's `next_command` computed after the emit landed.
- [ ] 2.5 Write gate: universal-spine checks for all kinds + `orbit-report-rendering`'s strict
      internal normalizer for review emits (export/reuse from `report-render.ts`); failure = no
      file, non-zero exit, field-naming stderr, empty stdout; tests for cell-mismatch and forged
      single-line slots refused at write.

## 3. CLI surface

- [ ] 3.1 `orbit emit <command>` registration in `src/cli/index.ts` + command module: `--change`,
      `--payload`, `--json` (echo composed emit), `--render` (review emits: path + report render
      in one breath); stdout = written path; error paths keep stdout empty.
- [ ] 3.2 Exactly-one-file guarantee test (two-sided snapshot around a successful emit) + the
      per-command computed-extension tests (explore counts, apply chunk fields, T0 composition)
      at the CLI level.

## 4. Boot render

- [ ] 4.1 `orbit status --change <name> --boot` (orientation family): position/eligibility,
      artifact pointers, latest emit per mode, explore.md/sketches presence; READ-ONLY;
      degradation per orientation fault-isolation; `--json` form.
- [ ] 4.2 Touchpoints view: design.md `## Touchpoints` parse (predicted); actual map from the
      change's first commit (engine diff); lifecycle-aware selection (predicted pre-apply,
      actual + predicted reference after); absent-section/non-git degradation; tests for both
      lifecycle positions.

## 5. Gates vocabulary and model hints

- [ ] 5.1 `gates.ts` canonical next-command strings → `/orbit:review --as <mode> --reviewer
      external <change>` (`:77`, `:397`); sweep every engine surface rendering the retired
      invocation; grep-test that `/orbit:review-external` renders on no recommendation surface.
- [ ] 5.2 `orbit/config.yaml` optional `models:` map reader + eligibility-line ` — hint: <value>`
      garnish (after any ` — user-invoked` marker); byte-identical output when unconfigured;
      tests both ways.

## 6. Review merge (surface 16 → 15)

- [ ] 6.1 Review template: `--reviewer in-context|fresh|external` axis (`--fresh` shorthand);
      external branch as ~5-line dispatch loading `references/external-handoff.md`; the
      reference authored from review-external's body (packaging steps, preflight, session note,
      prompt template + mode sections as nested references); record vocabulary FROZEN
      (`command: "review-external"`, `review-external-<TS>.json`, `external-<as>-<TS>.md`).
- [ ] 6.2 Mode-split pass references: `references/passes-{proposal,system,architecture}.md`
      (content verbatim from the body); Step 6 loads the resolved mode only.
- [ ] 6.3 Retire the standalone `orbit-review-external` skill + `orbit:review-external` launcher
      across ALL SIX registries (the B3 lesson: templates index, launcher index, init.ts, update
      paths, profiles, any manifest); fresh `init` in scratch yields 15 skills; e2e generated-
      surface test re-pinned.
- [ ] 6.4 T0 emit + WAITING arithmetic regression tests: the merged invocation still produces
      byte-compatible T0 records; orientation WAITING and the report ordinal unchanged.

## 7. Body-economy pass (the six heaviest bodies per sketches/body-inventory.md)

- [ ] 7.1 Disciplines blocks shrink IN PLACE across all bodies: four-bullet epitome +
      detail-to-situ (delete the block's copy where the step already carries it; move block-only
      procedure to its step) + no-chaining to ~2 structural-leaning lines; NO shared reference,
      NO generator constant (D-b2-2); fidelity markers re-pinned per body.
- [ ] 7.2 Emit sections across bodies (review, address-reviews, explore, audit-drift, apply,
      archive, propose, architect, verify…) shrink to payload-compose + `orbit emit <command>`
      invocations; maturity grids, chunk rules, collision/timestamp prose DELETED from bodies;
      schema reference docs shrink to payload-field lists.
- [ ] 7.3 Reference moves: worked examples + rarely-used flag detail (review `--mark`/
      `--parallel`/`--focus`; address-reviews examples) to `references/`; resident-size
      measurement recorded (before/after per body — the inventory's ~40.6k baseline).
- [ ] 7.4 Onboard re-teach: emit surface, merged review invocation, boot render, touchpoints;
      quick-reference table to 15 commands.

## 8. Workflow-layer hardening

- [ ] 8.1 Explore body: standing-recommendation slot in the capture convention + the boundary
      residency sweep tied to the existing emit trigger; begin emits excepted; emit via
      `orbit emit explore`.
- [ ] 8.2 Architect body: the same sweep before `orbit emit architect`; handoff section
      unchanged.
- [ ] 8.3 Propose body: design.md `## Touchpoints` authored at propose (consume mode seeds from
      explore.md leanings/references; standalone authors fresh); frozen-at-apply rule stated;
      section-to-artifact mapping reference updated.
- [ ] 8.4 Audit-drift body + checks: touchpoints divergence (set arithmetic on engine inputs;
      severity ladder per the delta; silent skip for pre-capability changes) and emit
      attestation cross-check (counts vs fresh parse; slot-less entry SUGGESTION).

## 9. Verification sweep

- [ ] 9.1 `npm run build && node bin/orbit.js update --force`; generated surface on disk matches
      templates (15 skills; epitomes; references present); fidelity + parity suites green.
- [ ] 9.2 Full `npm test` green; strict validation; `orbit fingerprint d5-context-economy
      --check` all verified.
- [ ] 9.3 Live smoke: `orbit emit review --render` on a scratch change; `orbit status --change
      --boot` both lifecycle positions; eligibility line with and without `models:` config;
      merged external invocation end-to-end (prompt file + T0).

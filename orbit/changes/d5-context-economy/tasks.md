<!--
Implementation chunks:
  Chunk 1 (groups 1-3):  Emit surface engine (parsers, composition, CLI, write gate)
  Chunk 2 (groups 4-5):  Engine surfaces (boot render, gates vocabulary, model hints)
  Chunk 3 (groups 6-7):  Review merge + body-economy pass
  Chunk 4 (groups 8-9):  Workflow-layer hardening, audit checks, verification sweep
-->

# Tasks: d5-context-economy

## 1. Grammars and counters (engine parsers)

- [x] 1.1 Chunk-preamble parser (`src/core/parsers/` per Touchpoints): the tasks.md HTML-comment
      grammar (`Chunk N (groups X[-Y]): <name>`), contiguous-range constraint, the documented
      malformed-preamble stderr warning + no-chunking fallback; unit tests incl. malformed forms.
- [x] 1.2 Explore counter: fence-aware parse of `explore.md` — decisions count, open-questions
      count, standing-recommendation attestation ("n of m"); unit tests incl. fenced decoys and
      slot-less entries.
- [x] 1.3 Checkbox arithmetic + apply-diff helper: task totals from tasks.md; `files_touched`
      from `git diff --name-only` against the previous emit's `diff_base` tree snapshot
      (write-tree boundary capture; first-commit fallback; null degradation outside git / no
      base); the late-committed-chunk regression case; unit tests.

## 2. Emit composition module

- [x] 2.1 `src/core/emit-composition.ts`: payload ingestion (stdin/`--payload`), engine-owned
      field rejection (named error), required nullable `model` key, unknown-command error naming
      the supported set.
- [x] 2.2 Spine composition: command→kind taxonomy table, timestamp, trail-location resolution
      (change/explore/architecture/archived/project — incl. the archive emit's post-move
      landing: lexically-greatest `orbit/changes/archive/*-<name>/` scan with the clean
      not-found error, tested), filename token + collision bump-forward (token and JSON
      timestamp agree; token resolves BEFORE deterministic-fact composition — the collision
      test asserts the review self-pointer equals the final post-bump path).
- [x] 2.3 Deterministic facts: review counts sentence + findings-dependent pointer; T0
      paste/save/ingest template from `prompt_path`; explore maturity-grid recommendation
      (Early/Mid/Mature/Stalled as engine data).
- [x] 2.4 Atomic next_recommended: pre-computable class vs post-write-semantics class
      (synthetic-trail status → stamp → full write gate → one atomic write; the status
      computation gains a candidate-overlay input); test byte-equality with the engine's
      `next_command` computed after the emit landed, and that a mid-composition crash
      leaves no file on the trail.
- [x] 2.5 Write gate: universal-spine checks for all kinds (accepting `change: null` + `doc`
      for architecture-scoped emits) + `orbit-report-rendering`'s strict internal normalizer
      for proposal/system review emits (export/reuse from `report-render.ts`); architecture-mode
      review emits get spine + rollup + handoff-shape checks instead; failure = no
      file, non-zero exit, field-naming stderr, empty stdout; tests for cell-mismatch and forged
      single-line slots refused at write, plus an architecture-mode emit passing the scoped gate.

## 3. CLI surface

- [x] 3.1 `orbit emit <command>` registration in `src/cli/index.ts` + command module: `--change`
      (workstream) / `--doc` (architecture-scoped) / bare for project-scoped `audit-drift` —
      with the wrong-flag, both-flags, and missing-target usage errors per the
      target-resolution contract; `--payload`; `--json`
      (stdout = exactly one `{path, emit, render?}` object); `--render` (proposal/system
      review emits: path + report render in one breath; architecture mode: no-op + stderr
      note); stdout = written path otherwise; error paths keep stdout empty.
- [x] 3.2 Exactly-one-file guarantee test (two-sided snapshot around a successful emit) + the
      per-command computed-extension tests (explore counts, apply chunk fields, T0 composition)
      at the CLI level.

## 4. Boot render

- [x] 4.1 `orbit status --change <name> --boot` (orientation family): position/eligibility,
      artifact pointers, latest emit per mode, explore.md/sketches presence; READ-ONLY;
      degradation per orientation fault-isolation; `--json` form.
- [x] 4.2 Touchpoints view: design.md `## Touchpoints` parse (predicted); actual map from the
      change's first commit (engine diff); lifecycle-aware selection (predicted pre-apply,
      actual + predicted reference after); absent-section/non-git degradation; tests for both
      lifecycle positions.
- [x] 4.3 Orientation surfaced-skip note (the modified fault-isolation requirement): the
      `⚠ invalid emit skipped: <filename>` line on bare, `--full`, and boot renders + the
      `skipped_emits` array on the affected workstream entry in both JSON tiers; tests with a
      spine-invalid-emit fixture across all three renders and the JSON shapes.

## 5. Gates vocabulary and model hints

- [x] 5.1 `gates.ts` canonical next-command strings → `/orbit:review --as <mode> --reviewer
      external <change>` (`:77`, `:397`); sweep every engine surface rendering the retired
      invocation; grep-test that `/orbit:review-external` renders on no recommendation surface.
- [x] 5.2 `orbit/config.yaml` optional `models:` map reader + eligibility-line ` — hint: <value>`
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
      measurement recorded (before/after per body — the inventory's ~40.6k baseline) against
      the stated target: six-body resident total ≤ 20k tokens, same bytes/4 method
      (proposal, arc exit criterion 1).
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
- [ ] 9.6 (User-validation handoff) Exercise exit criterion 3's every-seam boot test at stage
      ratification: a different model picks up cold at mid-explore (bare `orbit status` +
      explore.md + explore trail — the ratified seam answer, design.md D5), post-review,
      pre-apply, mid-apply-chunk, and pre-archive (`orbit status --change <name> --boot` for
      the change-scoped seams), and proceeds correctly from file-resident material alone.

### At-archive notes

(NOT apply tasks — the archive flow executes these; deliberately not checkboxes, so the
apply gate's arithmetic covers only apply-completable work.)

- 9.4 Update the Purpose paragraphs of the `orbit-run-summary-emit` and
  `orbit-review-external` baseline specs during the archive sync — both still describe the
  retired standalone invocation, and requirement-level spec sync never touches Purpose
  headers.
- 9.5 Amend R-d-9's text in the arc doc (and append the status-log entry)
  to record the ratified delivery map — (b) delivered as the engine boot render (per-emit
  `handoff` stays architect-only, D-d5-6); (c) items 1+4 mechanized, items 2–3 manual
  seam-audit practice with the cold-pickup-failure re-entry trigger (design.md D5).
- 9.7 The CLAUDE.md D5 entry sweeps present-tense surface counts to 15
  (the D15 bullet's "16 as of D2", the self-hosting note's skill/launcher counts) —
  current-state claims only; historical narrative stays as record.

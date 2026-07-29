# Tasks: d4-review-consistency

Order: the renderer first (the pure function both surfaces and bodies depend on), then the CLI
surface, then the body rewrites (the economy dividend + walk protocol), then the verification
sweep against the arc's two exit criteria. Every lifecycle transition is user-invoked; the
R-d-9 handoff audit runs by hand at the phase seams.

## 1. Renderer (`src/core/report-render.ts`)

- [ ] 1.1 `renderReviewReport(pass, context)`: the pure render over a normalized review pass
      (internal `review-<mode>-*.json` emit OR the trail reader's parsed external findings
      file) — fixed section order (header → trend → scorecard table → findings by severity
      with verbatim recommendations + labeled `recommendation_options` → suppressed-with-
      evidence → delimited `### Commentary` → engine tail LAST); empty sections omitted whole
- [ ] 1.2 Render-time context: iteration + trend computed from the change's prior review
      passes (internal + parsed external, token order, shared tie-break); the tail
      (gate line / position / `Ready when you are:`) from `loadChangeContext`/
      `formatChangeStatus`/`computeGateStates` — never read from the rendered record, never
      stored
- [ ] 1.3 Strict validation: spine + review extensions checked BEFORE rendering (mode,
      reviewer_class, depth, scorecard shape, findings[] entry shape); first missing/mistyped field → clean error
      naming field + file, no partial render; `commentary`/`recommendation_options`
      absent-safe; parse-rejected external files fail naming the file
- [ ] 1.4 Golden tests (`test/core/report-render.test.ts` + `test/fixtures/report-golden/`):
      goldens TRANSCRIBED from design D2b's canonical rendered example (never
      implementer-authored layouts); byte-identity per golden fixture (proposal pass, system pass, external pass, legacy
      no-commentary emit, commentary-with-near-miss-phrasing pinning the delimiter); strict-
      validation error cases (per-genre field sets); historical-pass case (as-of iteration/
      trend + CURRENT tail); trend as-of semantics (later passes excluded); an equal-token pair asserting distinct
      ordinals + the unique final trend point (the total pass order); scorecard/findings
      MISMATCH fixtures (fail whole, naming the cell); pre-boundary error
      fixtures pinned from the REAL archived emits (the kind+findings_summary generation —
      findings ABSENT in B2-era, populated dimension-less in B3-era, empty in C1-era; the
      D3-cycle scorecard/no-kind shape); blockquote-containment goldens (multiline bodies carrying ## CRITICAL,
      ---, and fences); the ungated minimal-tail golden; the deterministic
      first-run note literal
- [ ] 1.5 Extend the external-markdown parse into the NORMALIZED render shape (per design D4):
      per-finding Description body as verbatim recommendation with the File line reference
      retained; header `**Reviewer**:` + `**Date**:` MANDATORY and uniquely parsed (missing/duplicate/
      malformed → parse rejection naming field + file); `## Notes` → the Commentary slot;
      FENCE-AWARE
      (headings/field lines inside code fences never count) — without changing the gate
      model's lean `TrailPass` contract (`gates.ts` consumption untouched); unit tests incl.
      a fenced-`## CRITICAL` fixture and a parse-reject case

## 2. CLI surface (`--report` on the `--change` form)

- [ ] 2.1 `src/cli/index.ts` + `src/commands/workflow/status.ts`: `--report [<TS>]` rides
      `--change <name>` (bare/`--full` unchanged); no argument = newest review pass (internal
      emits + external findings files on the shared recency axis + tie-break); explicit `<TS>`
      selects; artifact RESOLUTION is a raw step (enumerate ALL trail artifacts/emits, shared
      tie-break, genre dispatch) BEFORE parse/normalize — the gate reader is not reused;
      non-renderable genre (spine `command` dispatch) → clean error naming the
      renderable set, exit non-zero; READ-ONLY (no file created or modified)
- [ ] 2.2 CLI tests (`test/commands/`): newest-default + explicit-TS render; external-pass
      render through the shared grammar; non-renderable genre error; ZERO-renderable-passes
      error (empty trail, exit non-zero); `--report --json` clean error; equal-token
      resolution via the shared tie-break; read-only assertion
      (two-sided snapshot, the D3 pattern); `--report` without `--change` errors cleanly;
      bare/`--full`/`--change` outputs unchanged (regression)

## 3. Body rewrites (the economy dividend + the walk protocol)

- [ ] 3.1 `src/core/templates/workflows/review.ts`: the report-format sections DELETED —
      including the final-assessment branch machinery and the as-of-completion synthetic-pass
      instructions (retired by persist-first ordering, per the MODIFIED final-assessment
      requirement) — replaced by persist-the-emit-FIRST, then run
      `orbit status --change <name> --report` and paste verbatim + the
      greppable hand-rendering prohibition (worded to visibly exempt architecture mode) + the
      `commentary` field authoring instruction
      (content contract: pattern/probing/risk; never counts/verdicts/next-commands) + the
      loose-form note (report grounds, conversation follows); architecture mode keeps its
      no-gate hand-rendered shape unchanged (interim path)
- [ ] 3.2 `src/core/templates/workflows/address-reviews.ts`: the three-lane walk — triage-time
      obvious-fix lane preview (provisional classification; before any fix; user pulls items
      into the decision lane; walk-time reclassification announced);
      decision-lane present → discuss → ratify (full-prose briefing; chat directive IS
      ratification recorded `ratified_via: "chat"`; AskUserQuestion fires only AFTER the
      discussion concludes without a crisp directive, discussed conclusion as default;
      dismissed/inconclusive → re-present);
      batch prompts prohibited (greppable) while batch delegation stays recorded
      (`delegation_directive`); `[discuss]`
      escape retired; resolution-log `ratified_via`/off-menu `chosen` semantics documented;
      the skill `description` literal refreshed to lane vocabulary
- [ ] 3.3 Generated-surface fidelity markers for both rewritten bodies (review: run-and-paste
      + prohibition; address: lane preview + re-present + batch-prompt prohibition); parity
      hashes re-pinned for both templates; `update --force` + on-disk spot-check
- [ ] 3.4 Reference docs riding the templates (`references/run-summary-schema.md` gains
      `commentary` AND its stale_suppressed note corrected — suppressions ARE a first-class
      report section now; address' `references/internal-findings-format.md` unchanged shape
      note + entry-level `ratified_via`/`resolution` + `delegation_directive` + off-menu
      `chosen` in the resolution-log schema reference; the stored `iteration_note` contract
      REMOVED — renderer-computed — and the deterministic spine-value contract documented;
      address' `references/external-findings-format.md` Notes line updated to the
      Commentary-contract text (or a one-line pointer to the prompt template as the format's
      source of truth) so both shipped copies agree;
      the `scorecard` field DECLARED as the required counts shape with per-finding `dimension`
      (the owning scorecard cell) and the cell-rollup equality rule; `findings_summary` AND
      `finding_titles` RETIRED from the review schema reference with the two-generation
      reader-tolerance note)

- [ ] 3.5 `src/core/templates/workflows/review-external.ts` (+ its `references/prompt-template.md`):
      the prompt template's `## Notes` instruction gains the commentary content contract (no
      finding counts, no gate verdicts, no next commands — the Notes body renders in the
      report's Commentary slot — per the change's `orbit-review-external` MODIFIED delta, which
      carries the updated template verbatim); FORMAT contract otherwise unchanged; parity
      hash re-pinned
- [ ] 3.6 `src/core/templates/workflows/onboard.ts`: the generated onboarding body's Phase 3
      prose drops the hand-authored final-assessment branch examples (engine-rendered report +
      tail described instead), Phase 4 prose and the quick-reference row teach the THREE-LANE
      present → discuss → ratify protocol (chat ratification; optional closure prompt; batch
      prompts dead / delegation alive) instead of the A/B/[discuss] fork model; fidelity
      markers + parity hash re-pinned

## 4. Docs

- [ ] 4.1 CLAUDE.md: no position edits (engine-computed); verify the D15/D14 bullets and the
      orientation pointer still read true post-apply (the report surface is a `--change` flag,
      not a new workflow — surface count unchanged at 16)

## 5. Verification sweep (arc §d4-review-consistency exit criteria)

- [ ] 5.1 Exit criterion 1 as a real test: the golden byte-identity suite (1.4) IS the
      criterion — plus a cross-source case proving an internal emit and an external file with
      equivalent findings render through one grammar (identical section order and tail)
- [ ] 5.2 Exit criterion 2 body-text checks as real tests: grep the generated address body for
      the prompt-fires-only-after-the-discussion-CONCLUDES rule (the arc's phrasing, stronger
      than briefing-precedence), the batch-prompt prohibition, and the
      dismissed-re-presents rule; grep the generated review body for the hand-rendering
      prohibition (with its architecture-mode exemption) + run-and-paste instruction (the
      one-observed-cycle half is post-apply, by hand, recorded at the seam)
- [ ] 5.3 Full suite green (baseline 1754 + new coverage); `orbit validate
      d4-review-consistency --strict` passes; `orbit fingerprint d4-review-consistency
      --check` all verified; if the suite runs in a spaced workspace path, record the
      environmental failure class distinctly (the ~24 unquoted-interpolation command tests)
      so it is never mistaken for a D4 regression
- [ ] 5.4 Arc sync (R-d-7): status-log entry at the post-apply seam; the R-d-9 handoff audits
      record DATED EVIDENCE NOTES in NON-REVIEW emits at each seam (address-reviews / apply /
      archive emits, whose final_assessment stays narrative — REVIEW emits' final_assessment
      is the deterministic counts sentence and never carries evidence prose; the pre-D5
      interim representation — change-scoped emits carry no structured handoff field yet).
      Archive-time notes: CLAUDE.md D4 completion entry; baseline 17 → 18; the new
      `orbit-report-rendering` baseline gets a real Purpose section at sync;
      `orbit-address-reviews`' baseline Purpose refreshed to lane vocabulary (the
      "pushback → classify → fix" phrase) — the D2 archive-time-Purpose precedent

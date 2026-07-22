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
      scorecard shape, findings[] entry shape); first missing/mistyped field → clean error
      naming field + file, no partial render; `commentary`/`recommendation_options`
      absent-safe; parse-rejected external files fail naming the file
- [ ] 1.4 Golden tests (`test/core/report-render.test.ts` + `test/fixtures/report-golden/`):
      byte-identity per golden fixture (proposal pass, system pass, external pass, legacy
      no-commentary emit, commentary-with-near-miss-phrasing pinning the delimiter); strict-
      validation error cases; historical-pass-current-tail case; trend computation

## 2. CLI surface (`--report` on the `--change` form)

- [ ] 2.1 `src/cli/index.ts` + `src/commands/workflow/status.ts`: `--report [<TS>]` rides
      `--change <name>` (bare/`--full` unchanged); no argument = newest review pass (internal
      emits + external findings files on the shared recency axis + tie-break); explicit `<TS>`
      selects; non-renderable genre (spine `command` dispatch) → clean error naming the
      renderable set, exit non-zero; READ-ONLY (no file created or modified)
- [ ] 2.2 CLI tests (`test/commands/`): newest-default + explicit-TS render; external-pass
      render through the shared grammar; non-renderable genre error; read-only assertion
      (two-sided snapshot, the D3 pattern); `--report` without `--change` errors cleanly;
      bare/`--full`/`--change` outputs unchanged (regression)

## 3. Body rewrites (the economy dividend + the walk protocol)

- [ ] 3.1 `src/core/templates/workflows/review.ts`: the report-format sections DELETED,
      replaced by run-`orbit status --change <name> --report`-and-paste-verbatim + the
      greppable hand-rendering prohibition + the `commentary` field authoring instruction
      (content contract: pattern/probing/risk; never counts/verdicts/next-commands) + the
      loose-form note (report grounds, conversation follows); architecture mode keeps its
      no-gate shape unchanged
- [ ] 3.2 `src/core/templates/workflows/address-reviews.ts`: the three-lane walk — triage-time
      obvious-fix lane preview (before any fix; user pulls items into the decision lane);
      decision-lane present → discuss → ratify (full-prose briefing; chat directive IS
      ratification recorded `ratified_via: "chat"`; AskUserQuestion demoted to optional
      closure with the discussed conclusion as default; dismissed/inconclusive → re-present);
      batch prompts prohibited (greppable) while batch delegation stays recorded; `[discuss]`
      escape retired; resolution-log `ratified_via` field documented
- [ ] 3.3 Generated-surface fidelity markers for both rewritten bodies (review: run-and-paste
      + prohibition; address: lane preview + re-present + batch-prompt prohibition); parity
      hashes re-pinned for both templates; `update --force` + on-disk spot-check
- [ ] 3.4 Reference docs riding the templates (`references/run-summary-schema.md` gains
      `commentary`; address' `references/internal-findings-format.md` unchanged shape note +
      `ratified_via` in the resolution-log schema reference)

## 4. Docs

- [ ] 4.1 CLAUDE.md: no position edits (engine-computed); verify the D15/D14 bullets and the
      orientation pointer still read true post-apply (the report surface is a `--change` flag,
      not a new workflow — surface count unchanged at 16)

## 5. Verification sweep (arc §d4-review-consistency exit criteria)

- [ ] 5.1 Exit criterion 1 as a real test: the golden byte-identity suite (1.4) IS the
      criterion — plus a cross-source case proving an internal emit and an external file with
      equivalent findings render through one grammar (identical section order and tail)
- [ ] 5.2 Exit criterion 2 body-text checks as real tests: grep the generated address body for
      the prompt-never-precedes-briefing ordering rule, the batch-prompt prohibition, and the
      dismissed-re-presents rule; grep the generated review body for the hand-rendering
      prohibition + run-and-paste instruction (the one-observed-cycle half is post-apply, by
      hand, recorded at the seam)
- [ ] 5.3 Full suite green (baseline 1754 + new coverage); `orbit validate
      d4-review-consistency --strict` passes; `orbit fingerprint d4-review-consistency
      --check` all verified
- [ ] 5.4 Arc sync (R-d-7): status-log entry at the post-apply seam; R-d-9 handoff audit by
      hand. Archive-time notes: CLAUDE.md D4 completion entry; baseline 17 → 18

## 1. Red tests first (the instruments before the mechanism)

- [ ] 1.1 `test/core/emit-composition*.test.ts`: `orbit emit review` refuses a proposal/system payload whose CRITICAL finding has no `reproduction`, an empty one, or a non-string one — exit non-zero, message names `findings[<i>]` and the title, no file, empty stdout; a multi-line reproduction is accepted; WARNING/SUGGESTION without the field write; architecture mode is not checked (its normalizer path is unchanged)
- [ ] 1.2 `test/core/report-render*.test.ts`: `normalizeExternalPass` carries a `**Reproduction**:` body after `**Description**:` as `reproduction`, keeps the recommendation to the Description body alone, and normalizes a file WITHOUT the label byte-identically to today (golden); a `**Reproduction**:` line BEFORE Description is not recognised
- [ ] 1.3 `test/core/report-render*.test.ts`: the render prints `> Reproduction:` + blockquoted body under the recommendation (internal and external); an external CRITICAL with no body renders ` — unreproduced` on its title and the engine tail is byte-identical with and without the body; an internal `"reproduction": 42` fails the strict normalizer naming `findings[<i>].reproduction`
- [ ] 1.4 `test/core/trail*.test.ts`: `parseExternalMarkdown` counts are unchanged by a `**Reproduction**:` body and by a `## Blocks` section with entries (the counter must not see either as structure)
- [ ] 1.5 `test/core/emit-schema-parity.test.ts`: the nested finding-key allowlist gains `reproduction`; the review reference's field-note prose names it and the table accepts it (the rc01 parity derivation)
- [ ] 1.6 Generated-surface fidelity tests (`test/integration/` or `test/core/template*`): every per-pass severity site in the review body names the ladder and states no definition (grep: no line in the pass lists reads `CRITICAL on`/`CRITICAL when` without `per the ladder`/`Severity ladder` on the same line); P8 carries no `classify as CRITICAL`; the prompt template carries the `## Severity` paragraph, the `**Reproduction**:` line in the CRITICAL triple and the `## Blocks` section; `references/run-summary-schema.md` names `reproduction`; both address-reviews mapping tables carry a `reproduction` row; Step 3a carries step (0)

## 2. Engine

- [ ] 2.1 `src/core/emit-composition.ts`: in `validatePayload` (review only, proposal/system modes), the finding-level check — CRITICAL ⇒ `reproduction` is a non-empty trimmed string, else `EmitError` naming index and title; top-level unknown-key check untouched; unknown finding keys still unchecked (comment names the gap deliberately)
- [ ] 2.2 `src/core/report-render.ts`: `NormalizedFinding.reproduction?: string`; `normalizeExternalPass` opens a `reproduction` body on `**Reproduction**:` (after Description only; body ends at `###`/`##`); the internal normalizer passes a string through and fails a non-string; `## Blocks` routes as `other` (no code change expected — confirm and pin)
- [ ] 2.3 `src/core/report-render.ts`: render the `> Reproduction:` blockquote under the recommendation; render ` — unreproduced` on a CRITICAL title with no reproduction (external always; internal only when the emit predates the field — detect by absence, never by date)
- [ ] 2.4 Run 1.1–1.5 green; `npm test` green

## 3. Generated surface — review body and prompt (`src/core/templates/workflows/review.ts`)

- [ ] 3.1 Re-point the seventeen per-pass severity sites (proposal P1–P9 lines 161–177, system S1–S5 lines 220–230, the report example at line 157) to the pointer form "<condition>: <severity>, per `orbit-conventions`' Severity ladder — <consequence>"; P2 and P7 to WARNING; P4 and S3 conditional on the reproduction; P1 and P8 to BLOCK wording; delete P8's "When ambiguous, classify as CRITICAL" clause
- [ ] 3.2 Step 9's field enumeration names `reproduction` (required on CRITICAL, optional otherwise, multi-line); the body's triage/report guidance lists blocks as a named line outside the scorecard
- [ ] 3.3 The prompt template (lines 560–660): add the `## Severity` paragraph before `## Output format`, the `**Reproduction**:` line in the CRITICAL triple with the quadruple note, the `## Blocks` section before `## Notes`; keep the output-format block byte-equal to `orbit-review-external`'s reference template
- [ ] 3.4 `references/run-summary-schema.md` (in `review.ts`): the finding entry documents `reproduction` with its rule
- [ ] 3.5 Run 1.5–1.6 green

## 4. Generated surface — walk (`src/core/templates/workflows/address-reviews.ts`)

- [ ] 4.1 Both virtual-marker tables (lines 51–60 markdown, 215–226 JSON) gain a `reproduction` row; the expected-file-format block documents the `**Reproduction**:` body and the `## Blocks` section
- [ ] 4.2 Step 3a gains step (0) — re-run the reproduction first for a CRITICAL; `unreproduced` noted when none; stale-with-evidence when it no longer reproduces; the triage table lists `## Blocks` entries first and never walks them
- [ ] 4.3 `npm run build && node bin/orbit.js update --force`; run 1.6 green; `npm test` green

## 5. Specs, docs and closure

- [ ] 5.1 Re-read every delta block against its baseline (`orbit validate rc02b-severity-ladder --strict`; `orbit fingerprint rc02b-severity-ladder --check`); confirm the review-external reference template's output-format block and the review body's prompt block are byte-equal after 3.3
- [ ] 5.2 README "Choosing a review mode" / any user doc that states a severity rule: name the ladder (audit-drift Category 3 would otherwise raise it); `CLAUDE.md`'s ACTIVE program section gains the rc02b line (the ladder by consequence; six capabilities declared)
- [ ] 5.3 Full `npm test` green on the final tree; record the test count
- [ ] 5.4 **User validation**: on the next real external return, confirm the reviewer wrote `**Reproduction**:` bodies and the render marks none `unreproduced` on a CRITICAL that carries one — the first live measurement of the request's uptake (handoff; recorded at archive, per `orbit-archive-modifications`' user-validation rule)

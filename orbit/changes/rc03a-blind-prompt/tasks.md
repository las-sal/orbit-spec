# Tasks: rc03a-blind-prompt

## 1. Read the slot (both branches)

- [ ] 1.1 In `src/core/templates/workflows/review.ts`, the external-handoff reference's
      "Load cycle context" step reads `next_hint_keys.slot` from the `orbit status --change <name>
      --json` call the branch already makes, and records it as the pass's GENRE.
- [ ] 1.2 The internal-class branches' "Inspect prior runs" step reads the same field from the same
      call. Neither branch re-derives the genre from flags, file scans, or trail inspection (D1).
- [ ] 1.3 Both branches treat an unreadable/absent slot as `blind-pair` for the purpose of the
      rule — fail closed (D3).

## 2. Withhold on a blind-pair slot

- [ ] 2.1 External branch: when the genre is `blind-pair`, the Cycle context section renders the
      iteration number plus a ONE-LINE withheld note naming the reason, and NO prior-findings
      content of either genre — no counts, no titles, no resolved-since list (D5).
- [ ] 2.2 External branch: when the genre is anything else, the section renders exactly today's
      content, byte-unchanged.
- [ ] 2.3 Internal branches: when the genre is `blind-pair`, skip the prior-summary read entirely;
      the report states that prior-run context was withheld and why.
- [ ] 2.4 Internal branches: pushback discipline is UNCHANGED — findings are still verified against
      current state. Only the prior-run read is withheld, never the verification.
- [ ] 2.5 Confirm the emit is unaffected: `reviewer_class`, `flags`, and every gate-read field
      record identically whether or not context was withheld.

## 3. Tests

- [ ] 3.1 Genre table: for each of the five slot states Case 1 walked — empty pair, open pair,
      confirming `external`, budget-spent `external`, proposal-mode `independent` — assert
      withhold-vs-retain matches the table.
- [ ] 3.2 Fail-closed: status call throws, gate absent, and field absent each produce withholding.
- [ ] 3.3 Byte-identity: a non-pair external prompt is byte-identical to the pre-change render for
      the same trail state (the no-regression guarantee behind "not BREAKING").
- [ ] 3.4 Symmetry: a `--fresh` pass on a `blind-pair` slot performs no prior-summary read.
- [ ] 3.5 Grep the generated surface: no blind-pair prompt path can emit a resolved-since list or a
      prior-findings list — rc03a's exit criterion 1, tested on the generated artifact rather than
      the source (the rc01 lesson: instruments derive from what actually ships).

## 4. Regenerate and verify the surface

- [ ] 4.1 `npm run build && node bin/orbit.js update --force`, then confirm the generated
      `.claude/skills/orbit-review/references/external-handoff.md` carries the conditional.
- [ ] 4.2 `npm test` green; `node bin/orbit.js validate --all --strict` green.

## 5. Close-out

- [ ] 5.1 (User-validation) Run one real blind pair on a later change under the shipped rule and
      confirm from the COMMITTED prompt file that the withheld note is present and no prior-findings
      content appears — rc03a's exit criterion 3. This cannot be asserted before archive: it needs a
      real pair, and it is the measurement rc13's own cycle depends on.
- [ ] 5.2 Record in `orbit/architecture/clean-up-review-cycle.md`'s status log what the first pair
      run under this rule measured, so the overlap number has a stated provenance.

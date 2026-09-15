# Tasks: rc03a-blind-prompt

## 1. Read the slot (both branches)

- [ ] 1.1 ADD an `orbit status --change <name> --json` read to the external-handoff reference in
      `src/core/templates/workflows/review.ts`, as an explicit step ordered BEFORE the
      "Load cycle context" step. The branch makes no such call today — its only CLI reads are
      `orbit list --json` and the git preflight — so this is a new step, not a reuse.
- [ ] 1.2 The internal-class branches' "Inspect prior runs" step reads `next_hint_keys.slot` from
      the status call the main body already makes at Step 4.
- [ ] 1.3 Both branches evaluate the CONJUNCTION: slot present AND `blind-pair` AND invoked class
      independent (`fresh`/`external`). Absence is NOT a pair signal and retains (D3).

## 2. Withhold every prior-findings channel

- [ ] 2.1 External branch: on a blind-pair member, the Cycle context section renders the iteration
      number plus a ONE-LINE withheld note naming the reason, and NO prior-findings content of
      either genre.
- [ ] 2.2 External branch: the prompt template's project-context reading list OMITS the
      `orbit/changes/<name>/.orbit-runs/` pointer on a blind-pair member — a reading list aimed at
      the directory holding the partner's emit is not blinded.
- [ ] 2.3 External branch: on every non-member path, both the section and the reading list render
      exactly today's content, byte-unchanged.
- [ ] 2.4 Internal branches: on a blind-pair member, skip the prior-summary read; the report states
      that prior-run context was withheld and why.
- [ ] 2.5 Internal branches: an `in-context` pass during the pair window RETAINS the read.
- [ ] 2.6 Architecture mode: carve out explicitly — the prior-run read over matching
      `review-architecture-*.json` emits stays mandatory for the hand-computed iteration note.
- [ ] 2.7 Pushback discipline is UNCHANGED. Only the prior-run read is withheld, never verification.
- [ ] 2.8 Confirm the emit is unaffected: `reviewer_class`, `flags`, and every gate-read field
      record identically whether or not context was withheld.

## 3. Instruments (assertions over the GENERATED surface)

The Cycle context section is composed at runtime by the reviewing AI from a markdown reference;
`src/` has no engine-side prompt composition, so there is no function to unit-test. These assert
over the emitted surface text — the rc01 instrument class, not a fallback.

- [ ] 3.1 The generated `references/external-handoff.md` states the `orbit status` read and places
      it before the cycle-context step.
- [ ] 3.2 The generated surface carries the decision table INCLUDING its absent-slot rows, and
      states that absence retains.
- [ ] 3.3 The generated surface states the conjunction's class term, and that `in-context` retains
      during the pair window.
- [ ] 3.4 The generated surface carries the architecture-mode carve-out.
- [ ] 3.5 Grep the generated surface: on the blind-pair path no prior-findings list, no
      resolved-since list, and no `.orbit-runs/` reading-list pointer can be emitted — covering
      BOTH `references/external-handoff.md` and `references/prompt-template.md`. This is rc03a's
      exit criterion 1, tested on the generated artifact rather than the source.

## 4. Regenerate and verify

- [ ] 4.1 `npm run build && node bin/orbit.js update --force`, then confirm both generated
      references (`external-handoff.md` AND `prompt-template.md`) carry the conditional.
- [ ] 4.2 `npm test` green; `node bin/orbit.js validate --all --strict` green.

## 5. Close-out

- [ ] 5.1 (User-validation) Run one real blind pair on a later change under the shipped rule and
      confirm from the COMMITTED prompt file that the withheld note is present, that no
      prior-findings content appears, and that the `.orbit-runs/` pointer is absent — rc03a's exit
      criterion 3. This cannot be asserted before archive: it needs a real pair.
- [ ] 5.2 (Architect-tier — NOT this change's to perform) The stage charter's `Touches:` line names
      one capability; the change ships two (`orbit-review-external` + `orbit-review`), and the
      charter's exit criteria are phrased around the external prompt only while the symmetry
      decision is half the deliverable. R-crc-1's ceiling is counted in capabilities touched, so
      the charter line is what a sizing check would read. Raise both in an architect session.
- [ ] 5.3 (Architect-tier) Record in the program status log what the first pair run under this rule
      measured, so the overlap number has a stated provenance.

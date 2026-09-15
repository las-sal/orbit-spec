# Tasks: rc13-explore-mechanism

## 1. The convention (orbit-conventions)

- [ ] 1.1 `explore.md`'s format gains a **Mechanism** section, ordered after Premise.
- [ ] 1.2 State the RULE test: a Decision is a rule iff asking "in which situations does this apply?"
      yields a SET. Fact / scope choice / rule are the three kinds; only the third has a domain.
      State explicitly that the test is GRAMMAR-INDEPENDENT and why.
- [ ] 1.3 State the three DECLARED closure forms — DERIVED / SOURCED / BOUNDED — and that an
      enumeration naming no form is unclosed however complete it looks.
- [ ] 1.4 State the corollary: classifying a record FALSIFIES an enumeration and never closes one.

## 2. The six moves (orbit-explore-modifications)

- [ ] 2.1 The Mechanism section records six moves per rule, with the derivation shown (parts of a
      mechanism → ways to be wrong) rather than the moves listed.
- [ ] 2.2 Name which two moves are EXISTING obligations — READ is read-before-reference, ENUMERATE
      is the closure requirement — so the body reads as enforcement, not novelty.
- [ ] 2.3 State that EXECUTE is not sufficient, with the measured reason: eleven of rc03a's fifteen
      CRITICALs were READ/ENUMERATE/COHERE and zero were EXECUTE.

## 3. Re-entry (orbit-explore-modifications)

- [ ] 3.1 Mode resolution gains the promoted-name case: when `orbit/changes/<name>/explore.md`
      exists and `orbit/explore/<name>/` does not, resume in place and SAY SO.
- [ ] 3.2 Never scaffold a staging directory for a name with an active change.

## 4. The maturity rung (orbit-run-summary-emit)

- [ ] 4.1 `maturityRecommendation` gains the rule-closure input; the Mature rung requires it in
      addition to the two counts.
- [ ] 4.2 Thresholds met + an open domain renders the MID rung's deferring language plus the NAMED
      gap (which rules are open) — not the Mature assertion.
- [ ] 4.3 Early, Mid and Stalled are byte-unchanged.
- [ ] 4.4 The explore emit carries whatever field 4.1 reads; extend the payload table and the
      schema reference together, and round-trip the reference through its own emit surface
      (the #12 lesson: a payload reference that fails on first use is worse than one that diverges).

## 5. Instruments

- [ ] 5.1 Unit: Mature requires closure; thresholds-met-with-open-domain renders Mid + the gap.
- [ ] 5.2 Unit: Early / Mid / Stalled byte-identical to today for the same inputs.
- [ ] 5.3 Generated surface: the emitted explore body carries the rule test, the three closure forms,
      the falsify-not-close corollary, and the six-move derivation.
- [ ] 5.4 Generated surface: the re-entry case is stated.
- [ ] 5.5 State in the test file what is NOT asserted — that an enumeration is TRUE — so a later
      reader does not mistake surface coverage for substance checking.

## 6. Regenerate and verify

- [ ] 6.1 `npm run build && node bin/orbit.js update --force`.
- [ ] 6.2 `npm test` green; `node bin/orbit.js validate --all --strict` green.

## 7. Close-out

- [ ] 7.1 (User-validation) The NEXT stage explored under this convention reaches its first review
      pass with zero CRITICALs of the READ, ENUMERATE or COHERE classes — exit criterion 3. Cannot
      be asserted before archive: it needs a subsequent stage's first pass.
- [ ] 7.2 (Architect-tier) Record in the program status log what that first pass measured, so the
      number has a stated provenance and exit criterion 3 is judged against evidence.
- [ ] 7.3 (Architect-tier) rc08 and rc03 inherit the two rules this exploration decided and handed
      away — walk discovery and the one-invocation launcher. Both failed this stage's own closure
      audit; their charters should say so rather than inherit them as settled.

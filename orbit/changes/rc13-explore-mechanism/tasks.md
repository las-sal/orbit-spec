# Tasks: rc13-explore-mechanism

## 1. The convention (orbit-conventions)

- [ ] 1.1 `explore.md`'s format gains a **Mechanism** section, ordered after Premise. State the RULE
      test (a Decision is a rule iff it has a domain of situations; the test applies PER CLAIM, so an
      entry may state a finding and still embed a rule), that it is GRAMMAR-INDEPENDENT and why, and
      what an entry whose rule-clause is incidental owes.
- [ ] 1.2 State the three DECLARED closure forms — DERIVED / SOURCED / BOUNDED — that an enumeration
      naming no form is unclosed however complete it looks, that the TAXONOMY ITSELF is BOUNDED with
      its residual stated, and the corollary: classifying a record FALSIFIES an enumeration and
      never closes one.

## 2. The eight moves (orbit-explore-modifications)

- [ ] 2.1 The Mechanism section records eight moves per rule, with the BOUNDED declaration and the
      residual: the set was assembled by classifying two records, grew each time, and grows again
      when a classification finds a member it lacks. A defect classifying to no move is a finding
      about the SET.
- [ ] 2.2 Name which moves are EXISTING obligations (READ is read-before-reference, ENUMERATE is the
      closure requirement) so the body reads as enforcement not novelty; state that MEDIUM CHOICE is
      deliberately outside the set and why; and record each move's DISPOSITION shape:
- [ ] 2.3 A rule's entry records the domain enumeration with its declared form, plus each move's
      DISPOSITION (applied with what it found, or not applied with the reason). `not executed —
      <reason>` satisfies EXECUTE; only the enumeration and its form cannot be dispositioned away,
      because they are what the maturity signal reads.
- [ ] 2.4 Produce ONE conforming exemplar entry in the shipped body, so the convention shows its
      shape rather than describing it.

## 3. Carry the second copy (orbit-explore-modifications MODIFIED)

- [ ] 3.1 `explore.md five-section convention` → six sections; the stub scenario asserts six.
- [ ] 3.2 Mode resolution for a promoted name, spec and body together: `Three invocation modes
      supported`'s Mode B WHEN gains `and no active change of that name exists`, and the body resumes
      in place against `orbit/changes/<name>/explore.md` and SAYS SO — never scaffolding a staging
      directory for a name with an active change.
- [ ] 3.3 `Boundary residency sweep before emits` → the slot enumeration gains Mechanism content
      (a domain enumeration, a declared form, a move disposition).

## 4. The maturity rung (orbit-run-summary-emit)

- [ ] 4.1 `maturityRecommendation` gains `rules_open: string[]` and `rules_total: number`,
      ENGINE-COMPUTED by the emit surface from the Mechanism section's declared closure forms —
      never caller-supplied, which would be the self-classification the rule test exists to remove.
- [ ] 4.2 The Open-domain state renders as its own rung: names open rules by DECISION ID, at most
      three plus `+N more`, ONE line, and does NOT surface `/orbit:propose`.
- [ ] 4.3 Precedence: >1 open question AND open domains → Stalled wins and additionally names the
      open-rule count.
- [ ] 4.4 The domain of "every rule": SUPERSEDED rules and rules assigned to another stage are OUT;
      an exploration with no Mechanism section has no live rules and is not withheld.

## 5. Sweep the residue the format change invalidates

- [ ] 5.1 `emit-composition.ts:908` (the missing-section warning a user sees), `explore-counter.ts:12`,
      `explore.ts:365 / :393 / :418`, `onboard.ts:79`, `propose.ts:154-156` — every live
      `five-section` claim. Grep-verify none survives.
      The requirement TITLE stays `five-section format` for delta identity and the fingerprint key;
      state that deferral in the delta prose so the name does not read as false in baseline.

## 6. Instruments

- [ ] 6.1 Unit: Mature requires closure; the Open-domain rung renders without propose; precedence
      holds; Early, Mid and Stalled byte-identical for the same inputs.
- [ ] 6.2 Generated surface: the rule test, the three closure forms, the falsify-not-close corollary,
      the eight moves with the BOUNDED residual, the re-entry case, and the exemplar entry.
      The test file STATES what is NOT asserted — that an enumeration is TRUE — so a later reader
      does not mistake surface coverage for substance checking.
- [ ] 6.3 `npm run build && node bin/orbit.js update --force`; `npm test` green;
      `validate --all --strict` green.

## 7. Close-out

- [ ] 7.1 (User-validation) The NEXT stage explored under this convention reaches its first review
      pass with zero CRITICALs of the READ, ENUMERATE or COHERE classes — exit criterion 3. If that
      pass is a blind pair, run it external-first BY HAND and record that the order was deliberate:
      rc03a was withdrawn with the blindness leak unfixed, so pair independence is not guaranteed.
- [ ] 7.2 (Architect-tier) Record what that first pass measured; correct the rc13 charter and status
      log, which still teach D-rc13-9's superseded grammar-keyed rule test; and note that rc08 and
      rc03 inherited two rules that failed this stage's own closure audit.

# Tasks: rc13-explore-mechanism (scoped to stage rc13a)

## 1. The convention and its parseable format (orbit-conventions)

- [ ] 1.1 `explore.md` gains a **Mechanism** section after Premise. State the RULE test (a Decision
      is a rule iff it has a domain of situations), that it applies PER CLAIM since an entry may
      state a finding and embed a rule, that it is GRAMMAR-INDEPENDENT and why, and what an entry
      whose rule-clause is incidental owes.
- [ ] 1.2 The three DECLARED closure forms — DERIVED / SOURCED / BOUNDED; an enumeration naming no
      form is unclosed however complete it looks; the TAXONOMY ITSELF is BOUNDED with its residual;
      and the corollary that classifying a record FALSIFIES an enumeration and never closes one.
- [ ] 1.3 The DECISION-ID slot: each Decisions entry opens with a unique `**<ID>**`, so a rule can
      be referenced by something a reader and a parser both see.
- [ ] 1.4 The MECHANISM ENTRY SHAPE: per rule, `Domain:` (the closed enumeration), `Closure:` (the
      declared form, plus the residual for BOUNDED), and one line per move recording its disposition.
- [ ] 1.5 The `Disposition:` slot with its FIXED vocabulary — `live` (default when absent),
      `superseded`, `assigned`, `illustrative` — so leaving the closure obligation is a named act.
      A rule is in the obligation only while `live`.

## 2. The nine moves (orbit-explore-modifications)

- [ ] 2.1 Nine moves per rule with the BOUNDED declaration; the residual states the set's history,
      HOW IT GROWS (an `@review:` marker plus a review finding against the requirement — nothing
      grows it silently), and the TEST separating a missing move from an out-of-domain concern.
- [ ] 2.2 Name which moves are EXISTING obligations (READ is read-before-reference, ENUMERATE is the
      closure requirement) so the body reads as enforcement rather than novelty.
- [ ] 2.3 A rule's entry records the domain and declared form plus each move's DISPOSITION — applied
      with what it found, or not applied with the reason. `not executed — <reason>` satisfies
      EXECUTE; only the enumeration and its form cannot be dispositioned away.
- [ ] 2.4 ONE conforming exemplar entry in the shipped body, so the convention shows its shape.

## 3. Carry the second copy (orbit-explore-modifications MODIFIED)

- [ ] 3.1 `explore.md five-section convention` → six sections; the stub scenario asserts six; the
      retained TITLE is noted in the delta prose as delta-identity only.
- [ ] 3.2 `Three invocation modes supported` → Mode B's WHEN gains `and no active change of that
      name exists` AND its THEN scaffolds the SIX sections; the body resumes in place against
      `orbit/changes/<name>/explore.md` for a promoted name and says so.
- [ ] 3.3 `Boundary residency sweep before emits` → the slot enumeration gains Mechanism content.

## 4. Sweep the residue, SOURCED over a named grep

- [ ] 4.1 The member set is `grep -rn 'five-section\|five sections' src/` — the grep defines the
      set, not a remembered list. Every hit is corrected or explicitly exempted; re-running it
      returns zero. Known at authoring time: `emit-composition.ts:908`, `explore-counter.ts:12`,
      `explore.ts:365 / :393 / :418`, `onboard.ts:79`, `audit-drift.ts:302`. `propose.ts` is NOT
      swept — it is governed by a capability this change does not touch.

## 5. Instruments

- [ ] 5.1 Generated surface: the rule test, the three closure forms, the falsify-not-close corollary,
      the nine moves with the residual's growth path and test, the ID slot, the entry shape, the
      disposition vocabulary, the re-entry case, and the exemplar entry.
      The test file STATES what is NOT asserted — that an enumeration is TRUE — so a later reader
      does not mistake surface coverage for substance checking.
- [ ] 5.2 `npm run build && node bin/orbit.js update --force`; `npm test` green;
      `validate --all --strict` green.

## 6. Conform this change's own artifact to the convention it ships

- [ ] 6.1 `explore.md`'s Decisions entries carry ID slots and `Disposition:` values — including
      D-rc13-3 and D-rc13-4, whose hand-away to rc08/rc03 is currently recorded only in an audit
      table, so the rule executed against its own file returns them open forever.
- [ ] 6.2 Annotate Cases 9(a) and 9(b), whose claims later decisions falsified, and correct the
      Mechanism section's disclaimer, which says the section is not part of the shipped convention.

## 7. Close-out

- [ ] 7.1 (User-validation) The NEXT stage explored under this convention reaches its first review
      pass with zero CRITICALs of the READ, ENUMERATE or COHERE classes. If that pass is a blind
      pair, run it external-first BY HAND and record the order as deliberate — rc03a was withdrawn
      with the blindness leak unfixed.
- [ ] 7.2 (Architect-tier) Correct the rc13 charter's superseded claims — the grammar-keyed rule
      test, the six-move table, the DERIVED claim, and the exit-criterion evidence sentence — and
      record what 7.1 measured.

# Tasks: bounded-closure-semantics (stage rc13a, second attempt)

## 1. The format, owned by orbit-conventions (text lives in the explore body)

- [ ] 1.1 Six sections and the two status tokens: the scaffold block, the section list, and every
      "five sections" phrase in `explore.ts` say six; `> **Status**: concluded <date>.` documented
      as the only other legal token.
- [ ] 1.2 Decision entry identity and classification: the opener grammar as the ID slot, the
      NORMATIVE-force rule test with the quantified-fact counter-example, one claim per entry
      (split a mixed one), `Kind:` (absent = rule) and `Disposition:` (absent = live) with their
      fixed vocabularies. `illustrative` does not appear.
- [ ] 1.3 The Mechanism grammar as ONE normative fenced block in the body — container, boundary,
      `Domain:` + table, `Closure:`, the two residual slots iff BOUNDED, `Moves:` × 9, `### Case`,
      the three H3 kinds, MALFORMED naming the line — stated once; every other mention points.
- [ ] 1.4 ACCOUNTED closure: the two-outcome table, kind-and-method, "there may be others" and
      "I can name no more" as non-forms, classification falsifies never closes, visibility never
      blocking, spec row owns and design points.
- [ ] 1.5 The concluded outcome record: the three tokens, the ORDER (entry → header → key → emit),
      in place, user-declared under D1, the two KNOWN limits with their owners (rc13b, Q-crc-11).

## 2. The body's application, owned by orbit-explore-modifications

- [ ] 2.1 The nine-move table with its residual in the two slots, the growth path, the boundary
      test with RESOURCES in the IN list, the existing-obligation note, and EXECUTE-not-sufficient.
- [ ] 2.2 The exemplar: D-bcs-3's Mechanism entry, verbatim from `explore.md`, in the body.
- [ ] 2.3 The re-entry table (six cells, two refused; active change without `explore.md` = new in
      place) replaces the Mode B row's prose; Mode B's WHEN carries both guards.
- [ ] 2.4 The conclude verb and reopen flow. FIRST read the change-metadata helpers for how an
      unknown key inside `architecture:` is treated; if rejected, the key moves to the citation's
      sibling level and the spec's scenario text is corrected in the same commit.
- [ ] 2.5 The residency sweep names the Mechanism slots; "no downgraded Kind" stated once, here.

## 3. Residue, SOURCED over a scoped grep

- [ ] 3.1 `grep -n 'five-section\|five sections' src/core/templates/workflows/explore.ts` returns
      ZERO. Every other hit in `src/` is listed in the design as a justified exemption:
      `propose.ts:154/156` (the propose follow-on), `emit-composition.ts:1127` and
      `explore-counter.ts:12` (rc13b), `audit-drift.ts:302` (a pointer to the retained title).

## 4. Instruments

- [ ] 4.1 Generated-surface assertions in `orbit-generated-surface.test.ts`: the six sections,
      both status tokens, `Kind:`/`Disposition:` vocabularies, the three closure tokens, the
      residual-slot rule, the nine move names, the six re-entry rows, the conclude order, and the
      exemplar's lines matched against the grammar's productions. The file STATES what is not
      asserted: that an enumeration is true, a residual honest, or every rule written down.
- [ ] 4.2 `npm run build && node bin/orbit.js update --force`; `npm test` green;
      `orbit validate --all --strict` green; `orbit fingerprint bounded-closure-semantics --check`.

## 5. Conform this change's own artifact (exit criterion 2)

- [ ] 5.1 Re-verify `orbit/changes/bounded-closure-semantics/explore.md` against the SHIPPED
      grammar after 1.3 lands: every live rule has an entry, every entry has nine unique moves,
      every BOUNDED entry has both slots, no residual slot on a closed entry, all `Kind:` values
      legal. Fix the file, never the grammar, on any drift.

## 6. Close-out

- [ ] 6.1 (User-validation) The NEXT stage explored under this convention reaches its first
      independent pass with zero CRITICALs of the READ, ENUMERATE or COHERE classes; record the
      count either way in that stage's emit.
- [ ] 6.2 (Architect-tier, at the archive tail) rc13b's charter sentence corrected to "every live
      rule's domain ACCOUNTED"; the propose-consumption follow-on (`rc13c`) PROPOSED to Sal as a
      stage, not declared unilaterally; Q-crc-11 gains the `concluded:` key as its named input.

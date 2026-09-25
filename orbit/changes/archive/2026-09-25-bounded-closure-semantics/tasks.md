# Tasks: bounded-closure-semantics (stage rc13a, second attempt)

## 1. The format, owned by orbit-conventions (text lives in the explore body)

- [x] 1.1 Six sections and the two status tokens: the scaffold block, the section list, and every
      "five sections" phrase in `explore.ts` say six; `> **Status**: concluded <date>.` documented
      as the only other legal token.
- [x] 1.2 Decision entry identity and classification: the fenced DECISIONS production (opener as
      the ID slot; `Kind:`/`Disposition:`/`Re-entry:` slot lines with the optional-bullet regex),
      the NORMATIVE-force rule test with the quantified-fact counter-example, one claim per entry
      (split a mixed one), `Kind:` (absent = rule) and `Disposition:` (absent = live; one meaning,
      two consequences) with their fixed vocabularies. `illustrative` does not appear.
- [x] 1.3 The Mechanism grammar as a normative fenced block in the body — container, boundary,
      `Domain:` + table (no empty tables), `Closure: <TOKEN>[ — <justification>]`, the two residual
      slots iff BOUNDED, `Moves:` × 9, `### Case`, the three H3 kinds, MALFORMED naming the line —
      plus the one-line STATUS-HEADER production; three productions in all (with 1.2's), each
      stated once; every other mention points.
- [x] 1.4 ACCOUNTED closure: the two-outcome table, kind-and-method, "there may be others" and
      "I can name no more" as non-forms, classification falsifies never closes, visibility never
      blocking, spec row owns and design points.
- [x] 1.5 The concluded outcome record: the TWO tokens, the ORDER (entry → header → emit), nothing
      written to metadata, in place, user-declared (not a consent-marked seam), the three KNOWN
      limits with their owners (rc13b, Q-crc-11, the propose follow-on).

## 2. The body's application, owned by orbit-explore-modifications

- [x] 2.1 The nine-move table with its residual in the two slots, the growth path, the boundary
      test with RESOURCES in the IN list, the existing-obligation note, and EXECUTE-not-sufficient.
- [x] 2.2 The exemplar: D-bcs-3's Mechanism entry, verbatim from `explore.md`, in the body (+ D-bcs-12,
      the BOUNDED entry, added on the system walk so both closure branches ship).
- [x] 2.3 The re-entry table (six cells, two refused at apply — nine cells, four refused after the system walk; active change without `explore.md` = new in
      place; staging dir without `explore.md` or with neither header token = not-concluded, add-only)
      replaces the Mode B row's prose; Mode B's WHEN carries both guards; resume adds a missing
      Mechanism section (add-only).
- [x] 2.4 The conclude verb, the reopen flow (prior CONCLUDED entry superseded; one live
      `Re-entry:` slot), and the second-conclude cycle. The body writes NO metadata on conclude or
      reopen — assert it in 4.1.
- [x] 2.5 The residency sweep names the Mechanism slots and POINTS at the capture scenario for the
      no-downgraded-Kind rule (stated once, in the five-section convention's capture scenario).

## 3. Residue, SOURCED over a scoped grep

- [x] 3.1 `grep -nE '(five|5)[- ]sections?' src/core/templates/workflows/explore.ts` returns ZERO
      (pattern widened on the system walk, 2026-09-25 — the narrower one missed `onboard.ts:79`, now
      corrected). The exemption list for every other hit in `src/` lives in design.md Risks, the
      retained-titles entry; this task points there and does not restate it.

## 4. Instruments

- [x] 4.1 Generated-surface assertions in `orbit-generated-surface.test.ts`: the six sections,
      both status tokens, `Kind:`/`Disposition:` vocabularies, the three closure tokens, the
      residual-slot rule, the nine move names, the six re-entry rows, the conclude order, the
      no-metadata-on-conclude sentence, the status-header production, and the exemplar's lines
      matched against the grammar's productions. The file STATES what is not
      asserted: that an enumeration is true, a residual honest, or every rule written down.
- [x] 4.2 `npm run build && node bin/orbit.js update --force`; `npm test` green;
      `orbit validate --all --strict` green; `orbit fingerprint bounded-closure-semantics --check`.

## 5. Conform this change's own artifact (exit criterion 2)

- [x] 5.1 Re-verify `orbit/changes/bounded-closure-semantics/explore.md` against the SHIPPED
      grammar after 1.3 lands: every live rule has an entry, every entry has nine unique moves,
      every BOUNDED entry has both slots, no residual slot on a closed entry, all `Kind:` values
      legal. Fix the file, never the grammar, on any drift.

## 6. Close-out

- [ ] 6.1 (User-validation) The NEXT stage explored under this convention reaches its first
      independent pass with zero CRITICALs of the READ, ENUMERATE or COHERE classes; record the
      count either way in that stage's emit.
AT-ARCHIVE NOTE 6.2 (architect-tier; execute in the archive flow, not at apply — the repo's at-archive-note convention: rc07's 5.4, citing D5's 9.4/9.5/9.7, D6's 5.5–5.9 and rc04d's 2.3; converted from a checkbox at apply 2026-09-25 because the apply gate cannot honestly count work no apply session can do): rc13b's charter sentence corrected to "every live
rule's domain ACCOUNTED"; the propose-consumption follow-on (`rc13c`) PROPOSED to Sal as a
stage, not declared unilaterally, carrying the propose-on-concluded transition; Q-crc-11 gains
the header token (in the citation-located directory) as its named input; the rc13a section's
"SETTLED in `orbit/explore/bounded-closure-semantics/`" pointer corrected to the archived
change's path; the charter's two superseded sentences ("three DECLARED closure forms with the
taxonomy itself declared BOUNDED"; "a RULE iff it has a domain of situations") each gain
"superseded by the archived change — see SETTLED"; and rc13a's OWN exit (2) is graded AS
WRITTEN — all eight live-rule domains CLOSED (DERIVED/SOURCED), so "closed" still measures and
grades MET (R-crc-12: a grade, not a revision); the ACCOUNTED wording is for rc13b's sentence only.

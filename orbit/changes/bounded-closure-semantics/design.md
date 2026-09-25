# Design: bounded-closure-semantics

## Context

The first attempt (`orbit/changes/archive/2026-09-15-rc13-explore-mechanism/`) was reviewed by
three independent passes — 55 findings, 17 CRITICAL, zero repeats — and archived without syncing.
Its external pass found the contradiction this change dissolves and five more repairs, all
carried here. The full derivation is `explore.md`: Case 1 (the kind-and-method test against every
bounded claim on the record), Case 2 (each candidate concluded home against the three readers of
a staging directory), and eight Mechanism entries, one per rule (D-bcs-1, 2, 3, 6, 7, 8, 9, 10; D-bcs-4, 5 and 11 are scope).

Every reader of `orbit/explore/<name>/` keys on LOCATION, never content: the stage-state scan
(`src/core/architecture/state.ts`, `scanCitations` / `observe`), orientation
(`src/core/orientation.ts`, `listDirs` with an empty exclusion set), and audit-drift's explore
cross-check. The counter (`src/core/parsers/explore-counter.ts`) ends a section only on `## ` or
`# ` and counts top-level list items — so H3 entries and nested slot lines perturb nothing.

## Goals / Non-Goals

**Goals:**
- No domain reaches propose open SILENTLY: a rule either declares closure or declares its residual
  by kind and method, in slots a reader and a later parser both see.
- The format is parseable from its normative grammar alone — container, boundary, slots, failure.
- An exploration can conclude in nothing and the record says so, where the readouts will render it.

**Non-Goals:**
- Judging whether an enumeration is TRUE or a residual honest. The engine sees FORM (rc13b);
  substance is the reader's (R-crc-10, D-bcs-4).
- The parse, the rung changes, and the fifth rung — rc13b's, by declared dependency.
- Propose's consumption of Mechanism content — a declared follow-on, see proposal.
- Any change to the stage-state reader — Q-crc-11's, with its input shipped here.

## Decisions

Each is a Decisions entry in `explore.md`, and the rules among them carry a Mechanism entry; cited by ID, not restated
(R-crc-14 — the exploration owns the rationale until the spec does).

- **D-bcs-1 — ACCOUNTED, not CLOSED.** Two outcomes, three tokens. Alternative: retire BOUNDED
  as a closure form and let rc13b treat it as open (the charter's first branch) — rejected, since
  rc02's same-state limit shipped correctly as a bounded domain and forcing authors to fake
  closure is worse than the contradiction.
- **D-bcs-2 — kind and method as two slots.** Derived from the two things a reader of a residual
  can be asked to do. One prose sentence was rejected: the first attempt's taxonomy residual named
  a kind and no method and survived three passes.
- **D-bcs-3 — visibility, never blocking; spec row owns, design points.** Writing this entry
  found that a residual carried only in design vanishes at archive. The exemplar in the body is
  this entry.
- **D-bcs-6 — in place, TWO tokens.** Case 2: the archive-subdirectory home renders a bogus
  `archive` workstream row and defeats the fifth rung; a dot-directory hides the record. The
  citation is KEPT, unannotated: the first shape added a `concluded:` key inside it, and the
  fresh proposal pass MEASURED the metadata helpers stripping unknown keys at both levels, so the
  record is the header token plus the `Re-entry:` slot and nothing is written to metadata
  (ratified B, 2026-09-25). Q-crc-11's stage reads the header from the directory the citation
  locates. Order: CONCLUDED entry → header flip → final emit (amended at propose: the rung is
  computed from the file at emit time).
- **D-bcs-7 — six-cell re-entry table.** Three facts, the middle conditional on the first; two
  cells refused naming both paths.
- **D-bcs-8 — H3 entries.** Domains are tables (R-crc-7) and a table inside a list item is
  fragile. Cases stay as `### Case` siblings; other H3s are prose. MALFORMED names the line.
- **D-bcs-9 — the entry is the key.** Formalize the opener in use (zero migration); one claim per
  entry; `Kind:` defaults to rule; `illustrative` dropped. Claim-level IDs rejected as a second key
  space for a problem splitting solves.
- **D-bcs-10 — what rc13b inherits** is recorded here and handed off, not built.
- **D-bcs-11 — proven by exemplar, not parser.** No engine module ships; the generated-surface
  test asserts the exemplar against the grammar's productions, and rc13b parses the same exemplar
  as a fixture. Two extensions of one grammar (R-crc-14's shape) kept aligned by a shared fixture.
- **The rule test gains NORMATIVE force** (carried repair): a rule prescribes or constrains; a
  quantified empirical claim is a fact. The first attempt's D-rc13-2 ("heading count has never
  correlated…") is the worked counter-example the spec names.
- **The nine-move residual is written in the new slots**: kind — a further way a mechanism is
  wrong that the nine do not name; method — classifying another record's CRITICALs. Provenance
  stated in full: five → six by classifying rc03a (Case 7 of the first attempt), six → eight by
  classifying rc02 (Case 10), eight → nine by the first attempt's own review trail finding INVOKE.
  The boundary test's IN list gains RESOURCES, which FEASIBILITY was created to admit.

## Risks / Trade-offs

- [The convention is ADVISORY until rc13b] → stated in the proposal; the seam is a declared
  dependency, not a concession.
- [`Kind:` defaulting to rule makes every pre-existing decision on a live exploration an open
  rule under rc13b] → propose moved the only live exploration, so the migration surface today is
  ZERO staging directories plus the change-directory `explore.md` records propose leaves behind,
  which are never parsed. Stated so rc13b's proposer does not rediscover it.
- [A concluded record that touches metadata cannot survive the helpers] → MEASURED at the fresh
  proposal pass: `ChangeMetadataSchema` strips unknown keys at the nested AND the sibling level,
  the two rows the first shape's fallback table had. The record is two tokens and writes no
  metadata (D-bcs-6 as amended). The lesson is the R-crc-7 class — `state.ts` was read and is
  lenient; the helpers the body writes through were not read.
- [No independent pass has stood on the FINAL proposal tree] → the fresh pass read the tree
  before the two walks landed 23 edits; the in-context pass that followed is a reaction, not an
  independent read. The review-proposal gate PASSED on resolution, which is what it measures.
  This is the rc07 distinction, carried as an accepted residual for the archive's readiness
  record rather than spent on a third proposal pass now (R-crc-11(h): effort recorded, never
  targeted).
- [Two extensions of one grammar — the surface test's regexes and rc13b's parser] → the shared
  exemplar fixture; recorded as rc13b's obligation in its handoff.
- [Stage state renders `exploring` for a concluded citer] → Q-crc-11, with the header token in
  the citation-located directory as its input;
  the orientation row keeps saying propose until rc13b. Both KNOWN, both owned.
- [Propose does not consume Mechanism content] → a follow-on stage proposed to Sal; until then the
  transfer is an instruction the proposing AI follows from the authoritative file.
- [The retained titles say "five-section"] → a RENAMED delta exists and the validator handles
  RENAMED+MODIFIED, so retaining is a CHOICE: the rename would pull the three pointer sites —
  two of them in other capabilities (`orbit-audit-drift`, `orbit-emit-composition`) — into scope,
  making this four capabilities. The rename is DEFERRED to a retirement-class change; every other
  spec that names the title is a POINTER (R-crc-14(d)) and stays valid; the residue acceptance grep is
  scoped to the explore body with every other hit listed as a justified exemption (task 3.1) —
  the first attempt's sweep could never return zero because it exempted a file it matched.

## Alternatives considered

From `explore.md` Considered & out, so they are not rediscovered: `orbit/explore/archive/` as
the concluded home; a dot-directory home; dropping the citation on conclude; claim-level IDs and
dispositions; the `illustrative` disposition; Mechanism entries as list items; shipping the
parser in rc13a without a consumer; `Kind:` defaulting to fact. From the first attempt: the
executed case as the unit; listing the moves rather than deriving them; removing the Mature rung.

## Migration Plan

None. The counter ignores the new section and the nested slots (verified against
`explore-counter.ts`). Pre-existing staging directories are unaffected until an author touches
them; the demanding `Kind:` default has effect only once rc13b parses.

## Instruments — what can actually be measured

The convention, the grammar and the nine moves are body prose, assertable over the GENERATED
surface (the rc01 instrument class): the generated-surface test asserts the section list, the
status tokens, the slot names, the closure tokens, the residual-slot rule, the nine move names,
the re-entry table's six rows, the conclude sequence, and that the shipped exemplar's lines match
the grammar's productions. NOT asserted, and the test file says so: that any enumeration is TRUE,
that any residual is honest, or that an author wrote every rule down.

## Open Questions

None. The exploration closed with zero; the ordering defect in D-bcs-6 was found and amended at
propose.

## Touchpoints

- `src/core/templates/workflows/explore.ts` — the convention text, the grammar block, the nine
  moves, the exemplar entry, the re-entry table, the conclude flow, the sweep slots.
- `test/core/templates/orbit-generated-surface.test.ts` — generated-surface assertions.
- `orbit/changes/bounded-closure-semantics/explore.md` — own-artifact conformance (task 5.1).
- `orbit/architecture/clean-up-review-cycle.md` — architect-tier handoffs at the archive tail
  (rc13b's charter sentence; the rc13c proposal; Q-crc-11's input).

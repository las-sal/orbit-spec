## MODIFIED Requirements

### Requirement: Validate explore.md structure before consuming

The system SHALL check the basic structure of `explore.md` — the sections `orbit-conventions`' `` `explore.md` five-section format `` requirement lists, in its order (that requirement OWNS the list and its count; this requirement states neither) — and warn (but not block) on issues. The generated propose skill carries the list as a CHECKED MIRROR of that requirement in its `references/consume-mode.md` (R-crc-14's mirror corollary: an adopter's skill cannot resolve this repository's spec at runtime), held byte-equal to the owner's stated order by a parity test. The propose body keeps mode detection and tells the agent, when it resolves consume mode and after the PR layer's phase 1, to read `references/consume-mode.md` and follow it; that reference carries the structure check, the open questions, the section mapping, the Mechanism carry and the move, in that order, the move still running after the size brief. The Mechanism section is one of the listed sections: its absence warns like any other and, because every live rule is then without an entry, the design's record lists each as UNACCOUNTED (per `Mechanism section consumption`) — a format note with a visible consequence, never a block.

#### Scenario: All listed sections present

- **WHEN** `explore.md` has every section the owning format requirement lists
- **THEN** the command proceeds normally

#### Scenario: Mechanism section absent

- **WHEN** `explore.md` was written before the Mechanism section joined the format and has no `## Mechanism` section
- **THEN** the command warns naming the missing section, prompts proceed-anyway (default proceed), and — on proceed — the design's `Mechanism → artifacts` record lists every live rule as UNACCOUNTED with state `absent`

#### Scenario: The section list ships in the consume-mode reference

- **WHEN** the propose skill is generated
- **THEN** its `references/consume-mode.md` carries the section list byte-equal to the owner's order, the body does not,
  and the body names `references/consume-mode.md` at mode detection's consume outcome

#### Scenario: Missing section warning

- **WHEN** `explore.md` is missing one or more expected sections
- **THEN** the command warns about the missing sections and prompts the user to confirm proceed-anyway (default proceed)

#### Scenario: Malformed file

- **WHEN** `explore.md` cannot be read or parsed
- **THEN** the command halts with a clear error and exit; user fixes and re-invokes

### Requirement: Mechanism section consumption

In consume mode the system SHALL carry `explore.md`'s Mechanism section into the generated artifacts by the decision table below, reading the section from the FILE — the entry set under `## Mechanism`, each entry's `Closure:` token, and a BOUNDED entry's `Residual kind:` and `Residual method:` lines VERBATIM — as it reads Decisions: by the grammar `orbit-conventions`' Mechanism-entry requirement owns, which this requirement points at and does not restate. Propose fires NO emit of its own before its one-shot completion emit (per `orbit-run-summary-emit`'s one-shot rule, which this requirement leaves untouched) and reads NO prior emit as a cross-check: git preserves neither file's modification time, so no observable a workflow body has can establish that a trail record was written against the file's current bytes. The proposing AI's reading of the file is the SOLE source of the record, and the record's header says so. The engine's form parse (the readout's `rules_open` / `key_defects` / `residuals`, `orbit-emit-composition`'s fields) remains the reviewer's cross-check after the fact; a read-only print of it for a staging name is the follow-on this requirement names and does not build. Propose consumes FORM, as the readout renders form: whether an enumeration is TRUE, a residual honest, or a rule written down at all remains the reviewer's judgement.

**The decision table** — a PARTITION of the entries and live rules propose meets, over two facts: the owning Decisions entry's live-rule status (per `orbit-conventions`' entry-identity requirement: `Kind:` rule or absent AND `Disposition:` live or absent) and the rule's accounting state as the readout's parser judges it (`orbit-emit-composition`'s `rules_open` and `key_defects` fields — pointed at, never re-listed here). A live rule is ACCOUNTED exactly when it is COUNTED in `rules_total` AND NOT in `rules_open` — a duplicate-ID second entry is counted in neither and is a key defect (row 1), so it never reaches a carrier row. Read from the FILE alone (an adopter's skill has neither this repository's specs nor its parser), the same fact is: the rule has an entry that CONFORMS to the Mechanism grammar in FULL — a heading whose ID matches its Decisions entry, a `Domain:` line and a table with at least one member row, a `Closure:` token from the closed set, the two residual slots present exactly when BOUNDED, and nine move lines each exactly once (`orbit-conventions` owns that grammar; the propose skill's `references/consume-mode.md` carries a checked mirror of its production); an entry failing ANY clause, or no entry, is OPEN, and the readout's state word — when a readout is at hand — names which clause. A key defect is an entry whose heading ID matches no Decisions entry (an orphan) or a second entry or heading under an already-used ID (a duplicate). The `Closure:` token an entry carries is consulted ONLY on an accounted entry, because an entry can carry a token and still be open (a BOUNDED entry missing a slot; a SOURCED entry with a bad table). Rows are tested IN ORDER and the first match wins:

| row | owner's Decisions state | accounting state | lands in |
|---|---|---|---|
| 1 | any, or none — tested FIRST | in `key_defects` (an orphan entry whose heading ID matches no Decisions entry; a second entry or heading under an already-used ID) | reported in chat at the Mechanism read (after Step 0b's last write, before generation); no carrier — a key with no owner has nowhere to land, and a duplicate is excluded from `rules_total`. Its record row: the heading's ID plus `line N`, the defect kind (`orphan` / `duplicate`) in the state column, owner `none` (orphan) or `duplicate` (a second claim on an owned ID), destination `none` |
| 2 | NOT a live rule (`Kind: fact` / `scope`, or `Disposition: superseded` / `assigned`) | any — an entry or none, well-formed or not | nowhere — permitted history; `explore.md` travels unchanged; the record lists it as not carried with NO state word (the engine assigns none to a non-live owner) |
| 3 | live rule | OPEN — in `rules_open` (any state that field defines, whatever `Closure:` token the entry carries); from the file alone: no entry, or an entry failing any clause of the Mechanism grammar | UNACCOUNTED: ONE `design.md` Risks entry naming the rule as the readout names it — the ID, or `line N` for an ID-less entry, per `orbit-run-summary-emit`'s identifier rule — with the state word (the readout's when one is at hand; else the failing grammar clause, in the grammar's vocabulary); the spec delta carries nothing for it; never blocking |
| 4 | live rule | accounted, `Closure: DERIVED` or `SOURCED` | the spec delta requirement the rule derives: the domain table as one of the CLOSED shapes below, the `Closure:` justification as the sentence naming the source |
| 5 | live rule | accounted, `Closure: BOUNDED` (both residual slots present, by construction) | `Residual kind:` and `Residual method:` VERBATIM in that requirement's text as a named limit (the OWNER — only spec text survives archive); ONE `design.md` Risks entry naming the rule ID and POINTING at the requirement, restating nothing |

**The CLOSED shapes.** A CLOSED domain table lands in requirement text as one of four shapes, each observed on the record: a normative TABLE (the re-entry table in `orbit-explore-modifications`), a GRAMMAR or production block (the Mechanism grammar's fences in `orbit-conventions`), a SCENARIO SET — one scenario per member (the maturity rungs in `orbit-run-summary-emit`), or a SENTENCE naming the source with the members in prose (the concluded outcome's reader sentence in `orbit-conventions`). Which shape fits is the author's judgement; the record says which was chosen. This set is BOUNDED, and its named limit is stated here, once:

- Residual kind: a destination shape for a CLOSED domain table that none of the four names
- Residual method: classify the spec deltas of the next archived change that consumed a Mechanism section (this stage's own is the first through the mapping) against the four; a delta whose domain landed in none is a fifth row and a revision of this table

**The record.** The generated `design.md` SHALL carry a `## Mechanism → artifacts` section: one table row per Mechanism entry (and per live rule with none) — the rule as the readout names it (ID, or `line N`; a key defect by ID plus `line N`), its closure token or its state word (the readout's when one is at hand; else the failing grammar clause; the defect kind for a key defect), its owner's state (`none` for an orphan; `duplicate` for a second claim), and its destination named as a requirement title (and the shape, for CLOSED entries; `none` for a key defect) — plus a header line stating the source: "the proposing AI's reading of the file; no engine record" — always that sentence, because no engine record is consulted at propose. Before the staging directory is moved, propose verifies by grep that every BOUNDED entry the table sent to row 5 (a live, accounted rule — never a history row) has its two residual lines in a delta spec under `specs/`; a miss is reported and fixed before the move.

#### Scenario: A BOUNDED entry's residual travels to spec text with a design pointer

- **WHEN** a live rule's Mechanism entry is `Closure: BOUNDED` with both residual slots, and propose generates the artifacts
- **THEN** the two slot lines appear verbatim in the owning requirement's text in the delta spec, `design.md`'s Risks carries one entry naming the rule ID and pointing at that requirement, and the record's row for the entry names both carriers

#### Scenario: A CLOSED entry informs the requirement it derives

- **WHEN** a live rule's Mechanism entry is `Closure: DERIVED` or `Closure: SOURCED`
- **THEN** the record names the requirement the domain table landed in and which of the four shapes it took; the `Closure:` justification is the requirement's sourcing sentence

#### Scenario: A non-live owner is history

- **WHEN** a Mechanism entry's owning Decisions entry carries `Kind: fact`, `Kind: scope`, `Disposition: superseded <ID>` or `Disposition: assigned <stage>`
- **THEN** nothing is generated from it; the record lists it as not carried; `explore.md` is unchanged

#### Scenario: An unaccounted live rule is recorded, never blocking

- **WHEN** a live rule is in `rules_open` (any state), whatever `Closure:` token its entry carries
- **THEN** row 3 applies: `design.md`'s Risks carries one entry naming the rule as the readout would (ID, or `line N`) and the state word, the record lists it as UNACCOUNTED, no spec text is generated for it, and generation proceeds

#### Scenario: A BOUNDED entry missing a slot is unaccounted, not a residual

- **WHEN** a live rule's entry reads `Closure: BOUNDED` and carries `Residual kind:` but no `Residual method:`
- **THEN** the rule is `bounded-incomplete` in `rules_open`, row 3 applies and row 5 does not: nothing is copied into spec text, and the record names the rule UNACCOUNTED with that state word

#### Scenario: A malformed entry on a non-live owner is history

- **WHEN** a Decisions entry carries `Kind: fact` and its Mechanism entry has a `Domain:` table with no member rows
- **THEN** row 2 applies: nothing is generated, the record lists it as not carried with no state word, and no Risks entry is written

#### Scenario: A duplicate-ID entry is a key defect before it is anything else

- **WHEN** two Decisions entries carry the same ID and the second is a live rule with a well-formed, accounted-looking Mechanism entry
- **THEN** row 1 applies to the second entry (it is in `key_defects` and excluded from `rules_total`): it is reported and nothing is carried from it; the first entry is judged by rows 2–5 on its own state

#### Scenario: An orphan Mechanism entry has a record row and no carrier

- **WHEN** the Mechanism section carries `### D-x-9 — …` and no Decisions entry has ID `D-x-9`
- **THEN** row 1 applies: the record carries the row `D-x-9 at line N` / `orphan` / owner `none` / destination `none`, the defect is reported in chat at the Mechanism read, and nothing is generated from it

#### Scenario: A duplicate Mechanism heading has a record row naming the second claim

- **WHEN** two `### D-x-2 — …` headings exist under `## Mechanism`
- **THEN** the first is judged by rows 2–5 on its own state; the second gets row 1's record row — `D-x-2 at line N` / `duplicate` / owner `duplicate` / destination `none` — and is reported, not carried

#### Scenario: Accounted is decidable from the file alone

- **WHEN** a live rule's entry reads `Closure: SOURCED` and its `Domain:` table has no member rows, and the proposing AI has no readout at hand
- **THEN** the entry fails the grammar's member-row clause, is OPEN, and row 3 applies with the state column reading that clause; row 4 is never reached

#### Scenario: No prior emit is read as a cross-check

- **WHEN** the staging `.orbit-runs/` holds one or more explore emits when propose runs in consume mode
- **THEN** propose reads none of them as a source for the record and fires none; the record's header line reads "the proposing AI's reading of the file; no engine record"

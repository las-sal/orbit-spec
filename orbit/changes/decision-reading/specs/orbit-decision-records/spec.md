## MODIFIED Requirements

### Requirement: Decision records are written for a reader who knows only the architecture

Every plain-language field of a decision record SHALL be written so that a reader who knows the program's
architecture doc — its Premise, Goals, Rulings and stage charters — and nothing else understands it. Any other term
is defined in the record's `defines` list, or not used. Implementation detail the AI knows and the reader does not
(internal names, file layouts, mechanisms coined during the work) MAY appear in the `detail` field and SHALL NOT be
the only statement of what was decided. A plain field that restates something the record cites (a ruling, a goal, a
requirement, a resolution, an explore decision) states it as the cited text does, never narrowing or widening it.

What a record POINTS AT is part of the record, not outside knowledge: the text of each requirement, resolution and
explore decision it cites, its area's row in `The ledger's eighteen areas`, its stop condition's wording, the stop it
names, and when and in what work it was written. A reader is given them with the record (`The reading step's brief is
rendered by orbit`), so a reader who knows only the architecture doc can still check what the record relies on. The
fields the rule binds:

| field | record | reaches the reader as |
|---|---|---|
| `decided`, `alternatives`, `why` | ledger entry | the ledger, and the program brief built from it |
| `about`, `question` | stop record | the question put to the user at the stop |
| `answer`, `effect` | resolution | the answer as recorded, and the precedent later entries cite |
| `detail` | all three | not bound: may be technical, never the only statement |

Named limit — the fields are the ones this change defines.

Residual kind: a prose field a later stage adds to a record, or a new surface that renders record prose to the user

Residual method: when a field or surface is added, ask whether its text reaches the user; if it does, it joins this table

#### Scenario: A coined term is defined in the record

- **WHEN** a ledger entry's `why` uses "hub token", a term the architecture doc never uses
- **THEN** the entry's `defines` list carries `{term: "hub token", definition: "…"}`

#### Scenario: Detail is never the only statement

- **WHEN** a ledger entry's `decided` reads "see detail" and `detail` names the files changed
- **THEN** the entry fails this requirement: what was decided is stated nowhere a reader of the architecture can read

#### Scenario: A restatement keeps the cited text's meaning

- **WHEN** a ledger entry relying on R-adf-3 says its call stops on "an outward act", and R-adf-3's condition is "an
  outward or irreversible act the config has not granted"
- **THEN** the entry fails this requirement: the restatement widens the condition it cites

### Requirement: The plain-language rule is held by structure and by a reader

`Decision records are written for a reader who knows only the architecture` SHALL be held in two ways, which between
them reach every way a record can fail it:

| failure | caught by |
|---|---|
| a plain-language field left empty | orbit's write gate, which refuses it |
| a term in the `defines` list with no definition | orbit's write gate, which refuses it |
| a new term used in a plain field and left off the `defines` list | a reader |
| a plain field that relies on implementation detail | a reader |
| a plain field that is correct and still unclear | a reader |
| a plain field that restates something the record cites so that its meaning shifts | a reader, holding the cited text |

orbit checks FORM only: whether prose is clear is a reader's judgement (R-crc-10). The READER is the reading step
`orbit-review`'s `The reading step checks decision records in system review` defines, in which a reader given only the
brief orbit renders (`The reading step's brief is rendered by orbit`) judges whether each record makes sense. A record
the reader finds wanting is fixed by a replacement (`A record is fixed by a replacement, never edited`).

Named limit — the rows came from the decision-layer design and one probe of four records, not from a structure.

Residual kind: a way a record misleads its reader that none of the six rows names

Residual method: classify each reading's findings against the rows at its walk; a finding that fits none adds a row, as a change to the requirement

#### Scenario: An empty plain field is refused

- **WHEN** a stop payload's `question` is blank after trimming
- **THEN** the emit is refused naming `question`; no file is written

#### Scenario: An undefined term is refused

- **WHEN** a ledger payload's `defines` holds `{term: "hub token", definition: ""}`
- **THEN** the emit is refused naming `defines[0].definition`; no file is written

#### Scenario: A shifted restatement is a reader's finding

- **WHEN** the reading step reads a ledger entry whose `decided` restates a cited ruling without one of its qualifiers
- **THEN** the reader reports it under the fourth row, not as unclear, and orbit's write gate, which checks form only,
  had accepted the entry

## ADDED Requirements

### Requirement: A record is fixed by a replacement, never edited

A decision record SHALL never be edited or deleted once written. A record found wanting, by the reading step or by the
AI that wrote it, is fixed by a NEW record of the same kind whose `replaces` field names the old record's filename. The
old record and the new form a CHAIN; every reader of `decisions/` takes the LATEST record in each chain as the current
one. A replacement rewords; it never changes what happened, so it carries every LINK FIELD of the record it replaces
unchanged:

| record | link fields a replacement carries unchanged |
|---|---|
| ledger entry | `area`, `relies_on`, `raised_stop` |
| stop record | `condition` |
| resolution | `stop` |

One replacement carries every fix to one record: when a walk resolves several findings on one record, it writes ONE
replacement holding all of them. A finding a walk does not resolve (stale, deferred or escalated) writes none. A finding
that is a gap in the brief rather than in the record is fixed in the brief, never by a replacement. A finding that a
record cites the wrong thing is outside what a replacement can fix, since its links are fixed; the walk escalates it.

How each link between records follows a chain:

| link | follows the chain by |
|---|---|
| `replaces` itself | naming a record of the same kind in the same `decisions/` folder, belonging to the same work, that no other record already replaces |
| the at-most-one-resolution rule | counting a stop's resolutions with each chain collapsed to its latest, so a replacement of the one resolution is not a second |
| a new `raised_stop` or resolution `stop` | being refused when it names a replaced stop, naming the replacement to cite instead |
| a new `relies_on` citation of a resolution | being refused when it names a replaced resolution, naming the replacement to cite instead |
| a link written before its target was replaced | staying as written (the history is never rewritten); a reader follows the chain forward from it |

Named limit — the readers of `decisions/` this change knows are the write gate's link checks, the brief, the review
emit's selection and the archive emit's count; each takes the latest in every chain.

Residual kind: a reader of `decisions/` that a later stage adds and that reads a replaced record as current

Residual method: when a stage adds a reader of `decisions/`, its proposal checks it against this table; the requirement's named limit says so

Named limit — what a reader can find is not a closed set: the rows of the repair table above are the findings this
change knows (a record's wording, a gap in the brief, a wrong citation).

Residual kind: a reader finding about something other than a record's wording or the brief

Residual method: classify each reading's findings against this table at its walk; a finding that fits no row is a finding against this rule

#### Scenario: A replacement rewords and keeps its links

- **WHEN** ledger entry `ledger-A` exists and a ledger payload carries `replaces: "ledger-A.json"`, a reworded
  `decided`, and `area` and `relies_on` equal to `ledger-A`'s
- **THEN** the replacement is written, and `ledger-A` stays as it was

#### Scenario: A replacement that changes a link is refused

- **WHEN** a ledger payload carries `replaces: "ledger-A.json"` and an `area` different from `ledger-A`'s
- **THEN** the emit is refused naming `area`; no file is written

#### Scenario: Replacing the one resolution of a stop

- **WHEN** `stop-S` has one resolution, `resolution-B`, and a resolution payload names `stop-S` with
  `replaces: "resolution-B.json"`
- **THEN** the replacement is written: the stop still has one resolution, its latest wording

#### Scenario: A replaced resolution is not cited anew

- **WHEN** `resolution-B` has been replaced by `resolution-D`, and a ledger payload cites `resolution-B`'s token
- **THEN** the emit is refused naming `resolution-D` as the record to cite; an entry written before the replacement
  keeps its citation

#### Scenario: Several fixes to one record make one replacement

- **WHEN** a walk resolves three reading findings, all on `ledger-A`
- **THEN** it writes one replacement of `ledger-A` carrying all three fixes

### Requirement: The reading step's brief is rendered by orbit

`orbit decisions brief <change>` SHALL render, read-only, the brief the reading step gives its reader, and SHALL be the
only source of that brief: the reviewing session passes it to the reader verbatim and adds nothing. It writes no file
and prints the brief to standard output (`--json` prints the same content as structured data).

It SELECTS the records to read: every decision record in the change's `decisions/` folder written after the latest
in-context system review emit on the change's history, taking the latest record in each replacement chain; with no
such emit, every record. A selection that is empty renders a brief saying there is nothing to read.

For the selected records it renders, in this order:

| part | rendered as |
|---|---|
| the architecture doc | the full text of the doc the change cites (`architecture.doc` in its metadata), and of any other doc a selected record cites; with none, the brief says the reader knows no architecture doc |
| each record | its plain fields, its `defines` list, and its `detail` marked as not bound |
| a `requirement` citation | the requirement's text from the baseline spec, from its heading to its first scenario, under its capability and title |
| a `ruling` or `goal` citation | its id, which the reader finds in the architecture doc above |
| a `resolution` citation | the cited resolution's `answer` and `effect`, the latest in its chain |
| a `decision` citation | that Decisions entry's text from the `explore.md` it belongs to |
| a ledger entry's `area` | its row of `The ledger's eighteen areas`: the area's name and what it covers |
| a stop's `condition` | the condition's wording in `Three decision records, one job each` |
| a ledger entry's `raised_stop` or a resolution's `stop` | the named stop's `about` and `question` |
| when and in what work | the record's timestamp and the change or exploration it belongs to |

The brief carries content and never a path under `.orbit-runs/`, and names no review pass, finding or walk: its reader
is not a review-genre reviewer, and knows only what the brief carries.

The brief and the two engine-computed fields of `orbit-emit-composition`'s `The reading's selection is recorded at
review and archive` are the readers of `decisions/` this capability adds; no reader of run summaries reads the folder,
as `Where decision records are kept` states.

Named limit — a cited requirement is rendered from the BASELINE spec, which the write gate checked the citation
against; a delta in the change that modifies that requirement is not shown.

Residual kind: a record whose citation names a requirement the change itself rewrites, read against its old text

Residual method: the reader is told, in the brief, that cited requirement text is the baseline's; the walk compares the change's delta when a finding turns on it

#### Scenario: The brief carries only the doc and the records' content

- **WHEN** `orbit decisions brief foo` runs on a change citing `prog`, whose `decisions/` holds one ledger entry citing
  `{kind: "requirement", capability: "cap", title: "T"}`
- **THEN** the output holds `prog`'s text, the entry's plain fields, requirement T's text and the area's row, and no
  `.orbit-runs/` path

#### Scenario: Only records new since the last reading are selected

- **WHEN** a change's history holds `ledger-A` and `ledger-B`, and an in-context system review emit whose token falls
  between them
- **THEN** the brief renders `ledger-B` alone

#### Scenario: A replaced record is not rendered

- **WHEN** `ledger-A` is replaced by `ledger-C`, both written after the last reading
- **THEN** the brief renders `ledger-C` and not `ledger-A`

#### Scenario: A change with no records renders nothing to read

- **WHEN** `orbit decisions brief foo` runs on a change whose `decisions/` folder is absent or empty
- **THEN** the output says there is nothing to read, and the command exits zero

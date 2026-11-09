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

### Requirement: A ledger entry names what it relies on

A ledger entry SHALL cite, in `relies_on`, each approved thing its decision rests on, or cite nothing and name, in
`raised_stop`, the stop it raised; never both. An entry citing nothing and naming no stop is refused, and so is an
entry that cites something and also names a stop. The citable kinds, and how orbit confirms each exists:

| kind | written as | exists when |
|---|---|---|
| `requirement` | `{kind, capability, title}` | `orbit/specs/<capability>/spec.md` holds `### Requirement: <title>` |
| `ruling` | `{kind, doc, id}` | `orbit/architecture/<doc>.md` holds the ruling ID in bold (`**<id>**`) under `## Rulings index` |
| `goal` | `{kind, doc, id}` | `orbit/architecture/<doc>.md` holds the goal ID in bold (`**<id>`) under `## Goals`, followed by a space, an em dash or `**` |
| `resolution` | `{kind, change, token}` or `{kind, doc, token}` | a resolution record `resolution-<token>.json` is found by the lookup below, and reads as JSON whose `command` is `resolution` |
| `decision` | `{kind, id}` | the `explore.md` of the change or exploration the entry belongs to holds a Decisions entry with that ID whose `Disposition:` is `live` or absent; on an architecture-scoped entry, which has no `explore.md`, the kind is refused |
| nothing | `relies_on: []` and `raised_stop` | the named stop exists in the same `decisions/` folder, belongs to the same work, and its condition is `security-unprecedented` or `user-facing-uncovered` |

How the rows are read:

- `capability` and `doc` are single names, held to the same rule as the emit surface's `--change` and `--doc` values
  (no path separator, no `..`, no empty name); `change` in a `resolution` citation is held to it too.
- An ID matches only as a whole: `G1` does not match `**G10 — …**`. A ruling ID is followed by `**`; a goal ID by a
  space, an em dash or `**`.
- A heading or bold ID inside a fenced code block does not count.
- A `resolution` citation names its record by the history it belongs to and its filename token, never by path, because
  the history moves: an exploration's moves into the change at propose, and a change's moves into the archive. The
  lookup for `{change, token}` tries, in order, `orbit/changes/<change>/.orbit-runs/decisions/`,
  `orbit/explore/<change>/.orbit-runs/decisions/`, then the `decisions/` folder of each archived change whose directory
  is `orbit/changes/archive/<YYYY-MM-DD>-<change>/`, newest first when a name was archived more than once; the first
  folder holding `resolution-<token>.json` is used. The lookup for `{doc, token}` reads
  `orbit/architecture/.orbit-runs/decisions/`, and the record's `doc` must equal `<doc>`.
- A cited record that cannot be read, is not valid JSON, or is not a resolution is refused, naming the citation.
- A stop belongs to the same work as the record naming it when the stop's `change` and `doc` equal that record's own.
  Every program's architect sessions share one `decisions/` folder, so there the test is the `doc`: a record for one
  program cannot name another program's stop.
- Who wrote a Decisions entry is not checked: `explore.md` records no author a check can read, so an entry the AI wrote
  resolves the same as one the user made. G4's closing review, which reads the ledger beside the exploration, is
  where such a citation is found; the reading step judges a record's wording, not who wrote what it cites.

A citation that points at nothing is refused, naming it. A resolution, once written, is citable, so a question the user has
answered does not stop a run twice. orbit confirms that a cited thing EXISTS, never that it COVERS the decision: whether
it does, and whether every qualifying call was recorded at all, are judgements for G4's closing review (R-crc-10).

Named limit — other approved sources may exist (a project's CLAUDE.md rule, a convention file).

Residual kind: an approved source a ledger entry relies on that is not one of these kinds

Residual method: such a citation is refused at write, which surfaces the kind; adding it is a change to the requirement

#### Scenario: A citation of a missing requirement is refused

- **WHEN** a ledger payload cites `{kind: "requirement", capability: "orbit-review", title: "No such thing"}`
- **THEN** the emit is refused naming the citation; no file is written

#### Scenario: An earlier resolution is precedent

- **WHEN** a ledger payload cites `{kind: "resolution", change: "bar", token: "<the token of an existing resolution record of change bar>"}` and nothing else
- **THEN** the entry is written; no stop is needed

#### Scenario: A resolution citation survives the archive

- **WHEN** change `bar`, holding `resolution-2026-11-07T10-00-00Z.json`, is archived to
  `orbit/changes/archive/2026-11-08-bar/`, and a ledger payload in another change cites
  `{kind: "resolution", change: "bar", token: "2026-11-07T10-00-00Z"}`
- **THEN** the citation resolves in the archived change's `decisions/` folder and the entry is written

#### Scenario: A precedent in an older archive of a reused name is found

- **WHEN** `orbit/changes/archive/2026-11-08-bar/` and `orbit/changes/archive/2026-12-01-bar/` both exist, only the
  older holds `resolution-2026-11-07T10-00-00Z.json`, and a ledger payload cites
  `{kind: "resolution", change: "bar", token: "2026-11-07T10-00-00Z"}`
- **THEN** the citation resolves in `orbit/changes/archive/2026-11-08-bar/` and the entry is written

#### Scenario: A goal ID matches only as a whole

- **WHEN** a ledger payload cites `{kind: "goal", doc: "prog", id: "G1"}` and `orbit/architecture/prog.md` holds
  `**G10 — …**` and `**G11 — …**` under `## Goals` but no `G1`
- **THEN** the emit is refused naming the citation; no file is written

#### Scenario: A superseded decision is not citable

- **WHEN** a ledger payload cites `{kind: "decision", id: "D-foo-2"}` and the change's `explore.md` holds `D-foo-2` with
  `Disposition: superseded D-foo-3`
- **THEN** the emit is refused naming the citation; no file is written

#### Scenario: An unreadable cited record is refused

- **WHEN** a ledger payload's `resolution` citation names a `resolution-<token>.json` that holds invalid JSON, or whose
  `command` is not `resolution`
- **THEN** the emit is refused naming the citation; no file is written

#### Scenario: An entry relying on nothing must name its stop

- **WHEN** a ledger payload has `relies_on: []` and no `raised_stop`
- **THEN** the emit is refused naming `raised_stop`; no file is written

#### Scenario: An entry cannot both cite and name a stop

- **WHEN** a ledger payload's `relies_on` holds a citation and the payload also carries `raised_stop`
- **THEN** the emit is refused naming `raised_stop`; no file is written

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
that is a gap in the brief rather than in the record is a finding against `The reading step's brief is rendered by
orbit`, which only orbit's own code can fix: the walk records it `deferred`, naming that requirement, and writes no
replacement. A finding that a record cites the wrong thing is outside what a replacement can fix, since its links are
fixed; the walk escalates it.

A walk entry that resolves a finding by a replacement records, in its sweep, the replacement's path and a phrase of its
new wording under `introduced`, and the replaced record under `kept`, its `why` being that a replaced record is never
edited (`orbit-emit-composition`'s `The walk write gate checks sweep evidence`); the entry's `file` stays the replaced
record, as the finding named it.

How each link between records follows a chain:

| link | follows the chain by |
|---|---|
| `replaces` itself | naming a record of the same kind in the same `decisions/` folder, belonging to the same work, that no other record already replaces |
| the at-most-one-resolution rule | counting over the stop's WHOLE chain: a stop chain has at most one resolution chain, whichever record of the stop chain each resolution names, and each resolution chain counts once, so a replacement of the one resolution is not a second, and a resolution naming the stop's replacement is |
| a new `raised_stop` or resolution `stop` | being refused when it names a replaced stop, naming the replacement to cite instead |
| a new `relies_on` citation of a resolution | being refused when it names a replaced resolution, naming the replacement to cite instead |
| a link a replacement carries unchanged | staying as its original wrote it, even when its target has since been replaced: the replacement rewords, and the link is not new, so it is read like any link written before its target was replaced |
| a link written before its target was replaced | staying as written (the history is never rewritten); a reader follows the chain forward from it |

Named limit — the readers of `decisions/` this change knows are the write gate's link checks, the brief, the review
emit's selection and read-list check and the archive emit's count; each takes the latest in every chain.

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

#### Scenario: A record whose target was replaced can still be replaced

- **WHEN** `stop-S` is replaced by `stop-T`, and a ledger payload carries `replaces: "ledger-L.json"` and
  `raised_stop: "stop-S.json"`, `ledger-L`'s own
- **THEN** the replacement is written: the carried link is not new, and a reader follows it forward to `stop-T`

#### Scenario: A stop answered through its earlier record is not answered again

- **WHEN** `stop-S` has the resolution `resolution-B`, `stop-S` is replaced by `stop-T`, and a resolution payload names
  `stop-T` without `replaces`
- **THEN** the emit is refused naming `resolution-B`: the stop chain already has its one resolution chain

### Requirement: The reading step's brief is rendered by orbit

`orbit decisions brief <change>` SHALL render, read-only, the brief the reading step gives its reader, and SHALL be the
only source of that brief: the reviewing session passes it to the reader verbatim and adds nothing. It writes no file
and prints the brief to standard output (`--json` prints the same content as structured data).

It SELECTS the records to read: the latest record in each replacement chain of the change's `decisions/` folder that no
in-context system review emit on the change's history lists in its `decision_records_read`
(`orbit-emit-composition`'s `The reading's selection is recorded at review and archive`). No ordering of timestamps
decides it: a record a skipped reading did not read, or one written while a pass ran, stays selected until a reading
lists it. A selection that is empty renders a brief saying there is nothing to read.

For the selected records it renders, in this order:

| part | rendered as |
|---|---|
| the architecture doc | the full text of the doc the change cites (`architecture.doc` in its metadata), and of any other doc a selected record cites; with none, the brief says the reader knows no architecture doc |
| each record | under its bare filename, the name the reader reports it by: its plain fields, its `defines` list, and its `detail` marked as not bound |
| a `requirement` citation | the requirement's text from the baseline spec, from its heading to its first scenario, under its capability and title |
| a `ruling` or `goal` citation | its id, which the reader finds in the architecture doc above |
| a `resolution` citation | the cited resolution's `answer` and `effect`, the latest in its chain |
| a `decision` citation | that Decisions entry's text from the `explore.md` it belongs to |
| a ledger entry's `area` | its row of `The ledger's eighteen areas`: the area's name and what it covers |
| a stop's `condition` | the condition's wording in `Three decision records, one job each` |
| a ledger entry's `raised_stop` or a resolution's `stop` | the named stop's `about` and `question` |
| when and in what work | the record's timestamp and the change or exploration it belongs to |
| the reader's task, last | the four reader rows of `The plain-language rule is held by structure and by a reader`; the severity rule of `orbit-review`'s `The reading step checks decision records in system review`; that cited requirement text is the baseline's; and the return shape: one finding per record and row, naming the record by its filename, the row, the field, and what a reader would take it to mean |

The brief points its reader at no file to open: of its own it names no path under `.orbit-runs/`, no review pass, no
finding and no walk, and a record is named by its bare filename. Text it quotes (a cited requirement, a record's prose,
the doc) is rendered whole, a path inside it included, since the reader reads it and opens nothing. Its reader is not a
review-genre reviewer, and knows only what the brief carries.

A brief is whole or absent, never partial: when a selected record cannot be read or is not valid JSON, or a source the
brief renders (the architecture doc, a cited requirement, resolution or Decisions entry) no longer resolves, the command
exits non-zero naming it and prints nothing to standard output, so a failure is never read as an empty selection.

The brief and the fields of `orbit-emit-composition`'s `The reading's selection is recorded at review and archive` are
the readers of `decisions/` this capability adds; no reader of run summaries reads the folder, as `Where decision
records are kept` states.

Named limit — a cited requirement is rendered from the BASELINE spec, which the write gate checked the citation
against; a delta in the change that modifies that requirement is not shown.

Residual kind: a record whose citation names a requirement the change itself rewrites, read against its old text

Residual method: the reader is told, in the brief, that cited requirement text is the baseline's; the walk compares the change's delta when a finding turns on it

#### Scenario: The brief carries only the doc and the records' content

- **WHEN** `orbit decisions brief foo` runs on a change citing `prog`, whose `decisions/` holds one ledger entry citing
  `{kind: "requirement", capability: "cap", title: "T"}`
- **THEN** the output holds `prog`'s text, the entry's filename and plain fields, requirement T's text, the area's row
  and the reader's task, and no `.orbit-runs/` path

#### Scenario: Only records no reading listed are selected

- **WHEN** a change's history holds `ledger-A` and `ledger-B`, and an in-context system review emit lists `ledger-A.json`
  in its `decision_records_read`
- **THEN** the brief renders `ledger-B` alone

#### Scenario: A replaced record is not rendered

- **WHEN** `ledger-A` is replaced by `ledger-C`, and no reading has listed either
- **THEN** the brief renders `ledger-C` and not `ledger-A`

#### Scenario: A cited path is quoted whole

- **WHEN** a selected ledger entry cites `{kind: "requirement", capability: "orbit-decision-records", title: "Where
  decision records are kept"}`
- **THEN** the brief renders that requirement's text with the `.orbit-runs/` paths it holds, and names no other path
  under `.orbit-runs/`

#### Scenario: A missing source fails the brief

- **WHEN** a selected ledger entry cites a requirement the baseline spec no longer holds
- **THEN** the command exits non-zero naming the citation and prints nothing to standard output

#### Scenario: A change with no records renders nothing to read

- **WHEN** `orbit decisions brief foo` runs on a change whose `decisions/` folder is absent or empty
- **THEN** the output says there is nothing to read, and the command exits zero

# orbit-decision-records Specification

## Purpose
The three DECISION RECORDS a run keeps for the people it answers to (stage `decision-layer` of `automate-dev-flow`): the LEDGER ENTRY, for a call the AI makes in one of eighteen named areas that affect the end user or involve security, with what it relies on; the STOP RECORD, for a moment one of R-adf-3's stop conditions arises; and the RESOLUTION, the user's answer to a stop, which later entries may cite as precedent. Each is written in plain language for a reader who knows only the program's architecture doc, checked for form and existence before it is written, and kept in the `decisions/` folder of the history it belongs to. The records are written in every mode and halt nothing by themselves.
## Requirements
### Requirement: Three decision records, one job each

orbit SHALL keep three DECISION RECORDS, each written for exactly one kind of event:

| record | written when | carries |
|---|---|---|
| ledger entry | the AI makes a call that falls in one of the ledger's eighteen areas (`The ledger's eighteen areas`) | the area, what was decided, the alternatives, why, and what approved thing it relies on |
| stop record | one of `automate-dev-flow`'s R-adf-3 stop conditions arises | which condition, what it is about, and the question for the user |
| resolution | the user answers a stop | which stop, the answer, and what happens next |

Each event maps to its records by this table: a row for a plain ledger call, one row per stop condition (the closed set
R-adf-3 ratifies), and a row for the user's answer:

| event | records |
|---|---|
| a call in one of the eighteen areas | a ledger entry |
| condition `security-unprecedented`: a security-relevant call with nothing approved to rely on | a stop record, then the ledger entry for the call, pointing at the stop |
| condition `user-facing-uncovered`: an end-user-visible call that no ratified goal covers | a stop record, then the ledger entry for the call, pointing at the stop |
| condition `ruling-amendment`: amending a ratified ruling or goal | a stop record, raised directly |
| condition `outward-act`: an outward or irreversible act the settings do not grant | a stop record, raised directly |
| condition `tripwire`: a sideways tripwire firing | a stop record raised by orbit itself (stage `tripwires`), never by the AI |
| condition `unresolvable-critical`: a CRITICAL review finding that no edit inside the change resolves | a stop record, raised directly |
| the user answers a stop | a resolution naming that stop |

A stop is OPEN until a resolution names it, and a stop has at most one resolution. The ledger records every call the
AI made in those areas, and the stops record every time it needed the user; a call that is not about the user or security
never enters the ledger, so a stop raised by `ruling-amendment`, `outward-act` or `unresolvable-critical` carries no
ledger entry of its own. A ledger entry is not the cadence judgement of `orbit-run-summary-emit`'s `The judgement
record — one spine, two kinds`: that record stays as it is, on its three emits, and the two never share a key.

Named limit — the at-most-one-resolution check assumes one writer per `decisions/` folder at a time: it reads the
folder, then writes, and nothing holds the folder between the two.

Residual kind: two resolutions of one stop written concurrently, each passing the check before the other lands

Residual method: a later resolution of that stop is refused naming every resolution already naming it, so the duplicate surfaces; serializing writers belongs to stage `parallel-lanes` of `automate-dev-flow` (R-adf-4), where concurrent writers first arise

#### Scenario: A call with no precedent writes a stop, then its ledger entry

- **WHEN** a stop record of condition `security-unprecedented` is written, and then a ledger entry in area `secrets`
  with `relies_on: []` whose `raised_stop` names that stop
- **THEN** both records are written, and the ledger entry points at the stop

#### Scenario: Amending a ruling raises a stop with no ledger entry

- **WHEN** a stop record of condition `ruling-amendment` is written and no ledger entry names it
- **THEN** the stop record is written: a stop of that condition needs no ledger entry

#### Scenario: A stop stays open until answered

- **WHEN** a stop record exists and no resolution names it
- **THEN** the stop is open; once the user's resolution is written naming it, the stop is closed and a second resolution
  naming it is refused

### Requirement: Decision records are written for a reader who knows only the architecture

Every plain-language field of a decision record, and of a change's account, SHALL be written so that a reader who knows the program's
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
| `decided`, `alternatives`, `why` | ledger entry | the ledger, and the brief built from it (`orbit-program-brief`) |
| `about`, `question` | stop record | the question put to the user at the stop, and the brief's stops |
| `answer`, `effect` | resolution | the answer as recorded, the precedent later entries cite, and the brief's stops |
| `built`, `seams`, `deviations` | account | the brief's what was built, new seams and deviations from the charter |
| `detail` | every record | not bound: may be technical, never the only statement |

Named limit — the fields are the ones the decision records and the account define; the brief (`orbit-program-brief`)
shows each of them as written, and its `defines` lists as its new terms.

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

#### Scenario: A stop's question reaches the user in the brief too

- **WHEN** a change brief (`orbit-program-brief`) is rendered for a change holding a stop record
- **THEN** the stop's `about` and `question` are shown as written, so the rule binds them for that reader as for the
  user at the stop

#### Scenario: An account's coined term is defined

- **WHEN** an account's `seams` uses "hold", a term the architecture doc never uses
- **THEN** the account's `defines` list carries `{term: "hold", definition: "…"}`

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

### Requirement: The ledger's eighteen areas

A call SHALL be recorded in the ledger when it falls in one of these areas, and only then. Each ledger entry names its
area by the area's id:

| id | area | covers |
|---|---|---|
| `user-sees-or-does` | what the user sees or does | screens, messages, command output, how a feature behaves |
| `defaults` | defaults | what happens when the user sets nothing |
| `when-things-go-wrong` | when things go wrong | error handling the user meets: retries, fallbacks, failing loudly or quietly |
| `user-data` | the user's data | how it is stored, kept, changed between versions, or deleted |
| `things-others-build-on` | things others build on | interfaces, file formats, anything another system depends on |
| `docs` | docs | what the user is told |
| `who-can-get-in` | who can get in | logins, passwords, sessions, who may do what |
| `secrets` | secrets | keys, tokens and credentials, and where they are kept |
| `network-exposure` | exposure to the network | what is reachable, and from where |
| `trusting-input` | trusting input | what outside input is believed without checking |
| `new-dependencies` | new dependencies | adding someone else's code |
| `permissions-and-sandboxing` | permissions and sandboxing | what the software is allowed to touch |
| `encryption` | encryption | how data is protected |
| `personal-data-and-privacy` | personal data and privacy | what is collected about people, and who sees it |
| `cost` | cost | anything that spends money: paid APIs, cloud resources |
| `licensing` | licensing | a dependency's licence constraining what can be done with the result |
| `accessibility` | accessibility | whether some users cannot use it |
| `performance-user-feels` | performance the user feels | responsiveness, speed and limits a user notices |

Everything else — internal structure, naming, algorithms, code organisation, test approach, refactoring — the AI
decides without a ledger entry. The list alone decides: there is no catch-all test. A call that falls in two areas
(storing camera clips is both `user-data` and `personal-data-and-privacy`) is one entry naming either. Whether a call
falls in an area is the AI's judgement; orbit checks only that an entry names an id on this list.

Named limit — the list is Sal's choice of what matters, not derived from a structure.

Residual kind: a judgement that affects the end user or involves security and falls in none of the eighteen areas

Residual method: G4's closing review classifies a run's changes against the list; a qualifying call in no area adds its area, as a change to the requirement

#### Scenario: An internal call writes no entry

- **WHEN** the AI renames an internal module
- **THEN** no ledger entry is written: the call falls in no area

#### Scenario: An unknown area is refused

- **WHEN** a ledger payload's `area` is `ux`
- **THEN** the emit is refused naming `area` and listing the eighteen ids; no file is written

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
| `decision` | `{kind, id}` | the `explore.md` of the change or exploration the entry belongs to holds a Decisions entry with that ID whose `Disposition:` is `live` or absent; on a replacement, whose citation is carried, an entry with that ID whatever its `Disposition:`; on an architecture-scoped entry, which has no `explore.md`, the kind is refused |
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

A replacement's citations are its original's (`A record is fixed by a replacement, never edited`), and every one of them
was checked when the original was written, so a carried citation is checked for what a reader can still open, not for
whether it is still current. The rows above are every existence check the write gate runs on a ledger entry, and each
applies to a carried citation exactly as to a new one except the `decision` row: a superseded or assigned decision
stays citable by the record that cited it while it was live, as the brief renders any Decisions entry with its
`Disposition:` line (`The reading step's brief is rendered by orbit`). A carried `decision` citation of an ID the
`explore.md` no longer holds is refused, as a new one is.

Named limit — a carried `requirement`, `ruling` or `goal` citation is checked as a new one is: when another change's
archive renames or removes the cited requirement, or an architect session drops or renumbers the cited ruling or goal
ID, while this work is in flight, a replacement of the record is refused naming the citation; for a requirement, the
brief also fails on the record. Each case needs the cited source edited mid-flight, which orbit's one-session-at-a-time
use makes rare; the refusal surfaces it.

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

- **WHEN** a ledger payload without `replaces` cites `{kind: "decision", id: "D-foo-2"}` and the change's `explore.md`
  holds `D-foo-2` with `Disposition: superseded D-foo-3`
- **THEN** the emit is refused naming the citation; no file is written

#### Scenario: A replacement keeps its citation of a superseded decision

- **WHEN** ledger entry `ledger-A` cites `{kind: "decision", id: "D-foo-2"}`, `D-foo-2` then gains
  `Disposition: superseded D-foo-3`, and a ledger payload carries `replaces: "ledger-A.json"`, a reworded `decided`, and
  `area` and `relies_on` equal to `ledger-A`'s
- **THEN** the replacement is written, and a payload carrying the same citation without `replaces` is still refused

#### Scenario: A carried decision citation that names nothing is refused

- **WHEN** ledger entry `ledger-A` cites `{kind: "decision", id: "D-foo-2"}`, the change's `explore.md` no longer holds
  `D-foo-2`, and a ledger payload carries `replaces: "ledger-A.json"` with `ledger-A`'s `area` and `relies_on`
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

### Requirement: Where decision records are kept

Decision records SHALL be kept in a `decisions/` folder inside the history (`.orbit-runs/`) of the work they belong to,
named `<record>-<TS>.json` where `<record>` is `ledger`, `stop` or `resolution`:

| the record arises | it is kept in |
|---|---|
| during a change | `orbit/changes/<name>/.orbit-runs/decisions/` |
| during an exploration, before any change exists | `orbit/explore/<name>/.orbit-runs/decisions/`, moved into the change with the rest of the history at propose |
| during an architect session on a program | `orbit/architecture/.orbit-runs/decisions/`, the record naming its doc |
| as the user's answer to a stop | the same folder as the stop it answers |

The folder moves with a change when it is archived, as the rest of its history does. These are the three history
locations the emit surface writes by its scopes (change, doc); a project-wide record is not a place a judgement
arises. No reader of run summaries reads the folder: each reads only the files directly in `.orbit-runs/`.

#### Scenario: A ledger entry during a change lands in the change's folder

- **WHEN** `orbit emit ledger --change foo` is written
- **THEN** the file lands at `orbit/changes/foo/.orbit-runs/decisions/ledger-<TS>.json`

#### Scenario: Records made while exploring travel with the change

- **WHEN** a stop record is written by `orbit emit stop --change foo` while only `orbit/explore/foo/` exists, the
  directory is then moved to `orbit/changes/foo/` as propose moves it, and `orbit emit resolution --change foo` names
  that stop
- **THEN** the stop is found in `orbit/changes/foo/.orbit-runs/decisions/` and the resolution is written beside it

#### Scenario: Today's readers do not see the folder

- **WHEN** a change's history holds a `decisions/` folder of records
- **THEN** `orbit status`, the reviewed gates and the report render read the change exactly as they would without it

### Requirement: Decision records are written in every mode

Decision records SHALL be written under every setting, today's supervised flow included. Under supervised settings a
stop record means "the AI would have stopped here": the AI asks the user where it does today and nowhere else (a stop where today's flow asks nothing stays open), and
the record keeps the moment so
that G3 (stops are rare enough to be worth it) can be graded before anything runs unattended. A stop halts a run only
when a setting says so; this capability defines no setting, so in it no stop halts anything. Writing a record never
changes what the user sees in today's flow.

What tells the AI to write them is `orbit-conventions`' `Decision-writing discipline`, which every generated
workflow body with a disciplines epitome carries (onboard, which has none, names it); a record may also be written by invoking its command directly.

#### Scenario: A stop under supervised settings halts nothing

- **WHEN** a stop record is written while every setting is at its default
- **THEN** no gate, readout or next command changes, and the AI asks the user its question as it would have without the
  record

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

Each resolved finding writes its own replacement, of the LATEST record in the chain: when a walk resolves several
findings on one record, the first replaces the record, the next replaces that replacement, and so on, so each link of the
chain carries one walk entry's fix and the walk's one-finding-at-a-time cycle (`orbit-address-reviews`' `Walk-mode by
default with --batch opt-in`) holds unchanged. A finding a walk does not resolve (stale, deferred or escalated) writes none. A finding
that is a gap in the brief rather than in the record is a finding against `The reading step's brief is rendered by
orbit`, which only orbit's own code can fix: the walk records it `deferred`, naming that requirement, and writes no
replacement. A finding that a record cites the wrong thing is outside what a replacement can fix, since its links are
fixed; the walk escalates it.

A walk entry that resolves a finding by a replacement records, in its sweep, the replacement's path and a phrase of its
new wording under `introduced`, chosen free of double quotes, backslashes and line breaks because the gate matches it
against the record's JSON text, where those are escaped, and the record the replacement replaces under `kept`, its `why` being that a
replaced record is never edited (`orbit-emit-composition`'s `The walk write gate checks sweep evidence`); the entry's `file`
stays the record the finding named, even when its replacement replaces a later record of that record's chain.

How each link between records follows a chain:

| link | follows the chain by |
|---|---|
| `replaces` itself | naming a record of the same kind in the same `decisions/` folder, belonging to the same work, that no other record already replaces |
| the at-most-one-resolution rule | counting over the stop's WHOLE chain: a stop chain has at most one resolution chain, whichever record of the stop chain each resolution names, and each resolution chain counts once, so a replacement of the one resolution is not a second, and a resolution naming the stop's replacement is |
| a new `raised_stop` or resolution `stop` | being refused when it names a replaced stop, naming the replacement to cite instead |
| a new `relies_on` citation of a resolution | being refused when it names a replaced resolution, naming the replacement to cite instead |
| a link a replacement carries unchanged | staying as its original wrote it, even when its target has since been replaced: the replacement rewords, and the link is not new, so it is read like any link written before its target was replaced |
| a link written before its target was replaced | staying as written (the history is never rewritten); a reader follows the chain forward from it |

Named limit — the readers of `decisions/` this capability and `orbit-program-brief` know are the write gate's link
checks, the reading step's brief, the review emit's selection and read-list check, the archive emit's count, and the
brief `orbit brief` renders; each takes the latest in every chain.

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

#### Scenario: Several fixes to one record make a chain

- **WHEN** a walk resolves three reading findings, all on `ledger-A`, one after another
- **THEN** it writes three replacements, each replacing the latest in `ledger-A`'s chain and carrying one finding's fix,
  and the brief, the selection and the link checks read the third as current

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
and prints the brief to standard output (`--json` prints the same content as structured data, together with the
brief's text as `markdown`, so one run gives the reading step both the text it dispatches and the filenames it records).

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
| a ledger entry's `raised_stop` or a resolution's `stop` | the named stop's `about` and `question`, the latest in its chain |
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

### Requirement: Each change carries one account, written when apply is complete

Each change SHALL carry one ACCOUNT: a record, written by the AI in plain language, of what the change built, the new
places the user is asked something, and where the work left its plan — the three parts of the program brief (stage
program-brief of `automate-dev-flow`, R-adf-7) that no other record holds. The account is not a decision record: it
records no call and no stop, and `Three decision records, one job each` is unchanged. Its fields:

| field | holds |
|---|---|
| `built` | plain: what the change built, as its user would describe it |
| `seams` | plain: each new place the user is asked something, or where a setting now changes what happens; when there is none, it says so in words |
| `deviations` | plain: where the work left its stage's charter in the architecture doc the change cites, or, for a change citing none, the proposal's scope; when there is none, it says so in words |
| `defines` | as the decision records have it: every term a plain field uses that the architecture doc does not |
| `detail` | as the decision records have it: not bound by the plain-language rule, never the only statement |
| `replaces` | the account this one replaces, by filename |

It is kept in `orbit/changes/<name>/.orbit-runs/account/`, named `account-<TS>.json`, beside the `decisions/` folder and
outside it, and moves with the change when it is archived. Its accounts form one replacement chain, whose latest record
is the change's current account; a replacement may change any field, since an account records no link to another
record. The account is written under every setting, and writing it changes nothing the user sees or is asked.

APPLY IS COMPLETE when the change's apply gate passes: every task is checked, or every unchecked one is a declared,
marked `(User-validation` handoff (`orbit-engine-gates`' user-validation subset rule). An apply session writes or
replaces the account only when apply is complete at its end, so the account always describes finished work. Each step of
a change's lifecycle touches the account by this table:

| step | the account |
|---|---|
| explore, propose, ff, the proposal review and its walk | none: nothing is built yet |
| an apply session that ends with apply not complete | none, whether or not an account exists: the session that completes apply writes or replaces it |
| an apply session that ends with apply complete, on a change with no account | writes the account, before its run summary, or before its completion readout when it writes no run summary — whether it checked the last task, resumed after a session that ended before writing, or arrived on a change completed before accounts existed |
| an apply session that ends with apply complete, on a change that has an account (a walk reopened tasks) | when the work done since the latest account was written changed what it says, writes a replacement of it, at the same point; otherwise none |
| the system review | none: no reader takes the account (`No reader takes the account yet`) |
| a walk of an active change that has an account, when a resolved finding changes what was built, a seam, or a deviation | writes a replacement of the latest account; a walk that resolves any finding by reopening tasks writes none, not even for its other fixes: the apply session that completes them replaces it, covering those fixes too |
| a walk of an archived change | none: orbit writes no record to an archived change's trail, as for decision records |
| archive | none: the archived change keeps its latest account |

A change abandoned before apply is complete carries no account, and so does a change archived before its first
complete apply session ran after this requirement shipped. The table is closed by derivation: its rows are the
spec-driven schema's phases (explore and propose, the proposal review, apply, the system review, archive) with the walk
that follows each review, apply split by whether apply is complete at the session's end and whether an account already
exists, and a walk split by whether the change is active or archived.

The apply and address-reviews workflow bodies each carry the instruction for their rows of the table, each naming the
fields the write gate accepts (`orbit-emit-composition`'s `The write gate checks the account`) and how to invoke
`orbit emit account`, `replaces` included, so an installed skill of either needs no spec and no other skill to write
one; a test holds each body carrying the fields and the invocation.

#### Scenario: The session that completes apply writes the account

- **WHEN** an apply session checks the last unchecked task of change `foo`, which has no account
- **THEN** it writes `orbit/changes/foo/.orbit-runs/account/account-<TS>.json` with `built`, `seams` and `deviations`
  before its run summary

#### Scenario: A change ending on a user-validation handoff gets its account

- **WHEN** change `foo`'s `tasks.md` holds 1.1 and 1.2 and `- [ ] 2.1 (User-validation handoff) live-test`, and an apply
  session checks 1.1 and 1.2 and declares `user_validation_tasks: ["2.1"]`
- **THEN** apply is complete with 2.1 unchecked, and the session writes the account before its run summary

#### Scenario: A resumed session writes a missing account

- **WHEN** every task of change `foo` is checked, `foo` has no account (the session that checked the last task ended
  before writing it), and an apply session arrives on it
- **THEN** that session writes the account before its completion readout

#### Scenario: An apply session that leaves work writes none

- **WHEN** an apply session ends with a task of change `foo` still unchecked, and `foo` has no account
- **THEN** no account is written

#### Scenario: A reopened change replaces its account once, when apply completes

- **WHEN** a walk reopens two tasks of change `foo`, which has `account-A`; one apply session finishes the first and
  changes what `foo` does, and a second finishes the other
- **THEN** the first session writes no account, and the second, whose own task changed nothing the account says, writes
  one replacing `account-A` that describes the finished work

#### Scenario: A walk that reopens tasks writes no account

- **WHEN** a system walk of change `foo`, which has `account-A`, resolves a finding by reopening a task that adds a
  behaviour
- **THEN** the walk writes no account, and the apply session that completes the reopened task writes one replacing
  `account-A`

#### Scenario: A walk of an archived change writes no account

- **WHEN** `/orbit:address-reviews` walks an archived change that has an account, and a resolved finding changes what
  the account says
- **THEN** no account is written

#### Scenario: A walk fix that changes what was built replaces the account

- **WHEN** a system walk of change `foo`, which has `account-A`, resolves a finding by adding a behaviour the account
  does not mention
- **THEN** the walk writes an account carrying `replaces: "account-A.json"` that names the behaviour, and `account-A`
  stays as it was

#### Scenario: An uncited change states deviations against its proposal

- **WHEN** a change whose metadata carries no `architecture:` citation writes its account
- **THEN** its `deviations` field states where the work left the proposal's scope, or that it did not

#### Scenario: Archive writes no account

- **WHEN** change `foo`, holding `account-A` and its replacement `account-B`, is archived
- **THEN** the archived change's `.orbit-runs/account/` holds both, and no account is written by the archive

### Requirement: No reader takes the account yet

No reading step SHALL read a change's account until a later stage adds the setting under which one does (stage
program-brief's third change, D-pb-5 in `orbit/explore/program-brief/explore.md`). Because the account is kept outside
the `decisions/` folder, and the selection (`The reading step's brief is rendered by orbit`) reads only that folder,
every reader of the selection is unchanged by construction:

| reader of the selection | with an account in the change's history |
|---|---|
| `orbit decisions brief` | renders no account |
| the in-context system review's `decision_records_owed` and its read-list check | neither owes nor accepts an account |
| the archive emit's `decision_records_unread` | does not count the account |
| whether the reading step runs | unchanged: a change whose only record is its account has nothing selected, so no reader is dispatched |
| `orbit brief` (`orbit-program-brief`) | lists the records the selection returns as checked by no reader, and names the account apart, as checked by no reader too |

The rows are every caller of the one selection function.

No reader of run summaries reads the `account/` folder: `orbit status`, the reviewed gates and the report render read
only the files directly in `.orbit-runs/`, as they do for `decisions/` (`Where decision records are kept`).

Named limit — `The plain-language rule is held by structure and by a reader` holds an account's plain fields by the
write gate alone until a reading step takes the account: the reader rows of its table reach no account before stage
program-brief's third change.

Residual kind: an account whose prose is unclear, leans on implementation detail, restates what it cites with its meaning shifted, or uses a term it leaves undefined

Residual method: the third change's reading step, when sign-off is on; until then the user reads the account in the brief, and a finding against it is fixed by a replacement

#### Scenario: The brief does not render the account

- **WHEN** `orbit decisions brief foo` runs on a change whose history holds `account-A` and no decision record
- **THEN** the output says there is nothing to read, and the command exits zero

#### Scenario: The account is not counted unread at archive

- **WHEN** a change whose history holds `account-A` and one decision record no reading listed is archived
- **THEN** the archive emit carries `decision_records_unread: 1`

#### Scenario: The brief shows the account as checked by no reader

- **WHEN** `orbit brief --change foo` runs on a change whose history holds `account-A` and no decision record
- **THEN** its records-no-reader-checked section names no decision record and names the account as checked by no reader

#### Scenario: Today's readers do not see the account

- **WHEN** a change's history holds an `account/` folder
- **THEN** `orbit status`, the reviewed gates and the report render read the change exactly as they would without it


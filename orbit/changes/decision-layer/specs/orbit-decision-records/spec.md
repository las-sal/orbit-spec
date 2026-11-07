## ADDED Requirements

### Requirement: Three decision records, one job each

orbit SHALL keep three DECISION RECORDS, each written for exactly one kind of event:

| record | written when | carries |
|---|---|---|
| ledger entry | the AI makes a call that falls in one of the ledger's eighteen areas (`The ledger's eighteen areas`) | the area, what was decided, the alternatives, why, and what approved thing it relies on |
| stop record | one of `automate-dev-flow`'s R-adf-3 stop conditions arises | which condition, what it is about, and the question for Sal |
| resolution | Sal answers a stop | which stop, the answer, and what happens next |

Each event maps to its records by this table, one row per stop condition, which is the closed set R-adf-3 ratifies:

| event | records |
|---|---|
| a call in one of the eighteen areas | a ledger entry |
| condition `security-unprecedented`: a security-relevant call with nothing approved to rely on | a stop record, then the ledger entry for the call, pointing at the stop |
| condition `user-facing-uncovered`: an end-user-visible call that no ratified goal covers | a stop record, then the ledger entry for the call, pointing at the stop |
| condition `ruling-amendment`: amending a ratified ruling or goal | a stop record, raised directly |
| condition `outward-act`: an outward or irreversible act the settings do not grant | a stop record, raised directly |
| condition `tripwire`: a sideways tripwire firing | a stop record raised by orbit itself (stage `tripwires`), never by the AI |
| condition `unresolvable-critical`: a CRITICAL review finding that no edit inside the change resolves | a stop record, raised directly |
| Sal answers a stop | a resolution naming that stop |

A stop is OPEN until a resolution names it, and a stop has at most one resolution. The ledger records every call the
AI made in those areas, and the stops record every time it needed Sal; a call that is not about the user or security
never enters the ledger, so a stop raised by `ruling-amendment`, `outward-act` or `unresolvable-critical` carries no
ledger entry of its own. A ledger entry is not the cadence judgement of `orbit-run-summary-emit`'s `The judgement
record — one spine, two kinds`: that record stays as it is, on its three emits, and the two never share a key.

#### Scenario: A call with no precedent writes a stop, then its ledger entry

- **WHEN** the AI decides to keep a hub token in a plain file and finds no baseline requirement, ruling, goal, earlier
  resolution or exploration decision that covers it
- **THEN** it writes a stop record of condition `security-unprecedented`, then a ledger entry in area `secrets` whose
  `raised_stop` names that stop

#### Scenario: Amending a ruling raises a stop with no ledger entry

- **WHEN** a change would need R-adf-2 reworded
- **THEN** a stop record of condition `ruling-amendment` is written and no ledger entry accompanies it

#### Scenario: A stop stays open until answered

- **WHEN** a stop record exists and no resolution names it
- **THEN** the stop is open; once Sal's resolution is written naming it, the stop is closed and a second resolution
  naming it is refused

### Requirement: Decision records are written for a reader who knows only the architecture

Every plain-language field of a decision record SHALL be written so that a reader who knows the program's
architecture doc — its Premise, Goals, Rulings and stage charters — and nothing else understands it. Any other term
is defined in the record's `defines` list, or not used. Implementation detail the AI knows and the reader does not
(internal names, file layouts, mechanisms coined during the work) MAY appear in the `detail` field and SHALL NOT be
the only statement of what was decided. The fields the rule binds:

| field | record | reaches the reader as |
|---|---|---|
| `decided`, `alternatives`, `why` | ledger entry | the ledger, and the program brief built from it |
| `about`, `question` | stop record | the question put to Sal at the stop |
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

orbit checks FORM only: whether prose is clear is a reader's judgement (R-crc-10). The READER is a review step in which
someone given only the architecture doc and the record judges whether the record makes sense. Named limit — this
change ships the structure and its checks; the review step, and what makes it run, belong to the follow-on stage
`automate-dev-flow` declares after `decision-layer` (explore.md, D-dl-8). Until then the reader rows of this table are
covered by no step.

#### Scenario: An empty plain field is refused

- **WHEN** a stop payload's `question` is blank after trimming
- **THEN** the emit is refused naming `question`; no file is written

#### Scenario: An undefined term is refused

- **WHEN** a ledger payload's `defines` holds `{term: "hub token", definition: ""}`
- **THEN** the emit is refused naming `defines[0].definition`; no file is written

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
`raised_stop`, the stop it raised. An entry citing nothing and naming no stop is refused. The citable kinds, and how
orbit confirms each exists:

| kind | written as | exists when |
|---|---|---|
| `requirement` | `{kind, capability, title}` | `orbit/specs/<capability>/spec.md` holds `### Requirement: <title>` |
| `ruling` | `{kind, doc, id}` | `orbit/architecture/<doc>.md` holds the ruling ID in bold (`**<id>**`) under `## Rulings index` |
| `goal` | `{kind, doc, id}` | `orbit/architecture/<doc>.md` holds the goal ID in bold (`**<id>`) under `## Goals` |
| `resolution` | `{kind, path}` | `<path>` is a resolution record inside some history's `decisions/` folder |
| `decision` | `{kind, id}` | the `explore.md` of the change or exploration the entry belongs to holds a Decisions entry with that ID |
| nothing | `relies_on: []` and `raised_stop` | the named stop exists in the same history and its condition is `security-unprecedented` or `user-facing-uncovered` |

A citation that points at nothing is refused, naming it. A resolution, once written, is citable, so a question Sal has
answered does not stop a run twice. orbit confirms that a cited thing EXISTS, never that it COVERS the decision: whether
it does, and whether every qualifying call was recorded at all, are judgements for G4's closing review (R-crc-10).

Named limit — other approved sources may exist (a project's CLAUDE.md rule, a convention file).

Residual kind: an approved source a ledger entry relies on that is not one of these kinds

Residual method: such a citation is refused at write, which surfaces the kind; adding it is a change to the requirement

#### Scenario: A citation of a missing requirement is refused

- **WHEN** a ledger payload cites `{kind: "requirement", capability: "orbit-review", title: "No such thing"}`
- **THEN** the emit is refused naming the citation; no file is written

#### Scenario: An earlier resolution is precedent

- **WHEN** a ledger payload cites `{kind: "resolution", path: "<an existing resolution record>"}` and nothing else
- **THEN** the entry is written; no stop is needed

#### Scenario: An entry relying on nothing must name its stop

- **WHEN** a ledger payload has `relies_on: []` and no `raised_stop`
- **THEN** the emit is refused naming `raised_stop`; no file is written

### Requirement: Where decision records are kept

Decision records SHALL be kept in a `decisions/` folder inside the history (`.orbit-runs/`) of the work they belong to,
named `<record>-<TS>.json` where `<record>` is `ledger`, `stop` or `resolution`:

| the record arises | it is kept in |
|---|---|
| during a change | `orbit/changes/<name>/.orbit-runs/decisions/` |
| during an exploration, before any change exists | `orbit/explore/<name>/.orbit-runs/decisions/`, moved into the change with the rest of the history at propose |
| during an architect session on a program | `orbit/architecture/.orbit-runs/decisions/`, the record naming its doc |
| as Sal's answer to a stop | the same folder as the stop it answers |

The folder moves with a change when it is archived, as the rest of its history does. These are the three history
locations the emit surface writes by its scopes (change, doc); a project-wide record is not a place a judgement
arises. No reader of run summaries reads the folder: each reads only the files directly in `.orbit-runs/`.

#### Scenario: A ledger entry during a change lands in the change's folder

- **WHEN** `orbit emit ledger --change foo` is written
- **THEN** the file lands at `orbit/changes/foo/.orbit-runs/decisions/ledger-<TS>.json`

#### Scenario: Records made while exploring travel with the change

- **WHEN** `/orbit:propose foo` moves `orbit/explore/foo/` into `orbit/changes/foo/`
- **THEN** the records in `orbit/explore/foo/.orbit-runs/decisions/` now live in `orbit/changes/foo/.orbit-runs/decisions/`

#### Scenario: Today's readers do not see the folder

- **WHEN** a change's history holds a `decisions/` folder of records
- **THEN** `orbit status`, the reviewed gates and the report render read the change exactly as they would without it

### Requirement: Decision records are written in every mode

Decision records SHALL be written under every setting, today's supervised flow included. Under supervised settings a
stop record means "the AI would have stopped here": the AI asks Sal as it does today, and the record keeps the moment so
that G3 (stops are rare enough to be worth it) can be graded before anything runs unattended. A stop halts a run only
when a setting says so; this capability defines no setting, so in it no stop halts anything. Writing a record never
changes what Sal sees in today's flow.

Named limit — nothing in any generated skill yet tells the AI to write these records; until the follow-on stage
`automate-dev-flow` declares after `decision-layer` (explore.md, D-dl-8) adds that instruction, a record is written
only when the AI or Sal invokes the command directly.

#### Scenario: A stop under supervised settings halts nothing

- **WHEN** a stop record is written while every setting is at its default
- **THEN** no gate, readout or next command changes, and the AI asks Sal its question as it would have without the
  record

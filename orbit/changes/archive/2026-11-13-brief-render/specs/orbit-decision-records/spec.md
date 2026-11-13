## MODIFIED Requirements

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

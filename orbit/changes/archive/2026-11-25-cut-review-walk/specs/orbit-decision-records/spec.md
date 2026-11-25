## MODIFIED Requirements

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
chain carries one walk entry's fix and the walk's one-finding-at-a-time cycle (`orbit-address-reviews`' `Every walk
runs finding by finding`) holds unchanged. A finding a walk does not resolve (stale, deferred or escalated) writes none. A finding
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

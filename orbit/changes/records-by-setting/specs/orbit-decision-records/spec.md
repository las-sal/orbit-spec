## RENAMED Requirements

- FROM: `### Requirement: Decision records are written in every mode`
- TO: `### Requirement: Decision records are written when a setting reads them`

## MODIFIED Requirements

### Requirement: Decision records are written when a setting reads them

Decision records SHALL be written only while a reader of them runs, and then exactly as `orbit-conventions`'
`Decision-writing discipline` says (`reduce-orbit-phase1`'s R-rop-17). A reader runs in exactly these states of the
three settings that read the records, read at `92132d72`:

| setting state | records |
|---|---|
| a chain key granted (`chain.<key>: true`) | written: the chain's open-stop check runs before a granted next command (`orbit-engine-gates`' `The chain setting grants each command on its own key`) |
| a `chain:` map with no key granted, or no `chain:` key | not written by this term: no command chains, so the open-stop check never runs |
| `signoff: change` or `signoff: program` | written: the program brief shows the ledger, stops and resolutions to the user who signs off (`orbit-program-brief`) |
| `signoff: off`, absent, or an unrecognized value | not written by this term: nobody signs off |
| a tripwire sensor with `on_fire: halt` | written: a halting reading writes a `tripwire` stop that waits for the user's answer (`orbit-tripwires`' `A halting reading writes a tripwire stop`) |
| every sensor at `on_fire: record`, with a `tripwires:` key or none | not written by this term: no stop is written, and the sensors read only `tripwire` stops |

Records are written when ANY row marked written holds, and not otherwise. The table is SOURCED: the readers of a
`decisions/` folder are the modules in `src/core` that name the folder, each one's gating condition read at its lines.
The review's reading step and the walk's replacements are not terms: they read what was written, which at the defaults
is nothing, so the reading step is skipped as when nothing is selected. A later reader under a setting of its own (the
autonomous driver, `automate-dev-flow`'s stage `driver`) adds its row when it is built. `orbit decisions status says
whether decision records are written` computes the rule.

When records are written, a stop record means "the AI would have stopped here": the AI asks the user where it does
today and nowhere else (a stop where today's flow asks nothing stays open), and the record keeps the moment so that G3
(stops are rare enough to be worth it) can be graded. A stop halts a run only when a setting says so; this capability
defines no setting, so in it no stop halts anything. Writing a record never changes what the user sees.

What tells the AI to write them is `orbit-conventions`' `Decision-writing discipline`: every generated workflow body
with a disciplines epitome carries its basic content, which runs `orbit decisions status`, and the rule itself ships
beside the body (onboard, which has none, names it). A record may also be written by invoking its command directly, in
any state: the write gate does not read the settings, so a record written while none is owed is accepted and read as
any other.

#### Scenario: A stop under supervised settings halts nothing

- **WHEN** a stop record is written while every setting is at its default
- **THEN** no gate, readout or next command changes, and the AI asks the user its question as it would have without the
  record

#### Scenario: At the defaults no record is owed

- **WHEN** a project's `orbit/config.yaml` sets no `chain`, `signoff` or `tripwires` key
- **THEN** `orbit decisions status --json` reports `write: false` and `readers: []`

#### Scenario: Each reading setting makes records owed

- **WHEN** the project sets `chain.review: true`, or `signoff: change`, or `tripwires.touchpoints.on_fire: halt`
- **THEN** `orbit decisions status --json` reports `write: true`, with `readers` naming `chain`, `signoff` or
  `tripwires` respectively

#### Scenario: A setting with no reader owes nothing

- **WHEN** the project sets a `chain:` map whose keys are all `false`, and `tripwires.touchpoints.on_fire: record`
- **THEN** `orbit decisions status --json` reports `write: false`

## ADDED Requirements

### Requirement: orbit decisions status says whether decision records are written

`orbit decisions status` SHALL report, read-only and for the whole project, whether decision records are written:
`write` is true exactly when a row marked written in `Decision records are written when a setting reads them` holds,
and `readers` names each term that is on, in the order `chain`, `signoff`, `tripwires`. It takes no change name and no
doc: the settings are the project's, and every session whose body carries the decision-writing rule runs the same call,
whether it works on one change, on several (bulk-archive), on a named exploration, in an architect session, project-wide
(audit-drift, a project-wide walk, a bare explore) or as a dispatched worker, so the basic content can be one text in
the fourteen bodies that carry it (`orbit-conventions`' `Decision-writing discipline`). It prints one line, `Decision
records: not written (no setting reads them)` or `Decision records: written (read by <readers, comma-separated>)`;
`--json` prints `{"write": <boolean>, "readers": [<term>, …]}`. It reads `orbit/config.yaml` in the working tree through
each setting's own resolver, so an absent or unparseable file, or a value a resolver does not recognize, reads as that
setting at its default; it exits zero and writes nothing. The write gate does not read it.

The tripwire term is read from every sensor in orbit's sensor list, so a sensor added later is covered without an edit
here.

Named limit — the command reads the working tree's settings, while a halting sensor reads the committed config, or the
change's fixed point once apply has begun (`orbit-tripwires`' `A halting reading writes a tripwire stop`). The two
disagree only when a halt is removed after a change's fixed point: the sensor still halts and writes its stop, and the
answer to it goes unrecorded unless chain or signoff is on, under which records are written anyway.

#### Scenario: At the defaults the command says nothing is written

- **WHEN** `orbit decisions status` runs in a project with no `orbit/config.yaml`
- **THEN** it prints `Decision records: not written (no setting reads them)` and exits zero, and with `--json` prints
  `{"write": false, "readers": []}`

#### Scenario: Every reader that is on is named, in order

- **WHEN** the project sets `chain.address-reviews: true`, `signoff: program` and `tripwires.touchpoints.on_fire: halt`
- **THEN** `orbit decisions status --json` reports `write: true` and `readers: ["chain", "signoff", "tripwires"]`, and
  the plain output reads `Decision records: written (read by chain, signoff, tripwires)`

#### Scenario: An unparseable config reads as the defaults

- **WHEN** `orbit/config.yaml` is not valid YAML
- **THEN** `orbit decisions status --json` reports `write: false` and `readers: []`, and exits zero

#### Scenario: An unrecognized sign-off value is off

- **WHEN** the project sets `signoff: weekly` and nothing else
- **THEN** `orbit decisions status --json` reports `write: false`

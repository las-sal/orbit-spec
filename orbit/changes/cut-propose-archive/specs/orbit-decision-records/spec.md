## MODIFIED Requirements

### Requirement: orbit decisions status says whether decision records are written

`orbit decisions status` SHALL report, read-only and for the whole project, whether decision records are written:
`write` is true exactly when a row marked written in `Decision records are written when a setting reads them` holds,
and `readers` names each term that is on, in the order `chain`, `signoff`, `tripwires`. It takes no change name and no
doc: the settings are the project's, and every session whose body carries the decision-writing basic content runs the same call,
whether it works on one change, on a named exploration, in an architect session, project-wide
(audit-drift, a project-wide walk, a bare explore) or as a dispatched worker, so the basic content can be one text in
the thirteen bodies that carry it (`orbit-conventions`' `Decision-writing discipline`). It prints one line, `Decision
records: not written (no setting reads them)` or `Decision records: written (read by <readers, comma-separated>)`;
`--json` prints `{"write": <boolean>, "readers": [<term>, …]}`. It reads `orbit/config.yaml` (or `orbit/config.yml`) in the working tree through
each setting's own resolver, so an absent or unparseable file, or a value a resolver does not recognize, reads as that
setting at its default; it exits zero and writes nothing. The write gate does not read it.

The tripwire term is read from every sensor in orbit's sensor list, so a sensor added later is covered without an edit
here.

Named limit — the command reads the working tree's settings, while a halting sensor reads the committed config, or the
change's fixed point once apply has begun (`orbit-tripwires`' `A halting reading writes a tripwire stop`). The two can
disagree: a halt added or removed in the working tree and not yet committed, or a halt removed after a change's fixed
point. They disagree only about whether NEW records are written: a `tripwire` stop the sensor writes is answered
whatever the command reports, since a resolution answering a stop already in the trail is written under every result
(`orbit-conventions`' `Decision-writing discipline`).

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

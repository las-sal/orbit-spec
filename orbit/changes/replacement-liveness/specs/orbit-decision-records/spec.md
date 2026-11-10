## MODIFIED Requirements

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

Named limit — a carried `requirement` citation is checked as a new one is: when another change's archive renames or
removes the cited requirement while this work is in flight, a replacement of the record is refused naming the citation,
and the brief fails on the record. The case needs a second change archived mid-flight, which orbit's one-session-at-a-time
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

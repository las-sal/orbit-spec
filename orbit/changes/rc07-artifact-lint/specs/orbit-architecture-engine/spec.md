## MODIFIED Requirements

### Requirement: Parseable architecture-doc format

Architecture docs SHALL declare engine-readable structure via markdown heading conventions while
remaining judgment-dense prose documents: a stage is declared by a heading of the form
`### Stage <id> — <title>` (kebab-case `<id>`, unique within the doc), and a stage section MAY
carry two labeled slot lines — `Depends-on: <id>[, <id>…]` (or `Depends-on: (none)`) and
`Complete: [ ]` / `Complete: [x] <YYYY-MM-DD> (<who>)`. Both slots are OPTIONAL with defined
omission semantics: an absent `Depends-on:` parses as no dependencies; an absent `Complete:`
parses as unratified; validation accepts either omission; the architect ratification flow INSERTS
a missing `Complete:` line when writing a mark (per `orbit-architect`). The ARCHITECTURE PARSER's model contains ONLY:
stage ids/titles, the two slots, and section boundaries (a stage section runs from its heading to
the next same-or-higher-level heading). All other content — charter prose, exit criteria, premise,
rulings, status log — is opaque TO THE PARSER, and nothing downstream of `parseArchitectureDoc`
may read it.

One NAMED exception exists at the engine level, stated here because the earlier wording ("the
engine reads ONLY") would otherwise be falsified by it: the SOURCE LINT (`orbit-source-lint`) reads
a doc's `## Rulings index` section to compute `architecture.ruling-count`. That reader is not the
parser, contributes no field to the parsed model, and changes no doc classification — but it does
mean an author who reformats a ruling entry can change a source-lint result, so the opacity claim
is scoped to the parser rather than asserted of the whole engine. Any FURTHER engine-level reader
of otherwise-opaque content SHALL be named here the same way; an unnamed one is a violation of this
requirement. The parser SHALL be fence-aware: headings and slot lines
inside fenced code blocks are content, never declarations. **Near-miss rule** (a doc intended to
be parseable must not silently degrade to legacy): a heading starting `### Stage ` that fails the
exact grammar (malformed id, missing ` — <title>`), or a stage-like slot line that fails slot
syntax, is a VALIDATION ERROR naming the line — never silently ignored; `status` lists such a doc
as malformed rather than legacy. LEGACY means zero `### Stage `-prefixed headings anywhere
outside fences (genuinely opaque prose). Architecture docs live at
`orbit/architecture/<name>.md`; `<name>` (the filename stem) is the doc's citable identity.

#### Scenario: Stage declarations parse

- **WHEN** the parser reads a doc containing `### Stage d2-architect — architect (the program layer)` followed by `Depends-on: (none)` and `Complete: [ ]` lines
- **THEN** it yields a stage with id `d2-architect`, title `architect (the program layer)`, no dependencies, and an unratified completion mark

#### Scenario: Fenced look-alikes are content

- **WHEN** a doc contains a fenced code block whose text includes `### Stage fake-stage — x` or a `Complete: [x]` line
- **THEN** the parser declares no stage and no slot from inside the fence

#### Scenario: Duplicate stage id fails validation

- **WHEN** a doc declares two stages with the same `<id>`
- **THEN** `orbit architecture validate` fails with an error naming the duplicated id

#### Scenario: Slotless stage parses with omission defaults

- **WHEN** a parseable stage carries neither slot line
- **THEN** it parses as no-dependencies + unratified; `validate` passes; ratifying its completion later inserts the `Complete:` line

#### Scenario: Near-miss heading is a validation error, not silent legacy

- **WHEN** a doc's only stage heading is mistyped (e.g. `### Stage d2_architect architect` — bad id form, missing em-dash)
- **THEN** `orbit architecture validate` FAILS naming the line and the grammar violation, and `status` lists the doc as malformed — the doc never silently downgrades to legacy

#### Scenario: Legacy prose docs degrade gracefully

- **WHEN** a doc under `orbit/architecture/` contains zero `### Stage `-prefixed headings outside fences (e.g. a pre-D2 prose document)
- **THEN** it is listed as legacy/opaque by the status surface and is never an error; only
  parseable docs participate in stage-state computation

#### Scenario: Ruling-index content stays out of the parsed model

- **WHEN** the source lint reads a doc's `## Rulings index` section to compute a ruling count
- **THEN** `parseArchitectureDoc` yields the same stages, slots and `docClass` it would otherwise, the ruling text contributes no field to the parsed model, and `orbit architecture validate` is unaffected — the reader is named at the engine level without becoming part of the format's parse

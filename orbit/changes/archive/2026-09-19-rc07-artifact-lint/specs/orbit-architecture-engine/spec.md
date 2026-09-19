## MODIFIED Requirements

### Requirement: Parseable architecture-doc format

Architecture docs SHALL declare engine-readable structure via markdown heading conventions while
remaining judgment-dense prose documents: a stage is declared by a heading of the form
`### Stage <id> — <title>` (kebab-case `<id>`, unique within the doc), and a stage section MAY
carry two labeled slot lines — `Depends-on: <id>[, <id>…]` (or `Depends-on: (none)`) and
`Complete: [ ]` / `Complete: [x] <YYYY-MM-DD> (<who>)`. Both slots are OPTIONAL with defined
omission semantics: an absent `Depends-on:` parses as no dependencies; an absent `Complete:`
parses as unratified; validation accepts either omission; the architect ratification flow INSERTS
a missing `Complete:` line when writing a mark (per `orbit-architect`). The parser INTERPRETS only:
stage ids/titles, the two slot lines, and section boundaries (a stage section runs from its heading
to the next same-or-higher-level heading); `docClass` and the grammar-violation list derive from
that grammar alone. That interpreted set is what OPACITY is a claim about — charter prose, exit
criteria, premise, rulings and status log carry no meaning the parser assigns, and no engine reader
may DERIVE meaning from them except where named below.

The parser additionally CARRIES the document's raw lines as PASSTHROUGH. This is stated rather than
elided because an earlier wording — "the model contains ONLY … and nothing downstream of
`parseArchitectureDoc` may read it" — was false of the shipped API in both halves: the parsed model
holds every line of the document, and two readers consume it. Passthrough confers no meaning by
itself; it is the substrate section slicing is computed from, and carrying content is not
interpreting it.

The engine readers that attach meaning to passthrough content are NAMED, and the list is CLOSED:

| reader | what it reads | what it does with it |
|---|---|---|
| `sliceStageSection` (serving `orbit architecture show`) | a stage section's lines, by the boundaries the parser interpreted | returns them VERBATIM; assigns no meaning, contributes no field, changes no classification |
| `orbit-source-lint`'s `architecture.ruling-count` | the `## Rulings index` section | counts entries whose first bold span matches a DECLARED prefix, producing a source value |

Any FURTHER engine-level reader of passthrough content SHALL be named here the same way; an unnamed
one is a violation of this requirement. The consequence of the second entry is stated plainly rather
than left implicit: an author who reformats a ruling entry can change a source-lint result, so
`orbit validate --sources` can go red on an edit the architecture parser is indifferent to. That is
the price of the named exception, and it is why the exception is named rather than assumed.

The parser SHALL be fence-aware: headings and slot lines
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

#### Scenario: Passthrough is carried, not interpreted

- **WHEN** `orbit architecture show <doc> <stage>` prints a stage section whose charter prose the parser assigns no meaning to
- **THEN** the section is reproduced VERBATIM from the carried lines, and `parseArchitectureDoc` yields the same stages, slots, `docClass` and violations it would if that prose were different — carrying content is not interpreting it

#### Scenario: Ruling-index content stays out of the parsed model

- **WHEN** the source lint reads a doc's `## Rulings index` section to compute a ruling count
- **THEN** `parseArchitectureDoc` yields the same stages, slots and `docClass` it would otherwise, the ruling text contributes no field to the parsed model, and `orbit architecture validate` is unaffected — the reader is named at the engine level without becoming part of the format's parse

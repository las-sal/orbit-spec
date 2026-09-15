## ADDED Requirements

### Requirement: Source registry declares computable facts

The system SHALL read `orbit/sources.yaml`, whose top-level `sources:` key holds a map from a source NAME to an ENGINE-computed fact, and SHALL treat that map as the authority for which names a marker may reference. The `sources:` wrapper is required rather than entries at the document root, so a later top-level key is an addition rather than a format break. An absent file means no sources, no markers, and no lint — the state of every repository today.

The lint is reached through `orbit validate --sources`, and `orbit validate --all` runs it alongside the change and spec checks; a finding fails validation with a non-zero exit, and the coverage record renders after the findings on both. Per-item `orbit validate <change>` and `orbit validate <spec>` are UNCHANGED — the lint's domain is the project, not a change, so putting it behind a per-change command would report a project-wide verdict under a per-change name.

This capability owns the `src:` marker family end to end. `orbit-conventions` owns the `@review:` family and its `@review(escalated):` / `@todo:` companions; the `src:` family is deliberately NOT declared there, because the marker's syntax and the rule that checks it are one mechanism and splitting them would put two capabilities in charge of one rule.

Every engine source emits a STRING. A fact that is natively numeric (`version: 4` is a YAML number) is rendered to its decimal string form AT THE SOURCE, never at the comparison — the check is `includes` over two strings and performs no coercion of its own.

The v1 engine-source set is CLOSED at four entries, each with its declared parameters:

| source | parameters | emits |
|---|---|---|
| `architecture.stage-count` | `doc` | the count of WELL-FORMED parsed stages in that doc |
| `architecture.ruling-count` | `doc`, `prefix` | the count of ruling entries in that doc's `## Rulings index` — a top-level list item whose first bold span matches `<prefix>-<n>` |
| `specs.capability-count` | — | the count of directories under the project's `specs/` that contain a `spec.md` — BASELINE only, so a capability introduced by an unarchived change is not counted; a directory without a `spec.md` is not counted |
| `schema.version` | `schema` | that registered schema's `version` |

In that grammar `<prefix>` is matched LITERALLY, never compiled as a pattern, and `<n>` is one or more decimal digits with nothing following them — so `R-crc-10` is an entry and `R-crc-4a` is not.

`architecture.ruling-count` takes the prefix as a DECLARED parameter rather than deriving it from the doc's name. The doc's identity is its filename stem, which is not the abbreviation its rulings use (`clean-up-review-cycle` versus `R-crc-1`), so any derivation is a guess about a naming convention the engine cannot observe. Declaring it also makes emptiness meaningful: with a prefix given, a `## Rulings index` section that yields ZERO entries is a MALFORMED source that fails naming the doc and the prefix — never a count of zero, which would silently agree with prose that contains a zero digit.

An entry names an ENGINE source and its parameters. Each engine source DECLARES its required parameter names; an entry missing `engine:`, missing a required parameter, or carrying an unknown key is a clean validation error naming the entry. A source name SHALL be unique within the map. An entry SHALL NOT carry a shell command: orbit is a published package, so a `command:` field would mean that cloning a project which uses orbit and running `orbit validate` executes repository data — arbitrary code execution from a command that reads as read-only. The engine-source set is CLOSED and exposed from the engine itself, so adding a fact is a code change with a test rather than a line of YAML.

#### Scenario: A registry entry resolves to an engine fact

- **WHEN** `orbit/sources.yaml` declares `sources:` with the entry `stages: {engine: architecture.stage-count, doc: clean-up-review-cycle}`
- **THEN** the source `stages` resolves to the string that engine fact emits for that doc

#### Scenario: A declared prefix that matches no ruling entry is a malformed source

- **WHEN** an `architecture.ruling-count` entry declares a prefix and the doc's `## Rulings index` section yields no entry matching it
- **THEN** validation FAILS naming the doc and the prefix; the source SHALL NOT emit a count of zero

#### Scenario: An unknown engine source is a clean error

- **WHEN** an entry names an engine source the engine does not expose
- **THEN** validation fails naming the entry and the unknown source, and lists the source names the engine does expose

#### Scenario: A registry that exists but does not parse fails loudly

- **WHEN** `orbit/sources.yaml` exists but is not valid YAML, or its `sources:` value is not a map of entries, or an entry is a scalar rather than a map, or a source name is declared twice
- **THEN** validation FAILS naming the file and the specific fault; the absent-file silence below SHALL NOT be reached by any file that exists, so a corrupted registry can never disable the lint quietly

#### Scenario: No registry means no lint

- **WHEN** `orbit/sources.yaml` is absent
- **THEN** the lint performs no checks and reports nothing; a repository with no registry and no markers lints clean

### Requirement: A marker delimits a span and the check is string containment

The system SHALL recognise a marked span opened by `<!-- src:NAME -->` — where NAME matches `[a-z0-9][a-z0-9-]*` exactly — and closed by `<!-- /src -->`, and SHALL verify that the span's text CONTAINS the string the named source emits. A marker is INERT — neither an opener nor a closer — in three cases, so that prose ABOUT the syntax never becomes prose CHECKED by it: a comment that does not match the opener grammar exactly; a marker inside a fenced code block; and a marker inside an inline code span. The third case is required, not cosmetic: this capability's own artifacts carry conforming markers inside backticks, and without the rule the document describing the check would fail it. The check is string containment inside a boundary the AUTHOR drew; it SHALL NOT parse numbers, and it SHALL NOT infer which token in a span is the figure.

The delimited form is required rather than a marker placed beside a figure. A marker beside a figure would require the engine to identify "the number near the marker" in prose which — across the four defects that motivated this capability — was a numeral inside bold, a range endpoint inside an identifier, an English word, and a compound of three numbers. Any rule for "the number near" infers which token the author meant, and the engine cannot observe intent.

Because the check is containment of a STRING, a source whose value is compound (`4C/6W/0S`) needs no special case, and a marked span SHALL use numerals: a source emitting `18` is not contained by the word `eighteen`.

**Containment's residual is STATED, not closed**: a span whose stale text happens to CONTAIN the current value passes — a source emitting `9` is contained by the stale span `19`, and one emitting `0` by the stale span `R-crc-1..10`. A shrinking or re-prefixed figure can therefore survive. The mitigation is authorial and is a RECORD, not a check: a marked span SHOULD be drawn tight around the figure. A token-boundary rule is deliberately NOT introduced — deciding where a figure's token ends inside arbitrary prose is the inference this capability exists to avoid.

**Span pairing is a CLOSED table**, so no degenerate case is left to an implementer's judgment. Its outcomes are of TWO KINDS, and they report differently: a MARKER ERROR names the file and line of the offending delimiter, because there is no span to compare; a CHECK FAILURE names the source value against the span's text, because there is.

| situation | kind | outcome |
|---|---|---|
| opener then closer | — | one span; its text is the bytes between them |
| opener then a second opener before any closer | MARKER ERROR | unclosed marker, naming the FIRST opener's line (the closer is anonymous, so nesting is not expressible) |
| closer with no open span | MARKER ERROR | orphan closer, naming its line |
| opener with no closer before end of file | MARKER ERROR | unclosed marker, naming the opener's line |
| opener immediately followed by its closer | CHECK FAILURE | an EMPTY span contains no source value, so it fails like any disagreeing span — reported with the source value, not as a syntax error |

A MARKER ERROR's blast radius is ONE FILE: that file's remaining spans are abandoned (pairing is no longer trustworthy inside it) and the error is reported, while every other file in the domain still lints and still reports. The run fails, but it never goes quiet — one malformed marker SHALL NOT turn the lint into a no-op for the rest of the project.

#### Scenario: A marked span agreeing with its source passes

- **WHEN** a span marked `src:stages` contains `18` and the `stages` source emits `18`
- **THEN** the lint reports no finding for that span

#### Scenario: A marked span disagreeing with its source fails validation

- **WHEN** a span marked `src:stages` contains `17` and the `stages` source emits `18`
- **THEN** validation FAILS, naming the file, the line, the source name, the string the span contains and the string the source emits

#### Scenario: A compound source value is checked by containment

- **WHEN** a span marked `src:pair-counts` contains `4C/7W/0S` and the source emits `4C/6W/0S`
- **THEN** validation fails; the check compares strings and requires no numeric parsing

#### Scenario: A marker naming an unknown source is a clean error

- **WHEN** a span names a source absent from `orbit/sources.yaml`
- **THEN** validation fails naming the file, the line and the unknown source

#### Scenario: A syntax example is not a marker

- **WHEN** a document describes the marker form with a placeholder name, shows one inside a fenced code block, or shows a conforming opener or closer inside an inline code span
- **THEN** none of them is treated as a marker, and the lint reports nothing for any of them

#### Scenario: An unclosed marker is a clean error

- **WHEN** an opening marker has no matching `<!-- /src -->` in the same file
- **THEN** validation fails naming the file and the line of the unclosed opener

#### Scenario: An orphan closer is a clean error

- **WHEN** a `<!-- /src -->` appears with no open span
- **THEN** validation fails naming the file and the line of the orphan closer

### Requirement: The lint reads living documents across the whole project

The system SHALL lint markdown across the WHOLE PROJECT, not only `orbit/`: the file domain is `git ls-files '*.md'` minus a DECLARED exclusion list. Git's tracked-file list is the authority, so the domain closes by construction rather than by a directory list an author remembers.

Two consequences of that authority are STATED rather than discovered. `git ls-files` lists TRACKED paths only, so an untracked markdown file is outside the domain until it is added — the same working tree lints differently before and after `git add`. And where git cannot answer at all, the domain is EMPTY: the lint reports a named reason and no findings rather than throwing.

**The lint reads LIVING documents, never RECORDS.** A figure inside a record was TRUE WHEN WRITTEN, and linting it would demand rewriting history to match the present, which inverts what a record is for. Every exclusion below is stated with its reason, and each is decidable BY PATH so that no judgment is asked of the engine.

That boundary is decidable BY PATH only BETWEEN files. WITHIN a file it is not: a living document may narrate history, and `CLAUDE.md` is the standing example — nearly all of its figures are transitions inside archived stage narratives (`capabilities 13 → 14`, "`spec-driven` went to version 3 here") that were true when written and must never be dragged forward. Inside a file, therefore, the AUTHOR'S MARKER is the boundary: a marked span is a present-tense claim, everything unmarked is outside the lint's reach whether it is narrative or not, and a fact whose file has no present-tense claim to mark needs one WRITTEN before it can be checked.

The path-decidable exclusions:

| excluded | reason |
|---|---|
| `orbit/changes/archive/**`, `**/.orbit-runs/**` | RECORDS — true when written |
| `test/**` | FIXTURES and GOLDENS — their numbers are test data |
| `schemas/*/templates/**` | TEMPLATES — placeholders, not claims |
| `.claude/**` | GENERATED — the source is what must be true |
| `README_OLD.md`, `adopter-report-*.md` | HISTORICAL — superseded by their own names; the only glob-shaped entries, still decidable by path |

#### Scenario: A stale figure in a governing document outside `orbit/` fails

- **WHEN** `CLAUDE.md` carries a marked span whose source disagrees
- **THEN** validation fails; the domain is the whole project, and a lint scoped to `orbit/` would have caught one of the four defects that motivated this capability and reported itself clean

#### Scenario: A historical figure in a living file is not linted

- **WHEN** a living document narrates a past transition (`capabilities 13 → 14`) and the figure is not inside a marked span
- **THEN** the lint ignores it; within a file the marker, not the path, separates a present-tense claim from a record of one

#### Scenario: An untracked file is outside the domain

- **WHEN** a markdown file carrying a marked span has not been added to git
- **THEN** the lint does not read it, and the same file enters the domain once it is tracked

#### Scenario: A checkout without git degrades to an empty domain

- **WHEN** `git ls-files` cannot be run (no git, or not a repository)
- **THEN** the lint reports the reason, checks nothing, produces no findings, and exits zero — it never throws and never claims the project verified

#### Scenario: A marker inside a record is not linted

- **WHEN** a marked span appears under `orbit/changes/archive/` or any `.orbit-runs/` directory
- **THEN** the lint ignores it; a record states what was true when written and is never rewritten to match the present

### Requirement: Unmarked figures are invisible, and coverage is reported

The system SHALL check only DECLARED links. An UNMARKED figure that disagrees with a computable fact is INVISIBLE to the lint and SHALL NOT be reported as clean — the lint claims to verify marked spans, never to find unmarked ones. Detecting an unmarked restatement would require inferring that a number in prose restates a particular fact, which is authorial intent.

As the stated mitigation, and as a RECORD rather than a check, the lint SHALL report per-source marker COVERAGE — each source name, the string it emits, and how many marked spans reference it — so a reader can see a fact that nothing points at. The report counts; it judges nothing.

#### Scenario: An unmarked stale figure produces no finding

- **WHEN** a living document states a figure that disagrees with a computable fact, and the figure is not inside a marked span
- **THEN** the lint produces no finding for it, and the summary does not describe the document as verified

#### Scenario: Coverage names a source nothing points at

- **WHEN** the lint runs and a declared source has zero marked spans referencing it
- **THEN** the coverage report lists that source with a count of zero, so the gap is visible without the engine judging whether a marker is owed

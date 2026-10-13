# orbit-source-lint Specification

## Purpose

A figure restated in prose that disagrees with its source is a defect a machine should own, not a
review finding. This capability is the link from the prose to the fact: `orbit/sources.yaml` maps a
source NAME to one of a CLOSED set of ENGINE-computed facts (no shell — orbit is a published
package, so a `command:` field would make `orbit validate` execute repository data), a `src:` marker
DELIMITS a span in living prose, and the check asks only whether that span CONTAINS the string the
source emits. The file domain is the WHOLE PROJECT — `git ls-files '*.md'` minus a DECLARED
exclusion list whose every entry is decidable by path and stated with its reason — because the lint
reads LIVING documents and never RECORDS. Within a file the AUTHOR'S MARKER is the boundary:
unmarked figures are INVISIBLE to the lint and are never reported as clean, and per-source marker
COVERAGE is reported so a fact nothing points at stays visible. The lint counts and compares; it
infers nothing about which token in prose an author meant, and where an input is prose or judgment
the deliverable is a RECORD rather than a CHECK.
## Requirements
### Requirement: Source registry declares computable facts

The system SHALL read `orbit/sources.yaml`, whose top-level `sources:` key holds a map from a source NAME to an ENGINE-computed fact, and SHALL treat that map as the authority for which names a marker may reference. The `sources:` wrapper is required rather than entries at the document root, so the document root RESERVES NAMESPACE for a later top-level key. That is a namespace claim, not a forward-compatibility promise: an unknown top-level key is a clean validation error naming it, so introducing one is a version-gated change like any other. Fail-loud wins over tolerance here for the same reason it wins everywhere else in this capability — a registry that silently ignores something is a registry that can silently stop checking. An absent file means no sources, no markers, and no lint — the state of every repository today.

The lint is reached through `orbit validate --sources`, and `orbit validate --all` runs it alongside the change and spec checks; a finding fails validation with a non-zero exit, and the coverage record renders after the findings on both. Per-item `orbit validate <change>` and `orbit validate <spec>` are UNCHANGED — the lint's domain is the project, not a change, so putting it behind a per-change command would report a project-wide verdict under a per-change name.

This capability owns the `src:` marker family end to end. `orbit-conventions` owns the review-marker family (`@review`, colon-suffixed) and its escalated and todo companions — spelled here without the literal colon so this sentence is not itself discovered by that family's raw grep; the `src:` family is deliberately NOT declared there, because the marker's syntax and the rule that checks it are one mechanism and splitting them would put two capabilities in charge of one rule.

A declared parameter that names a document or a schema is an IDENTIFIER, never a path: it SHALL match that kind's name grammar, and the file it resolves to SHALL be CONTAINED within the declared tier (symlinks resolved). The SAME containment policy governs EVERY filesystem-backed source, not only the parameterised ones — a tier directory that is itself a symlink is refused, and so is a counted file that resolves outside its tier — because a source whose value depends on untracked state outside the project is the same defect whichever source computes it. Without containment, `schema: ../../schemas/spec-driven` escapes both tiers and a read-only-looking `orbit validate` consumes a file the project never declared as an input — which is the same trust boundary the absent `command:` field exists to hold.

`schema.version` deliberately skips the user-global override tier the engine's ordinary resolver consults. That tier lives in a developer's data directory, so honouring it would make the same checkout emit different values on different machines, and a marked repository fact would be machine-dependent. The resolution TIER is an input under R-crc-10 and is therefore named rather than inherited.

Every engine source emits a STRING. A fact that is natively numeric (`version: 4` is a YAML number) is rendered to its decimal string form AT THE SOURCE, never at the comparison — the check is `includes` over two strings and performs no coercion of its own.

The v1 engine-source set is CLOSED at four entries, each with its declared parameters:

| source | parameters | emits |
|---|---|---|
| `architecture.stage-count` | `doc` | the count of WELL-FORMED parsed stages in that doc |
| `architecture.ruling-count` | `doc`, `prefix` | the count of ruling entries in that doc's `## Rulings index` — a top-level list item whose first bold span matches `<prefix>-<n>` (both terms defined below) |
| `specs.capability-count` | — | the count of directories under the project's `specs/` that contain a `spec.md` — BASELINE only, so a capability introduced by an unarchived change is not counted; a directory without a `spec.md` is not counted. An ABSENT `specs/` directory is a source-resolution ERROR, not a count of zero — 'no baseline to count' is not 'zero capabilities'; a PRESENT but empty directory does emit `0`, because that is a truthful count |
| `schema.version` | `schema` | that schema's `version`, resolved PROJECT-LOCAL then PACKAGE BUILT-IN — the user-global override tier is SKIPPED |

In that grammar `<prefix>` is matched LITERALLY, never compiled as a pattern, and `<n>` is one or more decimal digits with nothing following them — so `R-crc-10` is an entry and `R-crc-4a` is not. TOP-LEVEL means a list item whose `-` or `*` marker begins at indent 0–3 (CommonMark's allowance) and which is not nested inside another list item. The SECTION runs from the `## Rulings index` heading to the next heading at `##` or higher. Both terms are defined because the live doc happens to satisfy either reading, so an ambiguity here would ship unexposed.

Both architecture sources STATE THEIR DOCUMENT PRECONDITIONS: a named doc that is ABSENT, LEGACY (zero parseable stages) or MALFORMED (any grammar violation) is a source-resolution ERROR naming the doc and the source — never a count. `parseArchitectureDoc` populates `stages` even on a malformed doc and returns an empty list for a legacy one, so a source that simply read `stages.length` would emit a short count or a silent zero over a document the engine could not fully read.

`architecture.ruling-count` takes the prefix as a DECLARED parameter rather than deriving it from the doc's name. The doc's identity is its filename stem, which is not the abbreviation its rulings use (`clean-up-review-cycle` versus `R-crc-1`), so any derivation is a guess about a naming convention the engine cannot observe. Declaring it also makes emptiness meaningful: with a prefix given, a `## Rulings index` section that yields ZERO entries is a MALFORMED source that fails naming the doc and the prefix — never a count of zero, which would silently agree with prose that contains a zero digit.

An entry names an ENGINE source and its parameters. Each engine source DECLARES its required parameter names; an entry missing `engine:`, missing a required parameter, or carrying an unknown key is a clean validation error naming the entry. A source name SHALL be unique within the map and SHALL match the marker NAME grammar `[a-z0-9][a-z0-9-]*` — otherwise an entry could parse, resolve and appear in coverage while no legal marker could ever name it. Declared parameter values SHALL be non-empty strings; a YAML number, null, or list in a parameter slot is a clean error naming the entry and the parameter. A parameter that names a doc or schema which does not exist is likewise a clean validation error, never a silently absent source. An entry SHALL NOT carry a shell command: orbit is a published package, so a `command:` field would mean that cloning a project which uses orbit and running `orbit validate` executes repository data — arbitrary code execution from a command that reads as read-only. The engine-source set is CLOSED and exposed from the engine itself, so adding a fact is a code change with a test rather than a line of YAML.

#### Scenario: A registry entry resolves to an engine fact

- **WHEN** `orbit/sources.yaml` declares `sources:` with the entry `stages: {engine: architecture.stage-count, doc: clean-up-review-cycle}`
- **THEN** the source `stages` resolves to the string that engine fact emits for that doc

#### Scenario: A declared prefix that matches no ruling entry is a malformed source

- **WHEN** an `architecture.ruling-count` entry declares a prefix and the doc's `## Rulings index` section yields no entry matching it
- **THEN** validation FAILS naming the doc and the prefix; the source SHALL NOT emit a count of zero

#### Scenario: A broken architecture doc errors rather than counting

- **WHEN** an architecture source names a doc that is absent, LEGACY, or MALFORMED
- **THEN** validation FAILS naming the doc and the source; neither `architecture.stage-count` nor `architecture.ruling-count` emits a value over a document the engine could not fully read

#### Scenario: An unknown engine source is a clean error

- **WHEN** an entry names an engine source the engine does not expose
- **THEN** validation fails naming the entry and the unknown source, and lists the source names the engine does expose

#### Scenario: A parameter naming a path rather than an identifier resolves nothing

- **WHEN** a `doc` or `schema` parameter is spelled as a path that would escape its declared tier (`../../schemas/spec-driven`, an absolute path, or a traversal through a legitimate name)
- **THEN** validation FAILS naming the entry; no file outside the declared tiers is read, whatever the spelling

#### Scenario: An absent specs directory errors rather than counting zero

- **WHEN** `specs.capability-count` is declared in a project with no `specs/` directory at all
- **THEN** validation FAILS naming the source; a PRESENT but empty directory instead emits `0`

#### Scenario: A registry that exists but does not parse fails loudly

- **WHEN** `orbit/sources.yaml` exists but is not valid YAML, or its `sources:` value is not a map of entries, or its `sources:` map declares NO entries, or an entry is a scalar rather than a map, or a source name is declared twice
- **THEN** validation FAILS naming the file and the specific fault; the absent-file silence below SHALL NOT be reached by any file that exists, so a corrupted registry can never disable the lint quietly

#### Scenario: No registry means no lint

- **WHEN** `orbit/sources.yaml` is absent
- **THEN** the lint performs no checks and reports nothing; a repository with no registry and no markers lints clean

### Requirement: A marker delimits a span and the check is string containment

The system SHALL recognise a marked span opened by `<!-- src:NAME -->` — where NAME matches `[a-z0-9][a-z0-9-]*` exactly — and closed by `<!-- /src:NAME -->` — the closer's NAME SHALL match its opener's — and SHALL verify that the span's text CONTAINS the string the named source emits. A marker is INERT — neither an opener nor a closer — in two cases, so that prose ABOUT the syntax never becomes prose CHECKED by it: a comment that does not match the delimiter grammar exactly, and a marker inside a fenced code block. EXACTLY means byte-for-byte apart from NAME: one literal space inside each comment, so `<!--src:stages-->`, a tabbed form, a double-spaced form and a form split across lines are all inert. Only NAME is a pattern.

**THE CLOSER CARRIES ITS NAME, and that is what keeps prose safe.** An anonymous closer has no placeholder form, so every sentence mentioning it is a live orphan closer — and protecting prose from that required masking inline code spans, which requires knowing where CommonMark blocks begin and end, since inline elements never cross block boundaries. Four independent reviewers found four separate defects in that scanner before the fourth established the shape of the problem: a line-grouping heuristic was doing a block parser's job. The NEED was removed rather than the bug. With a named closer the AUTHORING RULE is one sentence — **write a PLACEHOLDER name in prose** (`<!-- src:NAME -->`, `<!-- /src:NAME -->`) — and the name grammar makes both delimiters inert with no scanner at all, inside backticks or not. Backticks confer no inertness; the NAME does.

A closer whose NAME does not match the open span is a MARKER ERROR, never a silent re-pairing: it is an authoring mistake the anonymous form could not express, and treating it as a close would end a span the author never opened.
 The check is string containment inside a boundary the AUTHOR drew; it SHALL NOT parse numbers, and it SHALL NOT infer which token in a span is the figure.

The delimited form is required rather than a marker placed beside a figure. A marker beside a figure would require the engine to identify "the number near the marker" in prose which — across the four defects that motivated this capability — was a numeral inside bold, a range endpoint inside an identifier, an English word, and a compound of three numbers. Any rule for "the number near" infers which token the author meant, and the engine cannot observe intent.

Because the check is containment of a STRING, a source whose value is compound (`4C/6W/0S`) needs no special case, and a marked span SHALL use numerals: a source emitting `18` is not contained by the word `eighteen`.

**Self-reference is an AUTHORING hazard, and it is stated as a RECORD rather than checked.** A source that reads a document derives its value from that document's bytes, so a marker placed inside the very text being counted changes the input and can invalidate the value it claims to check: `architecture.ruling-count` counts list entries whose first bold span matches its declared prefix, and marking the figure inside such an entry breaks that entry's bold span and drops the count by one. An author SHOULD therefore mark a figure in a current-state sentence written OUTSIDE the counted material.

This is deliberately NOT a check. Detecting it would require the engine to know, per source, which region of a document each value was computed from — an input that is nowhere declared, and one the R-crc-10 discipline this capability is built on forbids leaving unnamed. Making it a SHALL while its input went undeclared was the one place in this capability where judgment slipped back into a check; the hazard is real, so it is recorded here and enforced by the authoring instruction in the dogfood, not by a rule the engine cannot observe.

**Containment's residual is STATED, not closed**: a span whose stale text happens to CONTAIN the current value passes — a source emitting `9` is contained by the stale span `19`, and one emitting `0` by the stale span `R-crc-1..10`. A shrinking or re-prefixed figure can therefore survive. The mitigation is authorial and is a RECORD, not a check: a marked span SHOULD be drawn tight around the figure. A token-boundary rule is deliberately NOT introduced — deciding where a figure's token ends inside arbitrary prose is the inference this capability exists to avoid.

**Span pairing is a CLOSED table**, so no degenerate case is left to an implementer's judgment. Its outcomes are of TWO KINDS, and they report differently: a MARKER ERROR names the file and line of the offending delimiter, because there is no span to compare; a CHECK FAILURE names the source value against the span's text, because there is.

| situation | kind | outcome |
|---|---|---|
| opener then a closer of the SAME name | — | one span; its text is the bytes between them |
| opener then a second opener before any closer | MARKER ERROR | unclosed marker, naming the FIRST opener's line (nesting is not supported) |
| closer with no open span | MARKER ERROR | orphan closer, naming its line |
| closer whose NAME differs from the open span's | MARKER ERROR | mismatched closer, naming its line and both names |
| opener with no closer before end of file | MARKER ERROR | unclosed marker, naming the opener's line |
| opener immediately followed by its closer | CHECK FAILURE | an EMPTY span contains no source value, so it fails like any disagreeing span — reported with the source value, not as a syntax error |

Every SPAN-DERIVED finding reports the OPENER's line, including a span that crosses line endings; a MARKER ERROR reports the offending delimiter's own line.

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

- **WHEN** a document describes the marker form with a PLACEHOLDER name, or shows a conforming pair inside a fenced code block
- **THEN** neither is treated as a marker, and the lint reports nothing for either — a placeholder-named pair is inert whether or not it sits inside backticks, because the NAME confers the inertness

#### Scenario: A closer naming a different source is a clean error

- **WHEN** a span opened as `<!-- src:NAME -->` is closed by `<!-- /src:OTHER -->`
- **THEN** validation fails naming the file, the line and both names; the span SHALL NOT be silently closed

#### Scenario: An unclosed marker is a clean error

- **WHEN** an opening marker has no matching closer of its own name in the same file
- **THEN** validation fails naming the file and the line of the unclosed opener

#### Scenario: An orphan closer is a clean error

- **WHEN** a closer appears with no open span
- **THEN** validation fails naming the file and the line of the orphan closer

### Requirement: The lint reads living documents across the whole project

The system SHALL lint markdown across the WHOLE PROJECT, not only `orbit/`: the file domain is `git ls-files '*.md'` minus a DECLARED exclusion list. Git's tracked-file list is the authority, so the domain closes by construction rather than by a directory list an author remembers.

Two consequences of that authority are STATED rather than discovered. `git ls-files` lists TRACKED paths only, so an untracked markdown file is outside the domain until it is added — the same working tree lints differently before and after `git add`. And where git cannot answer at all, the domain is EMPTY: the lint reports a named reason and no findings rather than throwing.

**The lint reads LIVING documents, never RECORDS.** A figure inside a record was TRUE WHEN WRITTEN, and linting it would demand rewriting history to match the present, which inverts what a record is for. Every exclusion below is stated with its reason, and each is decidable BY PATH so that no judgment is asked of the engine.

That boundary is decidable BY PATH only BETWEEN files. WITHIN a file it is not: a living document may narrate history, and an architecture doc's status log is the standing example — its figures are transitions (`capabilities 13 → 14`, "`spec-driven` went to version 3 here") that were true when written and must never be dragged forward, beside present-tense content in the same file. A whole-file record kept inside the domain — a completed program doc, `orbit/architecture/program-history.md`, a record moved there — is read but INERT while it carries no marker: the lint judges only marked spans. Inside a file, therefore, the AUTHOR'S MARKER is the boundary: a marked span is a present-tense claim, everything unmarked is outside the lint's reach whether it is narrative or not, and a fact whose file has no present-tense claim to mark needs one WRITTEN before it can be checked.

The path-decidable exclusions:

| excluded | reason |
|---|---|
| `orbit/changes/archive/**`, `**/.orbit-runs/**` | RECORDS — true when written |
| `test/**` | FIXTURES and GOLDENS — their numbers are test data |
| `schemas/*/templates/**`, `orbit/schemas/*/templates/**` | TEMPLATES — placeholders, not claims. BOTH tiers: the package's own schemas and a project-local schema directory, which the engine resolves first and which is version-controlled when present |
| `.claude/**` | GENERATED — the source is what must be true |

#### Scenario: A stale figure in a governing document outside `orbit/` fails

- **WHEN** `CLAUDE.md` carries a marked span whose source disagrees
- **THEN** validation fails; the domain is the whole project, and a lint scoped to `orbit/` would have caught one of the four defects that motivated this capability and reported itself clean

#### Scenario: A historical figure in a living file is not linted

- **WHEN** a living document narrates a past transition (`capabilities 13 → 14`) and the figure is not inside a marked span
- **THEN** the lint ignores it; within a file the marker, not the path, separates a present-tense claim from a record of one

#### Scenario: An untracked file is outside the domain

- **WHEN** a markdown file carrying a marked span has not been added to git
- **THEN** the lint does not read it, and the same file enters the domain once it is tracked

The DOMAIN ITSELF is reported alongside the findings: how many files were actually READ, and the named reason when none could be. It rides in both output modes, because a reason carried only on stderr is out-of-band for the consumer a machine-readable mode exists to serve — a run that opened nothing would otherwise report zero failures and read as verification. The count is of files READ, never of files listed: a tracked path with no working-tree file is skipped silently (a deleted file is still tracked), while any OTHER read failure is a finding, so the lint never claims to have checked a document it could not open.

#### Scenario: A checkout without git degrades to an empty domain

- **WHEN** `git ls-files` cannot be run (no git, or not a repository)
- **THEN** the lint reports the reason, checks nothing, produces no findings, and exits zero — it never throws and never claims the project verified; the reason and a scanned count of zero appear in the machine-readable output as well as the human one

#### Scenario: A tracked file that cannot be read is reported, never swallowed

- **WHEN** a tracked markdown file in the domain cannot be read for any reason other than not existing in the working tree
- **THEN** the lint reports it as a DOMAIN fault naming the file, does not count it as scanned, and continues linting every other file — a run SHALL NOT exit clean while claiming to have checked a document it never opened

**A source compared against NOTHING has not passed.** When the scan is INCOMPLETE, every declared
source that still resolved SHALL be reported as UNVERIFIED rather than as passed. A scan is
incomplete whenever ANY file in the domain was not fully examined — the domain could not be listed,
a path could not be inspected, a file could not be read, a file was skipped by policy, or a file's
parse was ABANDONED after a marker error. Completeness SHALL be carried as its own state rather than
inferred from which finding kinds a summary happens to inspect: four successive reviews each found a
scope the inference did not cover, because widening an inference leaves the next scope uncovered
while clearing a carried flag is a precondition of the scope existing at all. Partial incompleteness counts: one unreadable
file may hold a source's only marker, so a rule gated on total failure would report success for a
source whose single check never ran. Without this the verdict turns on whether git could answer rather than on whether the
repository is correct, and it turns in the reassuring direction: the same tree reports a failure in
a git checkout and a success in an export. The run still exits zero and still produces no findings —
this requirement constrains what the summary may CLAIM, not whether the command fails.

#### Scenario: An unresolvable domain reports sources as unverified, not passed

- **WHEN** the file domain is empty for a named reason and declared sources resolved
- **THEN** those sources are counted UNVERIFIED, not passed; the run exits zero; and the summary
  SHALL NOT report them as passing a check that never ran

#### Scenario: A partially unread domain also reports sources as unverified

- **WHEN** the domain resolved but at least one tracked file in it was not fully examined — unreadable, uninspectable, skipped by policy, or abandoned mid-parse after a marker error
- **THEN** the resolved sources are counted UNVERIFIED, the domain fault is still reported, and the
  run exits NON-zero — incompleteness is incompleteness whether it is total or partial

#### Scenario: A marker inside a record is not linted

- **WHEN** a marked span appears under `orbit/changes/archive/` or any `.orbit-runs/` directory
- **THEN** the lint ignores it; a record states what was true when written and is never rewritten to match the present

### Requirement: Unmarked figures are invisible, and coverage is reported

The system SHALL check only DECLARED links. An UNMARKED figure that disagrees with a computable fact is INVISIBLE to the lint and SHALL NOT be reported as clean — the lint claims to verify marked spans, never to find unmarked ones. Detecting an unmarked restatement would require inferring that a number in prose restates a particular fact, which is authorial intent.

As the stated mitigation, and as a RECORD rather than a check, the lint SHALL report per-source marker COVERAGE — each source name, the string it emits, and how many marked spans reference it — so a reader can see a fact that nothing points at. The report counts; it judges nothing.

#### Scenario: An unmarked stale figure produces no finding

- **WHEN** a living document states a figure that disagrees with a computable fact, and the figure is not inside a marked span
- **THEN** the lint produces no finding for it, and the summary does not describe the document as verified

#### Scenario: Every failure kind is representable

- **WHEN** the lint reports any failure — a registry fault (no markdown line at all), a DOMAIN fault (a tracked file that could not be read: a file but no line, no span, no source value), a marker error (a line but no span, no source value), an unknown source named by a well-formed marker (a span but no value), or a mismatch (span text and source value both present)
- **THEN** each is emitted as a DISCRIMINATED record carrying a `kind` and exactly the fields its kind defines, so no report is padded with nulls and no failure kind is unrepresentable — in particular a DOMAIN fault carries no line, because no delimiter was reached and a synthetic one would render as a defect at that line

#### Scenario: Coverage names a source nothing points at

- **WHEN** the lint runs and a declared source has zero marked spans referencing it
- **THEN** the coverage report lists that source with a count of zero, so the gap is visible without the engine judging whether a marker is owed


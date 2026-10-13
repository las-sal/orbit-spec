## MODIFIED Requirements

### Requirement: The lint reads living documents across the whole project

The system SHALL lint markdown across the WHOLE PROJECT, not only `orbit/`: the file domain is `git ls-files '*.md'` minus a DECLARED exclusion list. Git's tracked-file list is the authority, so the domain closes by construction rather than by a directory list an author remembers.

Two consequences of that authority are STATED rather than discovered. `git ls-files` lists TRACKED paths only, so an untracked markdown file is outside the domain until it is added — the same working tree lints differently before and after `git add`. And where git cannot answer at all, the domain is EMPTY: the lint reports a named reason and no findings rather than throwing.

**The lint reads LIVING documents, never RECORDS.** A figure inside a record was TRUE WHEN WRITTEN, and linting it would demand rewriting history to match the present, which inverts what a record is for. Every exclusion below is stated with its reason, and each is decidable BY PATH so that no judgment is asked of the engine.

That boundary is decidable BY PATH only BETWEEN files. WITHIN a file it is not: a living document may narrate history, and `orbit/architecture/program-history.md` is the standing example — nearly all of its figures are transitions inside archived stage narratives (`capabilities 13 → 14`, "`spec-driven` went to version 3 here") that were true when written and must never be dragged forward. Inside a file, therefore, the AUTHOR'S MARKER is the boundary: a marked span is a present-tense claim, everything unmarked is outside the lint's reach whether it is narrative or not, and a fact whose file has no present-tense claim to mark needs one WRITTEN before it can be checked.

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

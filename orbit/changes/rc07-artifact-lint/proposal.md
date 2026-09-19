# Proposal: rc07-artifact-lint

## Why

Reviews keep spending findings on a class a machine should own: a figure restated in prose that
disagrees with its source. **Four in one day, zero caught by a check** — a schema version, a ruling
range, a stage count, and a set of severity counts. Three were in `CLAUDE.md`, which no validator
reads. Each had a trivially computable source; what was missing was a link from the prose to it.

## What Changes

- **A `src:` marker DELIMITS a span** in living prose: `<!-- src:NAME -->18 stages<!-- /src:NAME -->`.
  The registry names a source, the source emits a STRING, and the check asks only whether the span
  CONTAINS that string.
- **`orbit/sources.yaml` maps each source name to an ENGINE-computed fact.** No shell: orbit is a
  published package, and a `command:` field would mean cloning a project and running `orbit validate`
  executes repo data.
- **The lint's file domain is the WHOLE PROJECT** — `git ls-files '*.md'` minus a DECLARED exclusion
  list — because three of four defects were outside `orbit/`.
- **A marked span whose source disagrees FAILS validation.** Unmarked figures are invisible, and the
  requirement says so.
- **Per-source marker COVERAGE is reported** (`stages = 18 (2 markers)`) so a reader can see a fact
  nothing points at. It counts; it judges nothing.

## Capabilities

**New Capabilities**:
- `orbit-source-lint` — the marker format, the registry, the check, the domain and its exclusions,
  and the coverage report.

**Modified Capabilities**: `orbit-architecture-engine` — its `Parseable architecture-doc format`
requirement asserts that "the engine reads ONLY" stage ids/titles, slots and section boundaries,
with rulings explicitly engine-opaque. This change makes the SOURCE LINT read a doc's rulings index.
Keeping the ruling parse out of `parseArchitectureDoc` was not sufficient: the baseline's subject is
the engine and its verb is *reads*, so the delta separates what the parser INTERPRETS from what it
CARRIES as passthrough, and names a CLOSED table of the engine readers that attach meaning to
passthrough — `sliceStageSection` (serving `orbit architecture show`) and the source lint's ruling
count — with the rule that any further such reader must be named there too. The second row was not
foreseen: the system-mode external pass found that the first wording ("the PARSER's model contains
ONLY … nothing downstream may read it") was false of the shipped API in both halves, since the
parsed model carries every line of the document and `show` has always sliced charter prose out of
it. Without the delta the two baselines would contradict each other after archive; without the
correction the delta would have contradicted the code.

**Why ONE capability and not a split with `orbit-conventions`.** The review-marker convention (`@review`, colon-suffixed — written without the colon so this line is not discovered by that family's own raw grep)
lives in `orbit-conventions`, and consistency argues for putting `src:` beside it. Rejected: the
marker's SYNTAX and its SEMANTICS (what it points at, how it is checked, what happens when it
disagrees) are one mechanism, and separating them puts two capabilities in charge of one rule —
the "two copies of nearly everything" defect a review pass named on the previous stage. One
capability owns the marker end to end.

## Impact

- The validator gains a check; `orbit/sources.yaml` is new and optional (absent = no markers = no
  lint).
- No schema bump. No migration: a repo with no `sources.yaml` and no markers lints clean, which is
  every repo today.
- Unblocks nothing and blocks nothing; `rc07b-reference-roundtrip` is independent.

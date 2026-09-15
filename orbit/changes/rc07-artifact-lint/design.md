# Design: rc07-artifact-lint

## Context

Four restated-figure defects landed in this repository in a single day (2026-09-15). Every one had a
computable source — a YAML field, a stage count, a rulings index, an archived findings file — and
none was caught by a check. Three were in `CLAUDE.md`, which no validator reads. The full case
record is in `explore.md` (Case 1).

This is the first stage proposed under **R-crc-10** (*mechanize only what the engine can observe;
where the inputs are prose or judgment the deliverable is a RECORD, not a CHECK*), which was
ratified out of two consecutive stages that shipped nothing by asking the engine to judge what it
cannot see. So the design opens with that ruling's own test.

## The R-crc-10 test — the inputs, named before anything else

| input | what it is | engine can observe? |
|---|---|---|
| the SOURCE value | a fact the engine already computes (a stage count, a schema version) | **YES** |
| the marked SPAN's text | the bytes between two delimiters in a tracked markdown file | **YES** |
| whether the span's text agrees with the source | string containment | **YES** |
| the file DOMAIN | `git ls-files '*.md'` minus path-decidable exclusions | **YES** |
| *which* number in unmarked prose restates a given fact | authorial intent | **NO** |

The last row is not built. It is the residual (D-rc07-4), stated out loud rather than papered over:
an UNMARKED figure is invisible to this lint and always will be. Everything above the line is a
CHECK the engine runs; the link from prose to source is a RECORD the author writes.

The charter's own wording already said this — *prose POINTS AT IT*. The exit criterion is restated
to match: **a MARKED figure that disagrees with its source fails validation**, not "a restated
figure".

## Goals / Non-Goals

**Goals**

- A marked span whose source disagrees FAILS `orbit validate`, across the whole project.
- The source domain is closed by construction: a marker may name only what the registry declares,
  and the registry may name only what the engine exposes.
- The residual is visible: per-source marker coverage is REPORTED, so a fact nothing points at can
  be seen.

**Non-Goals**

- Finding unmarked restatements. See the test above — it is inference about intent.
- A shell escape hatch in the registry. See D-rc07-7; rejected as a trust boundary, deferred with
  its kind and method named.
- Word-form figures (`eighteen`). Marked spans use numerals; a numeral-to-word table is deferred,
  not built.
- Auto-fixing a stale span. The lint reports; the author edits.

## Decisions

### D1 — Surface: `orbit validate --sources`, and `--all` includes it

`orbit validate` already carries a project-scoped bulk family (`--all`, `--changes`, `--specs`) and
a per-item form. The source lint is project-scoped, so it joins the bulk family as `--sources`, and
`--all` runs it. Nothing about per-item `orbit validate <change>` changes: the lint's domain is the
project, not a change.

*Why not a new verb* (`orbit lint`): the exit criterion is "fails validation", and every path that
already runs `orbit validate --all` — CI, the pre-archive sweep, a contributor's habit — picks the
check up for free. A new verb would have to be adopted everywhere before it caught anything.

*Why not `orbit-audit-drift`*: audit-drift is an AI-driven workflow whose findings are judgments.
This check has no judgment in it. Putting a deterministic string comparison behind an AI pass is the
inversion R-crc-10 exists to prevent.

### D2 — Registry shape: `engine:` plus flat parameters, unknown keys rejected

```yaml
sources:
  stages:
    engine: architecture.stage-count
    doc: clean-up-review-cycle
  rulings:
    engine: architecture.ruling-count
    doc: clean-up-review-cycle
  capabilities:
    engine: specs.capability-count
  schema-version:
    engine: schema.version
    schema: spec-driven
```

Each engine source DECLARES its required parameter names. A missing parameter, an unknown parameter,
or an unknown `engine:` value is a clean validation error naming the entry — the domain closes
because the engine's table is the authority, exactly as `COMMANDS[cmd].payloadFields` is the
authority for rc07b's round-trip.

There is deliberately no `command:` field. Reversed from my own first proposal: orbit is a PUBLISHED
package, so a shell field means cloning a project and running a read-only-looking `orbit validate`
executes repository data (D-rc07-7).

### D3 — The v1 engine source table (CLOSED — four entries)

**The spec's table in requirement 1 is NORMATIVE; the one below is the same set annotated with what
earned each entry.** They must not drift — and if keeping two in step ever costs anything, the spec's
survives, because this change's own proposal rejects a capability split on the ground that two copies
of one rule is a defect.

| source | parameters | emits | earned by |
|---|---|---|---|
| `architecture.stage-count` | `doc` | `parseArchitectureDoc(...).stages.length` — WELL-FORMED stages only | the "fifteen small stages" defect |
| `architecture.ruling-count` | `doc`, `prefix` | count of ruling entries in the doc's rulings index | the "R-crc-1..8" defect |
| `specs.capability-count` | — | count of `orbit/specs/*/spec.md` | `CLAUDE.md`'s "Baseline capabilities N" line |
| `schema.version` | `schema` | the registered schema's `version` | the "spec-driven is version 3" defect |

Three of the four come free from parses the engine already performs. `architecture.ruling-count`
needs ONE new parse, and it gets a grammar rather than a heuristic: a ruling entry is a top-level
list item inside the `## Rulings index` section whose first bold span matches `<prefix>-<n>`, where
`prefix` is a DECLARED registry parameter. Anything else in that section is prose the count ignores.
Fence-aware, like every other parse in `src/core/architecture/parser.ts`.

**The prefix is declared, not derived, and that was a correction.** The first draft derived it from
the doc's identity — `R-<doc-stem>-<n>` — which for this program reads `R-clean-up-review-cycle-<n>`
and matches zero of its ten `R-crc-N` entries. The doc's stem is not the abbreviation its rulings
use, and no rule can know that it isn't: deriving one is a guess about a naming convention, which is
the inference R-crc-10 forbids. Declaring it also makes zero meaningful — with a prefix given, a
rulings section yielding nothing is a MALFORMED source that fails, never a count of zero.

**What the dogfood marks is the ENDPOINT, not the range.** `rulings R-crc-1..10` restates two facts —
how many rulings exist and the highest id — which coincide only while ids stay contiguous. The
source emits the COUNT, and the span is drawn tight around the endpoint alone
(`R-crc-1..` then the marked `10`), which is D5's tight-span discipline applied at the one site where
containment's substring residual actually bites: a loose span reading `R-crc-1..10` would contain a
stale source value of `0` and pass.

**A source never silently absorbs a broken doc.** `architecture.stage-count` counts `stages`, not headings — the parser splits well-formed stages from `violations`, and under the NEAR-MISS rule a heading that fails the grammar is MALFORMED, not absent. The two readings agree on the live doc today and diverge the moment a heading breaks, so a MALFORMED or LEGACY doc makes both architecture sources ERROR naming the doc rather than emit a count that quietly omits a near-miss. An error is honest; a short count is the same failure mode twice.

*Not in v1, with kind and method stated* (D-bcs-2): the fourth defect — the arc doc restating
`4C/7W/0S` from an archived findings file — has no engine source. KIND: a fact computable only by
parsing a specific record the engine does not summarise. METHOD: it surfaces the moment an author
marks that figure and finds no source name for it. The honest alternative is that restating a
RECORD's contents in living prose is itself the defect.

### D4 — Parse: delimited spans, fence-aware, one pass per file

An opener is `<!-- src:NAME -->` where NAME matches `[a-z0-9][a-z0-9-]*` EXACTLY; the closer is
`<!-- /src -->`. The name grammar is strict on purpose: a comment that does not match is not a
marker at all, so prose describing the syntax (including the line you are reading, where the name
is a placeholder) is inert. The closer is anonymous, so nesting is not expressible and is not
supported — an opener before the previous span closes is an unclosed-marker error. Markers inside fenced code blocks AND inside inline code spans are SKIPPED (they are documentation of the syntax,
including in this very design document), reusing `src/core/markdown-fence.ts`.

The check is `span.includes(sourceValue)`. It never parses a number; the compound `4C/6W/0S` works
with no special case (explore.md Case 2).

### D5 — Reporting: findings FAIL, coverage RECORDS

Findings are validation errors (non-zero exit), each naming file, line, source, the span's text and
the source's value. Coverage is a separate section — every declared source, its current value, and
how many marked spans reference it — and it never fails anything. It is the mitigation for D-rc07-4's
residual, and per R-crc-10 a mitigation over uninspectable input is a record, not a check.

### D5b — What `--all --json` gains

With a registry present, `orbit validate --sources --json` and `orbit validate --all --json` carry two
new arrays: `source_findings` (file, line, source, span text, source value) and `source_coverage`
(source, value, marker count). `--all`'s existing per-scope keys are untouched, so a consumer that
reads only what it read before is unaffected — but the object DOES gain keys, which is why D6's
byte-identical promise is scoped to the no-registry case and no further.

### D6 — Absent registry means silence

No `orbit/sources.yaml` → no sources, no markers, no findings, no coverage section. Every existing
project, this one included before its registry lands, validates byte-identically to today.

## Where this diverges from the charter

The rc07 stage declaration in `orbit/architecture/clean-up-review-cycle.md` predates three decisions
made here, and the divergences are RECORDED rather than quietly absorbed. Amending the declaration is
an architect act (`/orbit:architect`), not this change's to perform — task 5.4 recommends it.

| the charter says | this change decided | why |
|---|---|---|
| `Touches: the validator, orbit-conventions` | one NEW capability `orbit-source-lint`; no MODIFIED capabilities | the marker's syntax and the rule that checks it are one mechanism; splitting them puts two capabilities in charge of one rule (proposal) |
| the check "moves into `orbit validate` **and audit-drift**" | `orbit validate --sources` only | audit-drift is an AI-driven workflow whose findings are judgments; putting a deterministic string comparison behind an AI pass is the inversion R-crc-10 exists to prevent (D1) |
| exit criterion (3): registry entries "with **live commands**" | registry entries backed by ENGINE SOURCES; no shell | a `command:` field means cloning a project and running a read-only-looking `orbit validate` executes repository data (D-rc07-7) |

The charter also carries two stale figures of its own — the file domain as "61 today" (the measured
value is 50 after the declared exclusions, 48 including HISTORICAL) and a coverage example reading
`stages = 17` against a real count of 18. Both are named in the same architect task; neither is
edited here.

## Risks / Trade-offs

- **A marked span makes prose harder to edit by hand** → the delimiters are HTML comments, invisible
  when rendered, and the failure names the exact line. The cost is real and is the price of the
  author drawing the box instead of the engine guessing it.
- **Numerals-only in marked spans** → one prose edit (`eighteen` → `18`) in the one place it
  matters; the numeral-to-word table is deferred, not denied.
- **Coverage could become a Goodhart target** ("mark everything") → coverage counts and judges
  nothing; no gate reads it, and no threshold exists to game.
- **A new ruling-index grammar is a new way to be MALFORMED** → it is not. The count is a source
  value, not a doc class: a rulings section that matches nothing counts zero, and
  `orbit architecture validate` is unchanged. A source that silently counts zero is visible in the
  coverage record and fails loudly the moment a span claims otherwise.
- **`git ls-files` shells out to git** → read-only, no repository data is executed, and a non-git
  checkout degrades to "no domain, no findings" with a named reason rather than an exception.

## Migration Plan

Additive. The registry and the first marked spans land in the same change (the dogfood), so the
check has real subjects on day one: the four figures this session got wrong, in `CLAUDE.md` and
`orbit/architecture/clean-up-review-cycle.md`. Rollback is deleting `orbit/sources.yaml`.

## Open Questions

None. The exploration closed with zero open questions; the deferrals above are DECLARED with kind
and method per D-bcs-2, not open.

### D4b — The inertness rule needs an inline-code scanner, and that cost is named here

Skipping inline code spans is not free. `src/core/markdown-fence.ts` is line-based and tracks FENCES
only; nothing in the engine tracks backtick spans within a line, so task 2.2 carries that work
explicitly rather than leaving an implementer to discover it mid-apply.

The alternative was to anchor the opener — require it to be preceded on its line only by whitespace,
or to share a line with its closer. It is cheaper and it is rejected: it forbids marking a figure
mid-sentence, which is exactly what the rulings endpoint above requires. A rule that outlaws its own
dogfood is the wrong rule.

This capability's own artifacts are the fixtures. Four conforming markers already sit inside backticks
in this change's prose — three openers (one with no closer after it) and one orphan closer — and every
one must go silent under the rule. They are why the rule exists: the document describing the check
would otherwise fail it.

### D6b — `CLAUDE.md` has no present tense, and the dogfood has to write one

The charter's exit criterion (3) wants `CLAUDE.md` to carry markers for all four facts. Two of them
have nothing there to mark. Every capability figure in that file is a transition inside an archived
stage's narrative (`11→12`, `13 → 14`, "capabilities stay at **20**"); every schema-version figure is
likewise historical ("went to **version 2** at this stage"). Marking any of those would freeze a
record against a moving source — the inversion the living-versus-record principle exists to forbid.

So the dogfood WRITES the claim it then marks: one short current-state line carrying the live stage
count, rulings endpoint, baseline capability count and schema version. That is not a workaround; it
is the finding. A project doc that narrates every transition and asserts no present state is exactly
why three of the four defects that motivated this stage lived in that file. The new line is the kind
of thing that goes stale — which is precisely why it is marked.

## Alternatives considered

- **A marker BESIDE the figure** (`18 small stages <!-- src:stages -->`) — rejected on R-crc-10, not
  on taste: it requires the engine to find "the number near the marker" across prose that in the
  four real defects was a numeral inside bold, a range endpoint inside an identifier, an English
  word, and a compound of three numbers. Any rule for "the number near" infers which token the
  author meant (explore.md Case 2).
- **`command:` in the registry** — flexible and wrong; arbitrary code execution from repository data
  in a published package (D-rc07-7).
- **A key in `orbit/config.yaml`** — this is project DATA, not tool config.
- **`facts.yaml` / `project.yaml`** — the first is vague; the second collides with the established
  `orbit/project.md` convention, and two files sharing a stem with different purposes read like one
  thing in two formats. `sources.yaml` lines up with the marker's own `src:` vocabulary.
- **Scoping the lint to `orbit/`** — would have caught one of this session's four defects and
  reported itself clean (D-rc07-1).
- **Bundling the payload-reference round-trip** — split to its own stage under R-crc-9 while this was
  still an exploration; different inputs, different mechanism, different capabilities. Charter
  drafted at `sketches/rc07b-reference-roundtrip-charter.md`; the declaration is an architect act and
  has not been performed (D-rc07-5).

## Touchpoints

- `src/core/source-lint.ts` — new: domain resolution, span parse, containment check, coverage.
- `src/core/sources-registry.ts` — new: `orbit/sources.yaml` read + the CLOSED engine-source table.
- `src/core/architecture/parser.ts` — the rulings-index entry count (declared-prefix grammar).
- `src/core/markdown-fence.ts` — gains inline-code-span tracking (today: fences only).
- `src/commands/validate.ts` — the `--sources` path and its `--all` inclusion.
- `src/cli/index.ts` — the `--sources` flag.
- `orbit/sources.yaml` — new: this project's registry (the dogfood).
- `CLAUDE.md` + `orbit/architecture/clean-up-review-cycle.md` — the first marked spans.
- `test/core/source-lint.test.ts` + `test/core/sources-registry.test.ts` — new instruments.

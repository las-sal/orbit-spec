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
| `schema.version` | `schema` | the schema's `version` — PROJECT-LOCAL then PACKAGE, skipping the user-global tier | the "spec-driven is version 3" defect |

Three of the four come free from parses the engine already performs. `architecture.ruling-count`
needs ONE new parse, and **that parse does NOT go into `src/core/architecture/parser.ts`.** The
archived `orbit-architecture-engine` baseline states that the engine reads only stage ids/titles,
the two slots and section boundaries, and that everything else — charter prose, exit criteria,
premise, RULINGS, status log — is engine-opaque. Extending `parseArchitectureDoc` to count rulings
would reverse that live contract while this change declares no modified capabilities, and after
archive the two requirements would flatly contradict each other.

So the ruling-index read lives on the SOURCE-LINT side (`src/core/sources-registry.ts`), and
`parseArchitectureDoc` gains no field.

**That relocation is necessary but NOT sufficient, and an earlier draft of this section wrongly
claimed it was.** The draft argued the baseline claim survived because it was "about what that
subsystem EXPOSES". It is not: the requirement's subject is THE ENGINE and its verb is READS, and
`src/core/sources-registry.ts` is the engine. The consequence is behavioural rather than verbal —
once the dogfood lands, reformatting a rulings-index bold span changes a count and turns
`orbit validate --all` red, which is engine-visible meaning attaching to content the requirement
calls opaque. Post-archive the two baselines would have contradicted each other.

So this change DOES carry a MODIFIED delta for `orbit-architecture-engine`, narrowing the claim from
"the engine reads ONLY" to "the architecture PARSER's model contains ONLY", naming the source lint as
the single engine-level exception, and requiring any future engine-level reader of opaque content to
be named in the same place. One extra capability (1 → 2, inside R-crc-1's ceiling of 3) buys a
baseline that stays true; the delta preserves all six original scenarios and adds one asserting the
parsed model is unchanged.

It gets a grammar rather than a heuristic: a ruling entry is a top-level
list item inside the `## Rulings index` section whose first bold span matches `<prefix>-<n>`, where
`prefix` is a DECLARED registry parameter. Anything else in that section is prose the count ignores.
Fence-aware, like every other parse in `src/core/architecture/parser.ts`.

**The prefix is declared, not derived, and that was a correction.** The first draft derived it from
the doc's identity — `R-<doc-stem>-<n>` — which for this program reads `R-clean-up-review-cycle-<n>`
and matches zero of its ten `R-crc-N` entries. The doc's stem is not the abbreviation its rulings
use, and no rule can know that it isn't: deriving one is a guess about a naming convention, which is
the inference R-crc-10 forbids. Declaring it also makes zero meaningful — with a prefix given, a
rulings section yielding nothing is a MALFORMED source that fails, never a count of zero.

**What the dogfood marks is a COUNT in a current-state sentence, never the range endpoint — and
that reverses an earlier decision in this change.** Marking the endpoint (`R-crc-1..` then a marked
`10`) looked like tight-span discipline and was a trap: the architecture doc has no current-state
summary, so its only `R-crc-10` IS the counted list entry itself. A marker there changes that
entry's first bold span, it stops matching the declared prefix, and the count drops to 9 — the
dogfood invalidating its own input. The general rule this forced is now normative in the spec: a
marked span SHALL NOT sit inside the text its own source is computed from.

The remedy is the same move D6b already makes for `CLAUDE.md`: WRITE a current-state sentence
outside the counted material and mark the COUNT in it. Count-as-endpoint was also unsound on its own
terms — the two coincide only while ruling ids stay contiguous, and nothing requires that.

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
new arrays: `source_findings` and `source_coverage` (source, value, marker count).

`source_findings` entries are DISCRIMINATED by `kind`, because the four failures have genuinely
different shapes and a single flat record would be null-padded for three of them:

| kind | fields |
|---|---|
| `registry` | `file` (the registry), `detail` — no markdown line, no source, no span |
| `marker` | `file`, `line`, `detail` — a malformed delimiter; no span and no source value exist |
| `unknown-source` | `file`, `line`, `source` — a well-formed span naming nothing declared; no value exists |
| `mismatch` | `file`, `line`, `source`, `span_text`, `source_value` |

Validity is represented the same way the bulk validator already does it, with the ITEM UNIT named so
two implementers cannot diverge: **one item is one DECLARED SOURCE.** `byType.sources` carries
`items` = the number of declared sources, `failed` = sources with at least one finding, `passed` =
the remainder; a registry-level fault that prevents resolving any source counts as ONE failed
pseudo-item so the run can never report zero failed items beside a non-zero exit. Source items do
NOT enter `items[]`, which today holds only `BulkItemResult` records — so `summary.totals.items` on a
registry-bearing run no longer equals `items.length`. That invariant is RETIRED deliberately rather
than by accident, and task 3.2 states it, because a consumer cross-checking the two would otherwise
break silently. A `--sources`-only run has no change or spec item and its `byType` carries only the
`sources` key. `--all`'s existing per-scope keys are untouched, so a consumer that
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

**The overlap with `orbit-audit-drift` is named rather than left implicit.** That capability's
Category 3 already extracts "quantitative claims — port numbers, counts, version pins, size limits"
from governing docs and raises a CRITICAL when one disagrees with a current spec; Case 1 records that
this is exactly how the schema-version defect was caught. So after this lands, two surfaces report on
the same marked figure. That is acceptable and is not the "two capabilities in charge of one rule"
defect the proposal rejects elsewhere, because they are different MECHANISMS with different
reliability: the lint is a deterministic check over DECLARED links and can never see an unmarked
figure, while audit-drift is an AI judgement that can — which is precisely the residual the lint
declares. (A later refinement might have audit-drift suppress quantitative claims inside marked
spans, to stop it re-reporting what the lint already owns. That would be a MODIFIED delta on
`orbit-audit-drift` and is out of scope here.)

The charter also carries two stale figures of its own — the file domain as "61 today" (a figure this change does not
restate: the exclusions are declared here and the count is whatever `git ls-files '*.md'` minus them
yields at the time of reading — an incidental total in this document would be one more of exactly the
defect the stage exists to stop, and an earlier draft of this paragraph had already gone stale within
the same session) and a coverage example reading
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
- **A new ruling-index grammar is a new way to be MALFORMED** → it is not, but the reason is narrower
  than an earlier draft of this entry claimed (that draft said the section "counts zero", which
  contradicts D3, the spec and task 1.1 — all three make a zero-match a FAILING source). The correct
  statement: a zero-match is a SOURCE-RESOLUTION error that fails the lint naming the doc and the
  prefix; it does NOT change the document's `docClass`, and `orbit architecture validate` is
  unchanged. The two failure kinds are separate, and neither is silent.

**Both architecture sources state their document preconditions**: an ABSENT doc, a LEGACY doc (no
parseable stages) and a MALFORMED doc each ERROR naming the doc and the source, rather than emitting
a count over a document the engine could not fully read.
- **`git ls-files` shells out to git** → read-only, no repository data is executed, and a non-git
  checkout degrades to "no domain, no findings" with a named reason rather than an exception.

## Migration Plan

Additive. The registry and the first marked spans land in the same change (the dogfood), so the
check has real subjects on day one. Stated precisely, because the looser phrasing overstated it: the
dogfood exercises ALL FOUR v1 registry SOURCES, which is not the same as covering all four defects
Case 1 recorded. The fourth defect — an archived findings file's severity string — has no engine
source and remains DELIBERATELY unsupported (D3's deferral, with its kind and method named). Any
charter amendment must carry that distinction, so the split is not narrated as closure. Rollback is deleting `orbit/sources.yaml`.

## Open Questions

None. The exploration closed with zero open questions; the deferrals above are DECLARED with kind
and method per D-bcs-2, not open.

### D4b — The inertness rule needs an inline-code scanner, and that cost is named here

Skipping inline code spans is not free. `src/core/markdown-fence.ts` is line-based and tracks FENCES
only; nothing in the engine tracks backtick spans within a line, so task 2.2 carries that work
explicitly rather than leaving an implementer to discover it mid-apply.

The alternative was to anchor the opener — require it to be preceded on its line only by whitespace,
or to share a line with its closer. It is cheaper and it is rejected: it forbids marking a figure
MID-SENTENCE, and every mark the dogfood places is mid-sentence. (An earlier draft justified this by
citing "the rulings endpoint above"; D3 has since reversed endpoint marking outright, so the
surviving case is the one that carries the argument — a marked COUNT inside a written current-state
sentence, in `CLAUDE.md` and in the architecture-doc sentence task 5.4 recommends.) A rule that
outlaws its own dogfood is the wrong rule.

This capability's own artifacts are the fixtures — and the test DERIVES them rather than pinning a
count, because the count moves every time a scenario is added (an earlier draft said "four" and was
wrong within the same session). The rule is: every conforming opener or closer appearing inside a
backtick span anywhere in this change's own prose must go silent, whatever the current number is. They are why the rule exists: the document describing the check
would otherwise fail it.

### D6b — `CLAUDE.md` has no present tense, and the dogfood has to write one

The charter's exit criterion (3) wants `CLAUDE.md` to carry markers for all four facts. **Most** of
that file's figures have nothing markable: capability figures are transitions inside archived stage
narratives (`11→12`, `13 → 14`, "capabilities stay at **20**") and most schema-version figures are
historical ("went to **version 2** at this stage"). Marking those would freeze a record against a
moving source — the inversion the living-versus-record principle exists to forbid.

**But an earlier draft of this section claimed the file has NO present tense at all, and that is
false in exactly the two places that matter.** `CLAUDE.md:113` says "eighteen small stages in four
phases" while describing the ACTIVE program — a present-tense claim, and the very defect instance
Case 1 recorded (it read "fifteen", then "seventeen", now 18). `CLAUDE.md:145` says "**`spec-driven`
is version 4**" — also present tense. Those two are LIVING claims that went stale, and they are the
right things to mark.

So the dogfood does BOTH, and the division follows the evidence rather than convenience: it MARKS
THE EXISTING LIVING SENTENCES where they exist (line 113's stage count, converted to a numeral;
line 145's schema version), and it WRITES a current-state line only for the facts with no present
tense to mark (the ruling count and the baseline capability count). A duplicate marked figure
alongside an unmarked one would give the file TWO VOICES for one fact — the charter rule this stage
exists to enforce — and would protect the copy that was never wrong while leaving the one that
failed three times unlinted.

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
- `src/core/sources-registry.ts` — ALSO carries the rulings-index entry count (declared-prefix grammar); deliberately NOT `src/core/architecture/parser.ts`, whose engine-opacity contract stays intact.
- `src/core/markdown-fence.ts` — gains an ADDITIVE whole-document code-region mask (today: fences only, line-based). `FenceTracker.inFence`/`handle` are NOT modified — the trail and report parsers share that API.
- `src/commands/validate.ts` — the `--sources` path and its `--all` inclusion.
- `src/cli/index.ts` — the `--sources` flag.
- `orbit/sources.yaml` — new: this project's registry (the dogfood).
- `CLAUDE.md` + `orbit/architecture/clean-up-review-cycle.md` — the first marked spans.
- `test/core/source-lint.test.ts` + `test/core/sources-registry.test.ts` — new instruments.

# Design: d4-review-consistency

## Context

D-arc Stage D4 (charter: `orbit architecture show d-arc-arbitered-flow d4-review-consistency`;
rulings R-d-1..10 constrain). Consumed exploration: explore.md D-d4-1..6 (all user-ratified).
The D3 cycle is the freshest evidence corpus: fifteen passes of format drift, plus the three
record-only corrections (a hand-authored gate verdict; two emit next-lines diverging from the
engine) that motivated making the computed tail structural.

## Goals / Non-Goals

**Goals**
1. Exit criterion 1: the same findings record produces a BYTE-IDENTICAL rendered report
   regardless of which model ran the review — engine-rendered, golden-tested.
2. Exit criterion 2: the walk provably follows discuss-then-ratify — prompt never precedes the
   briefing, batch prompts prohibited in the body, dismissed prompts lose nothing.
3. The economy dividend: review/address bodies shed their report-format prose.

**Non-Goals** (deferred list, explore.md): resolution-log rendering; `--report --json`;
broader body-slimming (D5); any change to the external prompt template's markdown contract.

## Decisions

### D1. The renderer is a pure function; the tail is computed at render time (D-d4-1)

`src/core/report-render.ts`: `renderReviewReport(pass, context)` where `pass` is a normalized
review pass (an internal `review-<mode>-*.json` emit OR the trail reader's parsed external
findings file — the SAME `TrailPass`-adjacent shape) and `context` carries the render-time
joins: iteration number + trend (computed from the change's prior passes in the trail), and
the gate/position/eligibility tail (from `loadChangeContext`/`formatChangeStatus` +
`computeGateStates` — the same sources the D3 orientation surface composes from). NOTHING in
the tail or trend is read from the emit: storing computed context would create a second copy
that goes stale, and sourcing the gate line from the gate computation makes the D3-cycle
verdict lesson structural — the renderer CANNOT print an AI-authored verdict.

### D2. The report grammar sandwiches; commentary is quarantined variance (D-d4-1/2)

Fixed section order: header (change · mode · iteration · reviewer class · depth) → trend line
→ scorecard table → findings by severity (title, file:line, recommendation verbatim; structured
`recommendation_options` rendered as labeled alternatives) → suppressed-with-evidence → the
ONE delimited `### Commentary` slot (the emit's `commentary` string verbatim; absent field =
section omitted) → the engine tail (gate line · position · `Ready when you are:` eligibility),
ALWAYS last. Byte-identity binds the whole render; commentary is INPUT variance (two models
write different commentary), never render variance. The commentary contract: everything the
structure can't say — pattern behind the findings, what was probed, risk texture — and
PROHIBITED from counts/verdicts/next-commands (those exist only in engine sections, so the two
voices can never disagree; golden fixtures include a commentary carrying near-miss phrasing to
pin the delimiter).

### D3. Strict/loud validation (D-d4-6a — deliberately unlike orientation)

The renderer validates its input before rendering: required spine fields plus the review
extensions (`mode`, `iteration`-ables, `scorecard` shape, `findings[]` entry shape). First
missing/mistyped field → clean error naming it; NO partial render. Rationale: `--report` is
the AI's own tool in the run-and-paste loop — failing loud catches a malformed emit at the
source pass, where it can be fixed. The D3 orientation surface keeps its graceful degradation
(different consumer, different contract); the two policies are both deliberate and documented
side by side.

### D4. One grammar for internal and external passes (D-d4-6b) — via a NORMALIZED parse

External findings files (`external-<as>-<TS>.md`) render through the SAME grammar from their
PARSED form. The trail reader's existing parse is NOT sufficient (`TrailPass` carries only
`{title, file}` with `:line` stripped — iter-1 CRITICAL): task 1.5 EXTENDS the external parse
into the normalized render shape — per finding, the full `**Description**` body as the
verbatim recommendation with the `**File**` line reference retained; the header's reviewer and
date; the `## Notes` section mapped to the report's Commentary slot (it IS the external
reviewer's color commentary — the D-d4-1 quarantine applied symmetrically). The extension is
made FENCE-AWARE (headings/field lines inside code fences never count — the existing parser is
not, despite rendering Description bodies that plausibly contain fences; user fork A).
Validation splits per genre (D3): internal = spine + review extensions; external = confident
parse. `--report <TS>` resolves the token against BOTH genres on the shared recency axis
(equal tokens: `orbit-orientation`'s earlier-filename-wins rule). The external prompt template
is untouched; determinism applies from ingest onward. A parse-rejected external file is
non-renderable → the clean error names it. The gate model's OWN trail consumption
(`gates.ts`) keeps the lean parse — the normalized shape is the renderer's input, not a gate
contract change.

### D5. The surface is the status gateway (D-d4-5 — supersedes a standalone verb)

`orbit status --change <name> --report [<TS>]` — the trail gateway completing the D3 zoom
ladder (bare → --full → --change → --report). Rides the `--change` form per the D3
engine-gates scoping; bare stays the sprint view. Read-only (the D3 invariant extends: the
render creates and modifies no files). Non-renderable emit genres (propose, apply, …) fail
with a clean error naming what IS renderable — the genre dispatch reads the emit's spine
`command` field, leaving resolution-log rendering as a cheap later extension. NO delta to
`orbit-orientation`: its requirements govern the bare/--full tiers and explicitly leave the
`--change` form to the per-change contracts; `--report` adds a flag to that form without
contradicting any orientation requirement (verified against the D3 baseline — the read-only
scenario's letter is capability-scoped, and the render honors it regardless).

### D6. The three-lane walk; the prompt is a closure device (D-d4-3/4)

Lane 1 (obvious fix): today's trivial-fix classification, unchanged mechanics — but the walk
OPENS with a compact preview of every lane-1 resolution BEFORE any fix lands (the
over-classification guard: presentation-ordering, not a prompt; the user pulls any item into
lane 2 with a word). Lane 2 (decision): a FULL-PROSE briefing in chat — what the finding
means, why it matters, terminology level-set, options with real tradeoffs (the fork detection
machinery — structured `recommendation_options` preferred, strict heuristic fallback —
survives as the BRIEFING's option source, not the prompt's) — then genuine back-and-forth. A
user-typed chat directive IS ratification (the consent model's strongest provenance; the
resolution log records the chosen resolution + `ratified_via: "chat" | "prompt"`). The
AskUserQuestion fires ONLY as closure when the discussion trails off without a crisp
directive, carrying the discussed conclusion as its default option. Dismissed or inconclusive
→ the finding RE-PRESENTS; nothing lost. Lane 3 (stale/unresolvable): unchanged. Batch
PROMPTS prohibited (grep-testable body text); batch DELEGATION (an explicit user directive
compressing lane 2) survives — user prerogative under the consent model, distinct from the
dead batch prompt.

### D7. The economy dividend is the enforcement mechanism (D-d4-6c)

The review body's report-format sections (the markdown scaffold, scorecard layout, final-
assessment phrasings) are DELETED, replaced by: persist the emit → run
`orbit status --change <name> --report` → paste the output VERBATIM → converse freely after
(loose form). The greppable prohibition ("never hand-render the structured sections") is what
makes criterion 1 hold in practice — same pattern as D1's imperative-label prohibition. The
address body sheds its resolution-report scaffold similarly only where the walk rewrite
touches it; broader slimming is D5-the-stage's.

### D8. The final-assessment machinery collapses into the engine (iter-1 CRITICALs 1–4)

The baseline's `Final assessment phrasings depend on mode` requirement (orbit-review) and the
conventions stock-phrasings standard are MODIFIED, not merely orphaned: the convergence branch
routing they enumerated (ordered slots, unresolved-pass precedence, confirm predicates, the
five external-dimension buckets) already computes in `orbit-engine-gates`' reviewed-gate model
— the requirement's own text said so — and the exact phrasings become the renderer's fixed
grammar, pinned by goldens. The as-of-completion SYNTHETIC-PASS computation is retired
outright: persist-first ordering makes the on-disk trail complete before render, so the report
tail, `orbit status`, and `orbit instructions` all read one pure function with no disagreement
window. This is a deliberate large-block collapse (the branch scenarios' stock phrasings move
to golden fixtures; the predicates stay specced in orbit-engine-gates; nothing is silently
dropped — this note is the record). Likewise the walk-mode requirement's mandatory per-finding
prompt and the resolution-log's `discuss_invoked` are replaced by the lane protocol and
`ratified_via`/`delegation_directive` (off-menu chat ratifications record
`chosen: "off-menu"` + a verbatim `resolution` string). One naming note: the rewritten
decision-lane requirement KEEPS the title `Disjunctive recommendation fields surface as
decision forks` (avoiding a RENAMED op mid-cadence; the content is the lane protocol) — a
future rename is fine, just not re-litigated here.

## Alternatives considered

(Full record in explore.md Decisions/Considered & out.)

- **Standalone `orbit render <emit>` verb** — rejected (D-d4-5): splits the trail's access
  story, loses the sprint-view zoom-in continuity, renders the current-tail semantics oddly;
  the self-identifying-genre idea survives inside `--report`.
- **Report-only chat turns (strict form)** — rejected (D-d4-2): the user wants the grounding
  summary AND free engagement; predictability serves the conversation, never replaces it.
- **Commentary as minimized residue** — rejected (D-d4-1): commentary is crucial insight,
  promoted to a first-class quarantined field rather than squeezed out.
- **Requiring the AskUserQuestion as formal closure on every decision** — rejected (D-d4-4a):
  a chat directive is stronger provenance than a button; the prompt is optional closure.

## Risks / Trade-offs

- **Byte-identity vs evolving grammar**: golden tests make report-format changes deliberate
  (edit goldens consciously) — that friction is the point.
- **The renderer double-sources per-change status** (report tail + orientation both call the
  change-status computation): acceptable — both are read-only composition over the same
  engine; no caching, no divergence surface.
- **Chat-ratification auditability**: recording `ratified_via: "chat"` with the resolved
  content keeps the trail honest without forcing prompts; the one-observed-cycle criterion
  covers the UX claim the body text can't prove.
- **Strict render vs legacy emits**: pre-D4 review emits lack `commentary` (fine — optional
  field, section omitted) but carry the required shapes; genuinely malformed historical emits
  fail loud with the named field — correct behavior, and `--report <TS>` of a healthy pass is
  unaffected.

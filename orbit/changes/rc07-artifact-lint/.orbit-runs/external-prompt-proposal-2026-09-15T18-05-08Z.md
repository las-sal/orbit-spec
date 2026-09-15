# External Review: rc07-artifact-lint (iteration 1)

You are reviewing an OpenSpec change as a second pair of eyes. Your value is
your independent take — be thorough; flag anything that looks wrong,
inconsistent, or unclear. Don't be charitable to the authoring AI's reasoning.

## Repo

https://github.com/las-sal/orbit-spec.git (branch `d-arc`)

## Project context (read first)

- `CLAUDE.md` — handoff orientation
- `orbit/architecture/clean-up-review-cycle.md` — the LIVE program this change cites as stage
  `rc07-artifact-lint`. Read its rulings index (R-crc-1 .. R-crc-10) and the stage's charter
  and exit criteria. **R-crc-1** (size ceiling: ≤3 capabilities / ~12 requirements / ~40KB /
  <20 tasks), **R-crc-9** (split the mechanism or declare the stage blocked — never substitute
  a cheaper one) and **R-crc-10** (mechanize only what the engine can OBSERVE: name the inputs,
  and where any input is prose or judgment the deliverable is a RECORD, not a CHECK) are the
  rulings this change is built on and should be judged against.
- `orbit/project.md` — project goals + stack (if present)
- `*_convention.md` at repo root — naming, error handling, etc. (if present)
- `orbit/lenses/perspectives.md` — named callers worth validating from (if present)
- `orbit/lenses/critical-paths.md` — user flows worth walking end-to-end (if present)
- `orbit/changes/rc07-artifact-lint/.orbit-runs/` — iteration history; see what's
  already been addressed in prior cycles

## Cycle context

- Iteration: 1 (first external review for this change in `proposal` mode)
- Prior internal findings still open: **0**. Two internal passes have run and both were fully
  walked — a `fresh` clean-context pass (2 CRITICAL / 8 WARNING / 4 SUGGESTION, all resolved)
  and an `in-context` pass (0 CRITICAL / 4 WARNING / 4 SUGGESTION, all resolved).
- Prior external findings still open: none — you are the first external reader.
- Resolved since the last review (the in-context pass, all 8): no requirement named the surface
  the lint is reached through; task 1.3 was short of the malformed-registry scenario; the spec
  never stated that a source emits a STRING; the pairing table mixed parse errors with a check
  failure and said nothing about blast radius; the v1 source table existed in two places;
  `prefix` matching and `<n>` were unspecified; `specs.capability-count` did not say what it
  counts over; the exclusion-table lead-in was stranded behind a digression.
- Resolved in the round before that (the fresh pass, all 14) — the two CRITICALs are worth
  knowing because their repairs authored new mechanism you are the first independent reader of:
  the `architecture.ruling-count` grammar derived its prefix from the doc's filename stem and so
  matched nothing (now a DECLARED `prefix` registry parameter), and the marker-inertness rule
  covered fenced code blocks but not inline code spans, so the change's own artifacts broke the
  check it ships (inline code spans are now inert). Also authored during those walks: the
  within-file living/record boundary rule, the marker-error blast-radius rule, and the
  parse-error-versus-check-failure split in the pairing table.

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

## What to read for THIS review (--as proposal)

```
- orbit/changes/rc07-artifact-lint/proposal.md
- orbit/changes/rc07-artifact-lint/design.md
- orbit/changes/rc07-artifact-lint/tasks.md
- orbit/changes/rc07-artifact-lint/specs/orbit-source-lint/spec.md
- orbit/changes/rc07-artifact-lint/explore.md (the exploration the artifacts were generated
  from — its decisions are the authoritative seed; Case 1 and Case 2 are executed procedures
  against real data and are the strongest material in the change)
- orbit/changes/rc07-artifact-lint/sketches/rc07b-reference-roundtrip-charter.md
- orbit/specs/<capability>/spec.md (the 20 archived baselines — for delta consistency checks;
  `orbit-conventions` is the one that owns the repo's other marker families)
```

Engine reality worth verifying rather than taking on faith — this change claims four facts are
already computable by the engine, and a prior pass found one of those claims false:

```
- src/commands/validate.ts and the `validate` registration in src/cli/index.ts
- src/core/architecture/parser.ts (what it parses; what it does NOT)
- src/core/markdown-fence.ts (what it tracks; what it does not)
- schemas/spec-driven/schema.yaml
- src/utils/item-discovery.ts
```

## What to look for

1. **Structure & Delta Integrity** — required artifacts present; ADDED/MODIFIED/REMOVED/RENAMED valid; `orbit validate` would pass.
2. **Internal Coherence** — proposal aligns with design aligns with specs aligns with tasks. Count/label consistency. No scope creep.
3. **Cross-Doc Coherence** — `CLAUDE.md`, `project.md`, `*_convention.md` still accurate after this change.
4. **Archive Consistency** — ADDED don't contradict baseline; RENAMED FROM names exist; REMOVED not still referenced.
5. **Codegen Readiness** — no implicit requirements; no decisions left to codegen; no ambiguity.
6. **Gap Hunt** — could a fresh AI implement this from these specs alone? Unstated assumptions? Error paths? State transitions?
7. **Drift Hunt** — old vocabulary lingering; consistency with `*_convention.md`.
8. **Inline Review Marker Residue** — any `@review:` markers still present (must be addressed before apply)?
9. **Pre-Handoff Sweep** — anything else before shipping?

### Where this change is most likely to be wrong (probe these hardest)

These are the author's own stated uncertainties plus the areas two internal passes have churned.
Treat them as starting points, not a checklist — findings outside this list are welcome.

- **The R-crc-10 claim itself.** The design opens by asserting that every input the check needs
  is engine-observable, and that the one that is not (which unmarked number restates which fact)
  is deliberately not built. Test that claim requirement by requirement: is there anywhere a rule
  quietly requires inferring authorial intent? Two prior stages in this program died doing exactly
  that and the ruling exists because of it.
- **The mechanism authored during the walks** — the declared `prefix`, the inline-code inertness
  rule, the within-file "the author's marker is the living/record boundary" rule, the blast-radius
  rule. No independent reader has seen any of it. In this program's history, walk-authored
  mechanism is where defects concentrate.
- **Self-application.** This change's own artifacts contain conforming `src:` markers inside
  inline code spans. The spec claims they are inert. Verify that the rules as written actually
  make every one of them inert — including a bare closer with no opener — and that
  `orbit/changes/<name>/` (NOT under `archive/`) being inside the file domain is handled.
- **Whether task 2.2 is bounded.** It requires extending `src/core/markdown-fence.ts` with
  inline-backtick-span tracking. The author could not determine from the artifacts whether a
  correct-enough subset of CommonMark's inline-code rules is fifty lines or three hundred. If you
  can judge this, it is the highest-value thing you can tell us.
- **The dogfood (tasks 4.1–4.3).** It is the only place this change meets reality. Task 4.2 now
  requires WRITING a current-state line into `CLAUDE.md` and marking it, because that file
  narrates every transition and asserts no present state. Is that sound, or is it manufacturing
  a subject for the check to have something to check?
- **Containment.** The check is `span.includes(sourceValue)` — never a numeric parse. The spec
  states the residual (a stale span containing the current value passes). Is the residual stated
  completely, and is containment still the right primitive?
- **Size.** Measure the change against R-crc-1's ceiling (≤3 capabilities / ~12 requirements /
  ~40KB / <20 tasks). `design.md` is the heavy artifact.

## Output format — write to:

`orbit/changes/rc07-artifact-lint/.orbit-runs/external-proposal-<TS>.md`

(Where `<TS>` is today's timestamp in ISO format, e.g. `2026-09-15T20-14-03Z`. Pick a fresh
timestamp so this file doesn't overwrite prior reviews.)

Use this exact markdown structure:

```markdown
# External Review: rc07-artifact-lint (iteration 1)

**Reviewer**: <your model name>
**Date**: <YYYY-MM-DD>

## CRITICAL

### <Finding title>
**File**: <path>:<line>
**Description**: <what's wrong + specific recommendation>

(For each additional CRITICAL finding, repeat the `### <Title>` + `**File**:` + `**Description**:` triple. Use `None.` as a single-word body if there are no findings at this severity.)

## WARNING

### <Finding title>
**File**: <path>:<line>
**Description**: <what's wrong + specific recommendation>

(Same shape as CRITICAL. Use `None.` if no findings.)

## SUGGESTION

### <Finding title>
**File**: <path>:<line>
**Description**: <what's wrong + specific recommendation>

(Same shape. Use `None.` if no findings.)

## Notes

<Optional — rendered VERBATIM into the report's delimited Commentary slot: carry the pattern behind the findings, what you probed, and risk texture; do NOT state finding counts, gate verdicts, or next commands — those exist only in the report's engine-computed sections. Omit the whole `## Notes` section if you have nothing to add.>
```

If your environment doesn't support file writes (chat-only interface), output
the markdown directly and the user will save it.

## After completing the review

1. **Output the full findings markdown in chat** — in addition to writing the
   findings file, output the COMPLETE findings markdown in this chat. Same
   content as the file: every severity section (`## CRITICAL` / `## WARNING` /
   `## SUGGESTION`), every `### Title` entry, every `**File**:` and
   `**Description**:` field. Do NOT abbreviate or summarize — the chat output
   is the immediately-visible read for the user (they should be able to
   evaluate every finding without opening the file). The file remains the
   canonical record for `--from-file` parsing.

2. **Commit and push the findings file** (if your environment supports git):

   ```bash
   git add orbit/changes/rc07-artifact-lint/.orbit-runs/external-proposal-<TS>.md
   git commit -m "External review (proposal, iter 1): rc07-artifact-lint

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   Then STATE PLAINLY in your chat output that the findings landed —
   `Findings committed (<short-sha>) and pushed` — so the human never has to
   infer whether they reached the repo.

If you don't have git access, just output the findings markdown in this chat
(per the chat-only fallback above), state explicitly that you could NOT
commit/push, and the user will commit it manually.

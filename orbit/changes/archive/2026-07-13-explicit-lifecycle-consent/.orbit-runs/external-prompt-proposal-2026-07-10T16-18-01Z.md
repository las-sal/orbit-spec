# External Review: explicit-lifecycle-consent (iteration 2)

You are reviewing an OpenSpec change as a second pair of eyes. Your value is
your independent take — be thorough; flag anything that looks wrong,
inconsistent, or unclear. Don't be charitable to the authoring AI's reasoning.

## Repo

https://github.com/las-sal/orbit-spec.git — branch `d-arc`

## Project context (read first)

- `CLAUDE.md` — handoff orientation (if present)
- `orbit/architecture/d-arc-arbitered-flow.md` — this change is **Stage D1 of the D-arc
  program**; the arc's D1 exit criteria are the change's acceptance tests, and rulings R-d-1..8
  constrain the design. Artifacts contradicting the arc are findings.
- `orbit/project.md` — project goals + stack (if present)
- `*_convention.md` at repo root — naming, error handling, etc. (if present)
- `orbit/lenses/perspectives.md` / `orbit/lenses/critical-paths.md` (if present)
- `orbit/changes/explicit-lifecycle-consent/.orbit-runs/` — iteration history

## Cycle context

- Iteration: 2 (prior external: iteration 1 by **GPT-5 Codex**, 2026-07-10 — 2 CRITICAL +
  1 WARNING, all resolved: consent-era detection reworked to a persisted `schema_version`
  metadata marker with absence-as-exempt; standalone-sync consent descoped, user-ratified;
  conventions' canonical emit examples gained `consent`).
- Prior internal findings still open: 0 — three internal passes fully resolved (iter 1
  in-context: 6; iter 2 fresh: 3; iter 3 fresh: 3 — the latest CRITICAL being onboard's
  identity prose pinning "three execution disciplines" vs the new fourth).
- Prior external findings still open: none.
- Resolved since last external review: iter-3's 3 findings (onboard four-disciplines delta —
  the 8th capability; proposal bullet completeness; engine-gates bullet precision).
- Running pattern worth knowing: ALL FIVE CRITICALs across all passes were the same class —
  un-delta'd baseline text contradicting the new behavior. Iter 3 grep-swept the baselines and
  believes the class is now exhausted. Verify that belief.

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

## What the change does (orientation)

The consent/arbiter layer (D-arc Stage D1). Adds: a `consent: user-invoked` gate attribute in
the schema (spec-driven v3; engine parses + surfaces, never prompts); provenance-conditioned
consent AskUserQuestions in apply/archive/bulk-archive bodies (user-typed commands NEVER prompt;
AI-mediated arrivals ALWAYS do; uncertain → AI-mediated; sync inherits containing-flow consent,
standalone sync descoped); the no-chaining contract in orbit-conventions (fourth execution
discipline, echoed in all bodies); eligibility phrasing (`Ready when you are:` + ` — user-invoked`
marker) across engine readouts and orbit-review's stock phrasings; a flat
`consent: "user-invoked" | "prompted"` field on apply/archive emits (conventions' canonical
examples updated); consent-era detection via a persisted `schema_version` metadata marker
(absence = pre-consent = exempt); and an audit-drift tripwire that is the named re-entry trigger
for deferred harness-hook enforcement.

## What to read for THIS review (--as proposal)

- orbit/changes/explicit-lifecycle-consent/proposal.md
- orbit/changes/explicit-lifecycle-consent/design.md
- orbit/changes/explicit-lifecycle-consent/tasks.md
- orbit/changes/explicit-lifecycle-consent/specs/<capability>/spec.md — every spec under specs/:
  orbit-lifecycle-consent (new) + 7 modified (orbit-engine-gates, orbit-conventions,
  orbit-archive-modifications, orbit-run-summary-emit, orbit-audit-drift, orbit-review,
  orbit-onboard)
- orbit/changes/explicit-lifecycle-consent/explore.md (decision record, D-elc-1..10 + dated
  refinements)
- orbit/specs/<capability>/spec.md (archived baselines — the EIGHT MODIFIED blocks should
  contain their current baseline requirements verbatim plus only intended edits)

Useful commands: `npm install && npm run build`,
`node bin/orbit.js validate explicit-lifecycle-consent --strict`,
`node bin/orbit.js fingerprint explicit-lifecycle-consent --check` (expect 8/8 verified).

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

Independent-take probes: is the exhausted-contradiction-class belief actually true (your own
sweep of baselines vs everything the deltas redefine: labels, discipline counts, emit fields,
schema version, consent vocabulary)? Do the eight MODIFIED blocks carry any semantic drift beyond
intended transforms? Is `schema_version` absence-as-exempt sound against how
`orbit new change` / `writeChangeMetadata` actually behave (src/utils/change-metadata.ts,
src/core/artifact-graph/types.ts)? Can the bodies implement the provenance rule as written?

## Output format — write to:

`orbit/changes/explicit-lifecycle-consent/.orbit-runs/external-proposal-<TS>.md`

(Where <TS> is today's timestamp in ISO format with hyphens. Pick a fresh timestamp so this file
doesn't overwrite the iteration-1 review.)

Use this exact markdown structure:

```markdown
# External Review: explicit-lifecycle-consent (iteration 2)

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

<Optional: overall impression, broader concerns. Omit the whole `## Notes` section if you have nothing to add.>
```

If your environment doesn't support file writes (chat-only interface), output
the markdown directly and the user will save it.

## After completing the review

1. **Output the full findings markdown in chat** — every severity section, every entry, no
   abbreviation. The file remains the canonical record for `--from-file` parsing.

2. **Commit and push the findings file** (if your environment supports git):

   ```bash
   git add orbit/changes/explicit-lifecycle-consent/.orbit-runs/external-proposal-<TS>.md
   git commit -m "External review (proposal, iter 2): explicit-lifecycle-consent

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   Then STATE PLAINLY in your chat output that the findings landed —
   `Findings committed (<short-sha>) and pushed`.

If you don't have git access, output the findings markdown in this chat, state explicitly that
you could NOT commit/push, and the user will commit it manually.

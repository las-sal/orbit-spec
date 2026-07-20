# Design: d3-orientation

## Context

Stage D3 of the D-arc (`orbit architecture show d-arc-arbitered-flow d3-orientation` — the arc
owns charter + exit criteria per R-d-7; explore.md D-d3-1..5 is the ratified decision record;
this design maps those decisions onto code). Grounding facts (verified): bare `orbit status`
with active changes currently THROWS ("Missing required option --change", status.ts:57) — the
surface claims an error path, repurposing nothing; per-change position/next_command/gates come
from `loadChangeContext` + `formatChangeStatus` (the same computation `--change` renders); stage
states come from `listArchitectureDocs` + `computeStageStates`; trail filenames carry sortable
`<TS>` tokens (`parseTsToken`, trail.ts:60). The D2 cycle retired hand-maintained position; D3
composes the computed pieces into the return-after-a-day surface.

## Goals / Non-Goals

**Goals** (= arc §d3-orientation exit criteria):

1. Cold-start test: fresh session, only prior read CLAUDE.md, several active changes — ONE
   command answers per change: position, last workflow command, next eligible command(s), with
   no artifact reading beyond the command's own output.
2. `~/code/orbit-status` retired as a separate project.

**Non-Goals** (deferred list, explore.md): fleet-level task-%/marker detail; watch modes;
`--json` stability contract; conversational elaboration (CLI-only per D-d3-5); program-level
gates (D-d2-5 standing).

## Decisions

### D1. One aggregation module, zero new inference (`src/core/orientation.ts`)

A pure composition layer: `collectOrientation(projectRoot)` returns `{program, workstreams,
last, waiting}`. Sources — active changes via the existing change listing +
`loadChangeContext`/`formatChangeStatus` (position, next_command, gates, task counts); staging
explores via `orbit/explore/*/` presence + their `.orbit-runs/`; program layer via
`listArchitectureDocs` + `computeStageStates`; recency via emit filenames' `<TS>` tokens
(`parseTsToken`) merge-sorted across the four trail locations (per-change, per-explore,
architecture, project-wide) plus archived changes' relocated trails
(`orbit/changes/archive/*/.orbit-runs/` — global-LAST sourcing only, never live enumeration or
sprint anchoring; external iter 2 W2); equal tokens tie-break by workstream name then full
filename (shared by sprint anchoring and global LAST; external iter 2 W1). NO filesystem
archaeology beyond trail/metadata reads — the module
never infers position from artifact contents (D-d3-1; the v0.1 bash approach is the named
anti-pattern). FAULT ISOLATION per the spec's malformed-input policy: invalid emits —
unreadable, JSON-invalid, or spine-invalid (missing/non-string spine fields orientation
renders; T0 `mode` for WAITING) — are skipped
with fallback to the next-older valid one and excluded from WAITING counts; a workstream whose
status/metadata load fails
renders a degraded row without aborting the fleet (a degraded SPRINT renders the row in place
of the strip + trustworthy fields); all fallbacks deterministic.

### D2. The bare view: sprint strip + last + next + also (D-d3-3)

Bare `orbit status` (with ≥1 live workstream) renders:

- **Strip**: the lifecycle phases with state chips. Change phases come from the gate graph
  (`propose ✓ → review ⟲N …`); the `explore` phase is prepended — `✓` when `explore.md` exists
  in the change (consumed exploration), `▶` when the workstream IS a staging explore (no change
  yet), absent when neither. Review loops render as ONE chip with iteration count
  (`review ⟲6 ✓`) — count of `review-<mode>-*.json` in the workstream's trail for that phase;
  apply renders task progress (`apply ▶ 12/20`) from the tracked gate's checked/total.
- **last**: the workstream's most recent emit — `command · relative-time` + its
  `final_assessment` trimmed to the first sentence (hard cap ~160 chars, ellipsis).
- **next**: for a CHANGE, the engine-computed `next_command` (always current, engine-vetted);
  for an EXPLORE, the last emit's recorded `next_recommended` (no gate graph exists over
  explores — the recorded recommendation is the only source, and the begin emit guarantees one
  exists from minute zero). Eligibility framing verbatim; never an imperative label.
- **also**: one line — other live workstreams (`name (phase)`) + waiting-on-you items (see D4).

### D3. Continuity predicate + degradation ladder (D-d3-4)

Current sprint = the workstream owning the most recent emit among LIVE workstreams (active
change dirs + staging explore dirs; archived changes and the architecture/project trails never
anchor the sprint). Ladder (explicit predicates, precedence
order): (1) ≥1 live workstream → sprint view; (2) zero live workstreams AND ≥1 parseable
architecture doc → bare renders the `--full` arc view (nothing in flight IS the orientation);
(3) zero live workstreams AND zero parseable docs → the existing "No active changes" message,
unchanged. Orthogonally: `--full` with zero parseable docs → flat fleet view (workstreams
unnested, no PROGRAM band).

### D4. WAITING derivation is a closed list (no heuristics)

Waiting-on-you items, all trail/engine-derived: (a) a stage rendering
quiescent-awaiting-ratification; (b) outstanding packaged externals — COUNT-BASED per
change+mode (#T0 emits − #returned findings files; renders `N packaged, M returned`; external
iter 1 W4, user option C — no pairing token, no concurrency prohibition, deterministic
arithmetic); (c) a gate `unpassed`/`stale` on a live change (rendered with the engine's
reason). CLOSED set — new
waiting classes require a spec change, not an inference tweak.

### D5. `--full`: the arc-as-spine view — and the cold-start tier

PROGRAM band (every stage, computed state, one line each; legacy/malformed docs listed as the
architecture status surface lists them) with live workstreams nested under their cited stages
(citation from metadata; uncited workstreams under `standalone`), then LAST (global most recent
emit, any trail incl. architecture AND archived changes' relocated trails — LAST-band only)
and WAITING (D4) bands. EVERY workstream entry carries its
own full orientation tuple (strip/position + last + next, text and JSON) — `--full` is the tier
satisfying the arc's per-workstream cold-start exit criterion (external iter 1 CRITICAL); the
SOLE exception is a degraded workstream, whose entry is the degraded variant
(`{name, kind, degraded: true, error}` + trustworthy fields — the tuple mandate and fault
isolation reconciled, external iter 2 CRITICAL); bare
stays the deliberately-minimal sprint view (D-d3-2/3). `--json` for both tiers shares ONE
discriminated workstream-entry shape (kind change|explore — explore entries carry no `gates`
and `position: "exploring"`; degraded as above; absent fields omitted, never null): bare =
`{sprint, last, next, also, waiting}` with `sprint` one such entry; full =
`{program, workstreams, last, waiting}` —
compositions of existing payload shapes (the change-status JSON and the architecture-status
buckets), not new schemas.

### D6. The explore BEGIN emit is body-layer (D-d3-4)

Mode B/C scaffolding writes `explore-<TS>.json` immediately after the staging dir + metadata
are created — content is MODE-AWARE (iter-2 CRITICAL resolution, option A): Mode B records
`decisions_captured: 0` / `open_questions_count: 0` and the Early canonical
`next_recommended: "/orbit:explore <name> — continue capturing thinking"`; Mode C
(crystallization) records the BACK-FILLED counts and a maturity-consistent recommendation —
the crystallization requirement's "first emit" IS this begin emit, so the trail's first record
never understates a crystallized session. Both record the scaffold + the citation decision
(cited or declined) in `final_assessment`. Timing becomes begin + boundary (the
apply chunk+pause genre); bare mode still never emits; resume of a pre-D3 staging dir that has
no emits does NOT retro-fire a begin emit (the next boundary emit covers it — add-only, no
backdating). Spec deltas: `orbit-run-summary-emit` (Emit timing semantics + a begin-emit
scenario under Emit scope), `orbit-explore-modifications` (Mode B AND Mode C scenarios gain
the mode-aware emit — Mode C back-fills first, then fires it with back-filled counts),
`orbit-architect` (its emit-timing citation named the named-mode-explore genre, which this
delta re-genres — reworded to cite conversation-boundary timing directly; architect gains no
begin emit; iter-4 W1);
body edit in `explore.ts`.

### D7. CLAUDE.md cold-start pointer at apply-seam

Exit criterion 1 says the fresh session's ONLY prior read is CLAUDE.md — so CLAUDE.md must
name the command. One sentence in the D-arc section ("orientation: run `orbit status` — bare
for the current sprint, `--full` for the arc") lands during apply (the D2 precedent: the
position-pointer sentence was an apply-seam fix, not archive-time).

## Alternatives considered

(Full record in explore.md Decisions/Considered & out; summarized to prevent rediscovery.)

- **Arc-as-spine for the BARE view** — superseded (D-d3-2): most returns are mid-sprint; the
  arc view costs screen/context the common case doesn't need. Bare = sprint; `--full` = arc.
- **Slash-command wrapper (full skill OR 2-line verbatim mirror)** — rejected (D-d3-5):
  re-narration is what D5-the-stage kills; `! orbit status` covers in-session use.
- **Presence/mtime fallback instead of a begin emit** — rejected (D-d3-4): date-granular
  `created`, git-fragile mtimes, and it re-opens the trail gap; the begin emit fixes anchoring
  AND records the `premised → exploring` transition.
- **v0.1 carry-forward (bash+jq, filesystem position inference, `/opsx:status`)** — retired
  outright (the R-d-4 subtraction; engine-native since C1/D2).

## Risks / Trade-offs

- **[Recorded next can lag for explores]** — a stale `next_recommended` renders until the next
  boundary emit; accepted (D-d3-3's time-shifted contract; changes always use the live engine
  computation).
- **[Trail scan cost]** — four locations, dozens of small JSONs; pure recompute per invocation,
  no caching (the C2/D2 precedent); revisit only if measured.
- **[Strip width]** — six phases + chips can exceed a terminal line for long names; v1 accepts
  UNBOUNDED width (no truncation rule; terminals wrap) — `--json` carries structured data for
  any consumer needing layout control. Deferred with the other render polish.

## Migration Plan

None required: bare-with-changes was an error path (new behavior, no repurposing); `--change`
and no-changes outputs byte-identical; the begin emit is add-only (pre-D3 staging dirs emit at
their next boundary; no backdating). Rollback = revert.

## Open Questions

None — D-d3-1..5 resolved in explore.md; both open questions closed in-session.

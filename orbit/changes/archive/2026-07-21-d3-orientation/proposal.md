# Proposal: d3-orientation

## Why

D-arc Stage D3 — orientation (status absorption). The arc's motivating incident: multi-session
disorientation across concurrent changes and step-away-and-return. The data to answer "where am
I" already exists — every emit carries `command` + `next_recommended`; the engine computes
`position`/`next_command` per change and stage states per architecture doc — but no surface
COMPOSES it. Reconstructing state today costs a session's context (reading artifacts, listing
trails); the `~/code/orbit-status` test project proved the demand by reimplementing position
inference in bash+jq that is now engine-native. Intent (explore D-d3-1): **orientation, not
information** — the return-after-a-day question and the cold-start-AI question answered by ONE
command with zero artifact reads, as a composition of existing engine/trail data, never new
inference. (`orbit list` stays inventory; `--change` stays single-change depth;
`orbit architecture status` stays the program layer.)

Charter and exit criteria are owned by the arc (`orbit architecture show d-arc-arbitered-flow
d3-orientation`): (1) the cold-start test — fresh session whose only prior read is CLAUDE.md,
several active changes, one command answers position / last / next per change with no artifact
reading beyond the command's own output; (2) `~/code/orbit-status` retired as a separate
project.

## What Changes

- **`orbit-orientation` (ADDED capability)** — the two-tier surface (explore D-d3-2/3):
  bare `orbit status` renders the CURRENT-SPRINT strip — one workstream's lifecycle
  (`explore → propose → review ⟲ → apply → review ⟲ → archive`), last emit in the trail's own
  recorded words, the next recommendation (time-shifted: recorded `next_recommended` for
  explores, engine-computed `next_command` for changes), and one `also` line (other active
  work + waiting-on-you items). Bare invocation with active changes is TODAY an error path
  ("Missing required option --change") — the surface claims it; the no-changes message and
  `--change` behavior are unchanged. `orbit status --full` renders the arc view: all stages
  with computed states, workstreams nested under their cited stages (EVERY entry carrying its
  own position/last/next tuple — the tier satisfying the arc's per-workstream cold-start exit
  criterion), LAST + WAITING bands; fleet collection is fault-isolated (a damaged workstream
  degrades alone, never aborting the view — a degraded entry is the tuple mandate's sole
  exception, carrying a declared degraded variant instead).
  Continuity predicate (D-d3-4): current sprint = workstream of the most recent emit belonging
  to a LIVE workstream (active change or staging explore); nothing live → bare falls back to
  the `--full` view; no parseable architecture docs → `--full` degrades to the flat fleet view.
  Both tiers support `--json`. Invocation is CLI-only (D-d3-5) — no slash surface.
- **`orbit-run-summary-emit` (MODIFIED)** — named-mode explore gains a BEGIN emit at
  scaffold time (D-d3-4), MODE-AWARE: Mode B records zero counts + the maturity requirement's
  Early canonical recommendation; Mode C (crystallization) records the back-filled counts + a
  maturity-consistent recommendation — the crystallization requirement's "first emit" IS this
  begin emit. Both record the citation decision and the `premised → exploring` transition
  (explore was the only workstream-starting command that began silently; found live when this
  stage's own exploration ran >1h with an empty trail). Emit timing for named explore becomes
  begin + boundary (the apply chunk+pause genre); bare mode still never emits.
- **`orbit-explore-modifications` (MODIFIED)** — Mode B/C scaffolding fires the begin emit
  (body edit mirroring the timing delta).
- **`orbit-architect` (MODIFIED)** — one-parenthetical reword: its emit-timing citation read
  "the named-mode-explore emit-timing genre", which the timing delta re-genres to
  begin+boundary; the citation now names conversation-boundary timing directly (architect
  fires no begin emit).
- **CLAUDE.md** gains the cold-start pointer (exit criterion 1's "only prior read" must name
  the command); issue #3 closes; `~/code/orbit-status` retires (its bash+jq position
  archaeology, `/opsx:status` overlay command, and `jq` dependency are the R-d-4 subtraction,
  superseded by engine-native computation — see explore.md Considered & out).

Deferred, not rejected (recorded in explore.md): fleet-level task-percentage/marker detail;
watch/refresh modes; a `--json` stability contract for external consumers; any conversational
elaboration layer.

## Impact

- Affected specs: `orbit-orientation` (ADDED), `orbit-run-summary-emit` (MODIFIED — incl. the
  mode-aware begin emit and the crystallization first-emit clarification),
  `orbit-explore-modifications` (MODIFIED), `orbit-engine-gates` (MODIFIED — scoping its
  `orbit status` references to the `--change` form), `orbit-architect` (MODIFIED — the
  emit-timing genre citation reworded away from the re-genred named-mode explore). Baseline
  capabilities 16 → 17.
- Affected code: `src/commands/workflow/status.ts` (bare branch + `--full`),
  `src/cli/index.ts` (flag), a new aggregation module `src/core/orientation.ts` (trail scan
  across the four locations + composition; reuses `loadChangeContext`/`formatChangeStatus`,
  `computeStageStates`, `parseTsToken` — no new inference), `src/core/templates/workflows/explore.ts`
  (begin-emit instruction), tests. Generated surface count unchanged (16 — no new workflow).
- Affected docs: CLAUDE.md (cold-start pointer at apply; completion notes at archive).

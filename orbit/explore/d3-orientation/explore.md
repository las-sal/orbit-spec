> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: d3-orientation

## Premise

D-arc Stage D3 — orientation (status absorption). The stage charter is owned by the arc
(`orbit architecture show d-arc-arbitered-flow d3-orientation` — R-d-7: the arc owns premise and
exit criteria; this explore owns decision detail). In one line: the positional half of "where am
I" — a surface answering, across ALL active changes at once, what phase each is in, what ran
last, and the one-or-two eligible next commands, cheap enough to consult after a day away. The
data exists (emits carry `command` + `next_recommended`; the engine computes
`position`/`next_command`); the surface doesn't. Absorbs `~/code/orbit-status` (issue #3) as
first-class engine functionality. Constraints: eligibility framing only (D1); near-zero read
cost (goal 3).

## Decisions

- **D-d3-1 (2026-07-17) — Intent: orientation, not information.** The surface answers the
  return-after-a-day question (and the cold-start-AI question): what's in flight, where it
  stands, what moved last, what's eligible next. Graded by the arc's exit criterion 1 (one
  command, zero artifact reads). It is a COMPOSITION of existing engine/trail data — never new
  inference, never a report of everything true. (`orbit list` stays inventory;
  `--change` stays single-change depth; `orbit architecture status` stays the program layer.)

- **D-d3-2 (2026-07-17) — Two-tier surface: bare = current sprint; `--full` = the arc.** Bare
  `orbit status` renders the CURRENT SPRINT strip — one workstream's lifecycle
  (explore → propose → review ⟲ → apply → review ⟲ → archive) — claiming what is today an
  error path (bare invocation with active changes errors "Missing required option --change").
  `orbit status --full` renders the arc view: all stages with computed states, workstreams
  nested under their cited stages, LAST + WAITING bands. `--change <name>` behavior unchanged.
  Both tiers support `--json`.

- **D-d3-3 (2026-07-17) — Bare-view content: strip + last + next + also, nothing more.** The
  sprint strip is the engine's per-change gate readout with an explore phase prepended
  (staging-dir/explore.md presence) and review loops compressed to one chip with iteration
  count (e.g. `review ⟲6 ✓`). "Last" renders the most recent emit's `final_assessment` in the
  trail's own recorded words (trimmed). "Next" renders the recorded `next_recommended` +
  engine-computed `next_command` — recommendations are TIME-SHIFTED (captured at the last
  conversation boundary, engine-vetted), never live judgment (D1: eligibility framing, no
  imperatives, no AI narration inside the CLI). One `also` line keeps other active work and
  waiting-on-you items visible so concurrency never hides.

- **D-d3-4 (2026-07-20) — Explore gains a BEGIN emit; the continuity predicate anchors on it**
  (resolves Q-d3-1, option A). Mode B/C scaffolding fires `explore-<TS>.json` at staging-dir
  creation — normal emit shape, `decisions_captured: 0`, next = continue-capturing, the citation
  decision recorded — closing two gaps found live during THIS exploration (d3 ran >1h with no
  `.orbit-runs/` at all): (a) bare `orbit status` can anchor its sprint strip from the first
  minute; (b) the `premised → exploring` stage transition gets a trail record (explore was the
  only workstream-starting command that began silently; precedent: review-external's T0
  packaging emit). Requires a small `orbit-run-summary-emit` timing delta (explore = begin +
  boundary emits, the way apply = chunk + pause) + one explore-body line. The continuity
  predicate is therefore: CURRENT SPRINT = workstream of the most recent emit belonging to a
  LIVE workstream (active change or staging explore); when nothing is live, bare falls back to
  the `--full` arc view (nothing in flight IS the orientation). Presence-based/mtime fallback
  machinery rejected — that is the filesystem archaeology D3 retires.

- **D-d3-5 (2026-07-20) — Invocation is CLI-only; no slash surface** (resolves Q-d3-2, option
  a). `orbit status` in a terminal; `! orbit status` inside an AI session; prose asks have the
  AI run the identical command and quote its output (the cold-start contract). No skill body,
  no command mirror — see Considered & out for the rejected variants.

## Open questions

## Considered & out

- **Slash-wrapper variants for status (2026-07-20, resolves Q-d3-2)** — REJECTED both: (c) a
  full `/orbit:status` skill wrapper (the re-narration D5 kills; R-d-4 would demand a
  subtraction) and (b) a command-only verbatim mirror (2-line launcher, no skill — cheaper than
  (a full wrapper) but still namespace surface for a gesture `!` already provides). Ratified:
  CLI-only — `orbit status` in a terminal, `! orbit status` in-session, or prose ("status?")
  with the AI running the same CLI and quoting it. Revisit only if practice shows real
  friction.

- **Deferred, not rejected (2026-07-17)** — named per the sprint-scope ruling ("build what makes
  sense, write down the rest"): fleet-level task-percentage/marker detail (per-change depth via
  `--change` already has it); watch/refresh modes; a stability contract for `--json` beyond its
  shape (external consumers); any conversational elaboration layer (see Q-d3-2). Re-enter via a
  future change if practice demands.
- **v0.1 machinery retired outright (2026-07-17)** — the bash+jq binary, filesystem position
  inference (engine-native since C1), the `/opsx:status` overlay command, the `jq` dependency:
  superseded by engine reimplementation, not carried forward (the R-d-4 subtraction for this
  stage, alongside retiring `~/code/orbit-status` itself per exit criterion 2).

## References

- `orbit architecture show d-arc-arbitered-flow d3-orientation` — the stage charter + exit criteria (the arc's copy is authoritative)
- `~/code/orbit-status` — the test project to absorb (issue #3: extend built-in `orbit status`)
- `src/commands/workflow/status.ts` — the existing per-change status command (the extension point)
- `orbit-run-summary-emit` baseline — the emit spine (`command`, `next_recommended`) the surface reads
- `orbit-engine-gates` baseline — `position` / `next_command` computation the surface renders
- D-arc goal 2 (never lost in the flow) + goal 3 (context economy) — the graded goals for this stage

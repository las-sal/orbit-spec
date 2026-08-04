# Design: d5-context-economy

Nine ratified decisions from the consumed exploration (see `explore.md` — D-d5-1 … D-d5-9)
mapped to implementation shape. The governing rule throughout (D-d5-1): **if it's computable
from disk, the engine computes it and prose never re-states it**; a body's resident content is
only judgment.

## D1 — The emit surface: `orbit emit <command>` (from D-d5-3)

One generic verb-first command (naming precedent: `orbit fingerprint`):

```
orbit emit <command> (--change <name> | --doc <doc>) [--payload <file> | stdin] [--render] [--json]
```

- **Payload channel**: JSON on stdin (heredoc-friendly) or `--payload <file>`. The payload
  carries ONLY the narrative/authored fields for that command (e.g. review: `mode`,
  `reviewer_class`, `depth`, `scorecard`, `findings`, `stale_suppressed`, `commentary`,
  `passes_run/skipped`, `model`; address-reviews: `source*`, `resolutions`, `walk_mode`,
  narrative `final_assessment`, `model`; apply: `user_validation_tasks` — the checkbox-judgment
  identifier list — plus the optional `assessment_suffix`, `model`; …). The engine owns
  everything computable.
- **Engine-owned spine**: `command` (from argv), `timestamp` (now, UTC), `change` (from
  `--change`), `kind` (from the command taxonomy in `orbit-conventions` — the taxonomy moves
  into an engine table), filename token (timestamp with hyphens, collision-bumped forward one
  second until free — the same rule bodies teach today), and the DETERMINISTIC facts where a
  capability defines them (review: the counts sentence + findings-dependent pointer, per
  `orbit-report-rendering`'s strict contract; review-external T0: the multi-step
  paste/save/ingest recommendation composed from the prompt path template; apply: the
  chunk/counts core of `final_assessment` — payload contributes only an optional
  `assessment_suffix`, never the counts).
- **Two next_recommended classes** (a distinction the exploration's "atomic loop" resolves
  into): (a) PRE-COMPUTABLE — review emits (self-pointer/report pointer from the payload's own
  scorecard), T0 (path template), explore boundaries (the maturity grid from the parsed
  `explore.md` — the emit landing changes nothing it depends on), and archive (the stock
  post-archive prose, an engine constant; written to the ARCHIVED trail after the move):
  composed before any write. (b) POST-WRITE — commands whose
  recommendation is the engine's `next_command` AFTER the emit lands (address-reviews, apply
  completion): the engine writes the emit complete except `next_recommended`,
  recomputes the change status (the just-written file now part of the trail), stamps the field,
  and finalizes. One command, one visible file state at return; the transient
  missing-field window is engine-internal (documented; a crash mid-loop leaves a
  spine-incomplete emit that orientation excludes from arithmetic AND surfaces as a degraded
  note on the next status/boot render — detection without failure, never silent vanishing).
- **Write gate**: before ANY write, the composed candidate passes the SAME normalizers the D4
  renderer uses (`normalizeInternalPass` for proposal/system review emits; architecture-mode
  review emits pass the universal-spine checks — accepting `change: null` + required `doc` —
  plus scorecard rollup and the architect-owned `handoff` shape, mirroring D4's architecture
  render exemption; spine checks for all kinds). Validation failure = no file, non-zero exit,
  the field-naming error on stderr, empty stdout. One validator, two gates (write-time here,
  read-time at render).
- **`--render`**: for proposal/system review emits, after the write, print the engine report
  (the `status --report` render) — persist-first and run-and-paste collapse into one
  invocation; for architecture mode, a no-op with a stderr note (no architecture report
  surface exists).
- **Stdout**: the written path (+ the render under `--render`); `--json` echoes the complete
  composed emit.

## D2 — Per-command computed extensions (the absorbed sub-requirements)

- **`orbit emit explore`**: the engine parses `explore.md` (fence-aware) and computes
  `decisions_captured`, `open_questions_count`, `open_questions_with_recommendation` (leak
  layer 3 — D-d5-8: the attestation cannot be fudged because nothing hand-writes it), and the
  maturity-grid `next_recommended` (Early/Mid/Mature/Stalled — the grid moves from body prose
  to engine table).
- **`orbit emit apply`**: the engine parses the tasks.md chunk preamble (the grammar moves from
  body prose to engine; malformed preamble → the documented stderr warning + no-chunking
  fallback) and computes `tasks_completed/remaining` from checkboxes, `chunk`/`chunk_name`/
  `chunk_complete` (per-chunk arithmetic over the payload's `user_validation_tasks` judgment
  list — the whole task set standing in when `chunk` is null), and `files_touched` — the
  per-chunk diff (`git diff --name-only <ref>`
  against the working tree, committed + uncommitted tracked; `<ref>` = the previous apply
  emit's timestamp-resolved commit via `git rev-list -1 --before`, or the change's first
  commit for the first emit; graceful `null` outside a git repo).
- **`orbit emit review-external`**: T0 spine composed from the prompt path (payload supplies
  `prompt_path`, `target`); `awaiting_findings: true` engine-set.
- **`model`**: REQUIRED nullable payload field on every command (D-d5-9) — the surface rejects
  a payload missing the key (explicit `null` allowed) so provenance is always a conscious act.

## D3 — The merged review surface (from D-d5-2)

- `--reviewer in-context|fresh|external` on `/orbit:review`; default `in-context`; `--fresh`
  stays as shorthand for `--reviewer fresh` (no deprecation ceremony — it's one flag mapping).
- The external branch (packaging steps, preflight, session-recommendation note, prompt
  template pointer) lives in `references/external-handoff.md`, loaded ONLY when
  `--reviewer external`. The body's external branch is a ~5-line dispatch.
- **Record vocabulary FROZEN**: the T0 emit keeps `command: "review-external"` and its
  `review-external-<TS>.json` filename; findings files keep `external-<as>-<TS>.md`. The gate
  reader, orientation WAITING arithmetic, report ordinal, and address-reviews parser are
  untouched by the merge.
- `gates.ts` canonical next-command strings (`:77`, `:397`) become
  `/orbit:review --as <mode> --reviewer external <change>`; the launcher/skill pair
  `orbit:review-external`/`orbit-review-external` retires from the generated surface
  (registry rows removed across all six registries — the B3 lesson; surface 16 → 15).
- Archived trails citing `/orbit:review-external` are historical records — never rewritten.

## D4 — Body economy: what moves where (from D-d5-1/D-d5-4/D-d5-5; inventory in `sketches/`)

- **Disciplines blocks shrink IN PLACE** (D-d5-4; D-b2-2 honored — no shared reference, no
  generator constant): four-bullet epitome (~150 tok) + per-command detail relocated to the
  step where it fires (deleting the block's copy where the step already carries it) +
  no-chaining reduced to ~2 lines leaning on the D1/D4 structural enforcement.
- **Review pass definitions mode-split** (D-d5-5): `references/passes-proposal.md`,
  `references/passes-system.md`, `references/passes-architecture.md`; the body's Step 6 loads
  the resolved mode's file. Content verbatim — an organizational move only.
- **Emit sections across bodies** shrink to: compose the payload (field list per the
  command's reference), pipe to `orbit emit <command>`; the maturity grids, chunk rules,
  collision rules, and timestamp discipline DELETE (engine-owned).
- **Worked examples and rarely-used flag detail** (review's `--mark`/`--parallel`/`--focus`,
  address-reviews' examples) move to references.
- Schema reference docs shrink to payload-field lists (what the AI supplies) — spine
  documentation deletes.

## D5 — Boot render (from D-d5-6): `orbit status --change <name> --boot`

Rides the status gateway (precedent: `--report`). Composes ORDERED POINTERS, never substance:
position + eligibility (existing computation), the artifact list (existing contextFiles),
latest-emit pointers per command family on the trail (review split per mode), the touchpoints
view (D6), and explore.md/sketches presence.
READ-ONLY; degrades per orientation's fault-isolation policy. No hand-maintained handoff file
exists anywhere (R-d-4).

**R-d-9 delivery map — (b)/(c), stated once**: the charter's "D5 mechanizes R-d-9's clauses
(b) and (c)" is delivered as follows. **(b) is delivered AS THIS BOOT RENDER** (D-d5-6's
reframing): the boot-sequence need is served by an engine render computed fresh per
invocation; the structured per-emit `handoff` section stays ARCHITECT-ONLY by design —
generalizing a hand-authored handoff section to every workflow emit would recreate the
staleness class R-d-4 subtracts. **(c) lands half-mechanized on purpose**: item 1 (residency
sweep — the explore/architect boundary sweep) and item 4 (code-touchpoints map — the boot
render's touchpoints view + the audit-drift divergence check) ship here; items 2 (boot-chain
currency) and 3 (coverage-vs-charter) REMAIN manual seam-audit practice — they are judgment
checks, not set arithmetic, and mechanizing them today would produce vibes-checks dressed as
engine checks. Named re-entry trigger (the R-d-2 tripwire pattern): a cold-pickup failure at
any phase seam attributable to a stale pointed-at doc or an uncovered charter item re-opens
mechanizing items 2–3. The arc ruling's text is amended (status log appended) at archive so
R-d-9's stated program and D5's delivery converge — tasks.md 9.5.

**The mid-explore seam (exit criterion 3, ratified)**: `--boot` is change-scoped BY DESIGN
and is NOT extended to explorations. An exploration's file-resident boot material is
deliberately minimal — bare `orbit status` (the orientation surface models explore
workstreams: position, LAST, next per D3's own cold-start criterion), `explore.md` itself
(five sections with standing-recommendation slots — the material this change's leak
hardening strengthens), and the explore emit trail (engine-computed counts + maturity
recommendation). Criterion 3's mid-explore leg is TESTED AGAINST those artifacts; a
dedicated explore boot render would restate a one-file artifact set (R-d-4 ceremony,
subtracted). The every-seam boot test itself is exercised at ratification per tasks.md 9.6.

## D6 — Touchpoints: predicted authored, actual computed (from D-d5-7, ratified as-is)

- **Predicted**: `## Touchpoints` section in design.md — authored at propose (consume mode
  seeds from explore.md leanings), revised only through normal artifact revision, FROZEN once
  apply begins (it reads as "the plan", not "the truth", thereafter — accepted at capture).
- **Actual**: `git diff --name-only <change-start>..HEAD` — engine-computed at render; never
  prose. `<change-start>` estimated as the change directory's first commit (the existing
  system-mode heuristic, now engine-owned).
- **Boot chooses by lifecycle position**: predicted pre-apply; actual (predicted alongside)
  once apply commits exist.
- **Divergence is a check**: files in actual ∖ predicted (and predicted ∖ actual at
  archive-time) render as an audit-drift finding and feed the system cohesion pass — the D4
  cross-validation pattern (two representations, engine set-difference).
- This design.md carries the first authored instance (see `## Touchpoints` below).

## D7 — Leak hardening (from D-d5-8, charter-designed 2026-07-09, ratified)

Layer 1 (FORMAT): open-question entries in explore.md REQUIRE a
`Standing recommendation: <text> | none yet` line — conventions + explore body + this
exploration already practicing it. Layer 2 (PROTOCOL): the boundary residency sweep in
explore/architect bodies, tied to the EXISTING emit trigger (no emit without sweep; zero new
triggers per R-d-4). Layer 3 (ATTESTATION): engine-computed by `orbit emit explore` (D2 above);
audit-drift cross-checks recorded counts against the file.

## D8 — Model hints (from D-d5-9)

`orbit/config.yaml` gains an OPTIONAL `models:` map (`<phase-or-slot>: <hint string>`, e.g.
`external: "GPT-5 Codex"` — keys are schema phase ids like `review-proposal`/`apply`/
`review-system` or cadence slot names `in-context`/`fresh`/`independent`/`external`; slot
entry wins when both match, per the gates delta). The engine's eligibility lines append
` — hint: <value>` when the resolved next command's phase/slot has a hint. Pure garnish: no enforcement, no
validation of the hint value, absent map = zero output change. The phase-mapping hypothesis
itself lives in config (user-owned), not spec.

## Alternatives considered

(From the exploration's Considered & out — see `explore.md` for dated entries.)

- **Per-command emit surfaces (B)** — ceremony ×10; payloads are stdin JSON regardless.
- **Scaffold-and-AI-writes (C)** — forfeits the atomic next_recommended loop; clerical
  discipline stays prose.
- **Shared disciplines reference / generator skeleton constant** — foreclosed by D-b2-2
  (consolidation tried and REVERSED, issue #4) and by always-needed economics.
- **Hand-maintained HANDOFF.md / living touchpoints prose during apply** — the R-d-4
  staleness lesson; computed halves belong to the engine.

## Touchpoints

(The predicted map — D6's first authored instance; frozen once apply starts.)

- `src/cli/index.ts` — `orbit emit` registration; `--boot`/`--reviewer` flags; status action.
- `src/commands/` — new emit command module; status boot branch.
- `src/core/emit-composition.ts` (NEW) — payload merge, spine composition, deterministic
  facts, atomic loop, write gate (imports `report-render.ts` normalizers).
- `src/core/report-render.ts` — normalizer exports for the write gate.
- `src/core/orientation.ts` + `src/core/artifact-graph/gates.ts` — boot render; merged
  next-command vocabulary; hint garnish.
- `src/core/parsers/` — chunk-preamble grammar; explore.md counter (fence-aware).
- `src/core/templates/workflows/*.ts` — the body-economy pass (all 16; review-external
  retires); `src/core/templates/registry` sites (six registries — the B3 lesson).
- `src/core/config.ts` (or the existing config loader) — `models:` map.
- `test/` — emit-surface suite, boot suite, fidelity re-pins, gates vocabulary, chunk/counter
  grammars, touchpoints divergence.
- `orbit/config.yaml` — optional `models:` example (commented).

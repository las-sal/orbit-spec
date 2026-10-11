## Context

R-crc-1's ceiling (3 capabilities, ~12 requirements, ~40 KB changed delta, under 20 tasks) has been applied by hand
at every exploration since 2026-09-15. The engine computes none of the four figures, so a proposal that grows past
the ceiling at a walk goes unnoticed. This change is the size half of rc09-propose-hygiene, split at its exploration
(see explore.md, D-rc09-13). The exploration ran the computation over the archive before any prose was written:
Case 1 holds the four figures for 37 changes, and Case 4 tests the multiset byte count against git's diff. Each
figure reads an artifact the engine already parses: `parseDeltaSpec` and `extractRequirementsSection`
(`src/core/parsers/requirement-blocks.ts`), and `parseCheckboxes`, the apply emit's task counter
(`src/core/parsers/apply-state.ts`).

Two precedents shape the surface. `orbit-scenario-map` (rc06a) is an opt-in config key read alone, with validate
issues under one path and a change-scoped read on `orbit status`. The `## Touchpoints` section (D5) is an
engine-parsed section of a change artifact.

## Goals / Non-Goals

**Goals:**
- Compute R-crc-1's four figures for any active change, deterministically and without a diff dependency.
- Report a breach without blocking it; what `--strict` fails on is stated once, in `Validate reports each breach as declared or undeclared` (D-rc09-4).
- Give the declaration one grammar, stated once, mirrored into the propose body for adopters.
- Retire `orbit-engine-gates`' promise of a size-proximity computation.

**Non-Goals:**
- Choosing where to split. That stays the author's and the user's judgement (R-crc-10).
- Reading a declaration's reason, or recording who ratified it.
- Size proximity, or any effect of size on a gate, the position readout or the canonical next (D-rc09-8, R-crc-13).
- Sizing archived changes. Validate never reads them, and the exploration's probe did that once.
- The external-tool inventory (rc09b-tool-inventory) and the generalized spike (D-rc09-11; Q-crc-33).
- A size brief at `/orbit:ff` or `/orbit:continue`. The charter names propose; a change those create over the ceiling
  hears about it from `orbit validate <change> --strict`.

## Decisions

**D1 — One module computes the figures and parses the declaration.** New `src/core/change-size.ts` exports
`computeChangeSize(projectRoot, changeDir)`, returning the four figures, and `parseSizeDeclaration(proposalText)`,
returning the declared dimensions plus MALFORMED and DUPLICATE lines with their line numbers. It also exports
`sizeBreaches(figures, ceiling, declaration)`, which yields the `breaches` list and the stale declarations. The
byte count is the multiset rule (D-rc09-14). It needs no diff dependency, is linear in the block, and under-counts
only moved lines. Validate, status and the propose body all read through these functions, so the rule is computed
in one place.

**D2 — The config resolver follows `resolveReviewPreference`.** `resolveSizeCeiling(projectRoot)` in
`src/core/project-config.ts` reads only `size_ceiling`. It warns once per malformed shape and returns either `null`
(the check is off) or a map of the valid entries. The table in `The ceiling is opt-in by the size_ceiling config key`
is the test set, one case per row.

**D3 — Validate adds one issue source.** `Validator.validateChangeDeltaSpecs` adds `validateChangeSize(changeDir)`
beside `validateScenarioDeclarations`, and every issue carries the path `size`. The human printer in
`src/commands/validate.ts` currently prints only `scenario-map` INFO lines beneath a valid report. It widens to print
every `size` issue there too. Without that, a non-strict run with an undeclared breach would print only "is valid",
and the WARNING would exist only in `--json`.

**D4 — Status computes `size` at the command layer.** `src/commands/workflow/status.ts` adds `size` to the change's
JSON output and the `Size:` line to `printStatusText`. `formatChangeStatus` (`instruction-loader.ts`) is NOT
changed: orientation, the boot render and the gate computation consume `ChangeStatus`, and size must reach none of
them (the requirement's "never moves a gate"). The field rides the plain change status only; the `--boot`,
`--scenarios` and `--report` renders return before it is composed, and the requirement says so. A read failure nulls
its figure and is listed in `size.errors`; status never throws for size. The human line prints figures alone and names each breach. It shows
no ratio, following rc02c's rule that a ratio is a verdict wearing a figure's clothes.

**D5 — The propose brief runs after generation and NON-STRICT validation, before Step 0d's move, the PR
choreography's Phase 3 and the completion emit, in both modes.** The propose body gets a step after artifact
generation; a declaration it writes is therefore inside what Phase 3 commits. The validation before it is non-strict
`orbit validate <name>`, which size never fails: a strict run would stop the flow on the very breach the brief exists
to handle. On Split, the split recommendation replaces the completion prompt to review, and nothing else changes: the
move, Phase 3 and the emit all run. Skipping the move would leave the staging directory beside the change, a state
propose's Step 0 refuses; skipping Phase 3 would leave the generated files uncommitted on the branch Phase 1 switched
to. `--strict` keeps failing until the change is split, which is the record of an undeclared breach. It reads `size` from status JSON and follows the four-row table in `Size brief
after generation`. Split and declare are asked with `AskUserQuestion`. The `## Size` production is interpolated
from one exported constant in `change-size.ts`. A parity test holds that constant byte-equal to the fence in
`orbit-change-size`'s declaration requirement, and holds the rendered propose skill to the same text (R-crc-14's
mirror corollary).

**D6 — This repository opts in.** `orbit/config.yaml` gains `size_ceiling: {capabilities: 3, requirements: 12,
changed_bytes: 40960, tasks: 19}`, under a comment block in the style of `scenario_map` and `review_preference`.
These are R-crc-1's figures read as exact maxima (D-rc09-5). Turning the check on this repo is what makes the next
stage's proposal the first one sized by the engine.

**D7 — Two narrowings from the exploration, recorded.** (a) D-rc09-7's Mechanism entry said a second `## Size`
heading "merges with the first, with a note". The requirement keeps the merge and drops the note: a note would be a
fourth issue kind with no consumer, and a repeated heading declares nothing new. (b) D-rc09-5's table (Sal: agreed)
read "a map with zero valid entries → on, comparing nothing"; the requirement reads OFF. ON-comparing-nothing would
print `none over` for a check that compares nothing and fail `--strict` on declarations measured against no maximum,
and a map with no valid entry already warns once per bad entry. Ratified at the proposal walk (Sal: A). explore.md
is unchanged — it is the record of how the change took shape.

**D8 — Declaration edge rulings, settled at the proposal walk under R-crc-3.** A declared dimension with no
configured maximum reads stale (INFO); only `-` declares, and a `*` or `+` item is MALFORMED so it stays visible; the
reason begins on the item's first line, so a continuation-only reason is MALFORMED; the heading is `## Size`,
case-sensitive. Each is a row of the declaration table. The section reads CommonMark's indentation rules for the
constructs the table names — a heading takes up to three spaces of indent, a bullet nests only at or beyond the content
column of the item above it, and a thematic break is not an item — and no others: the table's section-end row states
what it does not model. "Exactly" in the first reading of this ruling
meant case and level, never a column; a column-0 grammar would have made `--strict` fail on, or silently drop, an
item every renderer shows as one.

## Alternatives considered

From explore.md's Considered & out:
- **Counting both sides of a MODIFIED block.** Rejected: it puts five rc-stages over 40K, all of them shallow
  retirements the 2026-09-23 clarification exists to spare (D-rc09-3).
- **A size check that blocks on any breach.** Rejected: it would fire on every ratified breach on the record, and a
  gate reports, it never rules (D-rc09-4).
- **The declaration in `design.md` or `.openspec.yaml`.** Rejected: design.md is optional in the schema, and the
  metadata helpers strip unknown keys (D-rc09-7).
- **Size proximity driving R-crc-4's near-ceiling pair.** Rejected: overtaken by the 2026-10-05 amendment (D-rc09-8).
- **A gate on unexecuted EXECUTE moves.** Rejected: this is rc09b's and Q-crc-33's territory, and the record
  supports no gate (D-rc09-11).
- **Computing size inside `formatChangeStatus`.** Rejected here (D4): every consumer of `ChangeStatus` would carry a
  figure none of them may act on.

## Risks / Trade-offs

- [The status JSON gains a top-level field on every change] → A golden or exact-shape assertion over `orbit status
  --change --json` may go red. Apply measures this first (task 1.1) instead of discovering it.
- [R-crc-1's "~" figures become exact maxima] → rc02's 40.5K reads one breach over 40,960. The approximation was
  the program's; the exact reading is now written in config, where it can change without a spec edit.
- [The multiset under-counts a moved line] → A block that reorders its own lines reads smaller than git would read
  it. Case 4 bounds this at 1.3% on the archive.
- [A breach found at a walk or at apply fails `--strict` again] → Intended: that is a change growing past R-crc-1
  unannounced. Declaring it is one line.

## Touchpoints

- `src/core/change-size.ts` — new: the four figures, the multiset count, the `## Size` parse, the production constant.
- `src/core/project-config.ts` — `resolveSizeCeiling`.
- `src/core/validation/validator.ts` — `validateChangeSize`, path `size`.
- `src/commands/validate.ts` — the printer widens to `size` issues beneath a valid report.
- `src/commands/workflow/status.ts` — the `size` JSON field and the `Size:` line.
- `src/core/templates/workflows/propose.ts` — the post-generation size brief and the interpolated production.
- `orbit/config.yaml` — opts in.
- `test/core/change-size.test.ts` — figures, byte rule, declaration grammar, breach table, config shapes, the validate
  printer and the status JSON and human line (the rc06a precedent keeps its equivalents in `test/core/scenario-map.test.ts`).
- `test/core/rc03b-untouched-modules.test.ts` — the module hash pin; `instruction-loader.ts` must NOT move (D4).
- `test/core/size-declaration-parity.test.ts` — the production held to the owner's fence and the rendered skill.
- `test/core/templates/` — the propose skill-template hash pin, which moves with the propose body.

## Mechanism → artifacts

the proposing AI's reading of the file; no engine record

| rule | closure / state | owner's state | destination |
|---|---|---|---|
| D-rc09-3 | SOURCED | live rule | `Four size figures are computed from the change's artifacts` (ADDED) — TABLE: the `changed_bytes` construct table, with the sentence naming `parseDeltaSpec`'s `DeltaPlan` as its source |
| D-rc09-4 | DERIVED | live rule | `Validate reports each breach as declared or undeclared` (ADDED) — TABLE: the state/level table |
| D-rc09-5 | DERIVED | live rule | `The ceiling is opt-in by the size_ceiling config key` (ADDED) — TABLE: the shape/outcome table |
| D-rc09-7 | DERIVED | live rule | `A breach is declared in the proposal's Size section` (ADDED) — GRAMMAR: the production fence, plus the line-kind TABLE |
| D-rc09-12 | — | assigned rc09b-tool-inventory | not carried |

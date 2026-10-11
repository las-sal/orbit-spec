# Design: d2-architect

## Context

This is **Stage D2 of the D-arc** (`orbit/architecture/d-arc-arbitered-flow.md` — its §Stage D2
exit criteria are this change's acceptance tests; rulings R-d-1..9 constrain the design). The
full decision record is `explore.md` (7 decisions, D-d2-1..7, all user-ratified 2026-07-13/14).
This design maps those decisions onto the code. Grounding facts (verified during the explore; the
code-touchpoints map lives in explore.md References): the engine has two declaration tiers today
(schema YAML interpreted by `src/core/artifact-graph/`; change artifacts + metadata); the arc doc
is hand-maintained prose whose state lines went stale 3× in the D1 cycle; C1 established
state-as-pure-function-of-disk and C2/D1 established the metadata-extension genre
(`base_fingerprints`, `schema_version`, `consent_era_from`).

## Goals / Non-Goals

**Goals** (= arc §Stage D2 exit criteria):

1. The arc doc is retrofitted to the parseable format and `orbit architecture status` renders
   program position (stage states computed from disk) matching reality.
2. A change's `.openspec.yaml` cites its architecture+stage and validation fails on a dangling
   citation (either level, error naming which).
3. `/orbit:review --as architecture` runs from a generated body and leaves evidence in the
   architecture's own `.orbit-runs/`.
4. A session can load a single stage section via CLI instead of the whole doc.

**Non-Goals**: program-level gates (D-d2-5); explore-grade stance prose / stage-lifecycle helpers
/ retrofit guidance in the architect body (D-d2-6 rungs 6–8); model-per-phase + handoff-audit
mechanization (R-d-9 → D5); `orbit list` or orientation-surface absorption (D3);
`fork-and-orbify.md` retrofit (optional, deferred).

## Decisions

### D1. New engine module `src/core/architecture/`, parallel to `artifact-graph/` (explore D-d2-1/3)

Three files by analogy to the C1 module set: `parser.ts` (fence-aware; stage headings
`### Stage <id> — <title>`, slot lines `Depends-on:` / `Complete:` with omission defaults,
section boundaries, and the near-miss rule — stage-like text failing the exact grammar yields a
MALFORMED result distinct from legacy; reuse the fence-scanning approach `requirement-blocks.ts`
landed after its C1 bug, but do NOT couple to that module: different grammar), `state.ts` (computed stage state: citation scan over
`orbit/changes/*/`, `orbit/changes/archive/*/`, `orbit/explore/*/` metadata + precedence +
completion composition — pure function, no caching, corpus is small), `validate.ts` (doc
structure: slot syntax + id uniqueness + Depends-on resolution; ALSO hosts the citation-resolution
helper, but that helper is CALLED by change validation — see D2: `orbit architecture validate`
itself checks doc structure only). CLI subcommands in `src/commands/architecture.ts`, registered
in `src/cli/index.ts`.

### D2. Citation is `architecture: {doc, stage}`; validation is two-level; explores get real metadata (explore D-d2-2/7)

`ChangeMetadataSchema` gains the optional object (Zod: `{doc: string, stage: string}`); the same
schema serves explore metadata — `readChangeMetadata`/`writeChangeMetadata` already take a
directory, so explore dirs reuse them unchanged; because `writeChangeMetadata` Zod-requires a
registered `schema`, the minimal explore file carries `schema: spec-driven` + `created` as
placeholder base fields (superseded at promotion — the merge writes fresh
`schema`/`created`/`schema_version`, so the placeholder never leaks into a change).
`orbit validate <change>` gains citation
resolution (dangling doc vs dangling stage, error names the level); `orbit architecture validate`
covers doc structure. Consume-mode propose merges the staged metadata explicitly BEFORE the bulk
move (read staged → carry `architecture:` forward via helpers → discard staged file), the same
explicit-handling slot where `.orbit-runs/` already moves; on a conflicting pre-existing
citation in the fresh metadata, the STAGED citation wins (deterministic; the exploration's
citation is the captured decision). Nothing outside `orbit/changes/` scans
for `.openspec.yaml` presence as is-a-change (verified during the explore: `orbit list` reads
`orbit/changes/` only).

### D3. State vocabulary: `premised → exploring → in-change → quiescent → complete`; completion composes (explore D-d2-1)

`quiescent` (not "archived") is the observed all-work-landed state — deliberately not claiming
doneness. `complete` is not a stored state: it renders when quiescent AND the `Complete:` slot is
ratified. Falsified marks (`[x]` on any non-quiescent observation — live citing work or `premised`)
surface via the status render + audit-drift, never silently honored (architecture validate
stays structure-only). Precedence when multiple artifacts cite one stage: in-change > exploring >
quiescent > premised (live activity outranks history; the status payload lists ALL citing
artifacts for detail).

### D4. One shared architecture trail (explore D-d2-5; conventions fourth location)

`orbit/architecture/.orbit-runs/` — a single directory for all docs (few docs, low emit volume;
per-doc dirs would be ceremony). Emits carry `change: null` + `doc: <name>`. Never moved by
change archiving. Architecture-mode review emits (`review-architecture-<TS>.json`) and architect
emits (`architect-<TS>.json`) both land here; both carry the R-d-9(b) `handoff` section from
birth (shape owned by `orbit-architect`).

### D5. Architecture review = third `--as` mode of `/orbit:review`, no gate, never inferred (explore D-d2-5)

Rides the existing review body (mode tables, scorecard, pushback, address-reviews ingestion)
rather than a separate command — one review genre, three modes. Doc-targeted: the positional
resolves against `orbit/architecture/`, prompt on ambiguity. Never mode-inferred (a positional
matching a doc name does not flip modes — explicit `--as architecture` only), because misfiring
review modes on change names would be a sharp edge. Final assessment renders findings + one
canonical next command with NO gate vocabulary (there is no gate to reference).

### D6. Architect body scope = D-d2-6's ladder rungs 1–5, full first-class anatomy (explore D-d2-6)

New `src/core/templates/workflows/architect.ts` (skill + thin launcher). Registration must hit
EVERY registry — grep-enumerate by an existing body's name first (B3's sixth-registry lesson;
current set per the explore's verified grep: `profiles.ts`, `profile-sync-drift.ts`,
`tool-detection.ts`, `skill-generation.ts`, `skill-templates.ts`). Surface 15 → 16: the D15
"all 15 workflows" count mentions (profiles comment, CLAUDE.md at archive, any baseline/test
pins) are swept 15→16 as part of the change — the D1-cycle contradiction class, handled
proactively. The completion-ratification flow is the body's one AskUserQuestion (ratify /
not-yet); the flow-entry rule (never a gatekeeper) is stated in the body and constrains OTHER
bodies' recommendation prose (no body recommends architect as required entry). Verb-taxonomy
justification (per orbit-conventions' verb-prefix requirement): `architect` is a NEW
authoring-genre verb — it fits none of the check-command prefixes (verify-/review-/audit-)
because it authors rather than checks; justified by D-d2-6 and arc ruling R-d-1.

### D7. The retrofit is part of THIS change's apply; subtraction accounting (explore D-d2-1/3, R-d-4)

`d-arc-arbitered-flow.md` converts in-place during apply: stage headings normalized to
`### Stage <id> — <title>` (ids: d1-explicit-lifecycle-consent … d6-pr-lifecycle — headings gain
ids; prose references survive), `Depends-on:`/`Complete:` slots added (D1's slot ratified
`[x] 2026-07-13 (Sal)` — the user ratified D1 complete in the D1-completion status entry;
confirm at apply), and **every `*State (manual until D2):*` line is DELETED** — the R-d-4
subtraction: the retrofit removes more hand-maintained text than the slots add. **Archived-stage
backfill (external iter 1, user-ratified option A)**: the retrofit also backfills the archived
D1 change's metadata with `architecture: {doc: d-arc-arbitered-flow, stage:
d1-explicit-lifecycle-consent}` — without it, nothing observable cites d1 and its ratified
`Complete:` mark would contradict a `premised` observation on the first retrofitted doc (exit
criterion 1). A deliberate one-time migration edit recording a true historical fact; the
falsified-mark rule is correspondingly tightened to flag ratified marks on ANY non-quiescent
observation. The status log
stays untouched (append-only ledger). D2's own change carries the first live citation
(`architecture: {doc: d-arc-arbitered-flow, stage: d2-architect}` stamped into this change's
metadata at apply, once the field exists).

## Alternatives considered

(Full record in explore.md Decisions/rejections; summarized to prevent rediscovery.)

- **YAML frontmatter/islands or sidecar YAML** for the parseable format — rejected (D-d2-3):
  second syntax in a human document / two files claiming one truth (the C2 divergence class).
  Heading conventions + `orbit architecture validate` + the audit hook carry the fragility risk.
- **Stored stage state** (doc declares state) — rejected (D-d2-1): hand-maintained state went
  stale 3× in one cycle; C1's computed-state principle extends upward instead.
- **Name-match linkage** (explore/change name == stage id) — rejected (D-d2-2): provably
  insufficient (D1's explore was `explicit-lifecycle-consent`).
- **Prose citation line in explore.md** instead of metadata — rejected (D-d2-2): the engine
  should never parse AI-authored prose for identity (R-d-1 applied to linkage).
- **Program-level gate over the arc** — rejected (D-d2-5): every real seam is already gated
  per-change; pre-need enforcement is the class the hooks deferral rejected. Trail ships so a
  future gate has something to compute over.
- **`archived` as the terminal state name** — rejected (D-d2-1): reads as "complete" and rebuilds
  C1's false-convergence bug at the program layer; `quiescent` + ratified `complete` instead.
- **Automatic doc updates / archive-time sync step** — rejected (D-d2-4): the readout is the
  reminder; the garnish line rides the existing archive render.

## Risks / Trade-offs

- **[Convention fragility] heading-convention format breaks on hand-edit typos** → mitigated by
  `orbit architecture validate` (structure + uniqueness + Depends-on), the audit-drift staleness
  check, and fence-awareness from day one; accepted as the price of one-syntax-for-humans.
- **[Citation scan cost] computed state scans all change/explore/archive metadata per status
  call** → corpus is dozens of files of ~10 lines; pure recompute, no caching; revisit only if
  D3's surface measures real cost.
- **[16th body grows the surface]** → R-d-4 paid by the retrofit deleting all hand-maintained
  state lines + the "manual until D2" caveats; the body itself is rungs 1–5 only.
- **[Ratified-mark honesty] a user could check `Complete:` on a non-quiescent stage** → rendered
  state stays honest (completion requires the composition); the status render surfaces it and
  audit-drift raises the CRITICAL rather than silently trusting either side.

## Migration Plan

None required: the citation field and explore metadata are optional (absent = today's behavior);
legacy prose architecture docs list as opaque, never error; the arc-doc retrofit is a one-time
in-place edit within this change's apply. Rollback = revert (the retrofit commit included).

## Open Questions

None — D-d2-1..7 resolved in explore.md (Q-d2-3's residue resolved to D-d2-7 at propose).

# Design: c2-parallel-merge-guardrail

## Context

Archiving applies delta specs to the live baseline via `buildUpdatedSpec`
(`src/core/specs-apply.ts`). The MODIFIED path is a wholesale replace: `nameToBlock.set(key, mod)`
substitutes the delta's absolute requirement snapshot for whatever the live baseline holds.
Sequencing is already correct — when change B archives, the target it reads is the *current*
baseline containing change A's edits (`BASE+A`) — but B's snapshot was authored against `BASE`, so
the replace drops A's contribution. Absolute values don't compose under sequencing; the delta is
absolute and base-unaware, so a stale snapshot clobbers silently (full mechanism analysis:
see `explore.md` Premise; upstream analysis: `openspec-parallel-merge-plan.md`).

Code facts this design is grounded on (read during exploration and re-verified at propose):

- Archive (`src/core/archive.ts:228`) is the **only programmatic caller** of `buildUpdatedSpec`;
  `applySpecs` is an unused export, and the sync-specs workflow is agent-driven (the AI edits main
  specs directly). Guarding the spec-apply engine therefore covers the destructive path, and
  bulk-archive (which shells out to `orbit archive` per change) inherits the guard for free.
- `extractRequirementsSection` (`src/core/parsers/requirement-blocks.ts`) is fence-aware (C1 fix)
  and already normalizes `\r\n?` → `\n` and `trimEnd()`s each block's `raw` — the D-c2-8
  normalization comes for free by hashing `raw` verbatim.
- `ChangeMetadataSchema` (`src/core/artifact-graph/types.ts:99`) is a Zod object that **strips
  unknown keys on parse**; `writeChangeMetadata`/`readChangeMetadata`
  (`src/utils/change-metadata.ts`) round-trip through it. `base_fingerprints` must be added to the
  schema or any read-modify-write would silently drop it.
- C1's archive-flow pattern (`src/core/templates/workflows/archive-change.ts`, Step 3.4/3.5):
  the engine reports, the skill prompts via AskUserQuestion, the user decides, the trail records
  (`gate_overridden` in the archive run summary). D-c2-4 mirrors this shape exactly.

## Goals / Non-Goals

**Goals:**

- Make **silent** spec data-loss at archive impossible: loss can occur only via a deliberate,
  recorded act performed after the divergence was shown (explore.md D-c2-1).
- Detection with the smallest surface: no delta-format change, no AI-authoring change, no
  migration of in-flight changes.
- Every divergence decision leaves a trail: overrides and unverified proceeds land in the archive
  run summary, mirroring C1's `gate_overridden`.

**Non-Goals** (explicitly deferred; see Alternatives considered):

- **Phase 1** — 3-way merge / `rebase` command (auto-incorporating the sibling; removes the
  blind-re-stamp footgun).
- **Phase 2** — scenario-level delta granularity (makes sibling adds commutative).
- Fingerprint surfacing in `orbit status` / the gate graph — the guard is an archive-time check,
  not a gate (D-c1 gate model untouched).
- Guarding the agent-driven sync-specs workflow — it performs intelligent merging by design and
  does not pass through `buildUpdatedSpec`.

## Decisions

Decisions D-c2-1 through D-c2-8 were made during exploration and are recorded with full rationale
in `explore.md` (authoritative). Summary + the design-level decisions that refine them:

### D1. Storage: `base_fingerprints` in `.openspec.yaml` (explore.md D-c2-2, D-c2-6)

Extend `ChangeMetadataSchema` with an optional map, hash-only (no raw base text — Phase-1 concern,
and it would bloat the file):

```yaml
schema: spec-driven
created: 2026-07-06
base_fingerprints:
  orbit-archive-modifications:
    "Archive run summary written": "sha256:<hex>"
```

Zod shape: `z.record(z.string(), z.record(z.string(), z.string())).optional()`. Keys are the
capability directory name and the requirement name exactly as parsed
(`normalizeRequirementName`). Hash values carry the `sha256:` prefix for algorithm agility.
Chosen over a new sidecar `meta.json` (the upstream plan's suggestion) because `.openspec.yaml`
already exists, is Zod-validated, has read/write helpers, and moves with the change into archive.

### D2. Hash rule: verbatim block `raw`, line-ending normalization only (explore.md D-c2-8)

`sha256(normalizeLineEndings(block.raw))` where `block` comes from
`extractRequirementsSection(liveSpec)`. Any real baseline change — even cosmetic — is content the
author did not see, so it counts as divergence; only pure line-ending noise is normalized away.
Because the parser already normalizes and trims, capture and check use the same code path and are
trivially consistent.

### D3. Capture surface: a deterministic CLI command, not AI-computed hashes (new, design-level)

Workflow bodies cannot reliably hand-compute SHA-256. A new top-level verb-first command (NOT
under `orbit change` — that namespace is deprecated, `src/cli/index.ts:177`):

```
orbit fingerprint <change-name> [--check] [--refresh] [--json]
```

- **Stamp mode** (default): parse each delta spec (`parseDeltaSpec`), derive the touched-requirement
  set — `renamed[].from` ∪ `removed[]` ∪ `modified[]` (with MODIFIED names mapped back through the
  delta's own RENAMED pairs to their live FROM names, since post-rename MODIFIED references the NEW
  header) — read each requirement's current baseline block, hash, and write `base_fingerprints`
  into `.openspec.yaml`. Touched requirements absent from the live baseline are skipped with a
  warning (validation elsewhere owns that error).
- **Add-missing-only by default; `--refresh` required to overwrite an existing fingerprint.**
  This is load-bearing: if re-stamping were the default, an innocent re-run after a sibling landed
  would overwrite the stored base hash with the new live hash and *mask* the divergence — the
  exact hole the guard exists to close. `--refresh` is the deliberate D-c2-5 re-stamp act.
- **Check mode** (`--check`): recompute live hashes, compare, and report per-requirement status —
  `verified` | `diverged` | `unverified` (no stored fingerprint) | `missing` (requirement absent
  from live baseline) — with `--json` for workflow consumption.
- No heavy new reconcile command (e.g. an `/orbit:rebase`) is introduced — that is Phase-1
  territory. Re-running the stamp (with `--refresh`) is the D-c2-5 re-stamp vehicle.

Capture is invoked by the propose/continue/ff workflow bodies immediately after delta-spec
generation (explore.md D-c2-3, D-c2-7).

### D4. Guard placement: inside `buildUpdatedSpec`, refuse-by-default with explicit override (explore.md D-c2-3/D-c2-4 + design-level)

Before the RENAMED→REMOVED→MODIFIED mutation sequence runs, the guard recomputes the live hash of
every touched requirement (same FROM-name mapping as capture) and compares against
`base_fingerprints` read from the change's `.openspec.yaml`.

- **Diverged + no override** → the engine throws with a divergence report; archive's existing
  error path prints it and aborts with "No files were changed." Non-interactive runs
  (`--yes`, bulk archive) can therefore never clobber silently.
- **Override** (`orbit archive --override-fingerprints`, plumbed from `archive.ts` into
  `buildUpdatedSpec`) → proceed; the engine prints a notice naming each overridden requirement
  (CLI-direct runs write no run summary), and the *workflow* records the override in the run
  summary.
- **Missing** (touched requirement absent from the live baseline) → the engine's existing
  not-found hard errors already abort; the check status adds context, no new lenient path.
- **Unverified** (no stored fingerprint) → warn and proceed (explore.md D-c2-7 chose warn, not
  block, for hand-added deltas and pre-C2 changes); the workflow layer strengthens this
  interactively (D6 below).
- **Gates vs. fingerprints**: gates never hard-block (apply-parity); the fingerprint guard *does*
  refuse by default. This is deliberate, not an inconsistency: a gate records process state (review
  cadence), while a fingerprint mismatch means the write is about to destroy content. The
  user-decides principle is preserved — the decision just has to be explicit (prompt choice or
  flag), never a default.

### D5. Idempotent-write skip (new, design-level)

If the live block's hash equals the hash of the *incoming* delta block (the MODIFIED `raw`,
normalized the same way), the write is a no-op — no content can be lost — so the guard treats it
as `verified` regardless of the stored base fingerprint. This gracefully handles (a) a change
whose own delta was already applied mid-flight via `/orbit:sync` — otherwise it would trip its own
guard at archive — and (b) identical parallel edits. (REMOVED requirements get no analogous skip:
removal is never a no-op.)

### D6. Divergence display: `current live ▸ what-would-be-written` diff (refines explore.md D-c2-5)

D-c2-5's text promises a "`your base ▸ current live`" diff, but D-c2-6 stores only the hash — the
base text is not available to render. The display that actually serves D-c2-5's stated purpose
("the user literally sees the sibling scenario they'd drop") is the diff between the **current
live block** and the **delta block that would replace it**: deletions in that diff are precisely
the live content the archive would destroy. This needs no stored base, and is strictly more
actionable. The engine prints it in the refusal report; the archive workflow surfaces it in the
inflection prompt.

### D7. Archive-flow prompt + trail (explore.md D-c2-4, D-c2-7 strengthened)

A new step in the archive workflow body (after C1's Step 3.4 review-system gate prompt, before the
Step 3.5 audit sweep) runs `orbit fingerprint <name> --check --json`:

- **Any `diverged`** → AskUserQuestion inflection prompt with the divergence diff:
  **Reconcile** (halt; print guided-manual instructions — hand-edit the delta to incorporate the
  live content, then `orbit fingerprint <name> --refresh`) / **Proceed anyway** (re-invoke
  archive with `--override-fingerprints`; record
  `fingerprint_overridden: [{capability, requirement, base_hash, live_hash}]` in the run summary) /
  **Abort**.
- **Any `unverified`** (and none diverged) → AskUserQuestion: proceed / abort. Proceeding records
  `fingerprints_unverified: [{capability, requirement}]` in the run summary. Rationale for
  prompting rather than console-warning: D-c2-7's own rationale is that missing-fingerprint "must
  not become a silent-loss loophole", and a console warn in a `--yes` flow is near-silent. The
  engine layer still warns-and-proceeds (the D-c2-7 letter); the interactive strengthening lives in
  the workflow layer, consistent with "the engine reports, the skill prompts".
- **All `verified`** → no prompt, no summary fields.

Both fields are arrays (multiple requirements can diverge in one archive), conditional (absent when
empty), and distinct from `gate_overridden`/`user_decision`. `references/archive-summary-schema.md`
documents them.

### D8. Blind-re-stamp footgun: accepted for Phase 0 (explore.md D-c2-5, D-c2-1)

`--refresh` without actually incorporating the divergent content re-opens the hole — the guard
checks `fingerprint == live_hash`, not "delta incorporated the change". Accepted because it is
reachable only *after* the loud refusal + shown diff (deliberate, same category as
proceed-anyway), so "no silent loss" holds. The Phase-1 3-way merge is the thing that removes it.

## Alternatives considered

- **Scenario-level delta granularity as the C2 core** — rejected (explore.md, Considered & out):
  far larger surface (new delta language + parser + `buildUpdatedSpec` + authoring templates +
  migration), does not alone guarantee no-loss (same-scenario edits still clobber), and wants
  Phase-0 detection underneath regardless. Reclassified as the Phase-2 follow-up.
- **Sidecar `meta.json`** (upstream plan's suggestion) — rejected in favor of the existing
  `.openspec.yaml` (D1).
- **Storing raw base text alongside the hash** — rejected for Phase 0 (D-c2-6); it exists to serve
  a 3-way merge that doesn't exist yet, and bloats the metadata file.
- **Hard block with no override** (upstream plan's "abort and instruct to rebase") — rejected;
  C1's philosophy keeps the user in charge with a recorded escape hatch (D-c2-4). Refuse-by-default
  + explicit flag gives the same non-interactive safety without removing the user's call.
- **Modeling the guard as a C1 gate** — rejected: gate state is a pure function of the
  `.orbit-runs/` trail and gates never hard-block; the fingerprint check is a content-integrity
  invariant on the write itself, not a process-cadence state.

## Risks / Trade-offs

- **[Blind re-stamp]** `--refresh` without editing the delta re-opens the hole → accepted for
  Phase 0 (deliberate-after-warning, D8); removed by Phase-1 merge. The reconcile instructions
  explicitly order the steps (edit first, refresh second).
- **[False sense of security for hand-authored deltas]** Changes never stamped (hand-written,
  pre-C2) verify nothing → D-c2-7 warn + D7 prompt + run-summary record; never silent.
- **[Requirement renamed by the sibling]** If a parallel change *renames* a requirement this
  change also touches, the live block is absent at check time (`missing` status) — the archive
  already fails loudly on the missing MODIFIED target today; the check report names the
  fingerprinted requirement so the user can see why. No silent path.
- **[YAML key edge cases]** Requirement names as map keys (quotes, colons, length) → the `yaml`
  package quotes as needed; round-trip covered by unit tests.
- **[Self-trip after mid-flight sync]** A change that synced its own delta would diverge from its
  own base → neutralized by the D5 idempotent-write skip.
- **[Dogfood sequencing]** C2's own archive is the first guarded archive; if the guard or capture
  lands broken, C2 can't archive cleanly → tasks order engine+CLI+capture before C2's own
  fingerprints are stamped, and the full suite gates each chunk.

## Migration Plan

None required. `base_fingerprints` is optional metadata: existing active changes and all archived
changes lack it and flow through the warn/prompt path (D-c2-7), never a hard failure. Rollback =
revert; no on-disk state outside the change directories is introduced.

## Open Questions

None — explore.md resolved all eight (D-c2-1..8); the finer points above (D3–D7) are the
codegen-level decisions explore.md explicitly delegated to design.

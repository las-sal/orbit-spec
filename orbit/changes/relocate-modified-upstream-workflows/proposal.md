## Why

orbit-spec is a hard fork of openspec@1.3.1 (D10). Today orbit's editorial/judgment layer for the
**11 modified-upstream workflows** still lives only in the old overlay repo (`../openspec-orbit`,
`.claude/skills/openspec-*/SKILL.md` + `.claude/commands/opsx/*.md`) — hand-maintained in the
*output* position of openspec's template→generation→adapter pipeline, divorced from the generator
that is supposed to own them. This is phase **B1** of the ratified 6-phase program (explore.md D9):
relocate that content **up into the source template modules** so the fork generates orbit's workflow
content natively and the whole spec-dev package is cohesive.

Per the 2026-06-08 directive captured in **D13**, B1 mimics upstream's structure as closely as
possible: prose stays as **inline TS template literals** in `src/core/templates/workflows/*.ts`
(D6's markdown-as-source and D8's DRY-conventions injection are deferred to a later, deliberate,
all-at-once architecture change). So B1 is **pure surgical relocation** — fold orbit's deltas into the
two existing literals per module (skill `instructions` + command `content`), no new architecture.

## What Changes

- **Relocate the orbit delta for all 11 modified-upstream workflows** from the overlay into the
  existing source modules `src/core/templates/workflows/{explore, propose, new-change,
  continue-change, apply-change, ff-change, sync-specs, archive-change, bulk-archive-change,
  verify-change, onboard}.ts`. For each: fold orbit's additions into the skill `instructions` literal
  and the command `content` literal, preserving upstream's fat-skill / thin-command two-tier shape.
- **Inline the three execution disciplines** (read-before-reference / change-completeness / pushback,
  i.e. `orbit-conventions`) into 9 of the 11 bodies — hand-duplicated per body, mimicking
  upstream's self-contained bodies (Q9 resolved-for-B-arc by D13; no injection mechanism).
  `sync-specs` stays upstream-verbatim (orbit never modified it); `bulk-archive-change` carries
  only the non-emission note.
- **Inline run-summary emit** (`orbit-run-summary-emit`) into the 8 workflows that emit
  (all except `sync-specs`, `bulk-archive-change`, and `onboard`, which explicitly do not emit).
- **Keep bodies mechanism-neutral** (D11): no Claude-only constructs ("the Skill tool", hardcoded
  `.claude/...` paths). The `/orbit:` colon syntax is fine — it is already rewritten per-tool by
  `transformToHyphenCommands`. Bodies must serve Claude (primary) + Codex from one source.
- **No generator changes** in B1. The `references[]` and metadata pass-through growth is B2 (D7).
  Consequence: `archive-change`'s one bundled reference file (`archive-summary-schema.md`) is the
  single piece **deferred to B2** — B1 relocates archive's body and inlines what it can; the sibling
  reference file lands when the generator can emit it.

## Capabilities

### New Capabilities

(These capabilities are new to *orbit-spec's* `orbit/specs/` — the repo had no specs before this
change. They are brought over from the overlay as the migration source of truth, D10. The 4 net-new
workflows — review, review-external, address-reviews, audit-drift — are **out of scope** for B1; they
land first-class in B3.)

- `orbit-conventions` — the three execution disciplines, inlined into all 11 workflow bodies.
- `orbit-run-summary-emit` — the `.orbit-runs/` audit-trail JSON emit, inlined into the 9 emitting
  workflows.
- `orbit-explore-modifications` — explore's orbit layer: capture modes/types, `explore.md` five-
  section convention, crystallization, offer-don't-auto.
- `orbit-propose-modifications` — propose's orbit layer, including explore.md consume-mode.
- `orbit-archive-modifications` — archive's orbit layer (NEW Step 5.5 archive run-summary).
- `orbit-onboard` — orbit's onboard workflow layer.

### Modified Capabilities

(none — orbit-spec has no pre-existing specs; everything is additive)

## Impact

- **Affected source**: the 11 `src/core/templates/workflows/*.ts` modules (skill + command literals).
  No changes to the generator (`shared/skill-generation.ts`, `command-generation/`), `init.ts`,
  `update.ts`, or the engine.
- **Affected tests**: existing generation/snapshot tests must stay green (~1369). Add a
  generation-fidelity check that `orbit init --tools claude` reproduces orbit's expected workflow
  content, and that `--tools codex` produces a sane skill.
- **Deferred to B2**: `archive-change` reference file; any other bundled `references/` for the 11.
- **Naming**: the user-facing rename is already done (bin `orbit`, working dir `orbit/`, skill dirs
  `orbit-*`, command namespace `/orbit:`). B1 authors orbit-native bodies from the start; command ids
  (`explore`, `propose`, …) are unchanged, so `init`/`update` continue to work.
- **Parity tracking**: B1 + B2 + B3 reach behavioral parity with today's overlay. After parity, the
  overlay repo (`../openspec-orbit`) retires (D10).

# Proposal: d5-context-economy

## Why

Every orbit command loads its full generated body into the context window, and the D-arc has
been growing exactly the bodies it most invokes: the six heaviest total ≈40.6k tokens, with the
three heaviest (address-reviews 9.8k, review 8.3k, explore 7.1k) being the most-run editorial
commands. The exploration's inventory pass (`explore.md` D-d5-1; `sketches/body-inventory.md`)
tagged every section of those six bodies and found only ~44% is resident judgment — the rest is
mechanical procedure the engine should own (~27%), reference material that should load lazily
(~20%), and duplication (~9%). Meanwhile the D-arc's dominant failure class — two voices
asserting one computable fact (hand-authored gate verdicts, stale iteration notes,
`findings_summary` drift, and this cycle's emit-vs-engine `next_recommended` corrections) —
keeps recurring at the one seam D4 didn't close: emits are still hand-composed by the AI
against schema prose. D5 is the stage that closes that seam and pays down the window: the
engine absorbs the mechanical, references absorb the rarely-needed, duplication dies, and what
remains resident in a body is only judgment (the charter's governing concern: what's in the
window and who's reading it). It also formalizes the cold-seam story (boot, touchpoints,
leak hardening) and the model-per-phase hints — both pre-shaped in the arc charter and ratified
as nine decisions in the consumed exploration.

## What Changes

- **NEW engine surface `orbit emit <command>`** (capability `orbit-emit-composition`): the AI
  composes only the narrative payload (stdin JSON); the engine stamps timestamp + collision-
  bumped filename, fills the spine (`kind` from the command taxonomy, deterministic facts where
  defined), composes post-write-semantics recommendations against a synthetic trail and writes
  ONCE, atomically (no provisional file ever exists), and
  validates through the same normalizers the D4 renderer uses (the fail-loud boundary moves
  from read time to write time). Sub-requirements absorbed: engine-computed explore maturity
  counts, the apply chunk-preamble grammar, review-external's T0 path-template
  recommendation, engine-computed per-chunk touched-file lists, and the required nullable
  `model` provenance payload field.
- **Review gains the reviewer-class axis** (`--reviewer in-context|fresh|external`;
  `--fresh` remains as shorthand): `/orbit:review-external` retires as a separate command
  (surface 16 → 15); the external packaging branch moves to a reference loaded only when
  `--reviewer external`; the record vocabulary is FROZEN (T0 emits stay
  `review-external-*.json`, findings stay `external-<as>-*.md`); `gates.ts` next-command
  vocabulary updates to the merged form.
- **Body-economy pass over the generated surface**: disciplines blocks shrink IN PLACE
  (epitome + detail-to-situ + structural leaning; no shared reference per prior ruling
  D-b2-2); review's per-mode pass definitions move to per-mode references loaded for the
  resolved mode only; emit sections across bodies shrink to surface invocations; worked
  examples and rarely-needed flag detail move to references. Stated reduction target (arc
  exit criterion 1's NUMBER): the six heaviest bodies' resident total drops from ≈40.6k to
  **≤ 20k tokens**, measured by the same bytes/4 estimate over the same six bodies as
  `sketches/body-inventory.md` (the inventory's halving claim made falsifiable; ≈18k is the
  judgment floor, ~2k the connective-prose headroom).
- **Boot render**: `orbit status --change <name> --boot` (orientation surface) composes the
  cold-start sequence as ordered pointers — position/eligibility, artifact set, latest-emit
  pointers per command family (review split per mode), and the touchpoints view; no
  hand-maintained handoff file exists.
- **Touchpoints**: design.md gains an authored `## Touchpoints` section (predicted map,
  written at propose, frozen once apply starts); the ACTUAL map is engine-computed from the
  diff (never prose); predicted-vs-actual divergence becomes a mechanical audit/system-review
  check; apply chunk emits carry engine-computed per-chunk file lists.
- **Leak hardening (three layers, ratified)**: the `Standing recommendation:` slot becomes
  required explore.md open-question format; the boundary residency sweep lands in the
  explore/architect bodies tied to the existing emit trigger; the
  `open_questions_with_recommendation` attestation is engine-computed by `orbit emit explore`.
- **Model strategy**: nullable `model` field on the emit spine (payload-required); `models:`
  phase-hint map in `orbit/config.yaml` echoed as a garnish on engine eligibility lines,
  never enforced by bodies.

## Capabilities

### New Capabilities

- `orbit-emit-composition`: the engine-owned emit surface — generic `orbit emit <command>`,
  payload contract (narrative fields + `model`), spine composition with deterministic facts,
  the atomic next_recommended loop, write-gate validation via the shared normalizers,
  timestamp/filename/collision ownership, per-command computed extensions (explore maturity
  counts, apply chunk grammar + per-chunk diffs, review-external T0 template).

### Modified Capabilities

- `orbit-review`: reviewer-class axis (`--reviewer`, external branch reference-loaded),
  mode-split pass references, emit via the engine surface.
- `orbit-review-external`: invocation re-anchored to `/orbit:review --reviewer external`;
  packaging behavior and record shapes explicitly frozen; standalone command retired.
- `orbit-orientation`: the `--boot` cold-start render (ordered pointers; lifecycle-aware
  touchpoints view).
- `orbit-run-summary-emit`: emits composed via the engine surface (bodies instruct the
  surface, never hand-compose); apply chunk emits gain engine-computed `files_touched`.
- `orbit-conventions`: `model` field joins the internal-run JSON spine; the explore.md
  five-section format gains the required `Standing recommendation:` slot on open questions;
  the No-chaining and discipline-embedding conventions acknowledge the epitome form.
- `orbit-explore-modifications`: standing-recommendation slot + boundary residency sweep
  (layer 1 + 2 of the leak hardening).
- `orbit-architect`: boundary residency sweep (layer 2 applies to architect sessions).
- `orbit-propose-modifications`: design.md `## Touchpoints` authored at propose (consume mode
  pulls candidates from explore.md), frozen-at-apply rule.
- `orbit-engine-gates`: eligibility-line model-hint garnish from `models:` config.
- `orbit-audit-drift`: predicted-vs-actual touchpoints divergence check; attestation
  cross-check (emit count vs actual explore.md count).
- `orbit-onboard`: the Identity layer list and the canonical-flow external-review pointer
  re-anchor to the merged invocation (`/orbit:review --reviewer external`; the review skill's
  `references/external-handoff.md`) so task 7.4's re-teach stays baseline-consistent.

## Impact

- **Engine (`src/`)**: new `orbit emit` command + composition module (reusing
  `report-render.ts` normalizers and `orientation.ts`/status computation for the atomic
  loop); `status --boot` in the orientation family; chunk-preamble parser; explore.md
  counter; config `models:` reader + gate readout garnish; `gates.ts` next-command
  vocabulary for the merged review form.
- **Generated surface (16 → 15 skills)**: review-external's launcher/skill retire into
  review's `--reviewer` axis; every body's emit section shrinks to a surface invocation;
  disciplines blocks shrink in place; review gains per-mode + external-handoff references.
- **Records**: emit vocabulary FROZEN (filenames, `command` values); the spine gains
  `model` (nullable — readers tolerate absence); apply chunk emits gain `files_touched`.
- **Tests**: emit-surface suite (composition, atomic loop, write-gate rejection, collision),
  boot render, chunk grammar, maturity counting, touchpoints divergence check, generated-body
  fidelity re-pins (epitome markers, reference loading, retired launcher), gates vocabulary.
- **Docs**: CLAUDE.md D5 entry at archive, including a sweep of the present-tense
  current-state surface counts (the D15 bullet's "ALL workflows (16 as of D2)", the
  self-hosting note's skill/launcher counts) to the post-merge 15 — historical narrative
  sections stay as records; the arc doc status log.

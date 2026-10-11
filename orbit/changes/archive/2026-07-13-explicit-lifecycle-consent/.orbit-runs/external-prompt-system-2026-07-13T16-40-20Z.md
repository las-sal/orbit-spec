# External Review: explicit-lifecycle-consent (iteration 1, mode: system)

You are reviewing an OpenSpec change as a second pair of eyes — **post-apply, whole-product-state review**. Your value is your independent take — be thorough; flag anything that looks wrong, inconsistent, or unclear. Don't be charitable to the authoring AI's reasoning.

## Repo

https://github.com/las-sal/orbit-spec.git — branch `d-arc`

## Project context (read first)

- `CLAUDE.md` — handoff orientation
- `orbit/architecture/d-arc-arbitered-flow.md` — this change is **Stage D1 of the D-arc program**; its D1 exit criteria are the change's acceptance tests, and rulings R-d-1..8 constrain the design. Implementation contradicting the arc is a finding.
- `orbit/project.md` — project goals + stack (if present)
- `*_convention.md` at repo root — naming, error handling, etc. (if present)
- `orbit/lenses/perspectives.md` / `orbit/lenses/critical-paths.md` — ABSENT in this repo (no lenses defined); passes 4–5 have no material
- `orbit/changes/explicit-lifecycle-consent/.orbit-runs/` — full iteration history (6-pass proposal cycle + apply emit + in-context system review)

## Cycle context

- Iteration: 1 in system mode (first external review of the IMPLEMENTATION; the proposal was externally reviewed twice by GPT-5 Codex — 5 findings total, all resolved pre-apply).
- Prior internal findings still open: 0 — the in-context system pass (`review-system-2026-07-13T16-36-02Z.json`) ran Passes 0–3 + 6 clean (Passes 4–5 skipped, no lenses).
- Prior external findings still open: none (system mode has had no external pass yet).
- The apply landed as four commits (`69af45d` → `65eff39`, diff range `cff2493..65eff39`), followed by the in-context review emit (`395fac0`). The user overrode the formally-UNPASSED review-proposal gate at the apply inflection prompt — recorded as `gate_overridden` in `apply-2026-07-13T15-46-06Z.json`; that is expected behavior, not a finding.

Do not push back on stale findings — pushback discipline is enforced on resolution, not review. Just flag what you observe.

## What the change shipped (orientation)

D-arc Stage D1: the consent/arbiter layer. **Engine**: gate vocabulary gains optional `consent: user-invoked` (closed set of one; parse/validate/surface in `src/core/artifact-graph/{types,schema,gates}.ts`); `schemas/spec-driven/schema.yaml` v2→v3 with both reviewed gates consent-marked; `ChangeMetadataSchema` gains `schema_version` (written at scaffold by `orbit new change`) + `consent_era_from` (straddler stamp); readouts render `Ready when you are:` (never `Next:`) with ` — user-invoked` appended to lifecycle canonical-next commands (`status.ts`, `instructions.ts`). **Bodies** (`src/core/templates/workflows/`): consent-at-entry steps in apply/archive/bulk-archive (provenance rule: user-typed = zero prompts; AI-mediated = AskUserQuestion before any write; uncertain = AI-mediated; migrate-on-touch `consent_era_from` stamp); `consent: "user-invoked" | "prompted"` field documented in apply + archive emits (incl. `ARCHIVE_SUMMARY_SCHEMA_REFERENCE`); review stock phrasings re-labeled; onboard enumerates FOUR disciplines; no-chaining echoed as the fourth discipline in all 15 bodies (sync-specs gained its first orbit-additions block). **Tripwire**: audit-drift Category 4 checks consent-scoped emits under the three-tier era rule (schema_version ≥ 3 → all checked; consent_era_from → at-or-after-stamp checked; neither → exempt; NO timestamp fallback). **Tests**: 1668 green (baseline 1608); new suites `test/core/artifact-graph/consent.test.ts` + `test/core/templates/consent-tripwire.test.ts`; parity hashes re-pinned; fidelity greps (no `Next:`, no-chaining echo) at template AND on-disk-surface level.

## What to read for THIS review (--as system)

- orbit/changes/explicit-lifecycle-consent/proposal.md, design.md, tasks.md, specs/ (8 delta files), explore.md
- The change's commit range: `git diff cff2493..65eff39` (the four apply commits)
- orbit/specs/<capability>/spec.md (archived baselines — for baseline-compliance; note baselines are PRE-SYNC: the deltas land at archive, so baseline text still showing v2/three-disciplines/`Next:` phrasings is expected, not a finding)
- Code paths touched: src/core/artifact-graph/{types,schema,gates,instruction-loader}.ts, src/commands/workflow/{status,instructions}.ts, src/utils/change-utils.ts, schemas/spec-driven/schema.yaml, src/core/templates/workflows/*.ts, the test files above
- The generated surface is gitignored; regenerate locally with `npm install && npm run build && node bin/orbit.js init --tools claude` in a scratch dir, or rely on `test/core/templates/orbit-generated-surface.test.ts` (real init e2e)

Useful commands: `npm install && npm run build`, `npm test` (expect 1668 green),
`node bin/orbit.js validate explicit-lifecycle-consent --strict`,
`node bin/orbit.js fingerprint explicit-lifecycle-consent --check` (expect 8/8 verified),
`node bin/orbit.js status --change explicit-lifecycle-consent --json` (expect consent markers on both reviewed gates).

## What to look for

0. **verify-change-style structural check** — tasks done, spec coverage, design adhered (run your own equivalent of upstream verify-change: each of the 12 delta requirements should map to landed implementation).
1. **Baseline Compliance** — does this change break any archived `orbit/specs/` requirement it did NOT delta? (C2 fingerprint machinery, emit spine, single-voiced canonical-next, gate computation purity.)
2. **Cohesion** — callers/dependents outside the tasks list. Signature drift (`nextAfterPass` changed shape), ripple effects (every `writeChangeMetadata` caller must round-trip the new metadata fields), side-effect additions.
3. **Surface Walk** — every CLI surface still coherent? `orbit status --json` / `orbit instructions apply --json` (additive fields only; JSON field NAMES unchanged per the delta), `orbit new change` (scaffold now writes `schema_version`), `orbit validate`, `orbit fingerprint`. Capabilities ARE surfaces.
4. **Perspective Reviews** — no lenses defined; skip unless you find implicit perspectives worth simulating (e.g., a codex consumer of the generated skills).
5. **Critical-Path Scan** — no critical-paths file; the de-facto critical path is the lifecycle: propose → review gates → apply (consent + inflection) → system review → archive (consent → gate → fingerprints → audit). Walk it against the new bodies + engine and flag breakage.
6. **Drift / Residue** — vocabulary residue (imperative `Next:` labels, "three execution disciplines" in LIVE docs — remember baselines are pre-sync), stale references, archive-coherence misses.

Independent-take probes (from the in-context pass — verify or refute):
- The ` — user-invoked` marker is embedded in the `next_command` JSON VALUE (not display-only), so bodies rendering it verbatim inherit the marker; the in-context pass judged this consistent with the delta's "rendered line" language and the tier-1 leading-token parse. Is that reading sound, or does any consumer treat `next_command` as an executable command string that the suffix would break?
- The consent-era straddler mechanics ran live on this very change: `consent_era_from: 2026-07-13T15:46:06Z` stamped in its `.openspec.yaml`, apply emit at the SAME second (boundary case: at-stamp = checked). Verify the three-tier rule's boundary semantics are consistently stated everywhere (audit-drift body, orbit-lifecycle-consent delta, consent-tripwire tests).
- The exit criteria (arc doc, Stage D1): (1) lifecycle emits carry consent + tripwire demonstrably flags absence; (2) user-typed apply/archive runs with ZERO added prompts; (3) no imperative `Next:` in engine output or generated bodies. Are all three actually satisfiable/falsifiable from what shipped — especially (1), where the "demonstrably flags" evidence is the test suite rather than a live audit-drift run?

## Output format — write to:

`orbit/changes/explicit-lifecycle-consent/.orbit-runs/external-system-<TS>.md`

(Where <TS> is today's timestamp in ISO format with hyphens, e.g. `2026-07-13T18-00-00Z`. Pick a fresh timestamp so this file doesn't overwrite anything.)

Use this exact markdown structure:

```markdown
# External Review: explicit-lifecycle-consent (iteration 1)

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

If your environment doesn't support file writes (chat-only interface), output the markdown directly and the user will save it.

## After completing the review

1. **Output the full findings markdown in chat** — in addition to writing the findings file, output the COMPLETE findings markdown in this chat. Same content as the file: every severity section (`## CRITICAL` / `## WARNING` / `## SUGGESTION`), every `### Title` entry, every `**File**:` and `**Description**:` field. Do NOT abbreviate or summarize — the chat output is the immediately-visible read for the user. The file remains the canonical record for `--from-file` parsing.

2. **Commit and push the findings file** (if your environment supports git):

   ```bash
   git add orbit/changes/explicit-lifecycle-consent/.orbit-runs/external-system-<TS>.md
   git commit -m "External review (system, iter 1): explicit-lifecycle-consent

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   Then STATE PLAINLY in your chat output that the findings landed — `Findings committed (<short-sha>) and pushed` — so the human never has to infer whether they reached the repo.

If you don't have git access, just output the findings markdown in this chat (per the chat-only fallback above), state explicitly that you could NOT commit/push, and the user will commit it manually.

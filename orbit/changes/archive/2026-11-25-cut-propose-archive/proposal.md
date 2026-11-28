## Why

`/orbit:propose` and `/orbit:archive` are still over the 5,000 estimated tokens Claude Code keeps of an invoked skill
after a compaction: propose at 7,982 and archive at 7,041 by `npm run size:report` at `a1c1f273`. A long propose or
archive that compacts loses its closing steps (the emit, the commit step, the PR tail). `/orbit:bulk-archive`, also over
(6,092), has never run in this repository, and Sal removed it (R-rop2-11). `reduce-orbit-phase2`'s stage
`cut-propose-archive` applies the inventory's cut lists for propose and archive
(`orbit/explore/inventory/sketches/explore-propose-archive-onboard.md`) and that removal. Both bodies then fit (G1), their
ceilings come down (G2), and every removal and every other edit is named (G0).

## What Changes

- **propose's body** keeps mode detection, Touchpoints (Step 0c.5, both modes) and every closing step. It moves consume
  mode's Steps 0a, 0b, 0c, 0c.6 and 0d, with the mirrored Decisions-entry and Mechanism productions and the graceful
  degradation cases, to `references/consume-mode.md` (P1, P2). That file is read when mode detection resolves consume,
  after the PR layer's Phase 1. Its Step 0d still runs after the size brief.
- **archive's body** keeps each step's basic content and moves four procedures to references read at the moment named:
  - A1: what consent at entry's AI-mediated and granted paths do goes to `references/consent-at-entry.md`, read when
    Step 0 classifies the arrival as one of them; the classification itself stays in the body. Apply's Step 0 gets the
    same move, since the inventory decided the step once for both bodies.
  - A2: the user-validation closure's dispositions and its DEFERRAL REFUSALS production go to
    `references/user-validation.md`, read when `tasks.md` holds an unchecked `(User-validation` task.
  - A3: the brief save's outcome table goes to `references/brief-save.md`, read when the save exits non-zero.
  - A4: the PR-attachment entry observation, the preflight detail and the outward-acts echo go to the existing
    `references/pr-archive-tail.md`, read when the trail carries a `pr_attachment`.

  The readiness line drops its justification paragraph (R1), and the prose that stays is tightened, with no step removed
  (R2).
- **REMOVED (G0, R-rop2-11): `/orbit:bulk-archive`.** The following go: the workflow template
  `src/core/templates/workflows/bulk-archive-change.ts`, the skill `orbit-bulk-archive-change` with its references, and
  the `/orbit:bulk-archive` launcher. So do its id in `ALL_WORKFLOWS`, the skill and command lists, and the config
  picker, along with every per-change clause that baseline specs, bodies and references hold for it. The full surface
  goes from 15 workflows to 14, and the bodies carrying the decision-writing basic content go from fourteen to thirteen.
  The skill and launcher join the retired-artifacts registry, so a plain `orbit update` removes them from an adopter's
  existing surface. An adopter archives several changes one at a time with `/orbit:archive`. Onboard's command table
  row and PR-layer mention, sync-specs' consent-inheritance example, archive's schema reference and the docs that
  count or describe the command follow.
- **The ledgers.** The cut ledger records the bodies this stage edits (propose and archive; apply, onboard and
  sync-specs, which this stage also edits) and names every edit as a pair. A new `retired` kind names a workflow removed whole: a test
  holds that its skill and launcher are absent from the generated surface and present in the retired registry. Phase
  1's tighten-bodies ledger drops bulk-archive's recorded body. Each edited body's character ceiling comes down (G2).

Not in this change: the decision-writing bullet's shortening (D-inv-2), since neither body needs it here; explore's and
onboard's own cuts (`cut-explore-onboard`). No cut list entry is postulated to change significantly what a session does,
so none is replayed (R-rop2-10).

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `orbit-archive-modifications`: the per-change bulk-archive clauses and scenarios leave six requirements (fingerprint
  divergence, the AI-mediated consent prompt, the PR-attached tail, the user-validation closure, the brief save, the
  sign-off hold). The DEFERRAL REFUSALS mirror and the brief save's table are carried by the archive skill's references
  rather than its body.
- `orbit-lifecycle-consent`: bulk-archive leaves the consent table, the consent-recording scenarios and the consent-era
  marker's carriers.
- `orbit-base-fingerprints`: the agent-driven archive path is `/orbit:archive` alone.
- `orbit-conventions`: the following changes:
  - `Generated-file disposition`: the surface count and the orbit-modified list lose bulk-archive, and its
    known-limits example names a reference.
  - The commit step's table and named limit lose bulk-archive's row.
  - `Tightened bodies carry no provenance`: its sentence on bodies keeping their own text drops bulk-archive.
  - The tighten-bodies ledger drops bulk-archive's body.
  - The cut ledger gains the `retired` kind.
- `orbit-skill-generation`: the retired-artifacts registry gains `orbit-bulk-archive-change` / `bulk-archive`.
- `orbit-architect`: the surface count, and the start-surface residual's known instance, which leaves with the body.
- `orbit-run-summary-emit`: the emit-scope exclusion of bulk-archive goes, and explore is the one emit step kept whole.
  Archive's deferral composition is carried by its user-validation reference.
- `orbit-engine-gates`: the inflection-prompt contract's bulk-archive named limit and the grant table's row go.
- `orbit-decision-records`: `orbit decisions status`' "on several (bulk-archive)" and the carrier count.
- `orbit-propose-modifications`: the explore.md section list and the Mechanism grammar mirror are carried by propose's
  `references/consume-mode.md`.

## Impact

- `src/core/templates/workflows/propose.ts`, `archive-change.ts`, `apply-change.ts` (Step 0), `onboard.ts` (its bulk
  row and sentence), `sync-specs.ts` (its additions' example); `bulk-archive-change.ts` deleted.
- `src/core/profiles.ts`, `profile-sync-drift.ts` (`WORKFLOW_TO_SKILL_DIR`, the retired registry),
  `shared/tool-detection.ts`, `shared/skill-generation.ts`, `templates/skill-templates.ts`, `commands/config.ts`.
- Docs: `README.md`, `docs/commands.md`, `docs/concepts.md`, `docs/workflows.md`, `docs/workflow-engine.md`,
  `docs/cli.md`, `docs/installation.md`, `docs/migration-guide.md`, `docs/supported-tools.md`; `CLAUDE.md`'s D15 count.
- Tests that read the moved or removed text follow it (listed in design.md's Touchpoints); the cut ledger and the
  tighten-bodies ledger; `skill-body-budget`'s ceilings; `skill-templates-parity`' hashes.
- An adopter's existing `orbit-bulk-archive-change` skill and `bulk-archive` launcher are removed by their next
  `orbit update`. Nothing else in engine behaviour changes.

## Size

- capabilities: One stage, one change (the program's stage rule; cut-review-walk declared on the same ground). The removal is a sweep of every spec that names bulk-archive, nine on its own, so no split brings either part under the ceiling. Declared by Sal at propose, 2026-11-25.
- requirements: The same reason: most of the requirements drop a per-change bulk-archive clause or a count, and the rest re-point where a mirror lives (body to reference). Declared by Sal at propose, 2026-11-25.

# Tasks: c2-parallel-merge-guardrail

Order is dogfood-sensitive (design.md, Risks): the engine guard + CLI + capture must all land and
be green BEFORE C2's own fingerprints are stamped (§5), so C2's archive is the first guarded
archive.

## 1. Metadata schema + hashing core

- [ ] 1.1 Extend `ChangeMetadataSchema` (`src/core/artifact-graph/types.ts`) with optional
      `base_fingerprints: z.record(z.string(), z.record(z.string(), z.string()))`; confirm
      `writeChangeMetadata`/`readChangeMetadata` (`src/utils/change-metadata.ts`) round-trip it
- [ ] 1.2 Create the fingerprint module (`src/core/fingerprints.ts` or similar): hash rule
      (`sha256:` + hex over line-ending-normalized block `raw`), touched-set derivation from a
      `DeltaPlan` (RENAMED.from ∪ REMOVED ∪ MODIFIED-mapped-through-RENAMED), live-block lookup
      via `extractRequirementsSection`, and per-requirement check statuses
      (`verified`/`diverged`/`unverified`/`missing`) including the idempotent-write skip
- [ ] 1.3 Unit tests: schema round-trip (with/without the field), hashing (LF/CRLF equal, cosmetic
      edit diverges), touched-set rename mapping, all four check statuses, idempotent skip

## 2. `orbit change fingerprint` CLI subcommand

- [ ] 2.1 Register `fingerprint <change-name>` under the `change` command (`src/cli/index.ts`)
      with `--check`, `--refresh`, `--json`; stamp mode writes `base_fingerprints` via
      `writeChangeMetadata` (add-missing-only by default; `--refresh` overwrites; warn + skip
      requirements absent from the live baseline)
- [ ] 2.2 Check mode: report per-requirement `{capability, requirement, status, base_hash,
      live_hash}` human-readably and as `--json`; exit without modifying files
- [ ] 2.3 Unit/CLI tests: stamp writes expected map; re-stamp without `--refresh` preserves a
      stale fingerprint; `--refresh` overwrites; `--check --json` shape and statuses;
      ADDED-only change stamps nothing

## 3. Archive-time guard in the engine

- [ ] 3.1 Guard in `buildUpdatedSpec` (`src/core/specs-apply.ts`), before the mutation sequence:
      read the change's `base_fingerprints`, compute per-requirement status; on `diverged`
      without override throw with the divergence report (requirement names + current-live ▸
      would-be-written diff); on `unverified` warn and proceed; honor the idempotent-write skip
- [ ] 3.2 Plumb the change directory + `--override-fingerprints` flag through
      `orbit archive` (`src/cli/index.ts`, `src/core/archive.ts`) into `buildUpdatedSpec`;
      refusal exits via the existing "Aborted. No files were changed." path
- [ ] 3.3 Tests: stale-snapshot repro (BASE+A vs snapshot-of-BASE) refused with A's content shown
      as a deletion; `--override-fingerprints` proceeds; `--yes` without override still refused;
      unverified warns and proceeds; verified + idempotent-skip archive byte-identical to
      pre-guard output; REMOVED gets no idempotent skip

## 4. Workflow template updates (then regenerate surface)

- [ ] 4.1 `propose.ts`, `continue-change.ts`, `ff-change.ts`: add the capture step — run
      `orbit change fingerprint <name>` immediately after delta-spec generation (D-c2-3/D-c2-7)
- [ ] 4.2 `archive-change.ts`: new fingerprint-check step after the Step 3.4 gate prompt and
      before the Step 3.5 audit sweep — `--check --json`, diverged → reconcile / proceed-anyway
      (re-invoke with `--override-fingerprints`) / abort, unverified-only → proceed/abort prompt;
      run-summary fields `fingerprint_overridden` / `fingerprints_unverified`; update the
      summary-shape documentation block in the body
- [ ] 4.3 `archive-change.ts` references: extend `archive-summary-schema.md` content with the two
      conditional fingerprint fields
- [ ] 4.4 `bulk-archive-change.ts`: brief orbit-addition note — the engine guard fires per
      archive; on refusal surface the per-change divergence and options rather than retrying
- [ ] 4.5 Template-fidelity/generated-surface tests as needed (per-workflow marker fidelity suite);
      `npm run build && node bin/orbit.js update --force` to refresh the local `.claude/` surface

## 5. Dogfood + verification

- [ ] 5.1 Full suite green (`npm test`; baseline 1576 + new coverage), and
      `node bin/orbit.js validate c2-parallel-merge-guardrail --strict` passes
- [ ] 5.2 Stamp C2's own fingerprints (`orbit change fingerprint c2-parallel-merge-guardrail`) —
      first guarded change; confirm `.openspec.yaml` records the `orbit-archive-modifications`
      MODIFIED requirements
- [ ] 5.3 Manual end-to-end sanity in a scratch project: two changes touching the same
      requirement; archive A then B → refusal with diff; reconcile per the guided-manual flow →
      both scenarios present in the final baseline

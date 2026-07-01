<!--
Implementation chunks:
  Chunk 1 (groups 1-2):  Engine core — gate types, schema parsing, state computation
  Chunk 2 (groups 3-4):  CLI surface — gate-aware status/instructions, spec-driven v2
  Chunk 3 (groups 5-6):  Editorial alignment — bodies, emits, attestations
  Chunk 4 (groups 7):    Verification — fixtures from real archives, e2e, docs
-->

# Tasks — c1-engine-gates

## 1. Gate model in the artifact graph

- [x] 1.1 Extend `src/core/artifact-graph/types.ts`: `GateSchema` (`id`, `kind: tracked|reviewed`
      closed enum, `requires`, `inputs`, `tracks`, `cadence`, `confirm: no-new-findings|findings-resolved`
      closed enum (reviewed kind; default `no-new-findings`), `before`, `instruction`);
      `SchemaYamlSchema` gains optional `gates:` list. Keep `ApplyPhaseSchema` intact.
- [x] 1.2 Normalization in `schema.ts`: `apply:` block → `kind: tracked` gate id `apply` when no
      `gates:` entry claims the id; double-declaration fails validation; gate ids join the
      duplicate/reference/cycle checks.
- [x] 1.3 Trail reader module (new, e.g. `artifact-graph/trail.ts`): enumerate `.orbit-runs/`,
      parse filename `<TS>` tokens (unparseable → absent), read review/address-reviews/external
      artifacts, resolve `reviewer_class` with the legacy-inference fallback.
- [x] 1.4 Gate state computation (extend `state.ts` or sibling `gates.ts`): tracked checkbox
      arithmetic (reuse apply's tracker parsing); reviewed convergence criterion — ordered-slot
      class coverage (each slot a fresh pass with a token strictly later than the prior slot's;
      `independent` slot ← fresh|external), resolution (`deferred=0, escalated=0` via
      `source_path` match), per-gate `confirm` independent confirmation (`no-new-findings`: 0
      CRITICAL + 0 new by title+file; `findings-resolved`: 0 CRITICAL + that pass's findings
      resolved). Pure function; zero writes.

## 2. Freshness + canonical-next

- [x] 2.1 Freshness rule: pass stale iff latest `apply-*.json` token > pass token; resolution
      traffic excluded. Unit-tested against token edge cases (same-second, unparseable).
- [x] 2.2 Canonical-next computation: from gate graph + cadence position, derive ONE full
      invocation string (`/orbit:review-external --as system <change>` etc.) + position-readout
      string; exposed to status/instructions and JSON consumers.

## 3. CLI surface

- [ ] 3.1 `orbit status`: gate rows (blocked/ready/passed/stale/unpassed + reasons) + the
      position readout line; JSON output carries `gates[]`, `position`, `next_command`.
- [ ] 3.2 `orbit instructions <phase>`: `blocked-by-gate` state (gate id, reason, next_command)
      when the phase's gate is unpassed; apply's existing states unchanged otherwise.
- [ ] 3.3 `schemas/spec-driven/schema.yaml` → version 2: `review-proposal` / `apply` /
      `review-system` gates with the D-c1-4 cadences exactly as spec'd, incl. per-gate `confirm`
      (`review-proposal: no-new-findings`, `review-system: findings-resolved`).

## 4. Compatibility

- [ ] 4.1 v1-schema compat tests: apply-only YAML (upstream shape) parses to one tracked gate;
      observable behavior of status/instructions on ungated schemas is unchanged.
- [ ] 4.2 Legacy-trail compat: gate computation over the archived B2 + B3 `.orbit-runs/` as
      fixtures (real trails; inference fallback exercised; B3 must compute review-system as
      converged-then-stale-free per its actual history).

## 5. Emits + attestations

- [ ] 5.1 `reviewer_class` on review emits: review body's run-summary section + its
      `references/run-summary-schema.md`; review-external T0 emit documents `"external"`.
- [ ] 5.2 Review-external attestations: packaging-side `Prompt committed (<short-sha>) and
      pushed to <remote>/<branch>` in the preflight-satisfied output (body Step 8 +
      worked example); template's "After completing the review" gains the external-side
      `Findings committed (<short-sha>) and pushed` statement requirement (body reference
      `prompt-template.md`).
- [ ] 5.3 Inflection-prompt override recording: archive (and apply, for review-proposal) bodies
      gain the gate prompt (address / proceed-anyway / abort). The apply body sources gate state +
      reason from `orbit instructions apply --json` (modeled phase); the archive body sources from
      `orbit status --change <name> --json` (`gates[]`/`next_command`) — there is NO
      `orbit instructions archive` phase. Run summaries record `gate_overridden` per the MODIFIED
      field-list deltas: document the field in the apply emit's inline JSON shape (apply body's
      "Run-summary emit (chunk-aware)" section, `apply-change.ts`) and in the archive emit schema
      reference (`orbit-archive-change`'s `references/archive-summary-schema.md`, `archive-change.ts`)
      — present only on proceed-anyway, absent otherwise.

## 6. Editorial bodies — single-voiced + position readout

- [ ] 6.1 `review.ts` body: Step 9 phrasings replaced with the MODIFIED-delta single-voiced
      texts (engine-sourced convergence; full commands; no skip clauses); worked examples
      updated to match. Implement the as-of-completion rule (both modes): orbit-review renders
      its final assessment over the on-disk trail PLUS a synthetic pass for the active run
      (mode, reviewer_class, now-token, about-to-be-written `review-<mode>-<TS>.json` path,
      current findings) so a current `--fresh`/`in-context` pass counts toward its cadence slot;
      `status`/`instructions` stay on-disk only.
- [ ] 6.2 All workflow bodies' completion prompts: render the engine's position readout + the
      canonical next command verbatim (replacing hand-written next-step prose); audit each of
      the 15 bodies' handoff text once.
- [ ] 6.3 Residue sweep: grep bodies for the retired phrasings ("Proceed directly to",
      "Or /orbit:review --fresh for a lighter", "Ready to apply.", "Ready to archive.") and bare
      command-name recommendations.

## 7. Verification + docs

- [ ] 7.1 Fidelity tests updated for the new phrasings + position-readout markers; launcher
      and surface tests stay green.
- [ ] 7.2 Engine unit tests green incl. the archive-fixture suite; `npm test` fully green.
- [ ] 7.3 Refresh own surface (`npm run build && node bin/orbit.js update --force`); CLAUDE.md
      post-C1 state (baseline 12 capabilities; engine gate summary; next C2).
- [ ] 7.4 `node bin/orbit.js validate c1-engine-gates --strict` + `orbit status` on a live
      change shows the position readout.

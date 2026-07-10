# Tasks: explicit-lifecycle-consent

Order: engine/schema first (the declaration the bodies consume), then bodies, then the tripwire,
then the exit-criteria verification sweep. This change practices its own contract while being
built: every lifecycle transition is user-invoked.

## 1. Schema + engine (consent declaration and eligibility phrasing)

- [ ] 1.1 `GateSchema` (`src/core/artifact-graph/types.ts`) gains optional
      `consent: z.literal('user-invoked')`; parse/validation in `schema.ts` rejects other values
      naming the gate id and the single legal value; `gates[]` JSON carries the marker
- [ ] 1.2 `schemas/spec-driven/schema.yaml`: `consent: user-invoked` on `review-proposal` and
      `review-system`; version 2 → 3. `ChangeMetadataSchema` gains optional `schema_version`
      (int); `orbit new change` scaffold writes it from the loaded schema's version; round-trip
      test
- [ ] 1.3 Eligibility phrasing (`src/core/artifact-graph/gates.ts` + the status/instructions
      renderers registered via `src/cli/index.ts`): canonical-next renders under
      `Ready when you are:` (never `Next:`), appending ` — user-invoked` when the target phase's
      gate carries the consent marker; JSON field names unchanged
- [ ] 1.4 Tests: consent attribute parses/surfaces/rejects; consent does not alter gate state;
      v2-style schemas without `consent` behave byte-identically; readout label + marker
      rendering; NO imperative `Next:` in any engine output (grep-style assertion)

## 2. Workflow bodies (consent prompts + no-chaining echo)

- [ ] 2.1 `apply-change.ts`: consent step at entry — provenance check per
      `orbit-lifecycle-consent` (user-typed → no prompt; AI-mediated → AskUserQuestion with
      position readout + task-count write preview, Proceed/Abort; uncertain → treat as
      AI-mediated); emit docs gain `consent` field (constant across chunk emits)
- [ ] 2.2 `archive-change.ts`: consent step BEFORE Step 3.4 (same provenance rule; write preview
      = deltas/capabilities to sync + move); summary-shape docs + `ARCHIVE_SUMMARY_SCHEMA_REFERENCE`
      literal gain the `consent` field; abort writes no summary
- [ ] 2.3 `bulk-archive-change.ts`: per-change consent on AI-mediated arrival (user-typed bulk
      whose flow confirmed the batch = user-invoked for the set); note sync's consent inheritance
      in both archive bodies (no double-prompt)
- [ ] 2.4 `review.ts` + `onboard.ts` (line ~78 quotes the stock phrasings; `apply-change.ts`'s
      literal `Next:` completion line is covered by 2.5): final-assessment tables re-labeled
      to `Ready when you are:` with the ` — user-invoked` marker on apply/archive
      recommendations (per the orbit-review spec delta)
- [ ] 2.5 All 15 bodies: no-chaining contract as the FOURTH disciplines entry (echo of the new
      `orbit-conventions` requirement); completion sections render the engine readout verbatim
      (subtraction per design D7: remove hand-written next-step prose variants + any quoted
      imperative `Next:` phrasing)
- [ ] 2.6 Template parity hashes re-pinned; per-workflow fidelity tests updated (incl. a grep
      test: no body renders an imperative `Next:` label)

## 3. Audit tripwire

- [ ] 3.1 `audit-drift.ts` body: Category 4 gains the missing-consent-record check (WARNING;
      era boundary per design D6 — consent-aware schema version, timestamp fallback); wording
      names the emit path and the missing field
- [ ] 3.2 Test: post-era emit (change metadata `schema_version >= 3`) without `consent` →
      WARNING surfaced; regression: a REAL pre-D1 archive (`.openspec.yaml` with only
      `schema: spec-driven`, no `schema_version` — e.g. the C2 archive fixture) scans exempt

## 4. Verification sweep (arc D1 exit criteria) + surface refresh

- [ ] 4.1 Exit-criterion greps as tests: no `Next:` in engine output or generated bodies;
      user-typed path zero-prompt assertion (body text: prompt instruction is provenance-gated)
- [ ] 4.2 Full suite green (baseline 1608 + new coverage);
      `node bin/orbit.js validate explicit-lifecycle-consent --strict` passes;
      `orbit fingerprint explicit-lifecycle-consent --check` all verified
- [ ] 4.3 `npm run build && node bin/orbit.js update --force` — regenerate the local `.claude/`
      surface; spot-check one regenerated SKILL.md for the fourth discipline + consent step
- [ ] 4.4 Sync the D-arc doc (R-d-7): D1 state → in-change complete; status log entry. CLAUDE.md
      archive-time note: the execution-disciplines section gains the fourth discipline
      (no-chaining) when this change archives

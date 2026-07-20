# Tasks: d3-orientation

Order: the aggregation module first (the composition the surfaces render), then the CLI
surfaces, then the begin emit (spec + body), then docs, then the verification sweep against the
arc's two exit criteria. Every lifecycle transition is user-invoked; the R-d-9 handoff audit
runs by hand at the phase seams.

## 1. Orientation module (`src/core/orientation.ts`)

- [ ] 1.1 `collectOrientation(projectRoot)`: live-workstream enumeration (active changes minus
      archive; staging explores), per-change status via the existing
      `loadChangeContext`/`formatChangeStatus` path, stage states via
      `listArchitectureDocs`/`computeStageStates`, trail recency via `parseTsToken` merge-sort
      across the four locations — pure composition, NO artifact-content inference (the spec's
      no-live-inference scenario)
- [ ] 1.2 Continuity predicate + degradation ladder: live-workstream anchor; archived/
      architecture/project trails never anchor; emit-less workstream fallback (metadata
      `created`, name tiebreak); zero-live → full view; zero-everything → existing no-changes
      message
- [ ] 1.3 Waiting derivation (CLOSED set): quiescent-awaiting-ratification stages;
      `awaiting_findings: true` T0 emits with no later `external-<as>-*.md` in the same trail;
      unpassed/stale gates on live changes with engine reasons
- [ ] 1.4 Unit tests (`test/core/orientation.test.ts`): predicate incl. the archive-emit edge
      (the D-d3-4 motivating case) and the emit-less fallback; waiting set incl. the
      awaiting-findings match rule; degradation ladder all four rungs; fixture workspaces

## 2. CLI surfaces

- [ ] 2.1 `status.ts` bare branch: replace the "Missing required option --change" throw with
      the sprint view; sprint strip renderer (explore chip rules; `review ⟲N` iteration counts
      from trail; `apply ▶ x/y` from the tracked gate; stage tag when cited); `last` (first
      sentence, ~160-char cap) + `next` (engine `next_command` for changes; recorded
      `next_recommended` for explores) + one `also` line. No-changes message and `--change`
      output byte-identical (regression-asserted)
- [ ] 2.2 `--full` flag (`src/cli/index.ts` + `status.ts`): PROGRAM band (stage lines incl.
      legacy/malformed listings), workstreams nested by citation (uncited → `standalone`),
      LAST + WAITING bands; flat-fleet degradation with zero parseable docs
- [ ] 2.3 `--json` both tiers: bare `{sprint, last, next, also, waiting}` embedding the
      existing change-status payload; full `{program, workstreams, last, waiting}` reusing the
      architecture bucket shapes; untruncated `final_assessment` in JSON
- [ ] 2.4 CLI tests (`test/commands/`): bare/mid-sprint render; error-path-claimed regression
      (bare exit 0 with changes; `--change` and no-changes unchanged — the regression asserts
      the scoped `orbit-engine-gates` contract: gate rows + gates[] markers remain on the
      `--change` form); `--full` nesting + flat-fleet; JSON shapes; eligibility framing (no
      imperative labels — grep, the D1 rule; the `Ready when you are:` literal capitalized)

## 3. Explore BEGIN emit

- [ ] 3.1 `explore.ts` body: Mode B/C scaffolding fires the begin emit immediately after
      scaffold + metadata — MODE-AWARE per the delta (Mode B: zero counts + the Early canonical
      recommendation; Mode C: back-filled counts + maturity-consistent recommendation — the
      crystallization's first emit IS the begin emit); citation decision recorded; resume of a
      pre-D3 emit-less staging dir does NOT retro-fire (add-only, next boundary covers it)
- [ ] 3.2 Generated-surface fidelity markers for the begin-emit instruction (surface e2e test);
      parity hashes re-pinned for the edited explore template

## 4. Docs + retirement (exit criterion 2)

- [ ] 4.1 CLAUDE.md cold-start pointer (apply-seam, the D2 precedent): one sentence in the
      D-arc section — `orbit status` bare = current sprint, `--full` = arc view
- [ ] 4.2 Retirement record: close issue #3 (absorbed); note `~/code/orbit-status` retired in
      the arc status log at archive (the R-d-4 subtraction: bash+jq binary, filesystem position
      inference, `/opsx:status`, `jq` dependency — engine-native now). The external repo's own
      retirement marker is the user's action; record the pointer, don't reach outside the repo

## 5. Verification sweep (arc §d3-orientation exit criteria)

- [ ] 5.1 Cold-start test as a real test where mechanical: fixture workspace with several
      active changes → ONE `orbit status --json` answers position/last/next per workstream
      with no artifact reads (assert the module's fs access stays within trail/metadata/
      engine paths); CLAUDE.md names the command (grep)
- [ ] 5.2 Full suite green (baseline 1712 + new coverage); `orbit validate d3-orientation
      --strict` passes; `orbit fingerprint d3-orientation --check` all verified
- [ ] 5.3 `npm run build && node bin/orbit.js update --force`; spot-check the explore SKILL's
      begin-emit instruction on disk; surface count unchanged (16 — the no-slash-surface
      scenario)
- [ ] 5.4 Arc sync (R-d-7): status-log entry; R-d-9 handoff audit at the post-apply seam.
      Archive-time notes: CLAUDE.md D3 completion entry; baseline 16 → 17

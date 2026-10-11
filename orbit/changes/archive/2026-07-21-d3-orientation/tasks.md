# Tasks: d3-orientation

Order: the aggregation module first (the composition the surfaces render), then the CLI
surfaces, then the begin emit (spec + body), then docs, then the verification sweep against the
arc's two exit criteria. Every lifecycle transition is user-invoked; the R-d-9 handoff audit
runs by hand at the phase seams.

## 1. Orientation module (`src/core/orientation.ts`)

- [x] 1.1 `collectOrientation(projectRoot)`: live-workstream enumeration (active changes minus
      archive; staging explores), per-change status via the existing
      `loadChangeContext`/`formatChangeStatus` path, stage states via
      `listArchitectureDocs`/`computeStageStates`, trail recency via `parseTsToken` merge-sort
      across the four locations PLUS archived changes' relocated trails
      (`orbit/changes/archive/*/.orbit-runs/` — global-LAST sourcing ONLY, never
      live-workstream enumeration or sprint anchoring) — pure composition, NO artifact-content
      inference (the spec's no-live-inference scenario)
- [x] 1.2 Continuity predicate + degradation ladder: live-workstream anchor; archived/
      architecture/project trails never anchor; equal-`<TS>` tie-break (workstream name, then
      full filename — shared by sprint anchoring and global LAST); emit-less workstream
      fallback (metadata `created`, name tiebreak); zero-live → full view; zero-everything →
      existing no-changes message
- [x] 1.3 Waiting derivation (CLOSED set): quiescent-awaiting-ratification stages;
      outstanding externals COUNT-BASED per change+mode (#T0 − #returned; `N packaged, M
      returned`; spine-invalid emits excluded from both counts); unpassed/stale gates on live
      changes with engine reasons
- [x] 1.4 Unit tests (`test/core/orientation.test.ts`): predicate incl. the archive-emit edge
      (the D-d3-4 motivating case — assert BOTH halves: no sprint anchor AND the archive emit
      surfacing in global LAST) and the emit-less fallback; same-second `<TS>` ties (sprint
      anchoring and global LAST); waiting set incl. the
      count-based concurrent-handoff case (2 packaged / 1 returned); FAULT ISOLATION fixtures
      (corrupt newest emit → older-valid fallback, deterministic; SPINE-INVALID newest emit —
      parseable JSON missing `final_assessment` — skipped like invalid JSON and excluded from
      WAITING counts; one broken workstream → degraded row, healthy rows intact, exit 0);
      degradation ladder all rungs; fixture workspaces

## 2. CLI surfaces

- [x] 2.1 `status.ts` bare branch: replace the "Missing required option --change" throw with
      the sprint view; sprint strip renderer (explore chip rules; `review ⟲N` iteration counts
      from the trail's SPINE-VALID review emits; `apply ▶ x/y` from the tracked gate; stage
      tag when cited); `last` (first
      sentence, ~160-char cap) + `next` (engine `next_command` for changes; recorded
      `next_recommended` for explores) + one `also` line. No-changes message and `--change`
      output byte-identical (regression-asserted)
- [x] 2.2 `--full` flag (`src/cli/index.ts` + `status.ts`): PROGRAM band (stage lines incl.
      legacy/malformed listings), workstreams nested by citation (uncited → `standalone`),
      EVERY workstream entry carrying its full orientation tuple (strip/position + own `last` +
      own `next` — the cold-start criterion tier; SOLE exception: degraded workstreams render
      the degraded row + trustworthy fields), LAST (incl. archived-trail sourcing) + WAITING
      bands; flat-fleet degradation with zero parseable docs (entries still carry the full
      tuple)
- [x] 2.3 `--json` both tiers: the SHARED discriminated workstream-entry shape (healthy
      `{name, kind, stage?, strip, position, last, next, status?}`, keys CLOSED;
      `kind` change|explore — change carries the per-change payload NESTED under
      `status` (gate state at `status.gates`, the single source — no entry-level gates key),
      explore has no `status` and
      `position: "exploring"`; degraded `{name, kind, degraded: true, error}` + trustworthy
      fields; absent fields omitted, never null; `strip` = ordered chip array
      `{phase, glyph, detail?}` per the closed glyph mapping — text render derived, never a
      pre-rendered string in JSON); bare `{sprint, last, next, also, waiting}`
      with `sprint` one such entry; full `{program, workstreams, last, waiting}` reusing the
      architecture bucket shapes; untruncated `final_assessment` in JSON
- [x] 2.4 CLI tests (`test/commands/`): bare/mid-sprint render; error-path-claimed regression
      (bare exit 0 with changes; `--change` and no-changes unchanged — the regression asserts
      the scoped `orbit-engine-gates` contract: gate rows + gates[] markers remain on the
      `--change` form); `--full` nesting + flat-fleet; JSON shapes incl. the explore-sprint
      variant and the degraded variant in both tiers; degraded-SPRINT bare render (degraded
      row in place of the strip, trustworthy `last`, exit 0); eligibility framing (no
      imperative labels — grep, the D1 rule; the `Ready when you are:` literal capitalized)

## 3. Explore BEGIN emit

- [x] 3.1 `explore.ts` body: Mode B/C scaffolding fires the begin emit immediately after
      scaffold + metadata — MODE-AWARE per the delta (Mode B: zero counts + the Early canonical
      recommendation; Mode C: back-filled counts + maturity-consistent recommendation — the
      crystallization's first emit IS the begin emit); citation decision recorded; same-second
      boundary emit bumps its token forward one second (lexical begin-before-boundary order);
      resume of a pre-D3 emit-less staging dir does NOT retro-fire (add-only, next boundary
      covers it)
- [x] 3.2 Generated-surface fidelity markers for the begin-emit instruction (surface e2e test);
      parity hashes re-pinned for the edited explore template

## 4. Docs + retirement (exit criterion 2)

- [x] 4.1 CLAUDE.md cold-start pointer (apply-seam, the D2 precedent): one sentence in the
      D-arc section — `orbit status` bare = current sprint, `--full` = arc view
- [x] 4.2 Retirement record: close issue #3 (absorbed); note `~/code/orbit-status` retired in
      the arc status log at archive (the R-d-4 subtraction: bash+jq binary, filesystem position
      inference, `/opsx:status`, `jq` dependency — engine-native now). The external repo's own
      retirement marker is the user's action; record the pointer, don't reach outside the repo
- [x] 4.3 `orbit-architect` genre-citation delta rides the archive sync (no code/template
      change — verified at proposal time no generated body carries the stale phrase); at apply,
      re-grep `src/core/templates/` for "named-mode-explore emit-timing genre" to confirm it
      stays spec-only

## 5. Verification sweep (arc §d3-orientation exit criteria)

- [x] 5.1 Cold-start test as a real test where mechanical: fixture workspace with several
      active changes → ONE `orbit status --full --json` answers position/last/next PER
      WORKSTREAM (multi-change text + JSON assertions on every entry's tuple — the
      criterion-satisfying tier per the spec; healthy entries assert the shared shape, a
      degraded fixture entry asserts the degraded variant carries no fabricated tuple) with no
      artifact reads (assert the module's fs access stays within trail/metadata/engine paths
      AND is read-only — the surface creates and modifies no files);
      CLAUDE.md names the command (grep)
- [x] 5.2 Full suite green (baseline 1712 + new coverage); `orbit validate d3-orientation
      --strict` passes; `orbit fingerprint d3-orientation --check` all verified
- [x] 5.3 `npm run build && node bin/orbit.js update --force`; spot-check the explore SKILL's
      begin-emit instruction on disk; surface count unchanged (16 — the no-slash-surface
      scenario)
- [x] 5.4 Arc sync (R-d-7): status-log entry; R-d-9 handoff audit at the post-apply seam.
      Archive-time notes: CLAUDE.md D3 completion entry; baseline 16 → 17

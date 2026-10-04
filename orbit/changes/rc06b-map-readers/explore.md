> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: rc06b-map-readers

## Premise

rc06b's charter (`orbit/architecture/clean-up-review-cycle.md`, Stage rc06b-map-readers, split from rc06 by
D-rc06-6): verify-change's Scenario Coverage step stops tracing scenarios to tests by prose and reads rc06a's
surface (`orbit status --change <name> --scenarios`), reporting UNCOVERED scenarios as verify findings; system
review's Pass 0, which runs verify-change, therefore consumes the map rather than rebuilding it. Neither records a
copy. Exits: (1) the verify body's coverage step names the surface and carries no prose-tracing instruction; (2) a
system review's Pass 0 consumes the map rather than rebuilding it. Rider (rc06a's readiness record): an UNKEYABLE key
renders ORPHAN on the surface and nothing pins that; how a reader presents it beside the MALFORMED `unkeyable` spec
lines is this stage's call.

Measured 2026-10-04, before any decision:

- **The surface has no body reader yet.** No workflow template names `--scenarios`. Its owner,
  `orbit-scenario-map`'s `The scenario map is engine-computed at one read surface`, already lists verify-change's
  Scenario Coverage step and system Pass 0 (through verify) as its consumers.
- **The prose-tracing line is in verify's UPSTREAM portion**, step 6: "Check if tests exist covering the scenario …
  Add WARNING: Scenario not covered". That portion is still byte-pristine against `upstream/v1.3.1` after the rename.
  The same bullet's first check, "Check if conditions are handled in code", is implementation tracing, not test
  tracing.
- **A standing requirement forbids new verify behaviour.** `orbit-run-summary-emit`'s `Emit-layer wraps upstream
  skills without modifying them`: `/orbit:verify` "SHALL NOT gain … other behaviors that change what verify itself
  does", and orbit additions "MUST NOT modify the upstream-authored body above the additions marker". Its scenario
  pins a cherry-pick that replaces the upstream portion wholesale. Precedent the other way: apply-change's upstream
  portion carries ~25 edited lines (e.g. the engine-computed next step); archive, propose and explore carry ~4 each.
- **Post-apply, nothing reads validate's ERROR.** `orbit validate` is run by proposal review's Pass 1 only (and the
  CLI `orbit archive`); system mode never runs it. An undeclared delta scenario becomes ERROR once `apply` passes
  (D-rc06-12), so Pass 0 through verify is the only post-apply reader of that state in the agent-driven flow.
- **Pass 0 already grades an uncovered scenario as WARNING** (`orbit-review`'s `Pass 0 delegates to upstream
  verify-change`), as its folded finding's author.
- **No capability owns verify-change.** The charter's touch list says "either gains one or rides orbit-review —
  measured at propose".

## Mechanism

### D-rc06b-2 — verify's Scenario Coverage step reads the surface and reports by a closed table
Domain: every state `orbit status --change <name> --scenarios --json` can return, per its owner `orbit-scenario-map`'s `The scenario map is engine-computed at one read surface`
| member | covered by |
|---|---|
| the command fails (non-zero exit, unparseable output) | one note naming the error; the check is listed as skipped, per the body's Graceful Degradation ("Always note which checks were skipped and why") |
| `check: "off"` | one note — scenario coverage not checked, `scenario_map:` absent from `orbit/config.yaml`; no per-scenario finding and no prose tracing |
| `check: "on"`, `scenarios` empty | one note — the change has no delta scenarios |
| a scenario with `uncovered: true` | WARNING `Scenario not covered: <capability> :: <requirement> :: <scenario>`; recommendation: add a `@scenario` tag above the test that exercises it, or a ledger entry |
| a scenario with any declaration (`behaviour`, `text`, `observed`, `untestable`) | no finding; the kinds it carries are listed as the surface gives them, never summed and never re-graded |
| an `orphans` entry, source tag or ledger, whose key equals the joined triple of a `malformed` spec entry (`reason: "unkeyable"`) | reported UNDER that spec entry, one finding (the rider; the repeated-title case, Case 1) |
| any other `orphans` entry | WARNING naming the tag's file and line or the ledger index, and the key |
| a `malformed` entry, source spec (`unkeyable`) | WARNING naming the title; the finding states that `orbit validate` reports it at ERROR (the level is `orbit-scenario-map`'s, named, never restated) and that the title must be renamed |
| a `malformed` entry, source tag, ledger or ledger-file | WARNING naming the line or index and the surface's `reason` |
| `counts` | printed as counts; the scorecard's Correctness cell carries no scenario ratio |
| `counts.baseline_undeclared` | reported as a count, never a finding (D-rc06-7) |
Closure: SOURCED — the surface's JSON shape, field by field, plus the one state outside it (the command failing)
Moves:
- READ: applied — the JSON shape read in `orbit-scenario-map`'s surface requirement; `splitKey`/`joinKey` read in `src/core/scenario-map.ts`; the upstream step 6 and Graceful Degradation read in `src/core/templates/workflows/verify-change.ts`
- ENUMERATE: applied — this table, one row per state of each top-level field plus the command failing; the rider's pairing row was found by executing the key splitter, not by reading the rider (Case 1)
- COHERE: applied — UNCOVERED at WARNING is the grade `orbit-review`'s Pass 0 scenario already gives a folded uncovered scenario, so Pass 0 consumes verify's finding with no re-grade; validate's ERROR for an unkeyable title is a LEVEL that verify names in its finding text, not a second grade
- EXECUTE: applied — `splitKey` on both unkeyable shapes (Case 1): the separator case is MALFORMED and has no key to pair on, the repeated case is an exact string match
- FALSIFY: applied — the reader judges nothing the engine computed: a `text`-only scenario is never reported uncovered; what this cannot catch is a tag that names a scenario its test does not assert, which stays the kind word's limit (D-rc06-1)
- CONFORM: applied — R-crc-13 (the surface reports; verify reports what it read); R-crc-14 (the body names fields and points at the shape's owner); R-crc-11(h) (counts, never a ratio); R-crc-10 (a declaration is the author's record, not re-graded)
- FEASIBILITY: applied — one CLI call per verify run
- CONSUME: applied — Pass 0 folds verify's findings into Correctness under its existing mapping; the verify emit records UNCOVERED through `fail_mode: "warnings"` with `warnings_count`, never `scenarios-fail`, which `orbit-run-summary-emit` reserves for failing scenarios
- INVOKE: applied — runs on every `/orbit:verify` and on every system Pass 0 that runs (D-rc06b-6)

### D-rc06b-6 — every Pass 0 reader reads the surface, and the review body restates nothing
Domain: every place a review performs verify-change's check, across the review body's three modes, three reviewer classes and two pass genres
| member | covered by |
|---|---|
| standalone `/orbit:verify <name>` | the verify body's step 6 (D-rc06b-2) |
| system Pass 0, in-context or fresh, REVIEW genre | invokes `/orbit:verify`, so reads step 6; the review body gains no coverage text |
| system Pass 0 under `--skip-verify` | not run; the existing skip note stands |
| system `--fast` | Pass 0 runs, so step 6 runs |
| an in-context VERIFICATION-genre system pass | Pass 0 not run (`orbit-review`'s verification-pass requirement) |
| an external system pass, the prompt's item 0 ("verify-change-style structural check") | the item names `orbit status --change <name> --scenarios` as the spec-coverage source; an external without the CLI reports the check not run |
| proposal mode | no Pass 0; `orbit validate` reports undeclared scenarios at INFO (D-rc06-12) |
| architecture mode | no Pass 0 |
Closure: SOURCED — the pass tables in the review body (`src/core/templates/workflows/review.ts`) and its external prompt template, for each mode, class and genre
Moves:
- READ: applied — Pass 0's definition and the skip, fast and VERIFICATION-genre rules read in the review body; the external prompt's item 0 read at its line
- ENUMERATE: applied — this table; the external item 0 was missing from `orbit-scenario-map`'s consumer list, which names system Pass 0 only "through verify"
- COHERE: applied — the external item is still "system review Pass 0", so the consumer list's wording covers it; the brief rule (`orbit-conventions`' `Review mode decision framework`) forbids findings, prior passes and trail paths, and the surface reads specs, the ledger and tests only
- EXECUTE: not applied — no reader exists yet
- FALSIFY: applied — leaving the external on prose would leave exactly the costliest reviewer tracing what the engine computes, the G2 failure the stage exists for
- CONFORM: applied — R-crc-14 (one statement, in the new capability; the review body points through its existing invocation); rc03b's brief rule
- FEASIBILITY: applied — one line in the prompt template
- CONSUME: applied — the external's findings fold like any external finding; nothing in the gate reads coverage
- INVOKE: applied — fires whenever a system review runs Pass 0 or its external equivalent

### Case 1 — the two unkeyable shapes, executed
`node -e` over `dist/core/scenario-map.js`, 2026-10-04: `splitKey('orbit-x :: Req :: a :: b')` → `null` (a title containing ` :: ` yields a key of four parts; the tag is MALFORMED, never ORPHAN); `splitKey('orbit-x :: Req :: Same title')` → three parts (a title repeated within its requirement keys normally and, being excluded from the resolvable set, renders ORPHAN). The rider's premise holds for the second shape only.

## Decisions

- **2026-10-04 — D-rc06b-1: verify's test-tracing line is replaced IN PLACE, and the wrapper requirement is narrowed** *(settled under R-crc-3; Sal: settle)*.
  Step 6's "Check if tests exist covering the scenario" in verify's upstream portion is replaced by a read of the
  surface (D-rc06b-2); "Check if conditions are handled in code" stays — it traces implementation, not tests.
  `orbit-run-summary-emit`'s `Emit-layer wraps upstream skills without modifying them` is MODIFIED so its SHALL
  governs the EMIT LAYER (which still never changes what a command does) and an upstream portion changes only
  through a change whose delta names the edit. Why: one coverage instruction rather than an upstream one and an
  overriding one that contradict each other — an AI handed two instructions for one step follows either; apply's
  upstream portion already carries ~25 edited lines, so "pristine" was never the whole-fork rule; the cost, a
  merge rather than a wholesale replace on a future cherry-pick of verify, is a deliberate act per this repo's
  upstream policy anyway. Revises the charter's touch list (a new capability, D-rc06b-7).
  CORRECTED 2026-10-04 at propose (a READ miss in this exploration): the rule is stated TWICE — also in
  `orbit-conventions`' `Generated-file disposition` ("the upstream-authored portion … is left intact"), its OWNER.
  Under R-crc-14 that requirement is MODIFIED to carry the narrowed rule once (an upstream portion changes only
  through a change whose delta names the edit), and the wrapper requirement narrows to the emit layer and POINTS at
  it rather than restating it. A still stands: the owner's rule is already false in fact for apply.
  Kind: scope
- **2026-10-04 — D-rc06b-2: verify's Scenario Coverage step reads the surface and reports by a closed table** *(settled under R-crc-3)*.
  Check OFF says "not checked" and does NOT fall back to prose: a mechanical "not configured" is honest, and the
  prose check it replaces matched 1 of 34 scenario titles on rc07b's record. UNCOVERED, ORPHAN and MALFORMED are
  WARNINGs; a declared scenario of any kind raises nothing.
  Kind: rule
- **2026-10-04 — D-rc06b-3: Pass 0 folds verify's coverage findings as WARNING and composes no block** *(settled under R-crc-3)*.
  The ladder grades by consequence: an undeclared scenario means an implementation could diverge untested
  (WARNING); `orbit validate`'s post-apply ERROR is a LEVEL its owner reports, and Pass 0 does not run validate.
  `orbit-review` carries no delta: its Pass 0 scenario already grades an uncovered scenario WARNING and already
  invokes verify, which is exit (2) — measured at propose by reading the invocation, not by new text.
  Kind: scope
- **2026-10-04 — D-rc06b-4: the rider's premise holds for one of its two shapes** — a title containing ` :: ` makes a tag MALFORMED, never ORPHAN; a repeated title makes it ORPHAN (Case 1, executed).
  Kind: fact
- **2026-10-04 — D-rc06b-5: the rider is answered in the READER, and the engine's behaviour is pinned by a test, not a spec delta** *(settled under R-crc-3)*.
  Verify presents an ORPHAN whose key equals an unkeyable spec entry's joined triple under that entry (D-rc06b-2's
  pairing row). The surface stays as it is (R-crc-13 — it reports; pairing is interpretation, and is the reader's
  by the rider's own terms). A behaviour test pinning both unkeyable shapes is tagged to `orbit-scenario-map`'s
  existing scenario `A tag naming no scenario is an orphan` (and the separator case to `A near-miss tag is
  malformed, never ignored`), so the pin adds no capability.
  Kind: scope
- **2026-10-04 — D-rc06b-6: every Pass 0 reader reads the surface, and the review body restates nothing** *(settled under R-crc-3)*.
  Includes the external prompt's item 0 — an external system pass is a system review's Pass 0, which exit (2)
  covers as written.
  Kind: rule
- **2026-10-04 — D-rc06b-7: two capabilities — `orbit-verify-modifications` ADDED, `orbit-run-summary-emit` MODIFIED** *(settled under R-crc-3)*.
  The new capability follows the `orbit-*-modifications` naming and owns D-rc06b-2 and D-rc06b-6 (both readers'
  rule, stated once); `orbit-review` and `orbit-scenario-map` carry no delta. Under R-crc-1's ceiling of three.
  Baseline capabilities would move 22 → 23. Re-measured at propose.
  CORRECTED 2026-10-04 at propose: THREE capabilities — `orbit-conventions` MODIFIED too (D-rc06b-1's correction),
  AT R-crc-1's ceiling. The external prompt's item 0 is owned by no spec (`orbit-review-external`'s template leaves
  the pass list a placeholder), so it adds none.
  Kind: scope
- **2026-10-04 — D-rc06b-8: the post-apply stop on an undeclared scenario is rc10's, not this change's** (Sal, at propose: Q-rc06b-1 resolved — hand it to rc10).
  After apply, `orbit validate` reports an undeclared delta scenario at ERROR, but only the CLI `orbit archive`
  runs validate; the agent-driven archive moves with `mv`, so the agent flow sees the state only as Pass 0's
  WARNING and nothing stops on it. Stopping is a pre-archive condition — rc10-apply-closure's charter. This change
  names it in its readiness record as a residual and proposes it to rc10 as a rider at archive; no artifact here
  acts on it.
  Kind: scope

## Open questions

## Considered & out

- **2026-10-04 — B: an orbit-additions section overriding step 6, upstream portion untouched.** Out: two
  instructions for one step that contradict each other, and exit (1)'s "no prose-tracing instruction" stays false.
- **2026-10-04 — C: Pass 0 reads the surface itself, verify left pristine.** Out: fails exit (1); standalone
  `/orbit:verify` keeps tracing by prose; two readers would state one rule.
- **2026-10-04 — prose fallback when the check is OFF.** Out: it keeps the instruction exit (1) removes and reports
  a guess where "not checked" is the truth.
- **2026-10-04 — Pass 0 composes post-apply UNCOVERED into `blocks`.** Out: Pass 0 does not run validate; a block
  composed by a reader from a level it did not read is a second statement of D-rc06-12 (Q-rc06b-1 carries the stop).
- **2026-10-04 — pairing ORPHAN with unkeyable entries IN the surface.** Out: interpretation in the reporting
  layer (R-crc-13), a delta to `orbit-scenario-map`, and the separator shape has no key to pair on anyway.

## References

- `orbit/changes/archive/2026-10-04-rc06a-scenario-map/explore.md` — the parent rc06 exploration (D-rc06-1..12)
- `orbit/specs/orbit-scenario-map/spec.md` — the surface and its JSON shape
- `orbit/specs/orbit-run-summary-emit/spec.md` — `Emit-layer wraps upstream skills without modifying them`
- `orbit/specs/orbit-review/spec.md` — `Pass 0 delegates to upstream verify-change`
- `src/core/templates/workflows/verify-change.ts` — step 6; `src/core/templates/workflows/review.ts` — Pass 0, external item 0
- `src/core/scenario-map.ts` — `splitKey`, `joinKey`, orphan computation

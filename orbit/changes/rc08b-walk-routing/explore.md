> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: rc08b-walk-routing

## Premise

rc08b is the second child of the split parent `rc08-walk-completeness` (D-rc08-1). Its charter
(`clean-up-review-cycle.md`, Stage rc08b) names six jobs, each about the walk's CONSUMER side — what a
walk picks up, and where a finding goes when the walk must not close it:

1. **Discovery.** A bare `/orbit:address-reviews` with exactly one active change resolves to that change
   and says so, and walks EVERY outstanding pass through the gate's own `passResolved`.
2. **R-crc-6's three lanes.** REPAIR / DESCOPE / REDESIGN, with a REDESIGN routed to `/orbit:explore`
   and the routing recorded on the log.
3. **Disagreement** (D-rc03-6): the two halves of one pair contradict each other on one site. The walk
   settles it with one cheap empirical test and records the test on the log.
4. **The T0 next line** (Q-rc03-5, D-rc03-16): the review-external T0 `next_recommended` ends at
   "save the response as …", and the eligibility line owns what follows.
5. **The remainder of rc08's job (3).** Does a walk need an edit-level record certifying that each
   intended edit happened? Decided here.
6. **Rider** (rc08a system walk 2, external W5, Sal: B): `orbit-engine-gates`' `Reviewed-gate pass
   condition` says "the emit surface validates the payload KEY and none of the entry shapes". That
   became false when rc08a added the walk write gate, so the sentence becomes a pointer to
   `orbit-emit-composition`'s `The walk write gate checks sweep evidence`.

Exit criteria: (1) a bare walk with one active change and two unwalked passes walks both, naming the
change; (2) the body implements the three lanes, a REDESIGN routes to explore, and the log records the
routing; (3) the T0 emit's `next_recommended` names no walk command.

**What the code says today (READ, 2026-10-05).**
- A bare invocation is a whole-repo `@review:` marker scan. Auto-discovery fires only with a
  change-name positional and zero markers, and then picks the SINGLE most-recent `review-<mode>-*.json`
  or `audit-drift-*.json` by `<TS>`. External `external-<mode>-*.md` returns are never auto-discovered:
  they enter only through `--from-file` (address-reviews body, Step 1 and `references/resolution-detail.md`).
- `passResolved` (`gates.ts:183`) is module-private. The convergence loop (`gates.ts:458-470`) RETURNS ON
  THE FIRST unresolved pass. Its `unresolvedPass` is internal: `GateStatus` (`gates.ts:25-68`)
  exposes only the prose `reason`, and no spec names the field. No engine surface lists outstanding
  passes, not even one, except as a token inside a sentence.
- `TrailResolution.sourcePath` is singular (`trail.ts:73`). This is D-rc13-3's original blocker: "a
  merged walk cannot be recorded until `sourcePath` becomes a SET". Practice since rc04c avoids it by
  writing ONE LOG PER PASS, in token order.
- A substantive entry with disposition `deferred` or `escalated` keeps its pass unresolved
  (`gates.ts:207-210`). A finding the walk will not close therefore holds the gate, which is honest
  under R-crc-13.
- **Vocabulary collision.** Walk logs already carry `lane` with values `obvious-fix` / `decision` /
  `stale` (D4's PROCESS lanes: how a finding is conducted). Measured on logs since 2026-09-14: 117 /
  30 / 4, plus `classification` with `trivial fix` / `decision required` / `stale` / `unresolvable`.
  R-crc-6's lanes are a different axis, what the resolution DOES. They appear on the trail only as
  prose: "Descope (option B)…", "DESCOPED TO rc13b", "Repair, not redesign". No field carries them.
- The re-entry table already has the REDESIGN route's landing cell. `/orbit:explore <name>` with an
  active change and no staging directory resumes in place against `orbit/changes/<name>/explore.md`,
  or creates it beside the artifacts.
- The T0 line is composed at `src/core/emit-composition.ts:1901`. Its owner is `orbit-run-summary-emit`'s
  `Review-external T0 multi-step recommendation` (spec lines 461-483).

## Mechanism

### D-rc08b-1 — one invocation walks every outstanding pass, writing one log per pass
Domain: the shapes of outstanding work one change-scoped walk can face
| member | covered by |
|---|---|
| one outstanding pass | one log, as today |
| two or more outstanding passes, same mode (a blind pair's halves) | one log per pass in token order; a converged finding in a later log is stale-with-evidence naming the earlier log |
| outstanding passes on two modes | one log per pass in token order; each log's `source_path` names its own pass |
| an outstanding pass that is internal JSON | `source_path` = the `review-<mode>-<TS>.json` path |
| an outstanding pass that is an external return | `source_path` = the `external-<mode>-<TS>.md` path; external returns join discovery here |
| an interrupted walk after log k of n | logs 1..k are on the trail and the gate reads them; the rest stay outstanding and the next invocation rediscovers them |
Closure: DERIVED — a pass is internal or external and belongs to one mode; the count is one or more; an interruption falls between logs or inside one, and the inside case is today's partial-log behaviour
Moves:
- READ: applied — `recordsFor` matches a record to a pass by the basename of a singular `sourcePath` (`gates.ts:171-177`, `trail.ts:73`); one log per pass satisfies it unchanged
- ENUMERATE: applied — this table, over count × genre × mode, plus the interruption point
- COHERE: applied — triage runs once across every discovered pass (the found-by-both / one-half-only / contradictory split D-rc13-3 wanted) and writes per pass; the split is a triage RENDERING, never a stored merged record, so it cannot disagree with the per-pass logs
- EXECUTE: applied — rc04c through rc08a each ran two logs on one pair by hand; the gate read both halves resolved each time (six COMPUTED PASSED gates)
- FALSIFY: applied — a merged log would need `sourcePath` as a set, changing the trail reader and the gate; that is the cost this rule avoids, and D-rc13-3's "ships with that or not at all" is lifted on that measured ground
- CONFORM: applied — R-crc-13 (the gate reads what it reads; nothing new is ruled), R-crc-14 (stale-with-evidence names the earlier log and never restates its resolution)
- FEASIBILITY: applied — the walk logs now written per pair (two) are the expected n; no limit is needed
- CONSUME: applied — the gate (`passResolved`) and the VERIFICATION pass (`verified_walks` over the walks of a mode) both read per-pass logs today
- INVOKE: applied — fires whenever discovery (D-rc08b-3) yields more than one pass

### D-rc08b-2 — the outstanding-pass list is the gate's, exposed in status JSON
Domain: the states a reviewed gate can be in when discovery reads it
| member | covered by |
|---|---|
| blocked (requires unmet) | no resolution computed (`gates.ts:587-611`); the field is absent; discovery walks nothing from this gate and says so; `--from-file` reaches its passes |
| superseded (its `before` phase ran) | discovery skips it; `--from-file` reaches its passes |
| not blocked, every pass resolved | `unresolvedPasses: []` |
| not blocked, one or more unresolved | `unresolvedPasses` lists EVERY one in token order, each `{token, file, mode, source}`; `reason` still names the first, so no rendering changes |
| not blocked, blind pair open | `openPair: {missing}` exposed beside the list (today it lives only in the `reason` prose) |
| stale passes | included, as the gate includes them (`gates.ts:457`); pushback finds their findings stale-with-evidence |
Closure: SOURCED — the gate's state branches in `computeGateStates` (blocked / tracked / reviewed), plus `superseded` set after computation (`gates.ts:664-670`)
Moves:
- READ: applied — the loop returns on the first unresolved pass (`gates.ts:458-470`); `GateStatus` carries no pass field (`gates.ts:25-68`); rows map field by field into the status JSON (`instruction-loader.ts:419`)
- ENUMERATE: applied — this table, over the gate's own branches
- COHERE: applied — `reason`, `unresolvedPasses[0]` and the canonical next all derive from one ordered loop, so the first entry is the pass the reason names
- EXECUTE: not applied — no code yet; the proposal's tests exercise the six rows
- FALSIFY: applied — a private body rule ("newest by TS") would let a walk report success while the gate stays unsatisfied; one predicate with two readers removes that class
- CONFORM: applied — R-crc-13 (the gate REPORTS a list; it rules nothing new), R-crc-10 (an engine-observable fact, so a CHECK-grade read, not a record)
- FEASIBILITY: applied — collecting instead of returning is the same pass count; resolution is already computed for each pass
- CONSUME: applied — discovery (D-rc08b-3) is the one new reader; existing readers of `reason`/`nextCommand` see no change
- INVOKE: applied — computed on every `orbit status --change <name>`, which the body already runs at Step 1

### D-rc08b-3 — discovery's domain
Domain: the invocation shapes of `/orbit:address-reviews`
| member | covered by |
|---|---|
| bare, zero active changes | whole-repo marker scan (unchanged) |
| bare, exactly one active change | resolves to that change, SAYS SO in the triage header, then proceeds as the change-name positional |
| bare, two or more active changes | whole-repo marker scan, and names the active changes so the user can aim it |
| change-name positional (active) | walks the UNION of in-scope markers and every pass in the non-superseded reviewed gates' `unresolvedPasses` |
| change-name positional, a gate reports `openPair` | stops before triage, names the missing member and the gate's next command; walks nothing (the gate says run it BEFORE walking) |
| change-name positional (archived) | markers only; status cannot address an archived change (Q-crc-26), so passes need `--from-file` |
| path/pattern positional | markers only (unchanged) |
| `--from-file <path>` | the file only; exclusive override (unchanged) |
| audit-drift JSON in the change trail | STAYS in discovery: every `audit-drift-*.json` whose basename no walk log's `source_path` names is walked, one log per file (the basename key `recordsFor` uses); it is not a gate pass, so the body reads the trail for it (amended at propose, 2026-10-05) |
| a review emit's own next line, `/orbit:address-reviews <change> --from-file <own path>` | an explicit aim: exclusive, as `--from-file` always is, so it bypasses discovery and the `openPair` stop; the line is `orbit-review`'s and stays unchanged (a fourth capability); named as a residual, the eligibility line on that turn naming the missing member |
Closure: DERIVED — the positional is absent / change (active or archived) / path; `--from-file` is present or not; the active-change count is 0 / 1 / many; `openPair` is set or not
Moves:
- READ: applied — today's resolution order and the "auto-discovery never fires for bare invocation" rule (address-reviews body Step 1, `references/resolution-detail.md`); CORRECTED at propose: `emit-composition.ts:1883-1890` is the REVIEW emit's next line, and change-scoped audit-drift's (`:2031-2032`, `orbit-run-summary-emit` spec line 500) names NO file and relies on auto-discovery, so audit-drift stays in
- ENUMERATE: applied — this table
- COHERE: applied — the bare-one-change row delegates to the positional row, so they cannot drift; the `openPair` stop and the gate's pair note are one fact read from one field
- EXECUTE: not applied — the proposal's exit (1) test is the execution
- FALSIFY: applied — today markers SUPPRESS discovery, so one stray marker hides an outstanding pass; the union removes that; dropping audit-drift would have broken its change-scoped next line and falsified `orbit-audit-drift`'s "via `--from-file` or auto-discovery" scenario
- CONFORM: applied — no-chaining (the stop names the missing member and runs nothing), R-crc-4 (the pair stays blind), Q-crc-22 (no silent single-half walk)
- FEASIBILITY: not applied — one status read per invocation
- CONSUME: applied — the triage table is the consumer; a large union is scoped there by the existing all / subset / only-critical response
- INVOKE: applied — every invocation without `--from-file`

### D-rc08b-4 — R-crc-6's lane is recorded as `remedy`, beside the D4 process `lane`
Domain: the walk-log entries that can carry a remedy
| member | covered by |
|---|---|
| `resolved`, an edit made in the change | `remedy: repair` |
| `resolved`, something removed from the change | `remedy: descope` (R-crc-6's DESCOPE SWEEP COROLLARY rides rc08a's `sweep` record) |
| `resolved` or `escalated`, mechanism routed out | `remedy: redesign` plus `routed_to` (D-rc08b-5) |
| `stale` | no remedy; nothing was done |
| `deferred` / `escalated` without a route | no remedy; filed or escalated as today |
| SUGGESTION entries | optional; the remedy matters where a finding gates |
Closure: SOURCED — the four dispositions the trail reader recognises (`resolved` / `stale` / `deferred` / `escalated`)
Moves:
- READ: applied — `lane` already holds `obvious-fix` / `decision` / `stale` on 151 entries since 2026-09-14; R-crc-6's three appear only in prose (`resolution`, `action`)
- ENUMERATE: applied — this table, over the disposition set
- COHERE: applied — `lane` says how a finding was CONDUCTED and `remedy` says what the resolution DID; obvious-fix × descope and decision × repair both occur, so the axes are orthogonal and neither field is redundant
- EXECUTE: applied — classified the prose remedies on the record: "Descoped to rc13b", "Repair, not redesign", "Dissolved by the redesign" each map to exactly one value
- FALSIFY: applied — exit (2) needs a change that keeps generating redesigns to be VISIBLE on the trail; a prose field cannot be counted, an enum can
- CONFORM: applied — R-crc-6 (the three lanes, verbatim), R-crc-10 (the remedy is a judgement, so the write gate records it and does not check it; a check would also be a fourth capability)
- FEASIBILITY: not applied — one field per entry
- CONSUME: applied — no engine reader in this stage; the field serves the trail reader of exit (2) and a future per-requirement redesign count (R-crc-8's sectional trigger)
- INVOKE: applied — written at Step 3c of every walk, per resolved or routed entry

### D-rc08b-5 — a REDESIGN leaves the walk, in one of two shapes
Domain: what closing a redesign finding can do to the change
| member | covered by |
|---|---|
| the unreviewed mechanism is SEPARABLE from the change | descope it; the entry is `resolved`, `remedy: redesign`, `routed_to: orbit/explore/<new-name>/`; the walk NAMES `/orbit:explore <new-name>` and invokes nothing |
| the mechanism is ESSENTIAL to the change | the entry is `escalated`, `remedy: redesign`, `routed_to: orbit/changes/<name>/explore.md`; the gate holds (`gates.ts:207-210`); the walk names `/orbit:explore <name>`, which resumes in place (the re-entry table's active-change cell) |
| a redesign judged on a REPAIR-looking finding | the test is R-crc-6's (does closing it need unreviewed mechanism?), never size |
Closure: DERIVED — the mechanism can be removed from the change or it cannot
Moves:
- READ: applied — the re-entry table's active-change rows (orbit-explore body; `orbit-explore-modifications`); escalated substantive entries keep the pass unresolved
- ENUMERATE: applied — this table
- COHERE: applied — the separable shape IS a descope plus a route, so it inherits rc08a's sweep obligation on the removal; the essential shape is R-crc-9's corollary (split the mechanism, or declare the stage blocked) seen from the walk
- EXECUTE: applied — rc13's 2026-09-15T15-28-15Z walk descoped five entries to rc13b; under this rule each would be `remedy: redesign` with `routed_to` the rc13b exploration
- FALSIFY: applied — a redesign closed "in place" is exactly the authoring R-crc-6 forbids; the escalated shape makes it impossible to close silently, because the gate holds
- CONFORM: applied — R-crc-6, R-crc-9, R-crc-13, no-chaining (name the route, never invoke it)
- FEASIBILITY: not applied — two fields
- CONSUME: applied — explore's re-entry resolution consumes the route; the gate consumes the escalated disposition
- INVOKE: applied — Step 3b classification, when the remedy test says redesign

### D-rc08b-6 — a disagreement is settled by one test, recorded on the later log
Domain: where two halves of one pair can contradict each other
| member | covered by |
|---|---|
| same site, opposite claims, both substantive | settle by ONE cheap empirical test; the LATER log's entry carries `disagreement: {with: {pass, title, file}, test, observed}` |
| same site, one half's claim stale at HEAD | ordinary pushback (stale-with-evidence); not a disagreement |
| different sites, contradictory premises | a disagreement whose `with.file` differs from the entry's file; the same record |
| the test cannot be run | `observed` states that; the entry routes to the decision lane, which brings it to the user |
Closure: DERIVED — same site or different sites; the claims contradict, or one is stale; the test runs or it cannot
Moves:
- READ: applied — D-rc03-6's rule (settle by one cheap empirical test, record the test on the log); rc02's one disagreement settled by one test in both directions
- ENUMERATE: applied — this table
- COHERE: applied — it lands on the LATER log, the same place D-rc08b-1 puts converged findings, so one rule says where cross-pass facts live
- EXECUTE: applied — rc04b's halves disagreed on direction (hold against forward); that is a DIRECTION disagreement, not a finding one, and it stays the readiness record's (R-crc-11(f)); this rule covers findings only
- FALSIFY: applied — without the record, a walk can pick a half by preference; the record makes the choice evidential and visible
- CONFORM: applied — D-rc03-6 (the name stays rc03's record, the rule lands here), R-crc-10 (a record; the write gate does not check it)
- FEASIBILITY: not applied — rare by measurement (one in rc02)
- CONSUME: applied — the VERIFICATION pass reads the entry like any resolved entry; the record is for humans and audit
- INVOKE: applied — at triage, when the cross-pass split marks a site contradictory

### D-rc08b-8 — the T0 next line ends at "save the response as …"
Domain: the T0 emit's provenance shapes
| member | covered by |
|---|---|
| change scope, proposal or system mode | the prose ends at `save the response as <path>`; the eligibility line names what follows (the missing pair member or the walk) |
| architecture mode | the same truncation |
| a reader parsing `next_recommended` for a leading `/orbit:` | none existed before and none exists now; `command`/`args` stay null |
Closure: SOURCED — the one composition site (`emit-composition.ts:1901`) and the one owning requirement
Moves:
- READ: applied — the composition site and `orbit-run-summary-emit`'s requirement (spec lines 461-483) both end on a walk command
- ENUMERATE: applied — this table
- COHERE: applied — with D-rc08b-3, a walk named on a T0 record would either be refused by the `openPair` stop or walk one half silently; ending the prose removes the contradiction at its source
- EXECUTE: not applied — the proposal's exit (3) test
- FALSIFY: applied — Q-crc-22's silent single-half walk was written INTO a record; that is the defect
- CONFORM: applied — R-crc-14 (the eligibility line owns the next step; the record does not restate it)
- FEASIBILITY: not applied — a shorter string at one site
- CONSUME: applied — the orientation strip renders the record's `next_recommended` as LAST, which now ends at the user action
- INVOKE: applied — every external packaging run

## Decisions

- **2026-10-05 — D-rc08b-1: one invocation walks every outstanding pass, writing one log per pass** —
  in the engine's token order. Triage renders the cross-pass split (found by both / one half only /
  contradictory) without storing it. This lifts D-rc13-3's blocker: `sourcePath` stays singular,
  because a merged log would change the trail reader and the gate for nothing the per-pass practice
  lacks (six stages of evidence). Settled under R-crc-3 on Sal's delegation of method.
  Kind: rule
- **2026-10-05 — D-rc08b-2: the outstanding-pass list is the gate's, exposed in status JSON** — the
  convergence loop collects every unresolved pass, not only the first. The reviewed gate's status row
  gains `unresolvedPasses: [{token, file, mode, source}]` and `openPair: {missing}`. `reason` and every
  rendering stay unchanged. Discovery reads this list and nothing else: one predicate, two readers.
  Settled under R-crc-3.
  Kind: rule
- **2026-10-05 — D-rc08b-3: discovery is the union of markers and outstanding passes; bare resolves the
  single active change** — markers no longer suppress pass discovery. External returns join discovery.
  audit-drift JSON leaves it (its emit names `--from-file`). An open blind pair stops the walk before
  triage and names the missing member. `--from-file` stays the exclusive override. Settled under
  R-crc-3. AMENDED at propose (2026-10-05): audit-drift JSON STAYS in discovery. Each unwalked
  `audit-drift-*.json` (no walk log's `source_path` names it) is walked, one log per file. The
  exploration's READ of its next line was wrong: change-scoped audit-drift names no file and relies on
  auto-discovery (`orbit-run-summary-emit`, spec line 500), whose recency sentence this stage repoints.
  Kind: rule
- **2026-10-05 — D-rc08b-4: R-crc-6's lane is recorded as `remedy: repair | descope | redesign`** — a
  per-entry field beside D4's process `lane`, orthogonal to it. Its shape is owned by
  `orbit-address-reviews` and the write gate does not check it (a judgement, R-crc-10; a check would be
  a fourth capability). Settled under R-crc-3.
  Kind: rule
- **2026-10-05 — D-rc08b-5: a REDESIGN leaves the walk in one of two shapes** — separable: descope and
  route to a new exploration (`resolved`). Essential: `escalated`, routed to the change's own
  `explore.md`, and the gate holds. The walk names the route and never invokes it. Settled under
  R-crc-3.
  Kind: rule
- **2026-10-05 — D-rc08b-6: a disagreement is settled by one test, recorded on the later log** — as
  `disagreement: {with: {pass, title, file}, test, observed}`. It covers findings, not directions (those
  stay the readiness record's). Settled under R-crc-3.
  Kind: rule
- **2026-10-05 — D-rc08b-7: a walk gains NO edit-level record** — the remainder of rc08's job (3) is
  answered no. rc08a's `sweep.introduced` already refuses a log whose intended new text is absent from
  its path. A claim that "the edit happened" beyond what text shows is an AI assertion the engine cannot
  observe (R-crc-10), and the VERIFICATION pass grades it (`landed` / `regressed`). The charter's
  question is answered here so it is not dropped. Settled under R-crc-3.
  Kind: scope
- **2026-10-05 — D-rc08b-8: the T0 next line ends at "save the response as …"** — Q-rc03-5's standing
  recommendation, adopted. The eligibility line owns what follows. Settled under R-crc-3.
  Kind: rule
- **2026-10-05 — D-rc08b-9: the rider is a pointer swap** — `orbit-engine-gates`' `Reviewed-gate pass
  condition` replaces "the emit surface validates the payload KEY and none of the entry shapes" with a
  pointer to `orbit-emit-composition`'s `The walk write gate checks sweep evidence`. The fallback is
  unchanged (Sal: B at rc08a). It must read the owner's body before writing the pointer.
  Kind: scope
- **2026-10-05 — D-rc08b-10: three capabilities, at R-crc-1's ceiling** — `orbit-address-reviews` (D-1,
  3, 4, 5, 6), `orbit-engine-gates` (D-2, D-9), `orbit-run-summary-emit` (D-8, plus the audit-drift
  standalone requirement's recency sentence, repointed per D-3's amendment). Checked at propose: the gate
  row's JSON fields are `orbit-engine-gates`' (precedent: `independentSpend`), so the count holds. Measured against the
  charter's "Touches" line. Whether the status JSON gate row is engine-gates' or another capability's is
  checked at propose. If it is another's, it is a fourth, declared or split under R-crc-9.
  Kind: fact

## Open questions

All seven opening questions moved to Decisions on 2026-10-05 (D-rc08b-1..8).

## Considered & out

- **2026-10-05 — `sourcePath` as a SET (a merged walk log)** — rejected for D-rc08b-1. It changes the
  trail reader, `recordsFor` and every per-pass reader to buy a merged record that the triage rendering
  already provides.
- **2026-10-05 — reusing `lane` for R-crc-6's three** — rejected for D-rc08b-4. 151 entries already
  carry D4's process values, and the axes are orthogonal.
- **2026-10-05 — a write-gate check on `remedy` / `routed_to` / `disagreement`** — out. It would be a
  fourth capability (`orbit-emit-composition`), and the remedy is a judgement (R-crc-10).
- **2026-10-05 — an edit-level "edit happened" record** — out (D-rc08b-7).

## References

- `orbit/architecture/clean-up-review-cycle.md`: Stage rc08b (the charter), Stage rc08 (the parent
  charter, job list, exit (4)), R-crc-6 (three lanes, plus the DESCOPE SWEEP COROLLARY), R-crc-8 (sectional
  redesign trigger), R-crc-9, R-crc-10, R-crc-13
- `orbit/changes/archive/2026-10-05-rc08a-sweep-evidence/explore.md`: D-rc08-1..5 (the split; the sweep
  record the edit-level question rests on)
- `orbit/changes/archive/2026-09-15-rc13-explore-mechanism/explore.md`: D-rc13-3 (discovery is the
  gate's predicate; blocked on singular `sourcePath`)
- `orbit/changes/archive/2026-10-04-rc03b-pass-genres/explore.md`: D-rc03-6 (disagreement), D-rc03-16 /
  Q-rc03-5 (T0 line)
- `src/core/artifact-graph/gates.ts`: `recordsFor` / `passResolved` (171-214), the convergence loop and
  `openPair` (440-470)
- `src/core/artifact-graph/trail.ts`: `TrailResolution` (70-80)
- `src/core/templates/workflows/address-reviews.ts`: Step 1 discovery (898-904), auto-discovery detail
  (337-355), classify (3b), the decision lane (3b.5)
- `src/core/emit-composition.ts:1901`: T0 `next_recommended`
- `orbit/specs/orbit-run-summary-emit/spec.md`: `Review-external T0 multi-step recommendation`
- `orbit/specs/orbit-engine-gates/spec.md`: `Reviewed-gate pass condition` (the rider sentence, line 275)

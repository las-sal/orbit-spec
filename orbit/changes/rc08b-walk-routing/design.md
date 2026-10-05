## Context

The walk and the gate disagree about what is outstanding. The gate's resolution clause
(`passResolved`, `src/core/artifact-graph/gates.ts:183`) treats every pass with unwalked substantive
findings as unresolved. The walk body uses a different rule: on a change-name positional with zero
markers, it picks the ONE newest `review-<mode>-*.json` or `audit-drift-*.json` by `<TS>`. A bare
invocation never reads a trail. External returns are reached only by `--from-file`. A single marker
suppresses the trail. The gate cannot help as it stands: its loop returns at the first unresolved pass,
and `GateStatus` exposes the fact only as a token inside the `reason` prose (explore.md, Premise).

R-crc-6's three lanes (repair / descope / redesign) exist only in prose on the trail. Walk logs already
carry a `lane` field with D4's process values (`obvious-fix` 117, `decision` 30, `stale` 4, on logs
since 2026-09-14), which is a different axis.

rc08b is the second child of rc08 (D-rc08-1). rc08a shipped the walk write gate and the `sweep`
record. This stage inherits rc08's jobs (2), (4), (5) and (6), the remainder of job (3), and one rider.

## Goals / Non-Goals

**Goals:**
- The walk discovers exactly what the gate reports outstanding, read from one engine list (exit (1)).
- A walk entry records R-crc-6's lane, and a REDESIGN leaves the walk with its route on the log
  (exit (2)).
- A blind pair's disagreement is settled by a recorded test.
- The T0 emit names no walk command (exit (3)).
- The rider's false sentence becomes a pointer.

**Non-Goals:**
- A merged walk log, or `sourcePath` as a set (see Alternatives).
- Write-gate checks on `remedy`, `routed_to` or `disagreement`. They are judgements (R-crc-10), and
  checking them would be a fourth capability.
- An edit-level "edit happened" record (D-rc08b-7).
- Changing the review emit's own `next_recommended` (`/orbit:address-reviews <change> --from-file <own
  path>`) or the external chat note's findings path. Both are `orbit-review` / `orbit-review-external`
  text (see Risks).
- Discovery on archived changes' review passes. `orbit status` cannot address an archived change
  (Q-crc-26).

## Decisions

**D1 — The gate collects; it does not decide more** (D-rc08b-2, see explore.md). In
`computeConvergence`, the loop over `resOrdered` keeps going after the first unresolved pass and builds
`unresolvedPasses`. The early `return` becomes a return after the loop, with `reason` and
`unresolvedPass` taken from the first collected element. Since that is the same pass the old early
return named, `reason` and the readout are byte-identical. A `passed` gate returns from its own branch
(`gates.ts:735`, `if (freshEval.converged)`), and that branch adds `unresolvedPasses: []`. `openPair` is
already computed before the loop, and it is copied onto the status. The canonical next for an unresolved
pass CHANGES (`gates.ts:807-809`): it becomes `/orbit:address-reviews <change>` with no `--from-file`, so
the engine's own eligibility line reaches discovery and the `openPair` stop, instead of aiming one half
(walk 1, Sal's delegation, option A). The goldens that print that line move as a recorded act (task 1.5). Both fields ride `GateStatus` → `GateStatusRow`
(`instruction-loader.ts:419`) into `orbit status --change --json`. `file` is made repo-relative at that
boundary. A blocked gate never reaches the convergence computation, so it carries neither field. A
superseded gate carries both, and the walk body ignores them (the reader's rule, per the ADDED
requirement). Alternative considered: a separate engine command that lists outstanding passes. Rejected,
because the status row is already the surface the body reads, and a second surface would be a second
voice.

**D2 — Discovery is one fence in the owning requirement** (D-rc08b-3). `orbit-address-reviews`'
`Address-reviews command available` replaces its three-step priority order with an eight-row `DISCOVERY`
fence (rows tested in order). The body carries that fence as a CHECKED MIRROR, held byte-equal by a
parity test, the way rc08a's walk body carries its check scope (`sweep-path-parity`). R-crc-14's mirror
corollary applies: an installed skill cannot open the spec (walk 1). audit-drift stays discovered
by a body-side basename rule. It is not a gate pass, so no engine predicate exists to reuse, and the
basename key is the one `recordsFor` already uses. This was amended at propose: the exploration's READ
of audit-drift's next line was wrong (explore.md, D-rc08b-3's amendment).

**D3 — One log per source** (D-rc08b-1). `orbit emit address-reviews` is invoked once per discovered
source, in token order, and the markers' log goes last. Nothing in the emit surface changes: each payload
is an ordinary walk log with one `source_path`. Converged findings resolve in the earlier log and are
`stale` with evidence in the later one, which is the practice of the last six stages, now written down.

**D4 — `remedy` beside `lane`** (D-rc08b-4, D-rc08b-5). The field's shape and the REDESIGN routing are
stated once, in a new `orbit-address-reviews` requirement as a four-row table. `Resolution-log JSON shape
extensions` gains one pointer line, as it did for rc08a's `sweep`. The body's classify step (3b) gains
the remedy test after its existing lane classification. No engine change is needed to accept the new
keys, checked at propose: the write gate closes only TOP-LEVEL payload keys (`emit-composition.ts:859`).
Per-resolution keys stay open on purpose, as the note at `emit-composition.ts:951-953` records for
findings. So `remedy`, `routed_to` and `disagreement` are accepted as written, and `orbit-emit-composition`
is untouched.

**D5 — The disagreement record** (D-rc08b-6) rides the later log's entry, the same place D3 puts
converged findings.

**D6 — The T0 string** (D-rc08b-8). `emit-composition.ts:1901` drops its `, then /orbit:address-reviews
…` clause. The review body's copy of the line (`review.ts` T0 section) moves with it.

**D7 — The rider** (D-rc08b-9) is a one-sentence swap inside the `Reviewed-gate pass condition` block,
naming both requirements that check walk entries at write time: `orbit-emit-composition`'s `The walk
write gate checks sweep evidence` and `A ripple-miss pointer resolves and is counted`. Both were read
(walk 1). The fallback is unchanged. The block's stale parenthetical deferring multi-source ingest to rc03
becomes a pointer to `One invocation writes one log per discovered source`. The cost is that the whole
block's 22 scenarios become delta scenarios. In all, the change carries 66 delta scenarios, 8 of them
covered at propose, so 58 must be declared (measured by `orbit status --change rc08b-walk-routing
--scenarios`; task group 5).

## Alternatives considered

- **`sourcePath` as a SET (a merged walk log).** Rejected (explore.md, Considered & out). It changes
  the trail reader, `recordsFor` and every per-pass reader to buy a merged record that the triage
  rendering already provides.
- **Reusing `lane` for R-crc-6's three.** Rejected: 151 entries carry D4's process values, and the axes
  are orthogonal.
- **A write-gate check on `remedy` / `routed_to` / `disagreement`.** Out: a fourth capability, and a
  judgement (R-crc-10).
- **An edit-level record.** Out (D-rc08b-7). `sweep.introduced` and the VERIFICATION pass already cover
  what can be observed.
- **Dropping audit-drift from discovery.** Rejected at propose. Change-scoped audit-drift names no file,
  and `orbit-audit-drift`'s ingest scenario says "via `--from-file` or auto-discovery".

## Risks / Trade-offs

- [An explicit `--from-file` aim bypasses discovery and the `openPair` stop] → The review emit's own
  next line and the external chat note both name `--from-file`, so a user following either walks one
  pass. Those lines are `orbit-review`'s and `orbit-review-external`'s (a fourth and fifth capability
  under R-crc-1). The gate's own eligibility line, the most-followed of the three, no longer does (D1).
  Named residual; the natural owner is a later stage touching the review body.
- [A suggestion-only pass is no longer walked by discovery] → Today's newest-by-TS rule walked it. Now
  only a pass carrying a CRITICAL or WARNING is outstanding, because that is the gate's predicate. The
  review emit's next line still names `--from-file` for it, and the requirement says so.
- [`--mark` writes markers that restate its pass's findings] → Without a rule, the union would walk
  each one twice. A marker at a discovered finding's file, beginning with its title, is walked as that
  finding, in its pass's log (the requirement states this).
- [Bare with one active change narrows the marker scan to that change] → The triage header says
  `markers outside it are not scanned`. A path positional re-aims it. Markers are rare since discovery
  replaced `--mark`.
- [58 delta scenarios to declare, 22 of them inherited from the rider's block] → Most are behaviours with existing gate tests that
  lack tags. Task group 5 measures the count before tagging, and declares any it cannot cover in the
  ledger with a `why`.
- [Superseded proposal passes leave discovery] → A post-apply walk never picks up an unwalked proposal
  pass. That gate gates nothing, so `--from-file` reaches it, and the requirement says so.
- [A walk across many passes is long] → The triage response scopes it (all / subset / only-critical),
  and each completed log stands on the trail if interrupted.

## Migration Plan

None. Prior walk logs carry no `remedy` and are never re-validated. `unresolvedPasses` and `openPair`
are additive optional JSON fields. The retired recency rule leaves `tie_break_rationale` accepted by the
payload table and no longer written.

## Touchpoints

- `src/core/artifact-graph/gates.ts` — collect every unresolved pass; `GateStatus` gains `unresolvedPasses` and `openPair`.
- `src/core/artifact-graph/instruction-loader.ts` — the gate row carries both fields into status JSON.
- `src/core/emit-composition.ts` — the T0 string (`:1901`).
- `src/core/templates/workflows/address-reviews.ts` — Step 1's mirrored `DISCOVERY` fence, one log per source, classify's remedy test, REDESIGN routing, disagreement, schema reference and `json example` blocks.
- `src/core/templates/workflows/review.ts` — the T0 section's copy of the next line.
- `test/core/artifact-graph/` — gate tests for the list, `openPair`, and the 22 tagged scenarios.
- `test/core/emit-composition.test.ts` + `test/core/reference-roundtrip.test.ts` + `test/core/emit-schema-parity.test.ts` — T0 string, new keys round-tripped.
- `test/core/templates/` — body text suites for discovery, remedy and the T0 copy.
- `orbit/scenario-ledger.yaml` — declarations no test can carry.

## Mechanism → artifacts

The proposing AI's reading of the file; no engine record.

| rule | closure / state | owner's state | destination |
|---|---|---|---|
| D-rc08b-1 | DERIVED | live rule | `orbit-address-reviews`: `One invocation writes one log per discovered source` (scenario set) |
| D-rc08b-2 | SOURCED | live rule | `orbit-engine-gates`: `A reviewed gate lists its outstanding passes` (sentence naming the source: the gate's state branches) |
| D-rc08b-3 | DERIVED | live rule | `orbit-address-reviews`: `Address-reviews command available` (normative table) |
| D-rc08b-4 | SOURCED | live rule | `orbit-address-reviews`: `A walk entry records its remedy, and a REDESIGN leaves the walk` (normative table) |
| D-rc08b-5 | DERIVED | live rule | the same requirement (normative table, the two `redesign` rows) |
| D-rc08b-6 | DERIVED | live rule | `orbit-address-reviews`: `A disagreement between the halves of a pair is settled by one test` (scenario set) |
| D-rc08b-7 | — | scope | not carried |
| D-rc08b-8 | SOURCED | live rule | `orbit-run-summary-emit`: `Review-external T0 multi-step recommendation` (sentence naming the source: the one composition site) |
| D-rc08b-9 | — | scope | not carried (its edit lands in `Reviewed-gate pass condition`) |
| D-rc08b-10 | — | fact | not carried |

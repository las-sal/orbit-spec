Each task lands with its tests; a task with failing or absent coverage is not complete.

## 1. Trail: severity on findings and on resolutions

- [x] 1.1 Add `severity` to `TrailFinding` in `src/core/artifact-graph/trail.ts` (from the internal
      emit's per-finding `severity`; from section membership for external files); read the
      `resolutions[]` array's per-entry `severity` plus the disposition from `outcome` OR the legacy
      `status` into `TrailResolution`, keeping the bare `deferred`/`escalated` counts for the
      fallback rules; and surface external findings artifacts REJECTED by
      `parseExternalMarkdown`'s shape validation as a separate list, so a malformed return is
      visible to spend and to the reason instead of vanishing.
      Tests: severity parses from both provenances; a pre-D4 emit without `resolutions[]` yields
      the legacy shape; a malformed entry is skipped rather than fatal.

## 2. Convergence clauses become severity-aware and fail safe

- [x] 2.0 Implement the two stated conventions once, not per rule: PASS-LIST QUANTIFICATION
      (clauses (a) and (c) over the fresh list, (b) over every relevant pass, the stale
      discrimination re-evaluating over the full list) and EMPTY SETS ARE NEVER VACUOUSLY
      SATISFYING. Freshness has exactly one home; assert it is not restated inside any slot
      predicate.
- [x] 2.1 Rewrite `passResolved` in `src/core/artifact-graph/gates.ts` to block only on a
      CRITICAL-or-WARNING entry whose `outcome` is `deferred` or `escalated`, and surface the
      deferred SUGGESTION count on `GateStatus` so a passing gate can name it.
- [x] 2.2 Implement EXISTENCE-FIRST scoped to SUBSTANTIVE findings (a pass carrying a CRITICAL or
      WARNING with no referencing record is unresolved; a suggestion-only pass needs no walk) and the single READABILITY predicate: a record is readable when `resolutions` is
      a NON-EMPTY array whose every element is an object carrying a recognised `severity` AND a
      recognised disposition (from `outcome` or legacy `status`); readable records read per entry and PREFER
      the entries over `resolution_summary`; every other shape falls back WHOLE to the bare counts,
      and an unreadable record with no readable summary leaves the pass unresolved. Fixture all four
      real archive shapes (260 with `outcome`, 49 with `status`, 217 with neither, 8 whose
      `resolutions` is a counter object, 1 with an empty array and a non-trivial summary, 2 with the
      key absent entirely).
- [x] 2.3 Restrict `hasNewFindings` to substantive findings, define the deferred-SUGGESTION count
      as distinct entries deduplicated by (trimmed title, repo-relative file) across every relevant
      pass's latest record, and test the set: a deferred SUGGESTION does not block, a deferred
      WARNING does, an unrecognised disposition or severity makes the record unreadable, a
      dispositionless entry falls the record back, a legacy `status` reads correctly, a READABLE
      record with a resolved WARNING plus a deferred SUGGESTION leaves the gate passable even though
      its summary reports `deferred: 1`, an unwalked pass carrying a WARNING blocks while an
      unwalked suggestion-only pass does NOT, an empty `resolutions` array falls back to its summary
      rather than resolving, a new SUGGESTION
      satisfies `no-new-findings`, a new WARNING does not, and one suggestion deferred across two
      passes counts once.

## 3. The `blind-pair` cadence slot

- [x] 3.1 Add `blind-pair` to `CADENCE_ENTRIES` in `src/core/artifact-graph/types.ts` and implement
      the slot predicate in `gates.ts`: two passes of distinct independent classes, BOTH strictly
      later than the previous slot's passes and its resolution records, with no
      `address-reviews` record referencing either pass's findings artifact carrying a token between
      theirs INCLUSIVE of the endpoints; satisfied at the later token; the EARLIEST qualifying pair
      selected under a TOTAL order (later token, then earlier token, then findings-artifact
      filename) applied ONLY among assignments that satisfy the whole cadence — coverage is
      existential, so a pair choice that forecloses a following slot is retried, never preferred.
      A consumed pass index never satisfies a second slot, and an ambiguous pair (shared tokens) is
      REJECTED rather than certified. Clause (a) gains the general ordering constraint the same
      edit needs: a slot's satisfying pass(es) must be strictly later than every resolution record
      closing the PREVIOUS slot's pass findings — this is what makes a following slot a check on
      the walk rather than a pass that arrived late.
- [x] 3.2 Tests: a valid pair satisfies; a walk of one member's findings between them breaks it; an
      unrelated walk does not; two same-class passes do not form a pair; a stale member does not
      satisfy; the four-pass multi-pair trail (external, fresh, in-context, late external) covers
      the cadence with the earliest pair and demands no further pass; `[external, blind-pair]` does
      not reuse the first slot's external as a pair member; a pair straddling a preceding slot is
      rejected; token ties on a member or a resolution record are rejected with the reason naming
      the tie; and the pre-walk trailing pass (external, fresh, in-context, then both resolution
      records) leaves the gate unpassed.

## 4. The review budget, reported beside the state

- [x] 4.1 Add the optional positive-integer `budget` to `GateSchema` and `NormalizedGate`, and add
      gate-id-naming validation to `validateGates` for BOTH new fields — a non-positive or
      fractional budget, and a cadence entry outside the five-token vocabulary (the Zod enum names
      an index, not the gate, while every surrounding error names the gate id).
- [x] 4.2 Report `budget`, `independentSpend` (display), `independentSpendFresh` (trigger) and
      `budgetExhausted` as named gate-status fields AND carry all four through BOTH projections — the `GateStatusRow` mapping in
      `src/core/artifact-graph/instruction-loader.ts` and the human gate row in
      `src/commands/workflow/status.ts` — or they reach neither surface. Count independent passes on
      the gate's mode across the whole trail, stale included, for the REPORTED figure; count only
      passes fresh against the current state for the EXHAUSTION TRIGGER; AND
      count external findings artifacts the trail reader rejected as malformed (surfaced separately
      from cadence-eligible passes — they satisfy no slot but they cost a run, and the reason names
      them, attributed to the mode in the filename). Set `budgetExhausted` when the trigger count
      reaches the budget and the gate is `unpassed` OR
      `stale`; render `unpassed BUDGET-SPENT` / `STALE BUDGET-SPENT` and carry budget + spend on
      the gate row. The gate-state set stays at five values.
- [x] 4.3 Tests: exhaustion on an unconverged gate; convergence beating budget; stale passes
      counted in the reported figure but not the trigger (no exhaustion mid re-cover after an
      apply); a rejected malformed external counting as spend for ITS OWN mode's gate only while
      satisfying no slot; both projections carrying the three fields; a
      previously-converged-then-staled gate at the budget boundary rendering `STALE BUDGET-SPENT`;
      no budget declared meaning never exhausted; and — the point of the shape — that WAITING, the
      inflection prompt, and `gate_overridden` all still read the five-value state and need no
      change.

## 5. Gate reasons that teach

- [x] 5.1 Implement the canonical-next rule for `blind-pair` in `commandForClass` /
      `canonicalNextForReviewed`, selecting the class missing from the earliest PAIRABLE
      combination, and make `commandForClass` EXHAUSTIVE over `CadenceEntry` (compile-time
      exhaustiveness or an explicit throw) — today it returns the in-context command for any
      unrecognised slot, so a new cadence token silently recommends a class that satisfies nothing.
      Compose the reason per failing clause (including the blind-pair slot's two failure modes:
      missing partner, blindness broken), the forward note that announces an open pair and names
      the missing class before its findings are walked, the exhausted reason as spend PLUS the
      clause it displaced, and the deferred SUGGESTION count on a passing gate.

- [x] 5.2 Tests: one assertion per reason shape on a constructed trail, including the composite
      exhausted-and-pair-uncovered case, the canonical next command targeting the missing PAIRABLE
      member, the both-must-run-before-either-is-walked reason when no pairable pass stands, and the
      proposal gate NEVER rendering the open-pair note (its cadence declares no `blind-pair`).

## 6. Schema version 4

- [x] 6.1 Bump `schemas/spec-driven/schema.yaml` to version 4 — `review-system` cadence
      `[blind-pair, in-context]`, `budget: 3` on both reviewed gates — and update its gate comment
      block to describe the blind pair and the budgets.
      Tests: the shipped schema parses and declares exactly those values; a v2/v3-era schema
      without `budget` or `blind-pair` still parses and behaves as before.

## 7. Legacy trails, sweep, and close

- [x] 7.1 Test that gate state computes over an archived v3-era change without throwing, reports
      its uncovered `blind-pair` slot, and produces no live-change orientation row; and grep-test
      that no schema-version selector exists outside the consent-era tripwire.
- [x] 7.2 Full suite green (`npm test`, recording the delta from the 2041-test baseline) and
      `orbit validate --strict` across all changes and specs.
      Then sweep for residue in generated bodies, references, AND baseline specs — including
      cadence-slot names inside EXAMPLE gate lines and readouts AND the post-apply next-command
      literal (`review --as system` outside the cadence vocabulary), neither of which any other grep
      catches — `src/core/emit-composition.ts` composes that command in THREE verify-emit branches
      and `apply-change.ts` predicts it twice in prose, and under v4 the first uncovered system slot
      is `blind-pair`, so all five would recommend a pass satisfying no slot, which the single-voiced
      requirement forbids: no
      surviving prose that says a gate repeats "until none", that every finding must be resolved,
      that the cadence vocabulary has four names, that names `spec-driven` v3 as current, or that
      shows a gate line v4 cannot produce. Two sites are known: the review body's worked example
      (`src/core/templates/workflows/review.ts`) ships the tail
      `Gate review-system: unpassed — cadence class 'external' has no pass`, which v4 makes
      impossible; `orbit-run-summary-emit`'s packaged-but-unreturned scenario is handled by this
      change's delta on that capability; `src/core/templates/workflows/review.ts` also tells the
      reviewing AI that "an `external` cadence slot is satisfied ONLY when an external findings file
      exists", which v4 generalizes. Treat the named set as OPEN — grep `cadence slot`,
      `cadence class`, and bare `external` slot claims rather than confirming only these. The
      `orbit-lifecycle-consent` scenario naming version 3 is handled by this change's delta on that
      capability. TWO baseline sites are OUT of this change's three capabilities and are assigned
      rather than swept: `orbit-conventions`' external-slot sentence ("whose `external` cadence slot
      must be covered for convergence", falsified by v4, where the external return covers half a
      `blind-pair`) goes to rc02b, which already touches that capability; `orbit-run-summary-emit`'s
      two v3-scoped next-command examples go to rc02c. Confirm both are recorded in the program doc
      rather than re-deciding them here.
- [ ] 7.3 (User-validation) Close issue #8 with a pointer to this change, naming the superseded mechanism and the
      preserved intent (outward action — recommend, never perform).
- [ ] 7.4 (User-validation) Run one full system cadence on this repo under the shipped rules and RECORD the pass
      sequence plus the gate's computed verdict at each step — the pre-archive half of exit
      criterion 3, answerable before the archive and recorded in the change's own trail.
- [ ] 7.5 (User-validation) At archive, confirm the seam proceeds through the stop rule or reports
      the budget spent, never a `gate_overridden` for "no clean pass yet" — recorded in the archive
      emit's gate fields plus one line in the program doc's status log.

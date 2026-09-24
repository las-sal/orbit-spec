## Why

`gate_overridden` and rc04a's `continuation/proceed` record describe ONE fact — a human chose
Proceed anyway past a gate that said no — and the repo currently writes both. Keeping two records
for one fact is the defect this stage exists to remove, and the parent charter's exit (4) demands
`gate_overridden` "either gains a reader or is retired".

It gained one, and that is the whole argument for acting now: rc04a's coexistence guard
(`src/core/emit-composition.ts:606-632` — the block removed at apply, 2026-09-24) reads the field solely to refuse an emit whose two
records disagree. That reader is SCAFFOLDING — it exists to prove the successor carries what the
legacy object carried — so it comes down with the thing it braced. Deferring leaves a field
written by three workflow bodies, read by one guard that exists only to watch it, and described
by nine requirements.

`rc04d-override-vocabulary` (ARCHIVED and ratified 2026-09-22) already took the three capabilities
that named the field without depending on its shape, so the interim state this stage inherits is
coherent: no spec normatively demands a field nothing writes. What remains is the retirement
proper, at R-crc-1's ceiling rather than twice it.

## What Changes

- **`gate_overridden` is retired from the write path.** The three workflow bodies stop composing
  it (`apply-change`, `archive-change`, `pr-choreography`), the engine stops accepting it as a
  payload key, and the archive schema reference stops documenting it. **BREAKING for emit
  payloads**: a payload carrying `gate_overridden` is refused by the write gate as an unknown key,
  which is the ordinary treatment of a retired field and requires no special case.
- **Archived trails keep reading.** Emits written before this change retain `gate_overridden` and
  remain valid as a PRIOR GENERATION. Nothing rewrites history and no migration runs; the trail
  readers that consume archived emits are unchanged.
- **The totality rule ships** (`explore.md` D-rc04c-1): `formed_against: []` becomes legal on a
  `continuation/proceed` entry IF AND ONLY IF the trail carries no independent pass earlier than
  the emit's own token, and is refused — naming the pass it should have cited — when one exists.
  This closes the ONE case the successor could not previously express, which is what makes "strict
  widening" true rather than nearly true.
- **The coexistence guard is removed**, and with it the field's only reader.
- **`judgement-record-fixture.test.ts` is NARROWED, not deleted** (D-rc04c-7): its coexistence body
  is replaced by an assertion that `continuation/proceed` still carries all three gate facts, so
  losing the legacy SHAPE does not quietly become losing the FIELDS.
- **The coexistence PROSE is swept** — `orbit-run-summary-emit` argues for the two records
  coexisting "until `gate_overridden` is retired", which is exactly the artifact residue R-crc-6's
  descope-sweep corollary names.
- **NOT a vocabulary reframe.** Per the charter's NON-GOAL and `explore.md` D-rc04c-5: this stage
  names the successor record correctly wherever it is ALREADY writing new text, and hunts nowhere
  else. No sweep of the fingerprint, audit-drift or PR seams; no requirement opened solely to
  change a word.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `orbit-run-summary-emit`: the `gate_overridden` payload field is retired from the archive and
  apply tables; the coexistence paragraph and its "until retired" framing go with it; the
  `formed_against` contract gains D-rc04c-1's conditional-empty rule for `continuation/proceed`.
  Both engine-side CHECKS are specified here — the coexistence refusal that is removed, and the
  emptiness-truthfulness rule that replaces the unconditional non-empty requirement.
- `orbit-archive-modifications`: the archive emit's conditional `gate_overridden` field and the
  scenarios mandating it are replaced by the `continuation/proceed` entry alone, including the
  named edge where no independent pass exists.
- `orbit-emit-composition`: TWO requirements. (1) the payload-table parity requirement's
  documented-field set drops from four conditional fields to three, because the archive schema
  reference stops documenting `gate_overridden`. (2) `Write-gate validation via the shared
  normalizers` — which governs `judgementOrderingCheck` — gains the emptiness refusal as a named
  well-formedness edge (d), reconciled against its own SHALL-NOT on sufficiency: the boundary is
  ZERO, where the trail can contradict the claim; above zero, adequacy stays the judgement R-crc-10
  forbids the engine. Without (2) this stage would ship a rule the governing requirement's prose
  appears to forbid.

## Impact

- **`orbit/specs/` — 3 capabilities, 10 requirements.** `orbit-run-summary-emit` 4,
  `orbit-archive-modifications` 4, `orbit-emit-composition` 2. The tenth was ADDED during the
  proposal walk (the fresh pass found the ordering-refusal contradiction).
  **SIZE, STATED AGAINST ALL FOUR OF R-crc-1'S DIMENSIONS rather than the one that flattered it**
  (corrected after external iter 1): capabilities 3 of 3 AT · requirements 10 of ~12 UNDER ·
  delta 57,418 B of ~40 KB **OVER** · tasks 34 of "under 20" **OVER**. The earlier claim that the
  stage was simply "AT the ceiling on the binding dimension" cited R-crc-1's own line that
  capabilities predict cost better than bytes — true, and not a repeal of the other three limits.
  Two breaches stand, handled differently and neither absorbed: the BYTE figure is ~43 KB verbatim
  carriage forced by the MODIFIED format (the large majority of it verbatim carriage; only ~150 lines differ from baseline), which tasks 5.1c
  proposes the ruling should stop counting; the TASK figure is a real breach proposed as R-crc-9's
  first RATIFIED one. **BOTH LANDED 2026-09-24** via `/orbit:architect` (task 5.1c): R-crc-1 now
  measures CHANGED bytes, under which this stage reads UNDER at 163 differing lines, and the task
  overage is recorded in the stage section as R-crc-9's FIRST ratified breach at its real figure.
  Three dimensions UNDER, one a citable ratified breach; the review cadence may continue.
- **`src/core/templates/workflows/` — 3 bodies.** `apply-change.ts` (3 occurrences),
  `archive-change.ts` (9), `pr-choreography.ts` (1).
- **`src/core/emit-composition.ts`** — 7 occurrences: the payload tables, the coexistence guard
  (`validateJudgements`), and the ordering check (`judgementOrderingCheck`) that gains the new rule.
- **`test/` — 4 files, 9 sites, FOUR kinds of break** (`explore.md` D-rc04c-6 as corrected by the
  fresh proposal pass — see `design.md` D3): SEMANTIC updates (`orbit-content-fidelity` body pins,
  `emit-schema-parity:167`, `emit-composition:169` and `:187`), FIXTURE-ONLY swaps
  (`emit-schema-parity:219` and `emit-composition:1235` — neither tests the field, both merely use
  it; `fingerprint_overridden` is a verified replacement victim), DELETION
  (`emit-composition:1178` and `:1259-1281`, which exercise the guard being removed and assert its
  error text by regex), and one test NARROWED in place (`judgement-record-fixture`).
- **Archived trails — untouched.** 20 archived emits carry `gate_overridden`; all remain readable
  as a prior generation.
- **Downstream**: this is the last stage of the `gate_overridden` retirement. Q-crc-23's residual
  vocabulary reframe is explicitly NOT inherited — it remains an open scope call.

## Why

rc17a shipped discovery: a change-scoped walk reaches every pass that carries a finding, at any severity. The gate's
canonical next already names no file. But a change-mode review emit's `next_recommended` still names
`/orbit:address-reviews <change> --from-file <own path>`, an aim at ONE pass, which inside a pair walks one half. The
emit should name the walk the gate names whenever the gate's next is a walk (D-bpc-16, carried here as D-rc17c-1; see
explore.md).

Measuring the stage turned up a fourth surface stating the old pointer: the editorial-kind example in
`orbit-conventions`' `Internal-run JSON summary format`. All three canonical examples in that requirement are stale
(explore.md, Case 3), because nothing reads them. Sal: "why wait til audit-drift to fix something we see now? let's fix
it now." (D-rc17c-6.)

## What Changes

- A proposal- or system-mode review emit WITH findings composes `next_recommended` as `/orbit:address-reviews <change>`.
  The clean pointer, architecture mode, the external T0 line and both audit-drift scopes are unchanged (D-rc17c-1).
- The report renderer's deterministic-pointer check accepts a closed set of TWO values computed from the emit itself:
  the short form, or the self pointer naming that emit's own path (the prior generation). Anything else still fails
  naming the field. No date cutoff, no new field (D-rc17c-2).
- `orbit-emit-composition`'s composition rule is restated in the review body twice. Both sites stop restating it and
  point at the owner (D-rc17c-3). The same requirement's T0 clause still says "paste/save/ingest"; since rc08b the line
  ends at the save step, and the clause is repaired to point at its owner while the block is open.
- `orbit-conventions`' three canonical examples (apply, review, archive) are refreshed to the shapes the engine writes
  today (D-rc17c-6).
- A test executes each canonical example: it subtracts the engine's own refused set to recover the payload, submits it
  through the real write gate in a disposable project, and holds the written emit's top-level key set equal to the
  example's. The review example is also rendered through `--report` (D-rc17c-7).

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `orbit-emit-composition`: `Deterministic facts are engine-composed per command`. The review pointer splits by mode
  (change modes short; architecture keeps `--from-file`), and the T0 clause points at its owner.
- `orbit-report-rendering`: `Strict input validation — fail loud, no partial render`. The pointer check accepts the
  prior-generation self pointer by value.
- `orbit-review`: `Internal run summary persisted per mode`. The persist-first scenario names the short form.
- `orbit-conventions`: `Internal-run JSON summary format`. Three refreshed examples, and the rule that each is
  executed.

**Size: four capabilities, one over R-crc-1's ceiling, declared under R-crc-9** (D-rc17c-6, on Sal's word; the rc07b,
rc02b and rc17b precedent). The charter named three; the fourth is the stale example the measurement found.

## Impact

- `src/core/emit-composition.ts`: the review composer's change-mode branch; `SPINE_FIELDS` and `ENGINE_OWNED_EXTRA`
  gain `export` so the example test strips by the engine's own list.
- `src/core/report-render.ts`: the spine-semantics pointer check.
- `src/core/templates/workflows/review.ts`: the spine paragraph and the schema line.
- Tests: emit-composition and report-render assertions on the pointer; golden fixtures whose JSON carries a pointer
  (the rendered goldens do not move, because no report prints `next_recommended`); a new canonical-example test.
- No migration. The 152 archived proposal/system emits that carry the self pointer keep it and keep rendering.

# External Review: d3-orientation (iteration 2, system)

**Reviewer**: OpenAI Codex (GPT-5)
**Date**: 2026-07-21

## CRITICAL

None.

## WARNING

### Cited workstreams do not nest under well-formed stages in malformed documents

**File**: src/commands/workflow/status.ts:359
**Description**: `printFullView` nests workstreams only while iterating
`program.parseable`; the malformed bucket is emitted later as opaque lines through
`renderMalformedLines`, with no matching-workstream pass and no update to
`citedKeys`. A scratch render with one parseable doc, a malformed `half-broken`
doc containing the well-formed sibling `good-stage`, and a change citing
`half-broken/good-stage` prints
`good-stage — in-change [active-change:cited]` but then prints `cited` under
`standalone`. This violates the `--full` requirement that live workstreams nest
under their cited stages; malformed sibling stages are valid citation targets and
are already treated as real stages by architecture status and WAITING. Render the
malformed header/violations and its sibling stages in a structure that preserves
the shared architecture-status line render while interleaving matching workstream
entries and recording their `kind:name` keys. Extend the malformed-document CLI
fixture with a workstream citing the well-formed sibling and assert that it appears
beneath that stage, not beneath `standalone`.

## SUGGESTION

### Twin-name fallback comparators still lack a total kind-aware tie-break

**File**: src/core/orientation.ts:528
**Description**: The emit-less `dated` comparator returns `-1` when `created`
and `name` are both equal, and the final workstream-order comparator similarly
returns `1` for equal names at line 555. A change and explore sharing a name is
explicitly supported, so an emit-less twin pair with the same `created` value
makes these comparators non-antisymmetric and leaves the sprint/type order
dependent on sort implementation and input order. No entry is currently dropped,
so this is lower severity than the resolved `citedNames` defect. Use the existing
`kind:name` identity as the final tie-break (and return `0` only for identical
keys), then make the twin fixture assert the selected sprint and complete
workstream order rather than only asserting that both entries survive.

## Notes

The fresh iter-4 resolution batch is present: `--full` tracks printed entries by
`kind:name`; the apply/archive template sources consistently scope per-change
payload reads to `orbit status --change <name> --json`; and the empty-trail phrase
is unified on `no emits yet`. A fresh Claude installation produced 16 skills and
16 commands with no status wrapper, retained the mode-aware explore BEGIN
instructions, and contained no bare `orbit status --json` per-change reference.

Build and lint pass. The focused orientation suites pass 41/41 and the
generated-template suites pass 175/175. The full suite reports 1,729 passed and
the expected 24 unrelated command-test failures caused by the workspace path
containing spaces (1,753 total). Strict validation passes; all 7 fingerprints
verify; live bare/full, JSON, per-change, and architecture surfaces render
successfully; and `status --full --json`.program deep-equals
`architecture status --json`.

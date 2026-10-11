# External Review: rc13c-propose-consumes-mechanism (iteration 1)

**Reviewer**: GPT-5 Codex
**Date**: 2026-09-28

## CRITICAL

### Continue deletes a concluded exploration

**File**: src/core/templates/workflows/propose.ts:142
**Description**: The new precedence deliberately sends a both-directories case
to the conflict prompt before inspecting the staging header. `Regenerate from
explore` now reaches the concluded refusal, but `Continue from change` still
says to discard the explore staging directory. Reproduction: create both
`orbit/explore/<name>/` with a concluded header and
`orbit/changes/<name>/`, invoke propose, and choose `Continue from change`;
the shipped instruction deletes the concluded record and its local trail. That
contradicts `orbit-conventions`' concluded outcome, which requires the staging
directory to STAY IN PLACE because it owns the standing re-entry trigger and
the orientation trail, and it defeats this change's preservation goal through
a sibling branch of the same prompt. Make the conflict handling status-aware
so no choice deletes or overwrites concluded staging: either continue from the
active change while preserving the concluded directory, if coexistence is
supported, or refuse that choice. Specify and test all three choices for the
concluded-conflict case.

### The installed skill cannot derive parser-owned states

**File**: src/core/templates/workflows/propose.ts:180
**Description**: The body points at `orbit-conventions`' Mechanism grammar
here, then Step 0c.6 requires the proposing AI to decide membership in
`rules_total`, `rules_open`, and `key_defects`, while deliberately reading no
engine record. The generated `orbit-propose` skill ships only
`pr-choreography.md`; it contains neither the Mechanism production nor the
parser's state precedence and defect rules. In an adopter repository those
internal specs and `explore-rules.ts` are unavailable—the proposal itself uses
that fact to justify mirroring the section list. Reproduction: give consume
mode a live entry with `Closure: SOURCED` and a malformed Domain table. The
shipped body sees the token but contains no executable rule that classifies the
entry as `malformed-entry`, so it cannot deterministically choose row 3 instead
of row 4. Duplicate headings and BOUNDED precedence have the same problem.
Provide a read-only engine surface that returns the fresh form parse, or ship
checked mirrors of the complete Mechanism grammar and parser classification
procedure with parity tests; until then, do not claim that the partition uses
parser-judged states.

## WARNING

### Key defects have no unambiguous record shape

**File**: orbit/changes/rc13c-propose-consumes-mechanism/specs/orbit-propose-modifications/spec.md:22
**Description**: The record requires one row per Mechanism entry with a rule
name, closure token or engine state word, owner state, and destination. A row-1
orphan has no owner and no `rules_open` state, while a duplicate Mechanism
heading has the same ID as the canonical entry and is distinguished by the
parser only through `kind` plus `line`; the record permits `line N` only for an
ID-less rule. The artifact therefore requires rows that its own columns and
naming rule cannot represent without invented sentinels or conflating two
entries. Define the row-1 representation explicitly (for example ID + line +
defect kind, owner `none`, destination `none`), or exclude key defects from the
record and make chat the stated sole disposition. Add orphan and
duplicate-Mechanism-entry scenarios that assert the chosen record shape.

### The four-shape parity test permits extensions

**File**: test/core/templates/orbit-content-fidelity.test.ts:230
**Description**: The test extracts the owner's four-shape clause but checks
only `body.toContain(ownerClause)`. The body can append `, or a fifth shape`
immediately after the exact four-item substring and the assertion still
passes, even though task 2.4 and the test title promise byte equality and the
owner declares this set BOUNDED. Extract the corresponding clause from the
body and compare the two normalized strings for equality (and assert a single
occurrence), rather than testing substring containment.

## SUGGESTION

None.

## Notes

CRITICAL classifications: “Continue deletes a concluded exploration” is
COHERE; “The installed skill cannot derive parser-owned states” is READ. No
CRITICAL is classified ENUMERATE.

The perspective and critical-path lens files are absent, so I skipped
named-lens reviews and walked the consume flow itself from Step 0 through PR
phase 1, Steps 0a/0b/0c/0c.5/0c.6/0d, fingerprinting, and the completion emit.
The direct concluded path and the Regenerate branch are positioned before phase
1; the missed destructive path is the conflict prompt's Continue branch. The
ff body does not consume explorations, so it has no concluded/Mechanism parity
obligation. The architecture citation scan and audit-drift exploration read
have different ownership and do not participate in propose's no-name candidate
selection.

Build, strict change validation, source validation, and all five fingerprint
checks passed; the full suite passed 2,329 tests. Those checks establish
structural integrity but not the critical runtime semantics above: the new
tests pin prose/position, not the availability of parser inputs or preservation
of concluded staging across every conflict choice. The three charter exit
artifacts are present, and the BOUNDED exemplar's two residual lines remain
verbatim in the delta with the design Risks pointer.

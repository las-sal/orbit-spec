## Context

The walk (`/orbit:address-reviews`) records per resolution what it edited (`ripple_cascade.applied`)
and nothing about how it found those sites. `orbit-address-reviews`' `Ripple cascade by default` says so
on purpose: "Cascade trusts the ripple-flag analysis … if ripple-flag analysis didn't surface a file,
cascade doesn't touch it." The analysis itself leaves no trace. The cost is on the record: nearly every
rc-stage since rc13a paid a pass to find wording a walk left behind (explore.md, Premise; D-rc08-5).

Today the walk's write gate (`composeAndWriteEmit`, `case 'address-reviews'` in
`src/core/emit-composition.ts`) validates NO resolution entry: it computes `iteration` and
`next_recommended` and passes `resolutions[]` through. This change adds the first resolution-level checks.
The model is rc02b's reproduction check (`orbit-emit-composition`'s `An internal CRITICAL carries its
reproduction at the write gate`): refuse a record that would be false, at write time only, with no
migration.

Source: `explore.md` (moved into this change), D-rc08-1..5, with three accounted Mechanism entries.

## Goals / Non-Goals

**Goals:**
- A resolved walk entry carries `sweep: {retired, introduced, searched, scope, kept}` (D-rc08-2).
- The write gate refuses a log whose retired wording survives or whose introduced text is absent
  (D-rc08-3). This also closes rc08's job (3): an edit set that half-applied cannot be logged as resolved.
- A later finding can be attributed to the walk entry that missed it, and the engine counts attributions
  (D-rc08-4).
- The VERIFICATION pass grades where the walk says it looked.

**Non-Goals:**
- Checking the SEARCH. `searched` and the judgement behind it are a record (R-crc-10).
- Catching behavioural leftovers that no string identifies. About a third of the record (D-rc08-5) stays
  outside every check and becomes visible only through attribution.
- Walk discovery, the three lanes, the disagreement rule, the T0 next line: rc08b's.
- Re-validating archived walk logs.

## Decisions

**D1 — The shape lives in `orbit-address-reviews`, the checks in `orbit-emit-composition` (R-crc-14).**
The five-key table is stated once, in `A resolved walk entry records its sweep evidence`; the gate
requirement names it and states only what it checks. The same split holds for `ripple_miss_of`. This
is the rc02b layout: the field owner is the payload's capability, the refusal owner is the surface's.

**D2 — Required on `resolved`, forbidden elsewhere, empty arrays legal (D-rc08-2).** `stale`, `deferred`
and `escalated` (the four-value `Disposition` in `src/core/artifact-graph/trail.ts`) edit nothing. An
empty array is the written opt-out, so a walker who claims there is nothing to retire says so on the
record. The explore table's "stale / suppressed / deferred / escalated" row reads as the trail reader's
four values: `suppressed` is a report section, not an outcome.

**D3 — The check scope and the path rule (D-rc08-3, refined by measurement at propose).** The
exploration named the scope (the change directory minus its trail, plus `file`, `ripple_cascade.applied`
and `sweep.scope`). Propose measured how those fields are WRITTEN. Across walk logs since 2026-09-20,
`file` is repo-relative (142) or change-relative (125, e.g. `specs/orbit-conventions/spec.md`), and
`ripple_cascade.applied` is mostly `orbit/changes/<name>/…`, a path that moved at archive. One rule
resolves all but one recorded path: strip `:<line>…`; map `orbit/changes/<name>/` to the change
directory; else the project root; else the change directory. The one failure is free text
(`.openspec.yaml fingerprint (13th stamp)`). Hence the asymmetry the requirement states: an unresolved
LEGACY field (`file`, `applied`) is skipped with a stderr warning, because refusing would break walks over
a field this change does not own; an unresolved `sweep.scope` path is refused, because the field is new
and its only job is to be a path.

**D4 — Matching normalizes whitespace and nothing else.** Collapsing whitespace runs (newlines included)
in both the string and the file catches wrapped phrases, which are common in this repo's 110-column
prose. Markup inside a wrapped phrase is NOT normalized, and that is the requirement's named limit.
Stripping markdown would make the check depend on a markdown model the engine does not otherwise need for
this, and a walker can always retire a shorter string.

**D5 — `ripple_misses` is a computed extension refused in the payload (D-rc08-4).** It is the count of
this walk's attributions. Absent from `payloadFields`, a supplied value is refused by the existing
unknown-key rule. Nothing reads it to decide anything (R-crc-11(h)). rc08a's exit (3) reads it, and the
`regressed` verdict count, by hand.

**D6 — The pointer is keyed as the gate keys resolutions.** `title` trimmed, `file` with the `:<line>`
suffix stripped, by REUSING `stripLineSuffix` from `src/core/artifact-graph/trail.ts` (exported for it),
so a pointer and the gate cannot disagree about which entry is meant, and the rule exists once in code.
Both `trail.ts` and `emit-composition.ts` are hash-pinned in `test/core/rc03b-untouched-modules.test.ts`;
both pins move as recorded acts (proposal walk 1, fresh W2). `walk` is the filename token, and must precede this emit's token
(the collision bump already makes token order write order, per rc03c).

**D6a — One key for a new log's disposition (proposal walk 1, fresh W1, option B).** The trail reader
falls back to the legacy key `status` when `outcome` is absent, and the gate counts that entry resolved. A
new log carrying `status` without `outcome` is refused, so the sweep check cannot be skipped by spelling.
Keying every new check on the reader's fallback (option A) would carry the legacy key into a new
generation of records.

**D6b — `sweep.scope` widens grading, not the residual check's exemption (proposal walk 1, fresh W4,
option A).** The verification pass's residual check names edited files no walk entry lists. `sweep.scope`
lists paths examined, so it joins what is graded and stays out of the exemption, which is each entry's
edit record (`file` ∪ `ripple_cascade.applied`).

**D6c — `--keep-resolved-markers` is a named limit (proposal walk 1, fresh W5, option B).** A retained
marker quoting retired wording is found like any other text; the walker kept-lists the file with the flag
as its `why`. Excluding marker text from matching (option A) would add a marker parser to the gate for a
debug flag.

**D7 — The walk body.** A new sub-step after the ripple cascade, "3d.5 Record the sweep", composes the
five keys. Triage (Step 2) gains the attribution read: for each finding, read the change's earlier walk
logs and, where the finding lies at a site an earlier resolved entry's fix should have reached, write
`ripple_miss_of` with its `kind`. The run-summary schema reference documents both fields and their notes.
Its `json example` blocks (executed by `test/core/reference-roundtrip.test.ts` in a disposable project)
carry `sweep` with `introduced: []` and `scope: []`, because a disposable project has no files for an
`introduced` path to name. The gate's own suite covers non-empty `introduced`.

**D8 — Scenario declarations.** This repo opts in to the scenario map (`scenario_map:` in
`orbit/config.yaml`), so every scenario in the three deltas is tagged at the test that exercises it, or
entered in `orbit/scenario-ledger.yaml`, before archive.

## Alternatives considered

From explore.md's Considered & out:

- **The engine infers the miss kind from file membership.** `scope` is computable; `query` versus
  `judgement` is not, so a partial inference would put two voices on one field. Out.
- **Report survivors instead of refusing.** A walk log claiming `resolved` over wording still on disk is a
  false record. Reporting it would recreate today's leftover-finding pass one step later. Out.

Added at propose:

- **Refuse every unresolved path, legacy fields included.** It would break walks on free-text `file`
  values the walk body has never constrained. Out (D3).
- **Glob support in `sweep.scope`.** Directories cover the cases on record. Globs add a matcher with
  its own semantics for no recorded need. Out.

## Risks / Trade-offs

- [A walker names no retired strings, so the check never fires] → The arrays are written, so the opt-out
  is on the record, and a later miss attributed with `kind: query` or `scope` shows where it was taken.
  Measured by `ripple_misses` (D-rc08-2's FALSIFY move).
- [Behavioural leftovers stay invisible to the check] → Attribution (D-rc08-4); stated as a Non-Goal.
- [The matching limit: markup inside a wrapped phrase] → named in `The walk write gate checks sweep
  evidence`; a shorter retired string avoids it.
- [Attribution is optional judgement; an unattributed miss is invisible] → named in `A ripple miss is
  attributed by the walk that finds it`.
- [Reading every change file per emit] → tens of files; negligible (D-rc08-3's FEASIBILITY move).

## Migration Plan

None. The check runs at write time; walk logs on disk, archived or active, are never re-validated, and
none of them carries `sweep`. The first walk after apply writes the new shape.

## Touchpoints

- `src/core/emit-composition.ts` — the address-reviews resolution checks, path resolution, `ripple_misses`.
- `src/core/templates/workflows/address-reviews.ts` — Step 2 attribution, Step 3d.5, the schema reference and its examples.
- `src/core/templates/workflows/review.ts` — the VERIFICATION branch's sweep-scope sentence.
- `src/core/artifact-graph/trail.ts` — export `stripLineSuffix`.
- `test/core/` — a new walk-gate suite; `emit-schema-parity.test.ts`; `reference-roundtrip.test.ts`; `rc03b-untouched-modules.test.ts` (two moved pins).
- `test/core/templates/skill-templates-parity.test.ts` — the moved hashes.
- `orbit/scenario-ledger.yaml` — entries for scenarios no test can run.

## Mechanism → artifacts

The proposing AI's reading of the file; no engine record.

| rule | closure / state | owner's state | destination |
|---|---|---|---|
| D-rc08-1 | — | `Kind: scope` | not carried (history) |
| D-rc08-2 | SOURCED | live rule | `orbit-address-reviews` / `A resolved walk entry records its sweep evidence`: a normative TABLE |
| D-rc08-3 | DERIVED | live rule | `orbit-emit-composition` / `The walk write gate checks sweep evidence`: a normative TABLE |
| D-rc08-4 | SOURCED | live rule | `orbit-address-reviews` / `A ripple miss is attributed by the walk that finds it`: a normative TABLE (the `kind` set); its pointer check in `orbit-emit-composition` / `A ripple-miss pointer resolves and is counted` |
| D-rc08-5 | — | `Kind: fact` | not carried (history) |

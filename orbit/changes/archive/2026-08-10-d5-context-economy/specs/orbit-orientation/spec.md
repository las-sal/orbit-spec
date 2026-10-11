## ADDED Requirements

### Requirement: Boot render composes cold-start pointers

`orbit status --change <name> --boot` SHALL render the cold-start boot sequence for a change —
ORDERED POINTERS into existing artifacts, never duplicated substance (arc ruling R-d-9(b)'s
`boot_sequence` genre generalized from architect emits to an engine surface; D-arc Stage D5):
the engine position and eligibility line (the existing status computation), the artifact set
(the existing contextFiles resolution), the latest-emit pointers from the trail — one per
command family present on the trail (`apply`, `address-reviews`, `explore`, `verify`,
`review-external` T0, …), with review emits further split per mode (`proposal` / `system` —
architecture-mode review emits persist to the architecture trail and never appear on a
change trail), each rendered as path + `final_assessment` first sentence — the presence of
`explore.md`/`sketches/` as historical context, and the TOUCHPOINTS view — lifecycle-aware: before COMMITTED apply work exists, the predicted
map (design.md's `## Touchpoints` section, when present) — the transition keys on committed
non-bookkeeping files, never on trail presence (an apply emit written at a boundary before its
chunk commit lands stays on the predicted view); once committed apply work exists, the ACTUAL
map (engine-computed `git diff --name-only` from the change's first commit, per the
propose-owned predicted/actual split) with the predicted map alongside as reference — the
ACTUAL map is the CODE map: the change's own files (`orbit/changes/<name>/**` — the same
exclusion audit-drift's divergence arithmetic applies as lifecycle bookkeeping) collapse out
of the list into one summary line carrying their count, never itemized. NO
hand-maintained handoff file exists anywhere in the flow — a boot render is computed fresh per
invocation (the R-d-4 subtraction). The render is READ-ONLY, degrades per this capability's
fault-isolation policy (a missing design.md section or non-git workspace yields an absent
touchpoints line, never an error), and composes with `--json`. The `--json` SHAPE: the
per-change status payload gains ONE typed `boot` object — `artifacts` (the ordered pointer
array, in read order), `emits` (array of `{family, mode?, path, headline}` entries — `mode`
present only for review-family entries; `headline` is the `final_assessment` first sentence),
`history` (`{explore_md: boolean, sketches: boolean}`), `touchpoints`
(`{predicted: string[] | null, actual: string[] | null, actual_change_own_count?: number,
actual_unpredicted?: string[], predicted_unsatisfied?: string[],
malformed?: Array<{line, text}>}` — `actual` null before committed apply work exists and
change-own-free otherwise, `actual_change_own_count` the collapsed change-own file count
(absent when zero), `predicted` null when the section is absent; the three divergence fields
are the ENGINE set-difference serving audit-drift's touchpoints check — `actual_unpredicted`
and `predicted_unsatisfied` present only when both maps are live, `malformed` the line-cited
unparseable entries whenever the section is present), and `skipped_emits` (the
fault-isolation array; absent when empty). Degradation renders as null or field omission per
the same policy, never an error — no implementer invents a second shape.

#### Scenario: Pre-apply boot shows the predicted map

- **WHEN** `orbit status --change foo --boot` runs before any apply commits exist and design.md carries a `## Touchpoints` section
- **THEN** the render shows position/eligibility, the artifact pointers, the latest-emit pointers per command family (review split per mode), and the predicted touchpoints — each entry a pointer or a computed line, nothing hand-maintained

#### Scenario: Post-apply boot shows the actual map

- **WHEN** apply commits exist for the change
- **THEN** the touchpoints view shows the diff-computed actual file list with the predicted map alongside as reference; the actual list is never sourced from prose, and the change's own `orbit/changes/<name>/**` files render only as the collapsed count line

#### Scenario: Degradation without error

- **WHEN** design.md has no Touchpoints section and the workspace is not a git repository
- **THEN** the boot render succeeds with the touchpoints line absent; exit 0

#### Scenario: Boot --json is one typed object

- **WHEN** `orbit status --change foo --boot --json` runs before any apply commits exist
- **THEN** the payload's `boot` object carries ordered `artifacts`, per-family `emits`, `history`, and `touchpoints` with `actual: null`; absent material is omitted or null per the degradation policy, never an error

## MODIFIED Requirements

### Requirement: Fault isolation and malformed-input policy

Fleet collection SHALL isolate faults per workstream — a single damaged workstream or emit
never erases orientation for healthy work: (a) an unreadable, JSON-invalid, or SPINE-INVALID
emit file is EXCLUDED from all arithmetic (consistent with the trail reader's existing skip behavior) and recency
falls back to the next-older valid emit in that trail — spine-invalid means parseable JSON
failing the minimum validity checks orientation renders from: a missing or non-string
`command`, `final_assessment`, or `next_recommended` (the universal-spine fields per
`orbit-conventions`), or, for a `review-external` T0 emit, a missing or non-string `mode` (the
WAITING arithmetic's discriminator); a skipped emit never wins recency, never counts in the
WAITING arithmetic, and never increments the strip's `⟲N` chip counts — but the exclusion is
SURFACED, never silent (D-arc Stage D5's fail-loud seam: a spine-invalid record — from
hand-tampering, a partial copy, or pre-capability tooling; the emit surface's atomic
single-write cannot produce one — must be
detectable, not invisible): the rendered view (bare, `--full`, and the boot render) carries a
one-line degraded note naming the skipped file (`⚠ invalid emit skipped: <filename>`), and
`--json` output carries the same exclusion as a `skipped_emits: ["<filename>", …]` array on
the affected workstream entry (absent when no file was skipped) —
detection without failure, the render still succeeds and exits 0; when NO valid emit
remains, the workstream follows the
emit-less rules (metadata-`created` recency; `last` reports the shared empty-trail line —
`no emits yet`, the same render as a never-emitted workstream; `next` falls
back per the continuity requirement's emit-less scenario — the maturity requirement's Early
canonical string for explores, the engine `next_command` for changes); (b) a workstream whose status computation or metadata load
fails renders a DEGRADED row (name + a one-line error note) while every other workstream
renders normally — the command exits 0 with the degraded row visible, never aborts the view;
when the degraded workstream IS the bare view's sprint, bare renders the degraded row in place
of the strip plus any tuple fields that remain trustworthy (a readable trail still yields
`last`; `next` is omitted with the error note when its source computation failed), the `also`
line, and exits 0;
(c) these fallbacks are deterministic (same inputs, same render) and never consult artifact
contents.

#### Scenario: Corrupt newest emit falls back deterministically

- **WHEN** the sprint workstream's newest emit file is invalid JSON but an older valid emit exists
- **THEN** `last`/`next` render from the older valid emit, the corrupt file is skipped, and repeated invocations render identically

#### Scenario: One broken workstream degrades alone

- **WHEN** one of three active changes has metadata that fails to load
- **THEN** that workstream renders a degraded row with an error note; the other two render fully; exit code 0

#### Scenario: Spine-invalid newest emit is skipped like invalid JSON

- **WHEN** the sprint workstream's newest emit parses as JSON but lacks a `final_assessment` string
- **THEN** the file is excluded, recency and `last` fall back to the next-older valid emit, the file counts in no WAITING arithmetic, and the render carries the one-line degraded note naming the file

#### Scenario: Spine-invalid trail file is detected at the next status render

- **WHEN** a spine-incomplete emit sits on the trail (hand-tampering, a partial copy, or pre-capability tooling — the emit surface's atomic single-write cannot produce one)
- **THEN** the next `orbit status` (any tier, and the boot render) surfaces the `⚠ invalid emit skipped: <filename>` note while excluding the file from arithmetic; exit 0

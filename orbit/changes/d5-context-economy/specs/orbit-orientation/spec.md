## ADDED Requirements

### Requirement: Boot render composes cold-start pointers

`orbit status --change <name> --boot` SHALL render the cold-start boot sequence for a change —
ORDERED POINTERS into existing artifacts, never duplicated substance (arc ruling R-d-9(b)'s
`boot_sequence` genre generalized from architect emits to an engine surface; D-arc Stage D5):
the engine position and eligibility line (the existing status computation), the artifact set
(the existing contextFiles resolution), the latest emit per mode from the trail (path +
`final_assessment` first sentence), the presence of `explore.md`/`sketches/` as historical
context, and the TOUCHPOINTS view — lifecycle-aware: before apply has commits, the predicted
map (design.md's `## Touchpoints` section, when present); once apply commits exist, the ACTUAL
map (engine-computed `git diff --name-only` from the change's first commit, per the
propose-owned predicted/actual split) with the predicted map alongside as reference. NO
hand-maintained handoff file exists anywhere in the flow — a boot render is computed fresh per
invocation (the R-d-4 subtraction). The render is READ-ONLY, degrades per this capability's
fault-isolation policy (a missing design.md section or non-git workspace yields an absent
touchpoints line, never an error), and composes with `--json`.

#### Scenario: Pre-apply boot shows the predicted map

- **WHEN** `orbit status --change foo --boot` runs before any apply commits exist and design.md carries a `## Touchpoints` section
- **THEN** the render shows position/eligibility, the artifact pointers, latest emits per mode, and the predicted touchpoints — each entry a pointer or a computed line, nothing hand-maintained

#### Scenario: Post-apply boot shows the actual map

- **WHEN** apply commits exist for the change
- **THEN** the touchpoints view shows the diff-computed actual file list with the predicted map alongside as reference; the actual list is never sourced from prose

#### Scenario: Degradation without error

- **WHEN** design.md has no Touchpoints section and the workspace is not a git repository
- **THEN** the boot render succeeds with the touchpoints line absent; exit 0

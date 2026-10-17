## Why

Issue #30. The artifact instructions orbit serves at propose (`orbit instructions <artifact>`, read from
`schemas/spec-driven/schema.yaml`) point the agent at `openspec/specs/`, a directory an orbit project does not have:
orbit's baseline lives in `orbit/specs/`. These are the only places the propose flow tells the agent to read the
baseline, so they point it at nothing (see explore.md). The guard that should have caught them, `orbit-cli-name`'s
source scan, matches `OpenSpec` and `Openspec` case-sensitively, so a lowercase path passes it; cli-says-orbit
(2026-10-14) edited `schema.yaml` under that rule and left the paths.

## What Changes

- The four `openspec/specs/` paths become `orbit/specs/`, and nothing else in their sentences changes (D-opf-2):
  `schemas/spec-driven/schema.yaml` lines 17, 39 and 55, and `schemas/spec-driven/templates/proposal.md` line 18.
- `orbit-cli-name`'s source scan reads every file under `schemas/**` for `openspec` in ANY case, under the existing
  admitted list (D-opf-1). Measured 2026-10-17: the four paths are the only lowercase occurrences in `schemas/**`, so
  the rule holds after the fix with no new admission. Every other shipped file keeps the case-sensitive pattern.
- The two comments in `src/core/artifact-graph/resolver.ts` (lines 52 and 97) that name the project schema
  directory `<projectRoot>/openspec/schemas/` say `<projectRoot>/orbit/schemas/`, matching `getProjectSchemasDir`
  (D-opf-3, comment-only).
- `test/core/rc03b-untouched-modules.test.ts` moves three hash pins (`schema.yaml`, `templates/proposal.md`,
  `resolver.ts`) and records the act.

Not changed: whether propose must read the spec of every modified capability (issue #29), and every other lowercase
`openspec` in shipped files (the kept names and legacy paths, the Tier-C scrub's work).

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `orbit-cli-name`: `The old name appears in what the package ships only for an admitted reason` — the source scan
  reads `schemas/**` for any case of `openspec`, and the named limit says so and names the schema copies outside the package (a user-level copy and a project fork).

## Impact

- `schemas/spec-driven/schema.yaml`, `schemas/spec-driven/templates/proposal.md` — the served instructions.
- `test/helpers/cli-name.ts`, `test/core/cli-name.test.ts` — the scan and its scenarios.
- `src/core/artifact-graph/resolver.ts` — two comments; no code moves.
- `test/core/rc03b-untouched-modules.test.ts` — three pins.
- Adopters: a project that already ran `orbit schema fork`, or a user with a schema copy under the global data
  directory's `schemas/`, keeps that copy's stale paths: both outrank the package schema. The fix reaches the
  package schema and every fork made from it after the fix; a fork takes whichever copy resolves.

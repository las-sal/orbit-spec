# Adopter report: the `openspec/` → `orbit/` workspace rename has no migration path

**Reporter:** Sal, via a session in the `home-env-test` adopter project
**Date:** 2026-08-11
**orbit CLI version:** 1.3.1 (`orbit --version`)
**Adopter repo:** `~/code/home-env-test` (uses orbit as its workflow tool; the
dev stack it tests, `~/code/home-env`, is a separate repo still on `openspec/`)

This report is written to stand alone — it assumes no context from the session
that produced it. Every claim below is stated with the command or the
`file:line` that establishes it.

## Symptom

An adopter project that was initialized under the `openspec/` convention and
later updated to orbit 1.3.1 ends up with **two workspace directories**: a
populated legacy `openspec/` and a freshly-scaffolded, empty `orbit/`. The
CLI reads only the latter, so the project's entire spec and change history is
invisible to the tool — silently, with no warning at any point.

In `home-env-test` the split looks like this:

```
openspec/                      # populated, git-tracked
├── config.yaml                # the project's governing context block
├── specs/                     # 7 capability specs
│   ├── device-selection/  host-lifecycle/  matrix-config/
│   ├── matrix-report/     matrix-runner/   retry-policy/
│   └── target-client/
├── changes/archive/           # 3 archived changes (the full audit trail)
└── .orbit-runs/               # 1 audit-drift emit

orbit/                         # scaffolded empty, git-UNTRACKED
├── specs/                     # empty
├── changes/archive/           # empty
└── architecture/              # the only populated tier
```

The `orbit/` scaffolding and a `.claude/` refresh are both timestamped
2026-08-10 22:28, so they were created by the same `orbit init`/`update` run.

## Evidence

The decisive one — the error message names the path the CLI expects:

```
$ orbit spec show target-client
Error: Spec 'target-client' not found at orbit/specs/target-client/spec.md
```

`openspec/specs/target-client/spec.md` exists and is well-formed. Supporting:

```
$ orbit list --specs
No specs found.                    # 7 specs exist under openspec/specs/

$ orbit validate --specs
No items found to validate.

$ orbit instructions
✖ Error: No changes found. Create one with: orbit new change <name>
```

(`orbit list` also reports "No active changes found", but that one is
legitimate — all three of this project's changes are archived, not active.
The spec lookup is the unambiguous signal.)

Notably, `orbit architecture status` works correctly and renders a nine-stage
program. That tier functions **only because the architecture doc happened to
be authored into `orbit/architecture/` during this session**. Had the project
carried a pre-existing architecture doc under `openspec/architecture/`, that
tier would be equally blind. The working architecture tier is what made the
breakage easy to miss.

## Root cause, in orbit's own source

1. **The directory name is a hardcoded constant that was renamed.**
   `src/core/config.ts:1` — `export const OPENSPEC_DIR_NAME = 'orbit';`
   Every resolver derives from it or hardcodes the same literal:
   `src/utils/item-discovery.ts:5` (`orbit/changes`), `:26` (`orbit/specs`),
   `:47` (`orbit/changes/archive`); `src/utils/change-utils.ts:143`
   (`orbit/changes/<name>`); `src/core/init.ts:95,719,720`;
   `src/core/update.ts:89`.

2. **No migration logic exists for the legacy workspace directory.** A search
   for `rename` / `migrateDir` / `moveSync` across `src/core/init.ts`,
   `src/core/update.ts`, and `src/core/legacy-cleanup.ts` returns nothing.
   Neither `init` nor `update` detects a populated `openspec/` beside an empty
   `orbit/`.

3. **`legacy-cleanup.ts` is scoped to AI-tool command directories only.** Its
   table (`:33`–`:52`) covers `.claude/commands/openspec`,
   `.cursor/commands/openspec-*.md`, and the equivalents for ~18 other tools.
   The workspace directory itself is not in scope, so the one component that
   already knows how to clean up legacy layout never looks at it.

4. **`docs/migration-guide.md` is stale against the rename** and actively
   points adopters the wrong way. It still documents the workspace as
   `openspec/` throughout — `:15` ("Clean config in `openspec/config.yaml`"),
   `:27` ("Active changes in `openspec/changes/` — Completely preserved"),
   `:29` ("Main specs in `openspec/specs/` — **Untouched. These are your
   source of truth**"), `:534` ("Ensure the file is at
   `openspec/config.yaml`"), and the "Files After Migration" tree at `:554`.
   An adopter following this guide would conclude the current layout is
   correct.

## Why this is worse than a cosmetic split

The failure is silent and the first destructive step is a normal, recommended
command. In `home-env-test` the very next action was going to be
`/orbit:propose`. That would have:

1. scaffolded a change under `orbit/changes/` — the correct location;
2. computed its delta specs against an **empty** baseline set, because
   `item-discovery.ts:26` finds nothing in `orbit/specs/`;
3. therefore classified every requirement as ADDED, since there is no baseline
   to diff a MODIFIED against;
4. and on `orbit archive`, written those fabricated baselines into
   `orbit/specs/` — producing two divergent spec sets: the real seven
   orphaned in `openspec/`, and a partial fabricated set in `orbit/`.

Recovering from step 4 is materially harder than moving directories
beforehand, and nothing in the flow surfaces a warning before it happens.

Secondary consequence worth calling out: `openspec/config.yaml`'s `context:`
block is documented (in this adopter's `CLAUDE.md`, and in
`docs/migration-guide.md:163`) as **injected into every planning request**.
Under the split, orbit looks for `orbit/config.yaml`, so that block is
silently inert. The adopter believes their conventions are in context on every
request when they are not — which is the kind of failure that shows up later
as unexplained AI drift rather than as an error.

## What the target layout is (confirmed, not inferred)

`orbit-spec`'s own workspace at `~/code/orbit-spec/orbit/` demonstrates the
intended 1.3.1 shape, which resolves several questions an adopter would
otherwise have to guess at:

```
orbit/
├── config.yaml              # config lives here, named config.yaml
├── specs/                   # orbit-address-reviews/, orbit-architect/, ...
├── changes/  changes/archive/
├── architecture/            # + architecture/.orbit-runs/
├── explore/
└── .orbit-runs/             # change-tier trail, distinct from the architecture one
```

So: `orbit/config.yaml` is correct; the change-tier `.orbit-runs` belongs at
`orbit/.orbit-runs/`; and the architecture trail at
`orbit/architecture/.orbit-runs/` is a separate location. The adopter's
`openspec/` layout is **structurally identical** to this — same nesting, same
filenames — which means for adopters the fix is a move, not a conversion.

## Suggested fixes for orbit

Ordered by how much silent damage each prevents.

1. **Detect and refuse to proceed silently.** If a populated `openspec/`
   exists and `orbit/specs/` is empty, every command that resolves specs or
   changes should surface it. A one-line warning would have caught this
   immediately; today the empty result is indistinguishable from a genuinely
   new project.
2. **Ship a migration.** Given the layouts are identical, `orbit init` /
   `orbit update` could offer to move `openspec/` → `orbit/` (merging into an
   existing `orbit/` rather than clobbering it, since the architecture tier
   may already be populated). `git mv` where the repo is a git worktree, so
   history follows the specs.
3. **Fix `docs/migration-guide.md`.** It currently tells adopters that
   `openspec/specs/` is their untouched source of truth, which is now false
   and is the opposite of the action they need to take.
4. **Consider whether `OPENSPEC_DIR_NAME` should have a legacy fallback**
   rather than a hard switch — read `orbit/` when present, fall back to
   `openspec/` with a deprecation warning. This would make the rename
   non-breaking for every existing adopter, not just this one.

## What the adopter is planning (for validation)

Not yet executed — awaiting confirmation from the orbit side.

- `git mv` the contents of `openspec/` into `orbit/`, merging rather than
  replacing (the architecture tier is already there), and keeping
  `openspec/.orbit-runs/` → `orbit/.orbit-runs/` distinct from
  `orbit/architecture/.orbit-runs/`.
- Sweep `openspec/` path references, with **three carve-outs** that a naive
  find-and-replace would corrupt:
  1. **Cross-repo references.** The dev stack under test (`~/code/home-env`)
     is a separate repo that has NOT migrated and still uses `openspec/`.
     Several files in the adopter repo legitimately reference
     `~/code/home-env/openspec/specs/`. These must stay.
  2. **Frozen audit trail.** 25 files under `openspec/changes/archive/`
     reference `openspec/` paths. They describe the world as it was at
     archive time and should not be rewritten.
  3. **Historical narration.** The adopter's `orbit-porting-guide.md`
     documents openspec-orbit v1.0.0, where `openspec/` was genuinely
     correct. That wants a dated note, not a rewrite.
- Verify with `orbit list --specs` returning 7 and `orbit spec show
  target-client` resolving.

## Open questions for the orbit side

1. Is there a supported migration command we missed, or is manual `git mv`
   the intended path today?
2. Was the `OPENSPEC_DIR_NAME` rename intended to be breaking for existing
   adopters, or is a fallback planned?
3. Is `orbit/explore/` (present but empty in `orbit-spec`) the intended intake
   location for reports like this one, or is repo root correct? This file was
   placed at root following the precedent of `openspec-parallel-merge-plan.md`.
4. Does anything else key off the old directory name that an adopter should
   check after moving — telemetry, fingerprints (`orbit fingerprint`), or the
   `.orbit-runs` trail readers?

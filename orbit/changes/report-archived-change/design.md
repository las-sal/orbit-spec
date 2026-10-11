## Context

`orbit status --change <name> --report [<TS>]` renders one review pass through `renderReport` (`src/core/report-render.ts`). The status command resolves the change with `validateChangeExists` (`src/commands/workflow/shared.ts`), which checks only `orbit/changes/<name>/`; `renderReport` then builds `orbit/changes/<name>` itself and `buildReportContext` computes the engine tail through `loadChangeContext` + `formatChangeStatus`, both of which also hard-code the active path. So an archived change fails at the first step: `Change 'rc10-apply-closure' not found`.

Everything else the render reads comes from the change DIRECTORY passed in: the trail listing (`listTrailArtifacts`), the same-mode pass order (`collectSameModePasses`), and the pass genre (`readTrail` + `computePassGenre`). The spine check on `next_recommended` composes the emit's path from the `change` field, not from the file's location, so an archived internal emit validates unchanged.

The emit surface already resolves archived changes for `orbit emit archive` and for `address-reviews`' fallback through `findArchivedDir` (`src/core/emit-composition.ts`, private): the lexically greatest `orbit/changes/archive/<YYYY-MM-DD>-<name>/` match. Q-crc-26's standing recommendation names that pattern.

## Goals / Non-Goals

**Goals:**
- Render any boundary-conformant review pass of an archived change, newest or by token. A pass that predates the D4 report boundary still fails with the `pre-capability emit` error, exactly as it does on an active change: the strict-input rejection is unchanged, so an archived change whose newest pass predates the boundary renders nothing without an explicit `<TS>` naming a later one.
- One resolver for archived directories, shared by the emit surface and the report.
- An archived report's tail says what the engine can honestly compute about an archived change.

**Non-Goals:**
- Archived fallback for any other `orbit status` form (`--boot`, `--scenarios`, the per-change status). Each has its own question about what an archived change means; none is asked here.
- Recomputing gate state over an archived trail.
- Changing the render of an active change in any byte.

## Decisions

**D1 — One shared resolver.** `findArchivedDir` moves out of `emit-composition.ts` into a small module (`src/core/archived-change.ts`) and is exported; the emit surface imports it, and the report resolution calls it. Alternative: a second copy in the status command — rejected, because two copies of one lookup are two rules waiting to diverge (R-crc-14). The move carries one correction: the resolver matches DIRECTORIES only — today it filters entry names, so a regular file `archive/2026-02-01-foo` beats a directory `archive/2026-01-01-foo` — and the emit surface inherits the fix. The containment check travels too: the report refuses an archived directory whose real path lies outside `orbit/changes/archive/`, the same real-path test the emit surface's `assertContained` runs after every archived resolution, so a symlinked archive entry cannot point the report outside the project.

**D2 — The archived tail is one computed line.** The tail of an archived change's report is the `---` rule plus `Archived: orbit/changes/archive/<YYYY-MM-DD>-<name>`. Alternatives:
- *Recompute the gate over the archived directory.* Rejected: gates come from today's schema file, and the archived trails were written under `spec-driven` versions 2 through 5, whose cadences differ (a v2-era trail has no `invoked` slot to satisfy). The render would grade old work against rules it never ran under, and the archive emit's `judgements` already record what was believed at archive time.
- *Render the bare `---` rule.* Rejected: that is the ungated-schema form, so an archived change would be indistinguishable from an ungated one — a computed absence presented as a different computed absence.

**D3 — Resolution order is active, then archived.** The same order the emit surface uses for `address-reviews`. A name that is both active and archived (a re-proposed name) renders the active change, which is the one a reader is working on. `validateChangeName` runs first, so a traversal name never reaches either lookup.

**D4 — `renderReport` takes the resolved location, optionally.** `renderReport(projectRoot, change, ts?, location?)` gains an OPTIONAL fourth argument `{ changeDir, archived }`; when it is absent the location is the ACTIVE directory `orbit/changes/<change>` with `archived: false`, exactly today's behaviour. `buildReportContext` composes the archived line when `archived` is true and the live tail otherwise. The status command's `--report` branch does the resolution, owns the miss error, and passes the location. `orbit emit review --render` (`src/commands/emit.ts`) keeps calling `renderReport('.', changeName)`: a review emit only ever targets an active change, so the default is its location. Alternatives: a REQUIRED argument — rejected, because it edits `emit.ts` and some sixty test call sites for no change in behaviour; resolve inside `renderReport` — rejected, because the miss error belongs to the command that names the available changes, as it does today.

**D5 — The miss error names both places.** `Change '<name>' not found — checked orbit/changes/<name> and orbit/changes/archive/*-<name>`, followed by `. Available changes:` and the active change names when any exist, and by nothing more when none do.

## Risks / Trade-offs

- [A reader may expect the gate state of an archived change] → what was believed at archive time is recorded in the archive emit's `judgements`, in the same archived trail; the archived line names that directory.
- [The fallback makes `--report` resolve differently from the other status forms] → stated in the gateway requirement ("`--report`'s alone"), and the non-goal is recorded here so a later change asks the question per form.
- [Carrying four MODIFIED blocks carries their eighteen existing scenarios] → each needs a `@scenario` declaration once apply passes (the scenario map reports them at ERROR after the apply gate); tasks include tagging the existing tests that already exercise them. `Strict input validation` is carried only to qualify one THEN (its eligibility-line clause now reads "on an active change"); its scenario titles are unchanged, so the tags already pointing at it keep matching.

## Touchpoints

- `src/commands/workflow/status.ts` — the `--report` branch resolves active-then-archived and owns the miss error.
- `src/core/report-render.ts` — `renderReport` takes the resolved location; `buildReportContext` composes the archived tail.
- `src/core/archived-change.ts` — new: the shared archived-directory resolver.
- `src/core/emit-composition.ts` — imports the resolver instead of its private copy.
- `test/core/report-render.test.ts` — resolution, the archived tail, the miss error, read-only.
- `test/fixtures/report-golden/` — a golden for the archived tail.

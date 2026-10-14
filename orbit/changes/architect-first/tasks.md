## 1. Archive emit's next (D-af-3)

- [ ] 1.1 In `src/core/emit-composition.ts`, case `archive`: read the archived directory's `.openspec.yaml` and compose `next_recommended` by `orbit-emit-composition`'s two forms (cited with the doc file present; anything else, including unreadable metadata, never refusing the emit)
- [ ] 1.2 Tests for the cited, uncited, dangling-doc and unreadable-metadata cases; re-point the tests that pin the old "Change archived. Run /orbit:new or /orbit:explore …" string
- [ ] 1.3 In the archive body (`src/core/templates/workflows/archive-change.ts`): update the example payload to the uncited string, and restate the prose that calls `next_recommended` the engine's fixed post-archive line (it now follows the citation)

## 2. Idle `orbit status` next (D-af-2)

- [ ] 2.1 In `src/core/orientation.ts`, compute the idle next on rungs 2 and 3 from the newest emit by the LAST band's recency rule: the recorded string when it begins with `/orbit:`, else `/orbit:architect <name>`
- [ ] 2.2 In `src/commands/workflow/status.ts`, render `Ready when you are: <next>` after the `--full` view (rung 2) and after `No active changes.` (rung 3); add `next` to both rungs' bare `--json` shapes, and none to an explicit `--full`
- [ ] 2.3 Tests: rung 2 with a command-led LAST, rung 2 with a prose LAST, rung 3 with no emit, rung 3 with a recorded `/orbit:explore …` (kept as recorded), both rungs' JSON, and an explicit `--full` carrying no top-level `next`

## 3. CLI start hints (D-af-5)

- [ ] 3.1 `src/core/init.ts`: the getting-started block becomes one line naming `/orbit:architect <name>`; remove the unreachable `/orbit:new` branch
- [ ] 3.2 `src/core/update.ts` and `src/ui/welcome-screen.ts`: the getting-started and quick-start lists read `/orbit:architect`, `/orbit:explore`, `/orbit:propose`
- [ ] 3.3 `src/commands/workflow/status.ts`: the rung-3 message becomes `No active changes.`; `src/commands/workflow/shared.ts`: the two no-changes errors name `/orbit:architect <name>` and not `orbit new change`; re-point the tests that pin the old text

## 4. Generated bodies (R-rda-2, D-af-6)

- [ ] 4.1 `src/core/templates/workflows/architect.ts`: restate the "Never a gatekeeper" paragraph to the architect-first canonical flow, keeping that a session is never required
- [ ] 4.2 `src/core/templates/workflows/onboard.ts`: the flow architect → the per-change phases (once per change) → architect to ratify, in the diagram and paragraphs (the architect paragraph stating the session is never required and explore remains the one-off path); reword explore's "Thinking-mode entry" label; the concrete-idea nudge naming `/orbit:architect <name>`
- [ ] 4.3 Rebuild and refresh the generated surface (`npm run build && node bin/orbit.js update --force`); re-pin the moved template hashes

## 5. Start-surfaces test (D-af-4, G1)

- [ ] 5.1 Add a test asserting `orbit-architect`'s strict rows: the archive next for a cited and an uncited change, `orbit init`'s getting-started output, the first line of `orbit update`'s and the welcome screen's lists, idle `orbit status`'s fallback, and the no-active-changes message and the two no-changes errors (raised by `orbit status --change` and `orbit instructions`) name `/orbit:architect` (or, for the message, no command) and none of `/orbit:explore`, `/orbit:new` or `/orbit:propose` as where to start; mutation-check that it fails on each old string
- [ ] 5.2 Assert the onboard body's prose row: `/orbit:architect` appears before any other start command in its flow and nudge

## 6. Residual and records

- [ ] 6.1 Run D-af-4's residual method: grep the generated bodies and the CLI's user-visible strings for "start", "begin", "first change", "new work", "entry" and "create", classify each hit against the start-surfaces table, and fix or record any surface it finds
- [ ] 6.2 Declare every scenario of the carried blocks (`@scenario` tags or `orbit/scenario-ledger.yaml` entries) so the scenario map reports none undeclared
- [ ] 6.3 Full `npm test` and `orbit validate architect-first --strict` green
- [ ] 6.4 At archive, edit `orbit-architect`'s Purpose in place to the architect-first stance: architect first and returning to architect, never required
- [ ] 6.5 (User-validation) In a scratch directory, run `orbit init` and then bare `orbit status`: both name `/orbit:architect <name>` as where to start

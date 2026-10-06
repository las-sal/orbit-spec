> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: rc17d-external-runner

## Premise

Stage `rc17d-external-runner` (`clean-up-review-cycle.md`, split from rc17b 2026-10-06 under D-rc17b-1). A
recorded per-user runner launches every external review with no paste; without one, today's handoff is
unchanged; a runner on PATH but not recorded is never launched. Capabilities: an ADDED runner capability,
`orbit-review-external`, `orbit-conventions`. The rules come from rc17a's archived exploration (D-bpc-1's
dispatch, D-bpc-2, D-bpc-11; D-bpc-5 and -14 as scope readings) and are re-entered below under this stage's
IDs, because their Mechanism entries were written for the pair and must be re-read for a single external.

### Measured 2026-10-06 — the ground the record lands on

- `src/core/global-config.ts`: `GlobalConfig {featureFlags, profile, delivery, workflows}` in
  `<XDG config>/openspec/config.json`; invalid JSON warns and falls back to defaults.
- `orbit config` (upstream CLI) already reads and edits that file: `path | list | get | set | unset | reset |
  edit | profile`. `src/core/config-schema.ts` REJECTS an unknown top-level key (`KNOWN_TOP_LEVEL_KEYS`), so a
  new field must be registered there or `orbit config set` refuses it.
- `orbit init` is interactive (`@inquirer/prompts`) with a non-interactive `--tools` path; it has no setup
  step for anything outside tool selection today.

## Mechanism

### D-rc17d-1 — a recorded and reachable runner launches the external half; otherwise the prompt is printed for paste
Domain: the runner's state when `/orbit:review --reviewer external` packages a prompt
| member | covered by |
|---|---|
| recorded, `argv[0]` resolves on PATH | after the handoff commit (D-rc17d-6), launched in the background in a throwaway `git worktree` at that commit, prompt on stdin, return written to `{output}` outside the repository |
| recorded, `argv[0]` does not resolve | the prompt is printed for paste, naming the unresolved command — today's handoff |
| nothing recorded | today's handoff, unchanged (exit 2) |
| launched, exits non-zero or times out (including a runner not signed in) | no pass file; the failure is reported with its exit status and the paste invocation is printed as the fallback; the T0 stands, so the gate keeps presenting the external half |
| the return opens with lines above `# External Review:` | normalized per Q-rc17d-3, the removed lines quoted in the commit message |
| the return carries no `# External Review:` heading | treated as a failed run (row 4); the raw return is kept outside the repository and its path named |
Closure: BOUNDED — the failure rows are those observed on one runner (Codex, rc08b and rc17a) plus the absent and unresolved cases
Residual kind: a return that opens with the heading and parses yet is not a complete review (a truncated run)
Residual method: running the three external readers over the return and reading its `**Reviewer**:` line at each runner's first recorded use
Moves:
- READ: applied — the trail reader and the renderer refuse a file without the `# External Review:` header (`report-render.ts`, "missing '# External Review:' header"); the Codex preamble above it was observed on rc08b and again on rc17a
- ENUMERATE: applied — this table
- COHERE: applied — the paste fallback IS today's handoff branch, so exit (2) and the unresolved and failed rows are one path
- EXECUTE: not applied — nothing built yet; a disposable-repo run with a stub runner (success, non-zero, no heading, preamble) is owed at apply
- FALSIFY: applied — a reachability probe cannot see sign-in state; a signed-out runner therefore launches and fails, and row 4 must cover it rather than the probe
- CONFORM: applied — no-chaining (the user typed `--reviewer external`; launching is the half they named); D6 / D-d6-7 (the body runs the process, never the engine); D11 Claude primacy (background Bash named)
- FEASIBILITY: applied — external runs outlast the ten-minute foreground limit, so the launch is background and the body waits on its completion notification
- CONSUME: applied — the trail reader consumes the committed return; the worktree keeps a still-running runner from reading edits made in the main checkout meanwhile, the same isolation rc17b's pair needs
- INVOKE: applied — fires at every `--reviewer external` (and, from rc17b, every pair's external half)

### D-rc17d-2 — a runner is used only through the user's explicit record
Domain: the ways an external runner could come to be used
| member | covered by |
|---|---|
| the user records the Codex preset | the engine resolves it to the argv in orbit's source (D-rc17d-5) |
| the user records an argv of their own | used as recorded, under D-rc17d-5's contract |
| the user records nothing | no runner: today's handoff |
| a runner binary is on PATH with nothing recorded | NOT a record: nothing launches; init may OFFER the preset because it is present (D-rc17d-4), and nothing else reads PATH |
| a recorded runner later removed or broken | D-rc17d-1 rows 2 and 4 |
| a runner named in a committed per-repo file | never read: cloning a repo must not make the cloner's AI run the repo's command (rc07's reason for refusing `command:`) |
Closure: SOURCED — a runner is used only through the record, so the members are the record's three states plus the three unrecorded-world states
Moves:
- READ: applied — rc07's refusal of a `command:` field in `orbit/sources.yaml`
- ENUMERATE: applied — this table
- COHERE: applied — PATH is read at exactly one place (init's offer), and only to choose what to offer, never what to run
- EXECUTE: not applied — nothing built yet
- FALSIFY: applied — a launch keyed on PATH presence would send the repository to a third party unasked; row 4 is the guard
- CONFORM: applied — Sal 2026-10-05 (the user decides how it is configured); exit (3) of the stage
- FEASIBILITY: not applied — one record
- CONSUME: applied — D-rc17d-1 reads the record only through D-rc17d-3's surfaced field
- INVOKE: applied — written at setup; read at every external packaging

### D-rc17d-3 — the record lives in the per-user global config; the engine surfaces it, never executes it
Domain: every surface the record passes through, and its fallback states
| member | covered by |
|---|---|
| where it is stored | a new optional `externalRunner` field on `GlobalConfig` in `<XDG config>/openspec/config.json`, registered in `config-schema.ts`'s known keys so `orbit config` accepts it |
| who writes it | `orbit init` and `orbit config` (D-rc17d-4) |
| who reads it | the engine, surfacing the RESOLVED form (`none`, or an argv with its placeholders) in `orbit status --json`, as the `pr` scalar is surfaced |
| who executes it | the review body, under the user's `--reviewer external`; never the engine |
| the field absent | `none`: today's handoff |
| the field malformed (D-rc17d-5's refused shapes) | warns, naming the field and the reason, and resolves to `none`, as the `pr:` scalar's inert values do |
| the global file is invalid JSON | `getGlobalConfig()`'s existing fallback to defaults, with its warning: `none` |
Closure: SOURCED — the record's path is store → write → read → execute, each a row, plus the three ways it can be missing or bad
Moves:
- READ: applied — `global-config.ts` (`GlobalConfig`, the XDG path, invalid JSON falls back with a warning); `config-schema.ts` rejects unknown top-level keys unless `--allow-unknown`
- ENUMERATE: applied — this table
- COHERE: applied — the review preference (project, `orbit/config.yaml`) and the runner (machine) are two records read at one invocation; neither reads the other
- EXECUTE: not applied — nothing built yet
- FALSIFY: applied — an unregistered key would make `orbit config set` refuse the very edit path D-rc17d-4 relies on; the registration row closes it
- CONFORM: applied — D6 / D-d6-7 (zero engine processes); rc07 (no executable repository data)
- FEASIBILITY: applied — one optional field, one resolver, one status field
- CONSUME: applied — the body reads the resolved argv from status JSON and carries no preset knowledge of its own
- INVOKE: applied — resolved on every `orbit status --json`; read at every external packaging

### D-rc17d-4 — init offers the record; `orbit config` edits it
Domain: the writers of the record, by mode
| member | covered by |
|---|---|
| `orbit init`, interactive, no record | one setup step explaining the concept; offers the Codex preset when `codex` resolves on PATH, an own argv, or none |
| `orbit init`, interactive, a record present | shows the current record; the default answer keeps it |
| `orbit init`, non-interactive (`--tools`) | no prompt; the record is untouched |
| `orbit config set externalRunner.preset codex` | records the preset (a string; `config set` coerces only scalars) |
| an own argv | `orbit init`'s step or `orbit config edit`; `config set` cannot write an array |
| `orbit config unset externalRunner` | back to none |
Closure: DERIVED — two writers (init, config) by their modes; every mode is a row
Moves:
- READ: applied — `coerceValue` returns string, number or boolean only; `orbit config` has `set`, `unset`, `edit`
- ENUMERATE: applied — this table
- COHERE: applied — both writers write the one field D-rc17d-3 registers; neither has a second store
- EXECUTE: not applied — nothing built yet
- FALSIFY: applied — "re-run init to change" would make a runner change re-run the whole tool setup; the config path removes that
- CONFORM: applied — D-rc17b-1 (the setup note lives in init's output, so `orbit-onboard` is untouched)
- FEASIBILITY: applied — one prompt step; no new command
- CONSUME: applied — D-rc17d-3's resolver reads what either writer wrote
- INVOKE: applied — at `orbit init` and at the user's `orbit config` edits

### D-rc17d-5 — the record is a preset name or an argv array, never a shell string
Domain: the record's shapes
| member | covered by |
|---|---|
| `{preset: "codex"}` | resolved by the engine to `codex exec -C {worktree} -s read-only -o {output} -`, the argv in orbit's source (no model flag: the user's Codex config chooses) |
| `{argv: [...]}` containing `{output}` | used as recorded; `{worktree}` and `{output}` substituted; the prompt always arrives on stdin |
| `{argv: [...]}` without `{output}` | malformed: the return would have nowhere to land |
| a string (a shell command line) | malformed: nothing runs through a shell |
| an unknown preset, both keys, or neither | malformed |
Closure: SOURCED — the field's type is `{preset}` or `{argv}`, and every value is one of these rows
Moves:
- READ: applied — the Codex invocation used since 2026-10-04 (read-only sandbox, `-o` capture, prompt on stdin, no model flag) and its observed behaviour under read-only
- ENUMERATE: applied — this table
- COHERE: applied — stdin-only prompt delivery keeps the prompt byte-for-byte, the blindness requirement; `{output}` outside the repository keeps the return out of the tree until it is normalized
- EXECUTE: not applied — nothing built yet
- FALSIFY: applied — under a read-only sandbox the reviewer cannot write or commit the findings file the prompt names; the prompt already requires its final message to be the complete findings markdown, which `-o` captures, so the prompt needs no per-route variant
- CONFORM: applied — rc07 (no shell field); D11 (the Codex preset is a named tool, kept)
- FEASIBILITY: not applied — two shapes
- CONSUME: applied — D-rc17d-1 runs the resolved argv; the normalization step reads `{output}`
- INVOKE: applied — resolved at every `orbit status --json`

### D-rc17d-6 — the handoff commit is the launch base; the return is committed alone and pushed
Domain: the files and acts around one launched external half
| member | covered by |
|---|---|
| the prompt file and T0 emit | committed and pushed before launch, exactly as today's handoff preflight requires; that commit is the worktree's base |
| the normalized return | saved as `external-<mode>-<TS>.md` on the trail and committed ALONE, the removed lines quoted in the message, then pushed |
| a failed run | nothing committed; the T0 stands |
| a failed push | reported; the commit stands; no retry |
| the worktree | removed after the return is read; a failed removal is reported, never fatal |
Closure: DERIVED — the path writes the packaging pair and at most one pass file; each is a row, plus the push and the worktree
Moves:
- READ: applied — `orbit-review-external`' `Handoff preflight blocks unusable pull invocations`; `orbit-conventions`' Residual outward-actions rule covers only acts not designed into a step, and Sal ruled 2026-10-05 that designed steps may commit and push
- ENUMERATE: applied — this table
- COHERE: applied — the same commit and push pair D-bpc-3 gives the pair, so rc17b reuses this path
- EXECUTE: not applied — nothing built yet
- FALSIFY: applied — committing the return with other work would move the VERIFICATION confirm's residual-check base; committing it alone keeps that base exact
- CONFORM: applied — D-d6-7 (all git is body choreography); no-chaining (no walk follows)
- FEASIBILITY: not applied — two commits and two pushes at most
- CONSUME: applied — the trail reader orders by token; the residual check reads the commit that added the pass file
- INVOKE: applied — after the runner returns

## Decisions

- **2026-10-06 — D-rc17d-1: a recorded and reachable runner launches the external half; otherwise the prompt is printed for paste** — re-entered from D-bpc-1 (rc17a archived exploration) for this stage, which ships the single `--reviewer external` path first; the pair's half reuses it in rc17b. Mechanism entry written for the single external path.
  Kind: rule
- **2026-10-06 — D-rc17d-2: a runner is used only through the user's explicit record; presence on PATH launches nothing** — re-entered from D-bpc-2 and D-bpc-5.
  Kind: rule
- **2026-10-06 — D-rc17d-3: the record lives in the per-user global config and the engine surfaces it, never executes it** — re-entered from D-bpc-11; the measured `orbit config` CLI and its key whitelist are facts the source entry did not read.
  Kind: rule

- **2026-10-06 — D-rc17d-4: init offers the record; `orbit config` edits it** — resolves Q-rc17d-1 (Sal: "go with the leanings"). `config set` writes only scalars, so an own argv goes through init or `orbit config edit`.
  Kind: rule
- **2026-10-06 — D-rc17d-5: the record is a preset name or an argv array, never a shell string** — resolves Q-rc17d-2 (Sal: "go with the leanings"). The prompt always arrives on stdin; `{output}` is required.
  Kind: rule
- **2026-10-06 — D-rc17d-6: the handoff commit is the launch base; the return is committed alone and pushed** — resolves Q-rc17d-4 (Sal: "go with the leanings").
  Kind: rule
- **2026-10-06 — D-rc17d-7: the T0 record's paste/save `next_recommended` stays as written; it states the manual fallback** — Sal: "a" (architect session, 2026-10-06). `orbit-run-summary-emit` requires the T0's next to be the user's paste/save action and `orbit-emit-composition` composes it; a launched runner makes it stale while the run is in flight. Kept as a NAMED LIMIT in the `orbit-review-external` delta (the launch is reported in chat) rather than a launch-aware record, which would add those two capabilities. Follow-up, not this stage.
  Kind: scope

## Open questions

- **Q-rc17d-3: who normalizes the return (strip lines above `# External Review:`)?** Required, not cosmetic: the trail reader and the renderer refuse a file whose header is not `# External Review:`.
  Standing recommendation: a body step for now — remove only the lines before the first `# External Review:` line, quote them in the commit message, touch nothing from the heading on; an engine command for it belongs to rc12-engine-owned-choreography if it ever moves.


## Considered & out

## References

- `orbit/architecture/clean-up-review-cycle.md` — Stage rc17d-external-runner (charter, exits).
- `orbit/explore/rc17b-blind-pair-command/explore.md` — D-rc17b-1 (the split).
- `orbit/changes/archive/2026-10-06-rc17a-invoked-coverage/explore.md` — D-bpc-1, -2, -5, -11, -14 and their Mechanism entries.
- `src/core/global-config.ts`, `src/core/config-schema.ts`, `src/commands/config.ts`, `src/core/init.ts`.
- `src/core/templates/workflows/review.ts` — `REVIEW_EXTERNAL_HANDOFF_REFERENCE` and its preflight.
- `orbit/specs/orbit-review-external/spec.md` — `Handoff preflight blocks unusable pull invocations`, `Command does not run the review or ingest findings`.

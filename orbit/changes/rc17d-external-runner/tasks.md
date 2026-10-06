## 1. The runner record

- [ ] 1.1 Add the optional `externalRunner` field to `GlobalConfig` (`src/core/global-config.ts`) and register it among `config-schema.ts`'s known top-level keys; test that `orbit config set externalRunner.preset codex` succeeds without `--allow-unknown`
- [ ] 1.2 Create `src/core/external-runner.ts` with the resolver: `{preset: "codex"}` → `codex exec -C {worktree} -s read-only -o {output} -`; `{argv}` with `{output}` used as recorded; every refused shape in the shape requirement's table resolves to `none` with a warning naming the field and reason; invalid JSON falls back through `getGlobalConfig()`
- [ ] 1.3 Add `reachable` — a `PATH` lookup of `argv[0]` that executes nothing
- [ ] 1.4 Unit-test the resolver over every row of the shape table and the storage table (absent, malformed, invalid JSON, preset, own argv), and that the preset carries no model flag

## 2. The `orbit external` commands

- [ ] 2.1 Add `src/commands/external.ts` and register the `external` group in `src/cli/index.ts`: `orbit external runner [--json]` prints the resolved record
- [ ] 2.2 Implement `orbit external save <change> --as <proposal|system> --from <path> [--json]`: remove only the lines before the first line beginning `# External Review:`, write `external-<mode>-<TS>.md` with the emit surface's collision bump against every trail file, print the path and the removed lines
- [ ] 2.3 Refuse, with a non-zero exit and nothing written: a return with no heading line, `--as architecture`, a change that does not exist
- [ ] 2.4 Unit-test the save command: preamble removed and reported, bytes from the heading unchanged, no-heading refusal, token bump on collision, the refusals in 2.3

## 3. Init's setup step

- [ ] 3.1 Add the interactive setup step to `src/core/init.ts`, gated by init's existing interactivity predicate: explain the runner in init's own output; offer the Codex preset (only when `codex` resolves on `PATH`), an own argv, or none; a present record is shown and kept by default
- [ ] 3.2 Test the step: preset offered only when `codex` resolves; `none` writes nothing; a present record is kept by default; non-interactive init shows no prompt and leaves the record unchanged

## 4. The review body's launch branch

- [ ] 4.1 In `REVIEW_EXTERNAL_HANDOFF_REFERENCE`, read `orbit external runner --json` at the preflight step; with `none` or `reachable: false` the branch is unchanged (the unresolved command named in the latter case)
- [ ] 4.2 Write the launch path: dirty tree before the prompt is written → no launch, the blocked output naming the runner; clean → `git commit --only` the prompt and the T0 (the handoff commit), push (a failed push or no remote reported, the launch proceeds), set the T0's `target` to the runner's name
- [ ] 4.3 Write the run: `git worktree add --detach` at the handoff commit outside the repository; launch the resolved argv in the background (named tool idiom: background Bash) with the prompt file on stdin and `{output}` outside the repository; wait on the completion notification
- [ ] 4.4 Write the return: `orbit external save`; commit the saved file alone with the removed lines quoted; push; remove the worktree (a failed removal reported, never fatal); render the return's report; a failed run commits nothing, reports the exit status and the raw return's path, and prints the paste invocation
- [ ] 4.5 Rewrite the reference's chat-output items to the two scenarios of `Prompt written to versioned file with chat invocation snippet` (no-launch, unchanged; launch, the runner line and the launch attestation), and its "Out of scope" section to the new rule (runs only through the recorded runner; never ingests)
- [ ] 4.6 Template tests: the no-runner path's reference text for the paste route is unchanged; the launch branch names `orbit external runner --json`, `orbit external save`, the worktree, stdin delivery and the commit-alone step; no shell-string invocation appears
- [ ] 4.7 `npm run build && node bin/orbit.js update --force`; confirm the generated `references/external-handoff.md` carries the branch

## 5. End-to-end

- [ ] 5.1 Disposable-repo test with a stub runner recorded as an own argv: success (the saved return is one commit, pushed to a bare remote), a preamble (removed and quoted), no heading (nothing committed, paste printed), non-zero exit (nothing committed, paste printed)
- [ ] 5.2 Exit (3) test: a stub runner on `PATH` named `codex` with no record → `orbit external runner --json` prints `none` and nothing launches
- [ ] 5.3 Declare every delta scenario (`@scenario` tags or `orbit/scenario-ledger.yaml` entries) and check `orbit status --change rc17d-external-runner --scenarios`
- [ ] 5.4 Full `npm test` green; `orbit validate rc17d-external-runner --strict`
- [ ] 5.5 (User-validation handoff) Record the Codex preset with `orbit config set externalRunner.preset codex` and run this change's system review as `--reviewer external`: it launches with no paste and its return is committed without hand edits (exit 1)

## 6. At archive

- [ ] 6.1 Sync the three deltas through the engine's merge and byte-verify every block
- [ ] 6.2 Close 5.5 by observation when the system review's external half ran through the runner
- [ ] 6.3 Correct `orbit-review-external`'s Purpose paragraph by hand ("Does NOT run the review" → runs only through a recorded runner; never ingests findings)

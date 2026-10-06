## 1. The runner record

- [x] 1.1 Add the optional `externalRunner` field to `GlobalConfig` (`src/core/global-config.ts`); register it among `config-schema.ts`'s known top-level keys and admit exactly one nested path under it, `externalRunner.preset`; put the record's shape into `validateConfig`, so `orbit config set` refuses a result of a refused shape with a message naming `orbit config unset externalRunner`
- [x] 1.2 Create `src/core/external-runner.ts` with the resolver: `{preset: "codex"}` → `codex exec -C {worktree} -s read-only -o {output} -`; `{argv}` with `{output}` used as recorded; every refused shape in the shape requirement's table resolves to `none` with a warning naming the field and reason; invalid JSON falls back through `getGlobalConfig()`
- [x] 1.3 Add `reachable` — a `PATH` lookup of `argv[0]` that executes nothing — and `name` (the preset's name, or the basename of `argv[0]`)
- [x] 1.4 Unit-test the resolver over every row of the shape table and the storage table (absent, malformed, invalid JSON, preset, own argv), that the preset carries no model flag, and the config path: `set externalRunner.preset codex` succeeds on no record and is refused over a recorded argv

## 2. The `orbit external` commands

- [x] 2.1 Add `src/commands/external.ts` and register the `external` group in `src/cli/index.ts`: `orbit external runner [--json]` prints exactly one of the three JSON shapes the storage requirement fences on standard output, every warning on standard error
- [x] 2.2 Implement `orbit external save <change> --as <proposal|system> --from <path> [--launch <token>] [--json]` in the requirement's eight steps: read; drop a leading byte-order mark; cut at the first `# External Review:` line outside every fence by the shared fence tracker (`src/core/markdown-fence.ts`); refuse a heading naming another change; check the result with the trail reader; with `--launch`, refuse when an `apply-*.json` token is later; write `external-<mode>-<TS>.md` with the emit surface's collision bump; print `{"path", "removed"}`
- [x] 2.3 Refuse, with a non-zero exit, the cause on standard error and nothing written: no unfenced heading, another change's heading, a reader rejection, a later apply, a missing or unreadable `--from`, `--as architecture`, a change that does not exist
- [x] 2.4 Unit-test the save command over every row of its table, including the proposal walk's reproduction (a fenced clean review in the preamble, then a review carrying a CRITICAL: the saved file keeps the CRITICAL), a heading-only return, a byte-order mark, trailing text kept, and the token bump

## 3. Init's setup step

- [x] 3.1 Add the interactive setup step to `src/core/init.ts`, gated by init's existing interactivity predicate: explain the runner in init's own output; offer the Codex preset (only when `codex` resolves on `PATH`), an own argv typed as one JSON array and checked against the shape table (a refused value asks again), or none; a well-formed record is shown and kept by default; a malformed one is shown with its warning and offered the three choices
- [x] 3.2 Test the step: preset offered only when `codex` resolves; `none` writes nothing; a refused JSON array asks again; a well-formed record is kept by default; a malformed one is not kept by default; non-interactive init shows no prompt and leaves the record unchanged

## 4. The review body's launch branch

- [x] 4.1 In `REVIEW_EXTERNAL_HANDOFF_REFERENCE`, read `orbit external runner --json` at the preflight step; with `{"runner": null}` the branch is unchanged; with `reachable: false` it is unchanged but for the one item naming the unresolved command
- [x] 4.2 Write the launch path: a dirty tree before the prompt is written → no launch, nothing written, the cause and "commit, then re-run"; clean → `git add` then `git commit --only` on the prompt and the T0 (the handoff commit), push (a failed push or no remote reported, the launch proceeds), the T0's `target` set to the runner's name, the prompt's `## Repo` filled with the runner's working directory
- [x] 4.3 Write the run: `git worktree add --detach` at the handoff commit outside the repository; substitute `{worktree}` and `{output}`; launch in the background (named tool idiom: background Bash) with the worktree as working directory, every element single-quoted (`'` as `'\''`), the prompt by `<` redirect, never `sh -c` on a recorded string; print the raw output path and the manual `orbit external save` recovery; wait on the completion notification
- [x] 4.4 Write the return: `orbit external save … --launch <T0 token>`; `git add` then `git commit --only` on the saved file alone, removed lines quoted; push; `git worktree remove --force` (a failed removal reported, never fatal); render the return's report; every attestation says "pushed" only when the push landed; a failed run (non-zero exit, or any save refusal) commits nothing, reports the cause and the raw path, and prints the pull invocation when the handoff push landed or the handoff-blocked output when it did not
- [x] 4.5 Rewrite the reference's opening paragraph ("Does NOT run the review … solely to package the handoff"), its "emits two things" intro, its chat-output items (the no-launch list plus the unresolved-runner item; the launch scenario's items) and its "Out of scope" section to the new rule (runs only through the recorded runner; never ingests)
- [x] 4.6 Template tests: the no-runner path's reference text for the paste route is unchanged; the launch branch names `orbit external runner --json`, `orbit external save --launch`, the worktree as working directory, the quoting rule, stdin by redirect and the commit-alone step; no `sh -c`
- [x] 4.7 `npm run build && node bin/orbit.js update --force`; confirm the generated `references/external-handoff.md` carries the branch and none of the old opening phrasing

## 5. End-to-end

- [x] 5.1 Disposable-repo harness test that runs the reference's launch commands TRANSCRIBED (the PR-lifecycle harness's instrument, with its limit stated in the test: it proves the commands, not that an agent follows the body) with a stub runner recorded as an own argv whose `argv[0]` path holds a space and a quote: success (the saved return is one commit, pushed to a bare remote), a preamble (removed and quoted), no heading (nothing committed, paste fallback), non-zero exit (nothing committed, paste fallback), a failed handoff push (blocked-handoff fallback)
- [x] 5.2 Exit (3) test: a stub runner on `PATH` named `codex` with no record → `orbit external runner --json` prints `{"runner": null}` and nothing launches
- [x] 5.3 Declare every delta scenario (`@scenario` tags or `orbit/scenario-ledger.yaml` entries) and check `orbit status --change rc17d-external-runner --scenarios`
- [x] 5.4 Full `npm test` green; `orbit validate rc17d-external-runner --strict`
- [x] 5.5 (User-validation handoff) Record the Codex preset with `orbit config set externalRunner.preset codex` and run this change's system review as `--reviewer external`: it launches with no paste and its return is committed without hand edits (exit 1) — CLOSED AT ARCHIVE BY OBSERVATION (note 6.2), 2026-10-06: Sal ran `orbit config set externalRunner.preset codex`; the system pair's external half launched codex through the recorded runner in a worktree at the handoff commit e975b42d with no paste, exited 0, and `orbit external save --launch 2026-10-06T15-23-46Z` wrote external-system-2026-10-06T15-37-42Z.md (0 lines removed), committed alone as 41f03552 with no hand edit

## 6. At archive

### At-archive notes

(NOT apply tasks — the archive flow executes these; deliberately not checkboxes, so the apply gate's arithmetic covers
only apply-completable work — D5's and D6's convention. Converted from checkboxes at apply, 2026-10-06: as
checkboxes they held the apply gate unpassed until archive, and with it the `review-system` gate that 5.5 needs.)

- 6.1 Sync the three deltas through the engine's merge and byte-verify every block
- 6.2 Close 5.5 by observation when the system review's external half ran through the runner
- 6.3 Correct `orbit-review-external`'s Purpose paragraph by hand ("Does NOT run the review" → runs only through a recorded runner; never ingests findings)
- 6.4 Move CLAUDE.md's `src:capabilities` mark from 23 to 24 and run `orbit validate --sources`
- 6.5 Record in the program doc's status log that the two `orbit-review` sentences (design, Risks) are rc17b's to correct, and with them the generated review trunk's matching line ("no review passes run in that invocation", `src/core/templates/workflows/review.ts`), which contradicts the external-handoff reference's launch branch until rc17b lands (system walk, external W5; Sal: A — the hand-off ruling kept, the contradiction carried as a named residual on the archive's readiness record)

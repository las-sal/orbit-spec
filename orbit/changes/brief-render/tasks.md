## 1. The brief

- [ ] 1.1 Build the brief's model in `src/core/program-brief.ts`: a change brief (active or archived, found active first, then the newest archive) with every section of `orbit-program-brief`'s `A brief tells the user what a change or a program did, from the trail` from its named source — the latest account, the archive record, the delta specs, the latest record of each chain, the selection (`selectUnreadRecords`), the `## Size` section — and the rows of `A brief rendered before its change's archive record says what it cannot yet show` when no archive record exists; a program brief of every change citing the doc, grouped by stage in the doc's order, then the architecture trail's records for that doc; whole or absent, every unreadable source refused naming it
- [ ] 1.2 Render it: the markdown text (plain fixed text, requirement titles under a heading saying they are the spec's titles, the tripwires line, the open-stop and no-account lines) and the JSON shape carrying the sections and the text as `markdown`
- [ ] 1.3 Tests for every scenario of the two requirements, and the golden renders the stage's first exit criterion names: one fixture program, and a second whose changes carry ledger entries and stops (open and answered); each assertion on a section shown able to fail
- [ ] 1.4 Tests for `orbit-decision-records`' two new scenarios (`A stop's question reaches the user in the brief too`, `The brief shows the account as checked by no reader`), tagged to that capability

## 2. The command and the save

- [ ] 2.1 `src/commands/brief.ts`: `orbit brief <doc>` and `orbit brief --change <name>`, `--json`, the usage errors (both, neither, `--save` without `--change`), the single-name rule, non-zero exit with nothing on standard output on any failure; register it in `src/cli/program.ts` and `src/core/completions/command-registry.ts`
- [ ] 2.2 Generalise `publishChildRecord` in `src/core/emit-composition.ts` to take the serialized text, and implement `--save`: active change only, `.orbit-runs/brief/brief-<TS>.md` with the trail's token, the canonical trail and child checks, the exclusive-link publish, the path and SHA-256 printed (and `saved: {path, sha256}` with `--json`), nothing written when the render fails
- [ ] 2.3 Tests for every scenario of `` `orbit brief` renders a brief read-only `` and `A change's brief is saved, never overwritten`, each refusal shown able to fail; `orbit status`, the gates and the report render read a change with a `brief/` folder as without it
- [ ] 2.4 Move the closed-set pins this extends — `rc03b-untouched-modules.test.ts`'s `emit-composition.ts` hash, and any command-set enumeration the new command enters — each recorded here

## 3. The archive

- [ ] 3.1 Add the save step to the archive body after Step 3.5 and before upstream Step 4, and to the bulk-archive body per change before its sync: `orbit brief --change <name> --save`, and the table of `orbit-archive-modifications`' `The archive saves the change's brief before the sync` (say nothing on success; on a non-zero exit one `warnings` entry for the run summary naming the failure, nothing in chat, the archive goes on; a stopped archive leaves its copy)
- [ ] 3.2 `src/core/pr/tail.ts`: `carried_untracked` leaves out `.orbit-runs/brief/brief-<TS>.md` under the archived directory, as it leaves out the archive emit; a test for `A saved brief is staged and not named as a stray`, shown able to fail
- [ ] 3.3 A test holding both bodies carrying the command and the table, shown able to fail; re-record the archive and bulk-archive skill hash pins that move, each recorded here

## 4. Docs

- [ ] 4.1 `docs/cli.md`: an `orbit brief` section (both units, `--json`, `--save`, the saved file and its hash, whole or absent) and the command in the engine-surfaces row

## 5. Close

- [ ] 5.1 `npm run build && node bin/orbit.js update --force`, then full `npm test` green
- [ ] 5.2 Scenario tags or ledger entries for every delta scenario, and `node bin/orbit.js validate brief-render --strict`
- [ ] 5.3 (User-validation handoff) After this change's archive, the user reads the brief that archive saved in its own history and says whether, reading only it, they can tell what was built, the new terms and seams, and every ledger judgement (an early read on G5)

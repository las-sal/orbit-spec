## 1. The brief

- [x] 1.1 Build the brief's model in `src/core/program-brief.ts`: a change brief (active or archived, found active first, then the newest archive) with every section of `orbit-program-brief`'s `A brief tells the user what a change or a program did, from the trail` from its named source — the latest account, the archive record, the delta specs, the latest record of each chain, the selection (`selectUnreadRecords`), the `## Size` section — and the rows of `A brief says only what the archive recorded` by the change's archive state (active; archived with the sync run, skipped, or no record), the unread records as a snapshot; new terms as each distinct definition with its records; entries oldest first; a program brief of every change citing the doc, grouped by stage in the doc's order (a LEGACY doc by cited stage id, a change naming no stage last), then the architecture trail's records for that doc; whole or absent, every unreadable source and a MALFORMED doc refused naming it
- [x] 1.2 Render it: the markdown text (plain fixed text, requirement titles under a heading saying they are the spec's titles, the tripwires line, the open-stop and no-account lines) and the JSON shape carrying the sections and the text as `markdown`
- [x] 1.3 Tests for every scenario of the two requirements, and the golden renders the stage's first exit criterion names: one fixture program, and a second whose changes carry ledger entries and stops (open and answered); each assertion on a section shown able to fail
- [x] 1.4 Tests for `orbit-decision-records`' two new scenarios (`A stop's question reaches the user in the brief too`, `The brief shows the account as checked by no reader`), tagged to that capability

## 2. The command and the save

- [x] 2.1 `src/commands/brief.ts`: `orbit brief <doc>` and `orbit brief --change <name>`, `--json`, the usage errors (both, neither, `--save` without `--change`), the single-name rule, non-zero exit with nothing on standard output on any failure; register it in `src/cli/program.ts` and `src/core/completions/command-registry.ts`
- [x] 2.2 Generalise `publishChildRecord` in `src/core/emit-composition.ts` to take the serialized text, and implement `--save`: active change only, `.orbit-runs/brief/brief-<TS>.md` holding the render's exact bytes, its token drawn unique within `brief/` by the collision bump, the canonical trail and child checks, the exclusive-link publish, two lines printed — the path, then `sha256 <hex>` — (and `saved: {path, sha256}` with `--json`), nothing written when the render fails
- [x] 2.3 Tests for every scenario of `` `orbit brief` renders a brief read-only `` and `A change's brief is saved, never overwritten`, each refusal shown able to fail; `orbit status`, the gates and the report render read a change with a `brief/` folder as without it
- [x] 2.4 Move the closed-set pins this extends — `rc03b-untouched-modules.test.ts`'s `emit-composition.ts` hash, and any command-set enumeration the new command enters — each recorded here
  - Moved: `test/core/rc03b-untouched-modules.test.ts`'s `src/core/emit-composition.ts` hash (the publish takes the serialized text; `publishTrailChildText` exported), its note dated 2026-11-13. The command set: `src/core/completions/command-registry.ts` gains `brief`, held to the program by `test/core/cli-grammar/registry-parity.test.ts` (no pin moved); no other enumeration failed the full run.

## 3. The archive

- [x] 3.1 Add the save step to the archive body after Step 3.5 and before upstream Step 4, and to the bulk-archive body per change after its base-fingerprint check and before its sync: `orbit brief --change <name> --save`, and the table of `orbit-archive-modifications`' `The archive saves the change's brief before the sync` (say nothing on success; on a non-zero exit one `warnings` entry for the run summary naming the failure, nothing in chat, the archive goes on; a stopped archive leaves its copy)
- [x] 3.2 `src/core/pr/tail.ts`: `carried_untracked` leaves out `.orbit-runs/brief/brief-<TS>.md` under the archived directory, as it leaves out the archive emit; a test for `A saved brief is staged and not named as a stray`, shown able to fail
- [x] 3.3 A test holding both bodies carrying the command and the table, shown able to fail; re-record the archive and bulk-archive skill hash pins that move, each recorded here
  - Moved: `test/core/templates/skill-templates-parity.test.ts`'s `getArchiveChangeSkillTemplate` and `getBulkArchiveChangeSkillTemplate` function hashes and the `orbit-archive-change` and `orbit-bulk-archive-change` generated-file hashes, each with a brief-render note. New: `test/core/templates/brief-save-step.test.ts`.

## 4. Docs

- [x] 4.1 `docs/cli.md`: an `orbit brief` section (both units, `--json`, `--save`, the saved file and its hash, whole or absent) and the command in the engine-surfaces row; `docs/concepts.md`: `brief/` in the glossary's Trail row (`orbit-program-brief` joins that section's Carried-by line at archive, after the sync: the carried-by check resolves only baseline specs — design.md, At archive), and the Archive section saying the archive saves the change's brief first; CLAUDE.md's sentence on running `node bin/orbit.js` until a release is installed names `orbit brief` too

## 5. Close

- [x] 5.1 `npm run build && node bin/orbit.js update --force`, then full `npm test` green
- [x] 5.2 Scenario tags or ledger entries for every delta scenario, and `node bin/orbit.js validate brief-render --strict`
- [ ] 5.3 (User-validation handoff) After this change's archive — whose save step runs as `node bin/orbit.js brief --change brief-render --save` until a release carrying `orbit brief` is installed — the user reads the brief that archive saved in its own history and says whether, reading only it, they can tell what was built, the new terms and seams, and every ledger judgement (an early read on G5)

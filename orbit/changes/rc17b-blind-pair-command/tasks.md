## 1. The engine's presentation

- [ ] 1.1 In `src/core/artifact-graph/gates.ts`, widen `presentInvoked`'s class to `'fresh' | 'external' | 'blind-pair'`: the default and unknown preferences present `blind-pair`; `canonicalNextForReviewed`'s local `forClass` — which renders the presented command — and `commandForClass`'s `invoked` case both return `/orbit:review --as <mode> --reviewer blind-pair <change>` for it (the rc17a D6 interim comment retired); the open-pair rows are unchanged; `nextSlot` and the hint keys carry `blind-pair`, and a `models: {blind-pair: …}` entry garnishes the pair command
- [ ] 1.2 Tests: the scenarios of `The first review slot covers what the user invoked` as modified (the four-preference scenario, the default-presents-the-pair scenario) and of `Single-voiced canonical-next computation` (the `blind-pair` hint); update every expectation that printed the default fresh command for an uncovered `invoked` slot, measured by running the suite, not by grep

## 2. The review trunk

- [ ] 2.1 In `review.ts`'s trunk, the reviewer axis: four values, the four shorthands, the at-most-one-selector table as usage errors, `external`/`blind-pair` refused with `--as architecture`; the argument table rows for `--in-context`, `--external`, `--blind-pair`
- [ ] 2.2 Dispatch: `blind-pair` loads `references/blind-pair.md` and `references/external-handoff.md`; replace the trunk's "no review passes run in that invocation" with what the external branch does (packages, then prints for paste or launches)
- [ ] 2.3 Template tests for 2.1–2.2: every selector row, the dispatch, the retired sentence absent

## 3. The pair reference

- [ ] 3.1 Add `REVIEW_BLIND_PAIR_REFERENCE` registered as `blind-pair.md`: the runner read ONCE at step 1, before packaging; the thirteen steps of `The blind-pair reviewer runs both halves in one invocation` as body steps, naming the handoff reference's Step 9 sub-steps and the trunk's "Dispatching a fresh pass" rather than restating them; the fresh subagent and the runner in the background; the save after the fresh commit; one push; both reports; the end at the readout with no walk
- [ ] 3.2 The no-runner and failed-external endings (`openPair: {missing: "external"}`, the paste output the push state selects), the fresh half's landing read from the trail (a fresh pass file later than L is the member whatever the worker's exit; none is MISSING, and the external return then lands alone), the dirty-tree refusal before anything is written, the other-flags rule, and the session-end recovery line naming the uncommitted fresh pass file beside rc17d's raw-return save line
- [ ] 3.3 Template tests for 3.1–3.2: the step order, the save-after-fresh ordering, `git commit --only` on each path, no `/orbit:address-reviews` invocation

## 4. The external-handoff reference

- [ ] 4.1 The re-run: when the mode's reviewed gate row carries `openPair: {missing: "external"}` and no apply token is later than the open launch L (the latest `pair: true` T0 of the mode), find BASE by the hash-only read; add the worktree at BASE; feed the prompt from the live checkout's copy; save with `--launch L`. With an apply later than L, say the pair's reviewed state is superseded and run as an ordinary single. The single-external path is unchanged otherwise; the trunk's fresh dispatch briefs a fresh re-run (`openPair: {missing: "fresh"}`, no apply later than L) with the pair's reviewed commit as the state to read — the repository read at that commit: the change's files and, in system mode, the code and the commit range ending there
- [ ] 4.2 The pasted `## Repo` line of a pair half (first run or re-run), and a failed launch's paste-fallback commit line for a pair half: the repository and the reviewed commit (BASE's first parent)
- [ ] 4.3 Step 9d in a pair: return control to the pair reference after the run exits; the save, commit and push follow the pair's order
- [ ] 4.4 Template tests for 4.1–4.3, and that a single external outside a pair — the gate reporting no `openPair` for the mode — reads byte-identical to today

## 5. Onboard

- [ ] 5.1 In `onboard.ts`, the Identity sentence, the Phase 4 cross-AI sentence and the command-table row point at `/orbit:review`'s reviewer axis instead of enumerating values, and stop saying the external AI "commits findings back"; update the onboard fidelity test

## 6. End-to-end

- [ ] 6.1 Disposable-repo harness (rc17d's `test/integration/external-runner/` instrument, its limit stated: it proves the transcribed commands, not that an agent follows the body): a launched pair with a stub runner that returns before a stub fresh pass (three commits in order, fresh token earlier, one push to a bare remote, the gate COMPLETE); a no-runner pair (BASE and the fresh commit, `openPair: {missing: "external"}`); a failed runner (pair open); a re-run whose worktree at BASE holds no fresh pass file and whose save passes `--launch L`; an apply later than L (the save refuses a re-run's return under `--launch L` — the constructed case of the proposal walk's external CRITICAL — and the single route saves under its own token); a fresh worker that wrote no pass file (the external lands alone, `openPair: {missing: "fresh"}`) and one stopped after writing it (committed as the member)
- [ ] 6.2 `npm run build && node bin/orbit.js update --force`; the generated review skill carries `references/blind-pair.md`; update the skill parity pins as a recorded act
- [ ] 6.3 Declare every delta scenario (`@scenario` tags or `orbit/scenario-ledger.yaml`) and check `orbit status --change rc17b-blind-pair-command --scenarios`
- [ ] 6.4 Full `npm test` green; `orbit validate rc17b-blind-pair-command --strict`
- [ ] 6.5 (User-validation handoff) Run this change's system review as `/orbit:review rc17b-blind-pair-command --as system --blind-pair`: one invocation produces both pass files, each committed alone, with no walk between, and pushed (exit 1)

## 7. At archive

### At-archive notes

(NOT apply tasks — the archive flow executes these; deliberately not checkboxes, so the apply gate's arithmetic covers
only apply-completable work.)

- 7.1 Sync the four deltas through the engine's merge and byte-verify every block
- 7.2 Close 6.5 by observation when the system review ran through `--blind-pair`
- 7.3 Record exit (2) by the harness case in 6.1 and say so in the status log (no runner-less live run is owed: the paste route's chat output is rc17d's, unchanged)

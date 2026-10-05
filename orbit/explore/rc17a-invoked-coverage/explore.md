> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: blind-pair-command

## Premise

Stage `rc17-blind-pair-command` (`clean-up-review-cycle.md`, declared 2026-10-05 by Sal during rc08b's
system walk). The cadence's `blind-pair` slot is ONE unit in the engine — two passes of distinct
independent classes, one state, no walk between — but running it today is two commands, a handoff, a
wait and an ordered commit (the eight-step sequence the rc16/rc03c/rc04b/rc08b cycles ran by hand):

1. commit + push the apply; 2. `/orbit:review --as system --reviewer external` packages the prompt and
the T0 emit; 3. Sal commits + pushes them; 4. Claude launches `codex exec -s read-only -o <file>` in
the background on Sal's word; 5. `--fresh` dispatches a clean-context subagent whose emit stays
UNCOMMITTED; 6. wait; strip any lines Codex wrote above `# External Review:`; 7. commit each pass file
alone; 8. render both reports. The walk is a separate command.

Between steps 4 and 7 the engine holds a HALF-OPEN pair the user must not walk, and — the routed
defect — on some cadences the engine does not even say so. Two jobs, one subject:

- **The command.** `/orbit:review --as <mode> --reviewer blind-pair` runs both halves, isolated, from
  one pushed commit, waits for both, commits each pass file in its own commit, renders both reports.
  NARROWS D-rc03-5: the user names both halves in one command, so no-chaining holds.
- **The diagnosis** (rc08b system walk 1, external W1, Sal: C). `diagnosePair(ordered0, trail)` in
  `src/core/artifact-graph/gates.ts` reads the WHOLE pass list, not the candidates eligible for the
  uncovered slot. Reproduced against dist by the external pass: cadence `[external, blind-pair]`, a
  clean external at T1 (consumed by slot 0), an unwalked fresh WARNING at T2 → `openPair` absent,
  `nextCommand` is `/orbit:address-reviews` — the walk that forecloses the pair. Same for
  `[blind-pair, blind-pair]` with the second pair half-formed. Unreachable on the shipped
  `[blind-pair, in-context]` cadence; exactly the state a failed half of the command would hand back.

Exit (charter): (1) one invocation produces both pass files on one commit, each committed alone, no
walk between; (2) with only one half returned, the gate reports `openPair` on every supported cadence,
including `[external, blind-pair]`; (3) an adopter without a configured external runner gets today's
handoff, unchanged. Goal G4.

## Mechanism

### D-bpc-1 — the external half dispatches by the recorded setup
Domain: the external runner's state when `--reviewer blind-pair` is invoked
| member | covered by |
|---|---|
| a runner is recorded and its reachability probe succeeds | launched in the background at BASE (D-bpc-4); the fresh half launches beside it |
| a runner is recorded and its probe fails (binary absent, not signed in) | the prompt is printed for paste, naming the failed probe; the fresh half still runs |
| no runner is recorded | the prompt is printed for paste: today's handoff, unchanged (exit 3) |
| the runner launched and exited non-zero or timed out | the external half is MISSING: the fresh half is committed alone, the engine reports `openPair` (exit 2), and a rerun runs only `openPair.missing` |
| the return carries lines above `# External Review:` | only those lines are removed and quoted in the commit message; nothing from the heading on is touched |
| the return carries no `# External Review:` heading | treated as a failed return (row 4) |
Closure: BOUNDED — the failure rows are those observed on one runner (Codex, rc08b's system pair) plus the absent case
Residual kind: a runner failure that yields a file which opens with the heading and parses yet is not a complete review (a truncated return)
Residual method: running the three external readers over the return and reading its `**Reviewer**:` line at each runner's first use
Moves:
- READ: applied — the handoff preflight (review.ts, "Handoff preflight — committed-and-pushed state") and the Codex `-o` preamble observed on rc08b's run
- ENUMERATE: applied — this table
- COHERE: applied — the paste fallback IS the handoff branch, so exit (3) and the failed-probe row are one path, not two
- EXECUTE: not applied — nothing built yet
- FALSIFY: applied — a runner merely present on PATH would launch with no opt-in and send the repo to a third party; answered by D-bpc-2 (a recorded setup is required)
- CONFORM: applied — no-chaining (the user names both halves in one command); D-rc03-5 narrowed as the charter states; D11's Claude primacy (the Agent tool and background Bash are named)
- FEASIBILITY: applied — external runs outlast the ten-minute foreground limit, so the runner runs in the background and the body waits on its completion notification
- CONSUME: applied — the trail reader consumes the pass file; address-reviews discovery row 4 consumes `openPair`
- INVOKE: applied — fires only when the user types `--reviewer blind-pair`

### D-bpc-2 — the runner setup is the user's, explicit, and part of setup
Domain: the ways an external runner could come to be used
| member | covered by |
|---|---|
| the user records a known runner (Codex) at setup | a shipped preset: the invocation verbatim (read-only sandbox, `-o` capture, prompt on stdin, no model flag) |
| the user records a runner of their own | a user-supplied invocation with the prompt-in / findings-out contract stated in the setup note |
| the user records nothing | no runner: D-bpc-1 row 3 |
| a runner binary is on PATH with nothing recorded | NOT a setup: no launch (D-bpc-1 row 3); the readout may say a runner looks available and point at the setup note |
| a recorded runner is later removed or broken | D-bpc-1 row 2 |
Closure: SOURCED — a runner is used only through a record, so the members are the record's three states (known preset / own invocation / none) plus the two unrecorded-world states
Moves:
- READ: applied — rc07's refusal of a `command:` field (orbit is a published package; a shell field would execute repository data) is why the record lives per user (D-bpc-11)
- ENUMERATE: applied — this table
- COHERE: applied — "explicit" and "detect" are one rule: the record is explicit, detection only checks the record is reachable
- EXECUTE: not applied — nothing built yet
- FALSIFY: applied — an adopter cloning a repo whose committed config names a runner would launch it under their own command: answered by D-bpc-11 (per-user only)
- CONFORM: applied — Sal's 2026-10-05 call (the user decides how it is configured; setup carries a note explaining the concept)
- FEASIBILITY: not applied — one record and one note
- CONSUME: applied — D-bpc-1 reads the record; init/onboard carry the note
- INVOKE: applied — written at setup (init, or a later setup step); read at every `--reviewer blind-pair`

### D-bpc-3 — the command commits each pass file alone and pushes
Domain: the files and acts after the halves return
| member | covered by |
|---|---|
| the prompt file and T0 emit | committed and pushed BEFORE launch; that commit is BASE |
| the earlier-token pass file | its own commit |
| the later-token pass file | its own commit, after it — the VERIFICATION confirm's residual check starts at the commit that added it |
| lines stripped from an external return | quoted in that pass file's commit message |
| a half that never returned | nothing committed for it |
| the push | after the pass commits; a failed push is reported and the commits stand, no retry |
Closure: DERIVED — the command writes exactly the packaging pair and at most two pass files; every one is a row, plus the push
Moves:
- READ: applied — `orbit-conventions`' Residual outward-actions rule covers only acts "not designed into a lifecycle step"; a push designed into this command is inside it, not a reversal of D6
- ENUMERATE: applied — this table
- COHERE: applied — commit order is token order, so the walk order the gate names and the residual check's base agree
- EXECUTE: not applied — nothing built yet
- FALSIFY: applied — a repo with no upstream or a rejected push: the commits stand locally and the readout names the failure
- CONFORM: applied — D-d6-7 (zero engine git: the choreography is body steps); Sal's 2026-10-05 call (the command commits and pushes)
- FEASIBILITY: not applied — at most three commits and one push
- CONSUME: applied — the trail reader orders by token; the VERIFICATION residual check reads the commit adding its base file
- INVOKE: applied — after both halves return, or after one fails

### D-bpc-4 — blindness between the halves is physical, not instructed
Domain: the channels by which one half could read the other
| member | covered by |
|---|---|
| the fresh emit, written into the working tree, read by a still-running external | the external runs in a throwaway `git worktree` at BASE, outside the repo directory |
| the external return read by the fresh half | the runner writes its return outside the repo until both halves are back |
| the prompt file's framing read by the fresh half | rc03b's brief rule: the fresh brief names no `.orbit-runs/` path to read |
| a rerun of the missing member reading its committed partner | the rerun's worktree sits at the ORIGINAL BASE, never HEAD |
| commit messages and status narrative | rc03b's BOUNDED residual (prior-pass content through what a brief legitimately names) |
Closure: BOUNDED — the channels are those inside the repository and its git history
Residual kind: a channel through machine state outside the repository (a runner's session history, an assistant's memory)
Residual method: listing what each runner reads beyond its working directory when it is recorded at setup
Moves:
- READ: applied — today's rule ("leave the fresh emit uncommitted") hides nothing from a process reading the live checkout
- ENUMERATE: applied — this table
- COHERE: applied — the same worktree-at-BASE serves the first run and the rerun, so partial failure needs no second isolation rule
- EXECUTE: not applied — nothing built yet; a disposable-repo test is cheap and owed
- FALSIFY: applied — content blindness is the body's; the engine's blindness is walk-ordering only, so neither substitutes for the other
- CONFORM: applied — rc03b's brief rule; R-crc-4's blind pair
- FEASIBILITY: applied — a worktree is one `git worktree add --detach` and one remove
- CONSUME: applied — the runner's working directory is the worktree path
- INVOKE: applied — at every external launch, first run or rerun

### D-bpc-6 — the pair is diagnosed over the candidates the uncovered slot could use
Domain: the states of a cadence whose coverage search fails deepest at a `blind-pair` slot, read at the canonical reaching state
| member | covered by |
|---|---|
| the deepest failed slot is not `blind-pair` | no pair diagnosis (unchanged) |
| several lower bounds reach the deepest slot | the LOWEST is canonical: eligibility is `token > bound` (the consumed set is redundant, per `assignCadence`'s memo argument), so its eligible set contains every other reaching state's |
| no pairable eligible member | `none-standing`: no `openPair`; a safe walk may run first (unchanged) |
| pairable eligible fresh only, however many | `no-external`: `openPair: {missing: "external"}` |
| pairable eligible external only, however many | `no-fresh`: `openPair: {missing: "fresh"}` |
| both classes eligible, every pair tied | `tie` (unchanged) |
| both classes eligible, every untied pair has a record inside its interval | `blindness-broken` (unchanged; defensive) |
| both classes eligible with one blind untied pair | unreachable: the slot would have a candidate, so a LATER slot is the deepest failure |
| a pairable pair exists in the whole list but one class is missing above the bound (rc08b's W1: `[external, blind-pair]`, clean external T1 consumed by slot 0, unwalked fresh T2) | the `no-external` row: the retired `foreclosed` label named this state and set no `openPair` |
Closure: DERIVED — a partition of the eligible pairable set by class presence, then by why no candidate formed, plus the two rows that choose the state the set is read at
Moves:
- READ: applied — `orbit-engine-gates`' pair text already says "the earliest pair STILL FORMABLE on this state" and "DIAGNOSIS USES THE SAME PREDICATE AS ASSIGNMENT"; `diagnosePair(ordered0, trail)` reads the whole list, so the code, not the spec, is wrong — except the spec's "reported as FORECLOSED" sentence, which retires with the label
- ENUMERATE: applied — this table
- COHERE: applied — the canonical state is the lowest bound, the same key `assignCadence` memoizes on, so diagnosis and assignment read one eligibility predicate
- EXECUTE: applied — rc08b's external pass ran the W1 state against dist (openPair absent, next `/orbit:address-reviews demo`); the table's no-external row is the intended output; nothing re-run here
- FALSIFY: applied — exit (2) says "every supported cadence", which no hand-picked case list proves; the owed test is a brute-force oracle over small enumerated cadences and trails: `openPair.missing = X` exactly when adding one NEW pass of class X, above every token, would make coverage succeed
- CONFORM: applied — R-crc-13 (the gate reports; the field is a fact, not a ruling); the walk's discovery row 4 is the consumer and stays unchanged
- FEASIBILITY: applied — `assignCadence` already tracks `deepest`; tracking the minimum bound seen at it is one comparison per visit
- CONSUME: applied — `openPair` on the status row (rc08b) and the reason's pair note; the `PairFailure` label set loses `foreclosed`, a type with no reader outside `gates.ts` (grep, 2026-10-05)
- INVOKE: applied — on every reviewed-gate evaluation whose coverage fails at a `blind-pair` slot

### D-bpc-8 — the first slot accepts any outside review and recommends the blind pair; config overrides per gate
Domain: what covers the first slot, by what the user INVOKED, and what the readout presents, per gate
| member | covered by |
|---|---|
| nothing independent standing, preference blind-pair (the default) | presents the pair command (rc17b); until rc17b ships, the fresh half first with the both-before-either reason (today's rendering) |
| nothing standing, preference fresh or external | presents that class's single invocation |
| preference absent | blind-pair, for each gate independently |
| preference an unknown value | warns and resolves to blind-pair, as the `pr:` scalar's inert values warn and resolve to `never` |
| a pair INVOKED, both halves landed, blind | covers the slot as one unit; the in-context slot follows the walks of BOTH members |
| a pair INVOKED, one half landed | NOT covered: `openPair: {missing}` presents the partner; the walk stops (address-reviews discovery row 4) |
| a pair INVOKED, a walk landed between the halves | NOT covered: blindness broken (unchanged diagnosis) |
| a pair INVOKED, the partner never lands and the user wants to proceed | D-bpc-12: re-run the missing half, or the recorded proceed |
| a single fresh or single external INVOKED, landed | covers the slot |
| two singles invoked separately on one state | the first covers the slot; the second is an extra independent pass whose findings clause (b) still requires resolved |
| how the engine knows a pass was invoked as a pair member | D-bpc-10 |
Closure: BOUNDED — the invocation forms are the three `--reviewer` values plus the preference's two fallbacks; pair membership is D-bpc-10's record
Residual kind: a pass whose pair membership the trail cannot decide (a single invoked while a pair launch stands open)
Residual method: D-bpc-10's residual slots carry it
Moves:
- READ: applied — spec-driven v4 (`schemas/spec-driven/schema.yaml`): proposal `[independent, in-context]`, system `[blind-pair, in-context]`; `independent` already accepts fresh or external; `orbit/config.yaml`'s `models:` hint is owned by `orbit-engine-gates`, the precedent for a per-gate config key
- ENUMERATE: applied — this table
- COHERE: applied — `openPair` stays a COVERAGE fact (a pair invoked and not complete does not cover), so the walk's row-4 stop and the gate's reason keep one meaning; the preference reaches only the "nothing standing" rows
- EXECUTE: not applied — nothing built yet
- FALSIFY: applied — a teammate's different config cannot re-grade a change: the preference enters no coverage row; coverage reads what was invoked, which the trail records
- CONFORM: applied — R-crc-4 AMENDED by Sal's word (the pair recommended, not required), to be recorded; R-crc-13 (the gate reports); single-voiced canonical next
- FEASIBILITY: applied — the schema moves to version 5; a v4 change keeps v4's cadence, whose reader is owed a check at rc17a
- CONSUME: applied — the canonical next and eligibility line read the preference; discovery row 4 reads `openPair`; the membership record (D-bpc-10) is read by the gate's coverage clause
- INVOKE: applied — on every reviewed-gate evaluation and every readout that renders a gate's next

### D-bpc-10 — pair membership is a state machine computed from the trail
Domain: the trail states of one reviewed gate's first slot, per mode
| member | covered by |
|---|---|
| no launch record of the mode | NO-LAUNCH: a single fresh or external covers by landing |
| a launch, neither half landed | PAIR-OPEN, both missing: the pair command is presented again (the fresh half first until rc17b ships) |
| a launch, the fresh emit carrying its token landed | PAIR-OPEN `{missing: external}` |
| a launch, the first external return after it landed | PAIR-OPEN `{missing: fresh}` |
| both landed, no walk record referencing either at or between their tokens | COMPLETE: covers the slot as one unit |
| a walk record referencing a landed member before its partner lands | BROKEN: does not cover; a new launch or the recorded proceed (D-bpc-12) |
| the two halves share a timestamp token | not covered: the existing fail-safe tie |
| a newer launch after an open or broken one | the newer is the live pair; the older stays as history |
| a newer launch after a complete pair | a new round; the complete pair still covers (coverage is existential) |
| a fresh emit with no launch token while a pair is open | a single, not a member |
| an external return after the launch, invoked as a single | counted as the member: the residual below |
| re-running only the missing half | writes no launch, so it refills the open pair |
| a change on spec-driven v4 (no launch records ever) | v4's structural `blind-pair` slot, unchanged |
Closure: BOUNDED — every row reads a record the trail holds; one attribution the trail cannot make
Residual kind: an external return the trail cannot attribute to a single or to the open pair
Residual method: each T0 emit is engine-composed and can carry the launch token it was packaged under; an audit cross-check of returns against their T0s finds a single-packaged return counted as a member
Moves:
- READ: applied — `trail.ts` reads `review-external-*.json` as NOT a pass ("T0 packaging emit is intentionally NOT a pass"), and the external return's filename is fixed (`external-(proposal|system)-<TS>.md`), so the return cannot carry a stamp
- ENUMERATE: applied — this table
- COHERE: applied — BROKEN is the existing `blindness-broken` reading scoped to a launch; COMPLETE is the existing blind-pair candidate test scoped to a launch, so `slotCandidates`' predicates stay the one test
- EXECUTE: not applied — nothing built yet; the brute-force oracle owed by D-bpc-6 extends to launches
- FALSIFY: applied — why a dedicated launch rather than the T0: a missing-half re-run re-packages and writes a new T0, which would read as a new pair
- CONFORM: applied — gate state a pure function of on-disk artifacts (C1: no new state files; the launch is a trail record like every other emit); R-crc-13
- FEASIBILITY: applied — one new emit kind on the emit surface; the trail reader gains one record type
- CONSUME: applied — the gate's coverage clause and `openPair`; address-reviews discovery row 4; the readout's canonical next
- INVOKE: applied — the launch is written by `--reviewer blind-pair` only; the states are read on every gate evaluation

### D-bpc-11 — the runner record lives in the per-user global config, set at init
Domain: every surface the runner record passes through, and its fallback states
| member | covered by |
|---|---|
| where it is stored | a new field in the per-user XDG global config (`getGlobalConfigDir()`, beside `profile` / `delivery`) |
| who writes it | `orbit init`'s setup step — explains the concept, offers the Codex preset when `codex` is on PATH, an own command, or none; re-run to change |
| its forms | the Codex preset (invocation in orbit's source) / an own command with prompt-in and findings-out placeholders / none |
| who reads it | the engine, surfacing it in `orbit status --json` as the `pr` scalar is surfaced; the review body reads that field |
| who executes it | the review body, under the user's `--reviewer blind-pair` (and, by the same rule, `--reviewer external`); never the engine |
| the field absent | none: the prompt is printed for paste (exit 3) |
| the field malformed | warns and resolves to none, as the `pr:` scalar's inert values do |
| the global file is invalid JSON | `getGlobalConfig()`'s existing fallback to defaults, with its warning: none |
| a runner in a committed per-repo file | not read: the clone risk (Considered & out) |
Closure: SOURCED — the record's path is store → write → read → execute, each a row, plus the three ways the record can be missing or bad
Moves:
- READ: applied — `src/core/global-config.ts`: XDG directory, `config.json`, `GlobalConfig {featureFlags, profile, delivery, workflows}`, invalid JSON warns and falls back to defaults
- ENUMERATE: applied — this table
- COHERE: applied — the preference (project) and the runner (machine) are two records read by one body at one invocation; neither reads the other
- EXECUTE: not applied — nothing built yet
- FALSIFY: applied — a single `--reviewer external` with a runner recorded would otherwise still paste; the rule applies to every external half, not only the pair's
- CONFORM: applied — D6 / D-d6-7 (zero engine processes: the body executes); rc07 (no executable repository data)
- FEASIBILITY: applied — one optional field on an existing file; one init step
- CONSUME: applied — D-bpc-1's dispatch rows read it through `orbit status --json`
- INVOKE: applied — written at init; read at every invocation that needs an external half

### D-bpc-13 — the one command's step order
Domain: the steps of `/orbit:review --as <mode> --reviewer blind-pair`, each with its failure handling
| member | covered by |
|---|---|
| 1. preflight | a dirty tree refuses, naming the files (the reviewed state must be committed); unpushed commits are allowed — step 4 pushes them |
| 2. the launch record | `orbit emit` of the pair launch (D-bpc-10), token L |
| 3. packaging | the existing external-handoff packaging: prompt file + T0 emit, both later than L |
| 4. commit + push | launch, prompt and T0 in ONE commit — BASE — then push; a failed push is reported and the run goes on (the local worktree needs no remote), the paste route then names the unpushed state |
| 5. worktree | `git worktree add --detach` at BASE, outside the repository directory (D-bpc-4) |
| 6a. the external half, runner reachable | launched in the background in the worktree, its return written outside the repository (D-bpc-1, D-bpc-11) |
| 6b. the external half, no runner or probe failed | the prompt is printed for paste; the fresh half still runs; the command ends after step 9 with PAIR-OPEN `{missing: external}` |
| 6c. the fresh half | a clean-context subagent in the main checkout, briefed per rc03b's brief rule, its emit stamped with L |
| 7. wait | both background completions; a half that fails or times out is MISSING (D-bpc-1 row 4) |
| 8. normalize the external return | lines above `# External Review:` removed and kept for the commit message; no heading → MISSING; saved as `external-<mode>-<TS>.md` |
| 9. commit each pass file alone, token order | earlier token first; the later file's commit is the VERIFICATION residual check's base (D-bpc-3) |
| 10. push | a failed push is reported, the commits stand |
| 11. remove the worktree | `git worktree remove`; a failure is reported, never fatal |
| 12. render both reports | `orbit status --change <name> --report <TS>` per landed pass |
| 13. end | the position readout and the engine's eligibility line; the walk is its own command (no-chaining) |
Closure: DERIVED — the steps are the decisions' acts in dependency order (the launch precedes both halves; BASE contains the launch; the halves read BASE; commits follow both returns), each step one row, its failure in the row
Moves:
- READ: applied — the handoff preflight (`review.ts` §3: `git status --porcelain`, `git rev-list @{u}..HEAD --count`, the local-path route when no remote); the external return's fixed filename (`trail.ts`); the Codex preamble observed on rc08b
- ENUMERATE: applied — this table
- COHERE: applied — BASE contains L, so both halves review a state in which the pair is already declared, and the T0 (later than L) never reads as a launch
- EXECUTE: not applied — nothing built yet; a disposable-repo run of steps 1–11 is owed at apply
- FALSIFY: applied — the paste route (6b) cannot wait for a human, so the command ends with the pair open and the gate's `openPair` carries the rest; that is exit (2)'s state, produced on purpose
- CONFORM: applied — no-chaining (the walk is not invoked); D-bpc-3 (the command commits and pushes); D6 (all git is body choreography)
- FEASIBILITY: applied — the external half outlasts the foreground limit, so steps 6–7 run in the background with completion notifications
- CONSUME: applied — the engine reads every record the command writes; the readout reads them through the gate
- INVOKE: applied — `--reviewer blind-pair`, typed by the user

### D-bpc-15 — discovery walks every unwalked pass that carries a finding, any severity
Domain: a change-mode pass, by what it carries and whether a walk record references it
| member | covered by |
|---|---|
| no findings at all | not discovered: nothing to walk |
| a substantive finding, unresolved | `unresolvedPasses` (unchanged): discovered, and it holds the gate |
| a substantive finding, resolved | neither set: walked |
| SUGGESTIONs only, no walk record references it | `unwalkedPasses` (new): discovered; the gate does NOT hold on it |
| SUGGESTIONs only, a walk record references it (fixed or deferred) | neither set: walked once is walked; deferral stays a recorded outcome |
| any finding, on a gate reporting `openPair` | discovery row 4 stops first (unchanged) |
| a stale pass from an earlier iteration, SUGGESTIONs only, never walked | discovered: the walk's pushback discipline suppresses stale findings with evidence |
| an external return carrying SUGGESTIONs only | the same rows: the trail reader's pass set is genre-blind |
| an audit-drift emit | the existing basename rule (unchanged) |
Closure: DERIVED — (findings: none / SUGGESTIONs only / substantive) × (walked or not), plus the three existing discovery paths it sits beside
Moves:
- READ: applied — `passResolved` returns true for a pass with no CRITICAL or WARNING, by design; `recordsFor` finds the walk records whose `source_path` names a pass; the discovery fence's row 5 reads `unresolvedPasses` only, and says a suggestion-only pass "is reached by `--from-file`"
- ENUMERATE: applied — this table
- COHERE: applied — the gate's set and the walk's set are now different sets, both engine-computed and both carried on the gate row; the hold reads one, discovery reads the union
- EXECUTE: not applied — nothing built yet
- FALSIFY: applied — a walk that only deferred a SUGGESTION has walked it, so the pass leaves the set and is not re-discovered forever
- CONFORM: applied — rc02 (SUGGESTIONs never gate), rc08b (discovery reads the engine, no second rule in the body), rc02b (severity is the reviewer's consequence judgement; it ranks a finding, it does not decide whether one is read)
- FEASIBILITY: not applied — one filter over passes the trail reader already loads
- CONSUME: applied — address-reviews discovery row 5 and its CHECKED MIRROR fence; `orbit status --json`'s gate row
- INVOKE: applied — on every gate evaluation; read by every change-scoped walk

### D-bpc-16 — the review emit's next names the change wherever discovery reaches the pass
Domain: the review emit's `next_recommended`, by mode and findings
| member | covered by |
|---|---|
| proposal or system mode, any finding | `/orbit:address-reviews <change>` (discovery reaches it, D-bpc-15) |
| proposal or system mode, clean | `orbit status --change <name> --report` (unchanged) |
| architecture mode, findings | `--from-file <path>` (unchanged: no change-scoped walk reads an architecture trail) |
| architecture mode, clean | the architect's `handoff.next_command` (unchanged) |
| the external T0 emit | ends at the save step (unchanged, rc08b) |
| change-scoped audit-drift | already the short form (unchanged) |
| project-wide audit-drift | `--from-file <path>` (unchanged) |
Closure: SOURCED — `orbit-emit-composition`'s review row plus the two audit-drift rows of `orbit-run-summary-emit`, every mode each names
Moves:
- READ: applied — `orbit-emit-composition` (the review row: "the address-reviews `--from-file` invocation naming this emit's own path when findings exist (all modes …)"); `emit-composition.ts` composes it so; `orbit-run-summary-emit`'s audit-drift rows already dropped the path for change scope
- ENUMERATE: applied — this table
- COHERE: applied — after the repair the review emit's next and the gate's canonical next name the same invocation, so no surface contradicts another
- EXECUTE: not applied — nothing built yet
- FALSIFY: applied — without D-bpc-15 a suggestion-only pass named by the short form would be walked by nobody; the two decisions ship together
- CONFORM: applied — single-voiced canonical next; R-crc-14 (the rule stated once, in `orbit-emit-composition`)
- FEASIBILITY: not applied — one branch in one composer
- CONSUME: applied — the report renderer checks `next_recommended` against the deterministic pointer (`report-render.ts`, "SPINE SEMANTICS"), so it moves in the same edit
- INVOKE: applied — on every review emit in change mode

## Decisions

- **2026-10-05 — D-bpc-1: the external half dispatches by the recorded setup** — runner recorded and reachable → launched automatically; otherwise the prompt is printed for paste into another AI (today's handoff). The fresh half always launches. Sal, 2026-10-05.
  Kind: rule
- **2026-10-05 — D-bpc-2: the runner setup is the user's, explicit, and part of setup** — users configure it differently; orbit ships the concept and a setup note (even if only a note), and the command reads what the user set up rather than inventing a runner. Sal, 2026-10-05.
  Kind: rule
- **2026-10-05 — D-bpc-3: the command commits each pass file alone and pushes** — Sal: "no issue with that at all"; the outward-act barrier served the learning phase and is now suboptimal. A designed push sits inside `orbit-conventions`' Residual outward-actions rule, which covers only acts not designed into a step.
  Kind: rule
- **2026-10-05 — D-bpc-4: blindness between the halves is physical** — the external runs in a throwaway worktree at BASE; its return stays outside the repo until both are back. A method call (R-crc-3), unopposed.
  Kind: rule

- **2026-10-05 — D-bpc-5: "detect" checks the record's reachability; it never discovers a runner** — a runner on PATH with nothing recorded launches nothing; the readout may name it and point at the setup note. Resolves Q-bpc-3 (Sal: "agree on detect"). The behaviour is D-bpc-2's fourth domain row; this entry records the reading of Sal's word, not a second rule.
  Kind: scope
- **2026-10-05 — D-bpc-6: the pair is diagnosed over the candidates the uncovered slot could use** — `diagnosePair` reads the passes ELIGIBLE at the failed blind-pair slot (token above that slot's lower bound, pairable), never the whole list, so the engine's code meets `orbit-engine-gates`' existing wording ("the earliest pair STILL FORMABLE on this state"). Resolves Q-bpc-4 and carries rc08b's routed external W1. The `foreclosed` label retires: under the slot-bound reading a whole-list foreclosure IS a missing class.
  Kind: rule

- **2026-10-05 — D-bpc-7: both reviewed gates are two slots — a user-chosen first slot, then `in-context`** — `review-proposal` and `review-system` each read `[<first>, in-context]`; the first slot is a blind pair OR a single outside reviewer (fresh or external), the user's choice; the second is always the in-context check on the walk. Sal, from extended use, 2026-10-05: "I will probably use blind pair, but someone else might just want to use either fresh or external." Today's `spec-driven` v4 hardcodes `[independent, in-context]` and `[blind-pair, in-context]`, so this generalizes what ships rather than replacing it. Mechanism entry not yet written: its domain waits on Q-bpc-5 and Q-bpc-6.
  Kind: rule
  Disposition: superseded D-bpc-8

- **2026-10-05 — D-bpc-8: the first slot ACCEPTS any outside review and RECOMMENDS the blind pair; config overrides the recommendation per gate** — for both `review-proposal` and `review-system`: the user is presented the blind pair, may run blind-pair, external or fresh, any of which covers the first slot; then the in-context review is presented; then the gate passes. `orbit/config.yaml` may set a review PREFERENCE that overrides the presented option, separately for proposal and system reviews. Sal, 2026-10-05, refining D-bpc-7. The preference shapes only what is RECOMMENDED, never what the gate accepts, so gate state stays a function of the change's files — my earlier stamp-at-propose idea is moot. AMENDS R-crc-4 (the pair was the required system cadence; it becomes the recommended default), to be recorded in the program doc. **Clarified by Sal the same day** (correcting my reading that one half covers the slot): the INVOCATION decides what covers it — once the user invokes `--reviewer blind-pair`, BOTH halves must land before the slot is covered; a single fresh or single external covers it only when the user invoked that single reviewer. So `openPair` keeps its meaning as a coverage fact, and a pair always fills the slot as one unit (resolves Q-bpc-7).
  Kind: rule
- **2026-10-05 — D-bpc-9: rc17 splits into rc17a (gate: the accepting first slot, the preference, the slot-bound pair diagnosis) and rc17b (the one-command pair)** — measured by capability (Q-bpc-1). A method call under R-crc-9, its seventh preventive application; declared as stages in an architect session, on Sal's word. Re-measured after D-bpc-15/16 (2026-10-05): rc17a carries D-bpc-6, -8, -10, -15, -16 across `orbit-engine-gates`, `orbit-emit-composition` (the launch record, the short next) and `orbit-address-reviews` (the discovery fence) — three, at R-crc-1's ceiling; rc17b carries D-bpc-1–4, -11, -13, -14.
  Kind: scope

- **2026-10-05 — D-bpc-10: pair membership is a state machine COMPUTED from the trail, with one new record — the pair LAUNCH** — the pair invocation writes an engine-composed launch record before either half starts; the engine reads NO-LAUNCH / PAIR-OPEN{missing} / COMPLETE / BROKEN off the trail and stores nothing. The fresh emit carries its launch's token; the external return is matched by order. Resolves Q-bpc-9 (Sal: "make it a decision").
  Kind: rule

- **2026-10-05 — D-bpc-11: the runner record lives in the per-user global config, set at `orbit init`** — beside profile/delivery in the existing XDG global config; init explains the concept and offers the Codex preset, an own command, or none; the engine surfaces the record in `orbit status --json` and never executes it. Distinct from the review PREFERENCE (D-bpc-8, project policy in `orbit/config.yaml`). Resolves Q-bpc-2 (Sal: "per-user global config is fine, go with that").
  Kind: rule

- **2026-10-05 — D-bpc-12: a stuck pair needs no new mechanism — the user can always pass the gate manually** — Sal: "the user can always manually pass the gate in any scenario." The existing route is the recorded `continuation`/`proceed` judgement at the gate's seam: the gate keeps REPORTING its computed state and the user's proceed is RECORDED (R-crc-13), never a recomputed pass. Re-running only the missing half remains the other route. Resolves Q-bpc-8. D-bpc-8's and D-bpc-10's "Q-bpc-8" rows point here.
  Kind: scope
- **2026-10-05 — D-bpc-13: the one command's step order** — preflight → launch record → package → commit + push (BASE) → worktree → both halves → wait → normalize the external return → commit each pass file alone in token order → push → remove the worktree → render both reports → end at the readout. A method call (R-crc-3), drafted for Sal's read.
  Kind: rule

- **2026-10-05 — D-bpc-14: a recorded runner auto-launches every external half, single or pair** — `--reviewer external` with a runner recorded launches it as the pair's half does; without one, it prints the prompt for paste as today. Sal confirmed. The behaviour is D-bpc-11's FALSIFY line and execute row; this entry records the confirmation.
  Kind: scope

- **2026-10-05 — D-bpc-15: a walk walks every pass that carries a finding and has not been walked — any severity** — Sal: "if a review was done and address-reviews was done, why would it not walk the review and fix it regardless of the severity. after all, severity is only a judgement." The GATE's hold is unchanged — SUGGESTIONs never gate (rc02; `passResolved`: "requiring a walk there would be SUGGESTIONs gating by another route") — but DISCOVERY widens: the engine computes a second set beside `unresolvedPasses`, every pass with at least one finding and no walk record referencing it, and the walk reads the union. Discovery still reads only engine-computed sets, so rc08b's "the outstanding set is the gate's, never a second rule here" holds in its intent: one rule, in the engine.
  Kind: rule
- **2026-10-05 — D-bpc-16: the review emit's next line names the change, never a path, wherever discovery reaches the pass** — a change-mode pass carrying any finding names `/orbit:address-reviews <change>`, as audit-drift's change-scoped next already does; `--from-file` stays only where discovery cannot reach (architecture mode; project-wide audit-drift). The gate's next and the report tail already print the short form. Resolves Q-bpc-10; with D-bpc-15, no change-mode pass needs a path.
  Kind: rule

## Open questions

_(none open)_

## Considered & out

- **A SUGGESTION-only pass reached only by `--from-file`** (my 2026-10-05 lean on Q-bpc-10: keep discovery equal to the gate's set) — out 2026-10-05 on Sal's call (D-bpc-15): severity is a judgement; a walk reads every unwalked pass.
- **One half of an invoked pair covers the first slot, with `openPair` as a preference hint** (my 2026-10-05 reading of D-bpc-8) — out 2026-10-05 on Sal's clarification: the invocation decides coverage, and `openPair` stays a coverage fact.
- **`independent` (fresh-or-external, whichever runs) as a preference value** — out 2026-10-05: Sal named three choices (blind-pair, fresh, external); a single reviewer is named by the user at invocation.
- **Launching a runner merely because it is on PATH** — out 2026-10-05 (D-bpc-5): no opt-in; the repo would go to a third party unasked.
- **A runner record in a committed per-repo file** — out 2026-10-05 (D-bpc-11): cloning a repo would make the cloner's AI run the repo's command — rc07's reason for refusing a `command:` field. A gitignored per-repo override also out of v1: no team case yet.
- **Stamp the resolved cadence on the change at propose** (my 2026-10-05 Q-bpc-6 lean) — out 2026-10-05: under D-bpc-8 config shapes only the recommendation, so there is nothing for a config edit to re-grade.
- **The first slot requires the blind pair on `review-system`** (spec-driven v4, R-crc-4 as amended 2026-09-14) — out 2026-10-05 on Sal's call (D-bpc-8): any outside review covers the slot; the pair is the recommended default.
- **The command never pushes; HEAD already pushed is a precondition** (my 2026-10-05 lean) — out 2026-10-05 on Sal's call (D-bpc-3).

## References

- `orbit/architecture/clean-up-review-cycle.md` — Stage rc17-blind-pair-command (the charter); D-rc03-5
  and its amendment (no launch sentence in the review body); R-crc-1 (size ceiling); R-crc-9 (split);
  Stage rc12-engine-owned-choreography (the D-d6-7 boundary, governed by R-crc-5).
- `orbit/changes/archive/2026-10-05-rc08b-walk-routing/.orbit-runs/external-system-2026-10-05T14-18-02Z.md`
  — the routed finding "Blind-pair protection ignores passes consumed by earlier cadence slots", with
  its reproduction; its walk entry is `address-reviews-2026-10-05T14-37-54Z.json` (`remedy: redesign`,
  `routed_to: orbit/explore/blind-pair-command/`).
- `src/core/artifact-graph/gates.ts` — `assignCadence`, `diagnosePair`, `isPairable`,
  `evaluateReviewed` (the `openPair` computation, coverage-before-resolution).
- `src/core/templates/workflows/review.ts` — the `--reviewer` axis, `Dispatching a fresh pass`, the
  external-handoff reference (`REVIEW_EXTERNAL_HANDOFF_REFERENCE`) and its preflight.
- `src/core/templates/workflows/address-reviews.ts` — discovery row 4: the walk stops on `openPair`.
- `src/core/global-config.ts` — the per-user XDG global config (`getGlobalConfigDir`, `GlobalConfig`), D-bpc-11's home.
- `orbit/specs/orbit-emit-composition/spec.md` — the review row's deterministic `next_recommended` ("the address-reviews `--from-file` invocation naming this emit's own path"), D-bpc-16's owner; `src/core/emit-composition.ts` composes it; `src/core/report-render.ts` checks it ("SPINE SEMANTICS").
- `orbit/specs/orbit-run-summary-emit/spec.md` — the audit-drift rows that already dropped `--from-file` for change scope (D-bpc-16's precedent).
- `schemas/spec-driven/schema.yaml` — v4's two reviewed gates (`[independent, in-context]`, `[blind-pair, in-context]`), which D-bpc-8 generalizes.

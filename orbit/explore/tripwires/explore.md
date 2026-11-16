> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: tripwires

## Premise

Stage `tripwires` of `automate-dev-flow`: detecting that a run has gone sideways (G6's first half, R-adf-3's fifth stop
condition). The charter names five signals that write stop records: a diff that leaves the change's frozen
`## Touchpoints` or touches an undeclared capability; review iterations that stop converging; size or walk budgets
exceeded; an edit to a ratified ruling or goal; and a steward pass at each stage boundary (`/orbit:review --as
architecture` aimed at one stage) asking whether the work is still the declared stage. In supervised mode each reports
without stopping. Exit: each tripwire fires on a fixture trail that should trip it and not on a clean one, each test shown
able to fail; G0 holds.

Earlier stages left places for this one: the stop condition `tripwire` exists and is refused from a payload, because
orbit raises it itself (`src/core/decision-records.ts`); the brief carries `tripwires: 'not-installed'`
(`src/core/program-brief.ts`); the chain's `why` reasons name "each signal the tripwires stage adds" as their residual
method (`orbit-engine-gates`).

What this exploration must settle: what a tripwire is mechanically (who computes it, when, where its stop record is
written, who resolves it); each signal's exact predicate; what the user sees at the defaults (G0); and how each detector
reads committed state so the run it watches cannot quietly evade it.

## Mechanism

### D-tw-1 — a tripwire is a sensor behind one contract, and sensors plug in
Domain: the kinds of sensor the contract must admit
| member | covered by |
|---|---|
| built-in, computed from committed state (Touchpoints left, undeclared capability, undeclared size breach, ruling or goal edited) | an engine function per sensor, reading git and the change's artifacts |
| built-in, computed from the trail (review iterations not converging) | an engine function reading the change's review emits |
| project-declared command (a linter, a code-structure evaluator) | a config entry naming a command whose output is one reading |
| judgement sensor (the steward pass) | a review emit's verdict field, which the engine turns into a reading |
Closure: BOUNDED — the four kinds are the inputs orbit can read today; a sensor's input is not a closed structure
Residual kind: a sensor needing state that is neither committed, on the trail, nor producible by a command (a live session's transcript, its token spend)
Residual method: classifying each drift that G6's first-run closing review finds no sensor caught against these four kinds
Moves:
- READ: applied — the reserved slots: `tripwire` in `STOP_CONDITIONS`, refused from a payload (`src/core/decision-records.ts`); `tripwires: 'not-installed'` (`src/core/program-brief.ts`); the chain `why` residual (`orbit-engine-gates`)
- ENUMERATE: applied — this table
- COHERE: applied — the judgement sensor is the odd member: its reading comes from an AI, so it is independent of the run only as far as its reviewer is (a fresh or external reviewer, never the run's own context)
- EXECUTE: not applied — nothing is built yet
- FALSIFY: applied — a sensor whose configuration or reference the watched run can edit can be evaded, so each sensor compares against a reference fixed before the run (Open question: the reference model)
- CONFORM: applied — R-adf-3: any sensor firing is condition 5, so plugging in a sensor adds no stop condition; R-adf-6: whether a sensor's firing halts is its own setting; G0: pending (Open question: what the defaults show)
- FEASIBILITY: applied — a command sensor costs a process per run; a slow linter at every emit is real cost, so each sensor names the seams it runs at
- CONSUME: applied — the `tripwire` stop record orbit writes, the chain's existing `open-stop` row, the brief's Tripwires section
- INVOKE: not applied — when sensors run is open (Open question: when sensors run)

### D-tw-3 — a sensor fires on an undeclared deviation from a reference fixed before the run
Domain: each sensor named so far, by what it measures, its reference and its declared escape
| member | covered by |
|---|---|
| Touchpoints | changed files since the change's first commit, against design.md's `## Touchpoints` as of the first apply commit; no escape (D-tw-17) |
| undeclared capability | the change's delta-spec folders, against the proposal's capability list as at the change's first apply commit; no escape (D-tw-15) |
| size | the four size figures, against the configured ceiling; escape: `## Size` |
| ruling or goal edited | the doc's Goals and Rulings-index items, against them as at the change's first apply commit; escape: a `ruling-amendment` stop with a resolution (D-tw-16) |
| convergence (circling, D-tw-7) | each finding key's verification verdicts, against the loop's normal shape of one verification per gate's walks; no escape |
| budget | a matched committed file's bytes, against its configured maximum and its size at the first apply commit; no escape in the change (D-tw-13) |
| project command (a linter, a structure tool) | the command's count now, against its count when the change was proposed (D-tw-12); no escape |
| steward pass | a judgement sensor: an independent verdict against the stage charter as at the stage's first citing propose; no escape (D-tw-8, D-tw-10) |
Closure: BOUNDED — sensors plug in (D-tw-1), so the set of sensors is open by design
Residual kind: a sensor whose reference cannot be read at its fixed point (no `## Touchpoints` section, a project sensor with no reading at propose, a baseline file missing)
Residual method: each sensor states how it reads its reference; a sensor that cannot read it returns a reading saying so, which is recorded like a firing — silence is never a pass
Moves:
- READ: applied — Touchpoints FROZEN once apply begins (`orbit-propose-modifications`' `Section-to-artifact mapping`); `## Size` declared breaches (`src/core/change-size.ts`); `ruling-amendment` in `STOP_CONDITIONS`
- ENUMERATE: applied — this table, from the charter's signals, D-tw-2's budget sensor and D-tw-1's project sensor
- COHERE: applied — a declaration is part of the plan, so it is read from the same fixed point as the reference; a declaration written after that point escapes nothing (Open question: late declarations)
- EXECUTE: not applied — nothing is built yet
- FALSIFY: applied — a run that edits its own reference (Touchpoints, sensor config, a baseline) would never trip; fixing the reference before the run is what this rule is for. A run that omits the reference (no Touchpoints section) would also never trip, hence the residual's "cannot read" reading
- CONFORM: applied — G6 (fires on a fixture that should trip and not on a clean one: a reference makes both fixtures definable); G3 (deviation, not absolute level, keeps firings rare); R-crc-11(h) untouched, since no sensor reads review spend
- FEASIBILITY: applied — a project sensor's reference is one extra run at propose, kept on the trail (D-tw-12)
- CONSUME: applied — the reading carries its reference and evidence into the `tripwire` stop, so the user answering it sees what changed against what
- INVOKE: not applied — when sensors run is open (Open question: when sensors run)

### D-tw-4 — the Touchpoints sensor fires only on unpredicted paths outside a configured exempt set
Domain: each changed path, and each state of the Touchpoints section
| member | covered by |
|---|---|
| a path under the change's own folder | excluded, as audit-drift's arithmetic already excludes it |
| a path matching a Touchpoints entry (exact, directory prefix or glob) | predicted; no firing |
| a path in the configured exempt set (tests and docs, by default to settle) | no firing |
| any other path | fires, naming the path |
| a malformed Touchpoints entry | excluded from the arithmetic, so a path it meant to predict reads as unpredicted; the reading names the malformed line beside the path |
| no Touchpoints section | the sensor cannot read its reference: a "cannot read" reading (D-tw-3's residual), never a silent pass |
Closure: DERIVED — a path is in the change's folder, matched by an entry, in the exempt set, or none of these; the section is present or absent, and its entries parse or do not
Moves:
- READ: applied — `touchpoints.actual_unpredicted` and `malformed` on the boot surface; audit-drift grades unpredicted test and doc paths SUGGESTION and source paths WARNING (`orbit-audit-drift`' `Touchpoints divergence check`)
- ENUMERATE: applied — this table
- COHERE: applied — the exempt set is sensor config, so it is read from the same fixed point as the Touchpoints (D-tw-3); widening it mid-run escapes nothing
- EXECUTE: not applied — nothing is built yet
- FALSIFY: applied — an exempt set wide enough to cover source would blind the sensor; the set is configured, visible and frozen, never inferred
- CONFORM: applied — G3 (unpredicted test files are routine, and firing on them would make stops not worth it); D-tw-3
- FEASIBILITY: not applied — one more filter over a list already computed
- CONSUME: applied — the `tripwire` stop's evidence lists the paths; audit-drift's grading is unchanged
- INVOKE: not applied — when sensors run is open

### D-tw-5 — at the defaults a firing is recorded and shown nowhere
Domain: every surface G0 names that a firing could reach with nothing configured
| member | covered by |
|---|---|
| the human readouts (`orbit status` bare, `--full`, `--boot`; `orbit architecture status`) | unchanged: none renders a reading |
| the gates | unchanged: no gate reads a reading |
| the chain object | unchanged: no stop is written at the defaults (D-tw-6), so no `open-stop` row can match |
| the reading step (default-on, R-adf-11) | unchanged: no stop is written to `decisions/` at the defaults, so its selection holds nothing new |
| the generated bodies | no text whose effect at the defaults changes what the AI does or says (R-adf-12) |
| the seam emits | an engine-computed field carrying the readings (D-tw-6): a record, rendered nowhere |
| the brief (`orbit brief`, the archive's saved copy) | its Tripwires line lists the readings, as `orbit-program-brief`' tripwires row already promises for when this stage ships |
Closure: SOURCED — G0's own list: readouts, gates, generated bodies, records; the chain object and the reading step are the two default-reaching consumers earlier stages added
Moves:
- READ: applied — G0 and R-adf-11, R-adf-12; `orbit-decision-records`' `The reading step's brief is rendered by orbit` (the reader selects every unread record in `decisions/`); `orbit-program-brief`' tripwires row ("until stage tripwires … ships, one line saying tripwires are not installed")
- ENUMERATE: applied — this table
- COHERE: applied — "record only" first meant writing the `tripwire` stop at the defaults; that stop would reach the default-on reader and, under any granted chain, halt it whatever the sensor's own setting, so the record is a reading and the stop is the halt setting's (D-tw-6)
- EXECUTE: not applied — nothing is built yet
- FALSIFY: applied — a record shown nowhere still reaches G6: first-run's closing review reads the readings on the trail
- CONFORM: applied — G0 with no new exception; the brief's tripwires line is a row its own requirement set aside for this stage
- FEASIBILITY: not applied — no surface is added
- CONSUME: applied — the brief, and first-run's closing review
- INVOKE: applied — every seam emit's write (D-tw-6)

### D-tw-6 — a reading rides the seam emit; a stop is written only when the sensor's setting says halt
Domain: what a sensor run leaves, by its outcome and its sensor's setting
| member | covered by |
|---|---|
| ran, did not fire | listed in the seam emit's engine-computed readings field (proof the sensor ran) |
| fired, setting absent or record-only | listed in the readings field with its evidence; no stop |
| fired, setting halt | listed in the readings field, and orbit writes a `tripwire` stop to `decisions/` naming the reading; the chain halts on the existing `open-stop` row |
| could not read its reference | listed as such (D-tw-3's residual), treated as fired for the two rows above |
Closure: DERIVED — a run fired, did not, or could not read; the setting is absent, record-only or halt
Moves:
- READ: applied — engine-computed emit fields already exist and are refused from a payload (`pass_genre`, `verified_walks` in `orbit-emit-composition`); `tripwire` in `STOP_CONDITIONS`, refused from a payload; the chain's `open-stop` row (`orbit-engine-gates`)
- ENUMERATE: applied — this table
- COHERE: applied — the sensor/policy split of D-tw-1's contract: the reading is the sensor's, the stop is the policy's, and one setting per sensor decides (R-adf-6)
- EXECUTE: not applied — nothing is built yet
- FALSIFY: applied — recording quiet runs too means a missing reading is visible: a seam emit with no readings field after this ships says the sensors did not run
- CONFORM: applied — R-adf-3 (a halting firing is condition 5); R-adf-6 (one setting per sensor); the charter's "in supervised mode each reports without stopping" (a reading with no stop)
- FEASIBILITY: applied — a project command sensor runs at emit write, and its reference is the one reading taken at propose and kept on the trail (D-tw-12), not rerun each seam
- CONSUME: applied — the brief's Tripwires line and first-run's closing review read the field; the chain reads only stops
- INVOKE: applied — the write of each seam command's emit (apply, review, address-reviews, archive), and propose for project sensors' references only (D-tw-12); which sensors run at which seam is each sensor's declaration

### D-tw-7 — the review sensor fires when the loop circles: one finding regressed in two verifications
Domain: what the verifications of one change say about one finding key (trimmed title, repo-relative file)
| member | covered by |
|---|---|
| never verified, or verified `landed` every time | no firing |
| `regressed` in exactly one verification pass | no firing: routine (37 of the 40 archives with verification carry one) |
| `regressed` in two or more verification passes | fires, naming the key, the two passes and the walks between them |
| `regressed`, then `landed` in a later verification | no firing: the second fix held |
Closure: BOUNDED — the four rows are closed over one key's verdict sequence, but the key is not the finding
Residual kind: a loop circling on one problem that the key cannot see — a finding re-titled between passes; a walk record unreadable to the gate, which owes no verdict; fixes repeated without an in-context verification between them
Residual method: first-run's closing review reading each change's walks for one file fixed in two or more walks of one gate
Moves:
- READ: applied — `orbit-emit-composition`' `A VERIFICATION-genre payload carries its verdicts and its findings link to the walk record` (`landed` \| `regressed`, keyed by the gate's resolution tuple); `orbit-engine-gates`' convergence criterion and its retired clause (c)
- ENUMERATE: applied — this table
- COHERE: applied — D-tw-3's reference here is the loop's normal shape, one verification per gate's walks; a second regression of one key is the deviation, and nothing can declare it
- EXECUTE: applied — run over the 68 archives with review emits on 2026-11-16: no key regressed twice, so the sensor fires on none
- FALSIFY: applied — a count trend (the latest pass found no fewer CRITICAL plus WARNING than the one before) would fire on most changes, since later passes routinely find more (2→10, 3→7, 1→5); review spend over `budget` would make an expected cost a permitted one (R-crc-11(h)); this reads neither
- CONFORM: applied — clause (c)'s retirement (no claim that a cadence converges); R-crc-11(h); G3 (zero firings on the record); D-tw-3; D-tw-6 (a reading on the review emit)
- FEASIBILITY: not applied — a pass over verdicts the trail reader already parses
- CONSUME: applied — the reading's evidence lists the key and both passes, so the user answering a halt sees the circle
- INVOKE: applied — the write of each review emit carrying `verification` (D-tw-6)

### D-tw-8 — the steward is a single-question review by an independent reviewer: is this change still its stage?
Domain: what the steward reads, and what its verdict can be
| member | covered by |
|---|---|
| the stage charter as it stood at the stage's first citing propose | the reference (D-tw-3), read from git at that commit; when the current charter differs, the reading says so |
| the change's proposal and diff | the work being judged |
| the change's account `deviations` | the run's own claim, compared with the verdict (D-tw-10) |
| verdict `on-stage` | no firing |
| verdict `drifted` | fires, with the reviewer's evidence |
| verdict `cannot-tell` | fires: a sensor that cannot decide is never a pass (D-tw-3's residual) |
| a change citing no stage | the steward does not run: there is no charter to judge against |
Closure: DERIVED — three inputs the charter and the account requirement define, three verdicts, and the one case with no reference
Moves:
- READ: applied — architecture mode's six passes judge the doc (`src/core/templates/workflows/review.ts`, `Architecture-mode passes (6)`), and no change-mode pass reads a charter; the account's `deviations` field (`orbit-decision-records`' `Each change carries one account, written when apply is complete`); four architecture reviews on the trail in total
- ENUMERATE: applied — this table
- COHERE: applied — the steward and the account are two statements of one fact, fit to the charter, one by the run and one by an independent reviewer; D-tw-10 reads them against each other
- EXECUTE: not applied — nothing is built yet
- FALSIFY: applied — reading the CURRENT charter would let a run make its drift legitimate by rewording the charter, which no other sensor watches (the ruling-or-goal sensor covers Goals and Rulings only)
- CONFORM: applied — D-tw-1 (the judgement member of the contract); D-tw-3 (a reference fixed before the run); D-tw-6 (the verdict becomes a reading on the steward's own emit); the charter's text names architecture mode, so its parenthetical is reworded at the next architect session
- FEASIBILITY: applied — one independent review per cited change: real cost, which is why it is off at the defaults (D-tw-9)
- CONSUME: applied — the reading, the brief's Tripwires line, and under a halt setting the `tripwire` stop; G6's fixture tests prove only the engine's part (verdict to reading, `cannot-tell` fired, the comparison with the account) — the reviewer's judgement is graded at first-run, a named limit
- INVOKE: applied — D-tw-9

### D-tw-9 — the steward runs at each cited change's archive, and is off at the defaults
Domain: each point where the steward could run, and each state of its setting
| member | covered by |
|---|---|
| a cited change's archive, setting on | runs, after the account exists and before the archive's own emit |
| a cited change's archive, setting absent or off | does not run; the archive is as today |
| the user invoking it on a change, any setting | runs |
| a change's propose | does not run (the user's choice, 2a) |
| stage completion at architect | does not run (the user's choice, 2a) |
Closure: DERIVED — the lifecycle points a change passes where its stage fit could be judged, by the setting's two states, plus the user's own invocation
Moves:
- READ: applied — the account is written when apply is complete, so at archive it exists (`orbit-decision-records`); G0's body clause and R-adf-12
- ENUMERATE: applied — this table
- COHERE: applied — D-tw-5 computes sensors at the defaults so first-run can count firings; the steward is the one exception, by cost, so supervised stretches carry no steward readings and G6 counts only the stretches where it was on
- EXECUTE: not applied — nothing is built yet
- FALSIFY: applied — a steward that ran only at stage completion would judge up to four changes at once, after all of them had landed
- CONFORM: applied — G0 (an added independent review at every archive changes the flow and its cost; off by default holds it with no exception); R-adf-6 (its own setting); R-adf-12 (the archive body's text for it acts only when the setting is on)
- FEASIBILITY: applied — one review per cited change, only when the user turns it on
- CONSUME: applied — the archive emit's readings (D-tw-6); the driver, which turns it on for an autonomous run
- INVOKE: applied — the archive of a cited change with the setting on, or the user's invocation

### D-tw-10 — the steward fires on drift whether or not the account declared it
Domain: the steward's verdict against the account's `deviations`
| member | covered by |
|---|---|
| `on-stage`, account declares none | no firing |
| `on-stage`, account declares a deviation | no firing; the reading notes the account declared one the reviewer did not judge drift |
| `drifted`, the account declared it | fires, marked declared |
| `drifted`, the account did not declare it | fires, marked undeclared |
| `cannot-tell` | fires, marked as such |
Closure: DERIVED — three verdicts by whether the account declared a deviation
Moves:
- READ: applied — the account is written by the run after the work and ratified by no one (`orbit-decision-records`)
- ENUMERATE: applied — this table
- COHERE: applied — D-tw-3's declared escape is a declaration in the PLAN, fixed before the run; the account is written after, so it is not one
- EXECUTE: not applied — nothing is built yet
- FALSIFY: applied — if a declared deviation escaped, a run could excuse any drift by confessing it in its account
- CONFORM: applied — D-tw-3; R-adf-6 (a halt setting may choose to halt on undeclared drift only, since the reading marks which)
- FEASIBILITY: not applied — one comparison
- CONSUME: applied — the reading's mark, read by the halt setting and the brief
- INVOKE: applied — every steward run (D-tw-9)

### D-tw-11 — project sensors are declared in the project and run only after the user approves that exact set on this machine
Domain: each state a declared project sensor can be in when a seam would run it
| member | covered by |
|---|---|
| no project sensor declared | nothing runs (G0) |
| declared, never approved on this machine | not run; a "cannot read" reading naming the missing approval |
| declared, approved, and the declaration and every repo file its argv names unchanged since | run: argv only, never a shell string, from the project root, under a timeout |
| declared, changed since its approval | not run; a "cannot read" reading naming what changed, which counts as fired (D-tw-3) |
| approved while the change it watches was under way | run; the reading notes the approval's time inside the change |
| a cloned project whose user never approved | nothing runs: approval is per machine, kept in the user's own config |
Closure: BOUNDED — the approval states are closed, but what a sensor's command reads is not
Residual kind: what a sensor's command reads beyond its declaration and the files its argv names — a script those call, the tool's own configuration (a linter's rule file)
Residual method: the Touchpoints sensor fires on an edit to such a file the plan did not predict only past its tolerances (D-tw-17), so a small edit passes; first-run's closing review reads each change's edits to files its sensors read
Moves:
- READ: applied — the external runner: per-user record, argv only, executed by the review body and never by the engine (`src/core/external-runner.ts`); the engine runs no other process but git
- ENUMERATE: applied — this table
- COHERE: applied — the approval is D-tw-3's freeze for project sensors: an edit stops the sensor running until the user approves again, and "cannot read" counts as fired, so editing a watcher trips it
- EXECUTE: not applied — nothing is built yet
- FALSIFY: applied — an AI holding the user's shell could run the approval itself; orbit cannot prevent that (single user, detection never a lock), so it records each approval's time and the reading notes one given during the change
- CONFORM: applied — the stop `stop-2026-11-16T20-27-14Z.json` and its resolution (the user's answer, A); R-adf-6 (each sensor's halt is its own setting); G0 (nothing declared, nothing runs)
- FEASIBILITY: applied — a command per sensor at each seam it names, under a timeout
- CONSUME: applied — the reading (D-tw-6), the approval record in the user's config
- INVOKE: applied — the seams each sensor names; the user's approval command

### D-tw-12 — a project sensor reports one count on stdout, compared with its reading when the change was proposed
Domain: what a project sensor's run can produce, and its comparison with its reference
| member | covered by |
|---|---|
| stdout is a single integer | the count, whatever the exit code |
| stdout is JSON `{"count": <int>, "items": [<string>…]}` | the count; the items are the reading's evidence, whatever the exit code |
| stdout is anything else, or empty | "cannot read" |
| the command times out or cannot start | "cannot read" |
| no reference reading (the sensor was added after propose, or could not read then) | "cannot read": no reference, no comparison |
| count greater than the reference | fires |
| count at or below the reference | no firing |
Closure: DERIVED — stdout parses as one of two forms or does not; the run finishes or does not; a reference exists or does not; the count exceeds it or does not
Moves:
- READ: applied — D-tw-3's reference model; D-tw-6's readings field
- ENUMERATE: applied — this table
- COHERE: applied — the reference is taken at propose, a seam the readings field did not list, so the propose emit's write takes each project sensor's reference reading and keeps it on the trail (D-tw-6's seams gain propose, for references only)
- EXECUTE: applied — linters exit non-zero when they find problems (a lint run with errors exits 1), so reading the exit code as failure would make every run with findings unreadable; the count is read from stdout whatever the exit code, and only an unparsable output, a timeout or a failure to start is "cannot read"
- FALSIFY: applied — a reference taken by re-running the tool at the base commit needs a checkout whose dependencies may not be installed, so it would often be unreadable; the propose-time reading is taken in the working tree the tool already runs in
- CONFORM: applied — D-tw-3 (deviation from a reference fixed before the run); D-tw-11 (the run itself)
- FEASIBILITY: applied — one extra run per sensor at propose; each sensor names the seams it runs at, so a slow tool runs only where the project wants it
- CONSUME: applied — the reading's count, reference and items, read by the brief and, under a halt setting, the `tripwire` stop
- INVOKE: applied — propose (the reference) and each seam the sensor names

### D-tw-13 — the budget sensor caps committed files' bytes; orbit-spec's generated skills are capped by a test
Domain: each state of a file a budget's paths match, and orbit-spec's own case
| member | covered by |
|---|---|
| a matched file at or under its maximum | no firing |
| a matched file over its maximum and larger than at the change's first apply commit | fires, naming the file, its bytes and its maximum |
| a matched file over its maximum and no larger than at that commit (already over before the change) | no firing; the reading notes it |
| a file new in the change, over its maximum | fires |
| a budget whose paths match no file | "cannot read" (D-tw-3's residual) |
| a maximum raised during the change | not seen: the budget is read from the config as at the first apply commit, so a raise applies to later changes |
| orbit-spec's generated skills (`.claude/` is gitignored, so not committed) | a test renders each skill in-process (`getSkillTemplates`, `generateSkillContent` in `src/core/shared/skill-generation.ts`) and holds its bytes at or under a committed table, first set to today's sizes; lowering an entry is free, raising one is a reviewed edit |
Closure: DERIVED — a matched file is at or under its maximum or over it; if over, larger than at the fixed point or not; new or not; a budget matches files or does not; plus orbit-spec's one uncommitted surface
Moves:
- READ: applied — `getSkillTemplates` (line 68) and `generateSkillContent` (line 147) in `src/core/shared/skill-generation.ts`; `.claude/` gitignored (CLAUDE.md); the sizes measured for D-tw-2
- ENUMERATE: applied — this table
- COHERE: applied — refines D-tw-2's mechanism and keeps its scope: a sensor an adopter can point at its own files must read committed files, and orbit's own generated skills are not committed, so the stage builds both halves
- EXECUTE: not applied — nothing is built yet
- FALSIFY: applied — firing on every file already over its maximum would fire on every change that touches one; comparing with the first apply commit fires only on growth
- CONFORM: applied — D-tw-2 (scope); D-tw-3 (reference at a fixed point; config read there too); R-adf-5 (orbit-spec is not run under the automation, so its guard is a test, not a sensor run)
- FEASIBILITY: not applied — a byte count per matched file
- CONSUME: applied — the reading (D-tw-6); for orbit-spec, `npm test` and CI
- INVOKE: applied — each seam the budget names; orbit-spec's test on every `npm test`

### D-tw-14 — a declaration written after the fixed point counts only as the user's answer to the stop it raised
Domain: when a declaration is written, by the sensor's setting
| member | covered by |
|---|---|
| present at the reference's fixed point | the deviation it names is declared: no firing |
| written later, sensor set to halt | fires; the `tripwire` stop names the reading's key, the user's answer is its resolution, and later readings with that key read as declared |
| written later, sensor record-only (the default) | the reading stays fired; the brief shows it beside the late declaration |
Closure: DERIVED — a declaration is in place at the fixed point or written after it; the setting is halt or not
Moves:
- READ: applied — D-tw-3 (declarations read from the fixed point); D-tw-6 (stops only under halt); D-tw-1's reading carries a key
- ENUMERATE: applied — this table
- COHERE: applied — the resolution names the stop and the stop names the reading's key, so "declared" has one source after the fixed point: the user's answer
- EXECUTE: not applied — nothing is built yet
- FALSIFY: applied — if a later declaration escaped on its own, a run could declare its way out of any sensor
- CONFORM: applied — D-tw-3; D-tw-5 (record-only shows nothing new); R-adf-6
- FEASIBILITY: not applied — a key match
- CONSUME: applied — later readings, the brief
- INVOKE: applied — every reading taken after a resolution

### D-tw-15 — the capability sensor fires on a delta-spec folder the proposal's capability list does not name
Domain: each delta-spec folder and each listed capability, against the proposal as at the change's first apply commit
| member | covered by |
|---|---|
| a folder under the change's `specs/` whose name is listed | no firing |
| a folder whose name is not listed | fires, naming the folder |
| a capability listed with no folder | no firing; the reading notes it (the plan overshot, as Touchpoints' unsatisfied entries are read) |
| a heading holding `None.` | an empty list |
| no `## Capabilities` section, or no list under it that parses | "cannot read" |
Closure: DERIVED — the list is the backticked leading names under `### New Capabilities` and `### Modified Capabilities`; a folder is listed or not; a listed name has a folder or not
Moves:
- READ: applied — the section's shape in archived proposals (`orbit/changes/archive/2026-11-16-program-signoff/proposal.md`); no engine parser reads it today
- ENUMERATE: applied — this table
- COHERE: applied — the proposal's list freezes when apply begins, as Touchpoints does; before that, proposal review may revise it
- EXECUTE: applied — run over the 40 latest archives on 2026-11-16: every proposal has the section, no folder is unlisted, no listed name lacks a folder; the sensor fires on none
- FALSIFY: applied — code that changes a capability's behaviour with no delta folder is invisible here (no map from files to capabilities); the Touchpoints sensor watches code paths
- CONFORM: applied — D-tw-3; G3 (zero firings on the record)
- FEASIBILITY: not applied — a directory listing and one section parse
- CONSUME: applied — the reading (D-tw-6)
- INVOKE: applied — apply, review and archive emits of a change with delta folders

### D-tw-16 — the ruling sensor fires when a Goals or Rulings-index item changes with no answered ruling-amendment stop
Domain: each Goals and Rulings-index item of the doc a change cites, as at the change's first apply commit against now
| member | covered by |
|---|---|
| no item changed, removed or added | no firing |
| an item changed, removed or added, with a `ruling-amendment` stop answered by a resolution written after the reference, in the change's trail or the doc's | no firing; the reading names the items and the stop |
| an item changed, removed or added, with no such stop | fires, naming the items |
| such a stop written but not answered | fires: an open amendment is not an approved one |
| the change cites no doc | does not run |
| the doc's `## Goals` or `## Rulings index` cannot be parsed | "cannot read" |
Closure: DERIVED — items are the anchors the ledger's `goal` and `ruling` citations already match (`**<id>` opening a Goals item, `**<id>**` under the Rulings index); each is unchanged, changed, removed or added; a covering stop is answered, open or absent
Moves:
- READ: applied — the ledger citation anchors (`orbit-decision-records`' `A ledger entry names what it relies on`); R-adf-13 recorded with a stop and its resolution in the doc's trail; R-adf-14 cites no stop
- ENUMERATE: applied — this table
- COHERE: applied — rulings are amended at architect sessions, whose records go to the doc's trail, so the search covers the change's trail and the doc's
- EXECUTE: applied — read against the Rulings index: R-adf-14's addition cites no stop, so it would have fired once; its answer would have been its declaration (D-tw-14)
- FALSIFY: applied — an added ruling is watched as an edit is, since an AI adding a permissive ruling is as sideways as one rewording a restrictive one. Named limit: a stop names no item, so one answered stop covers every edit in its window
- CONFORM: applied — R-adf-3 condition 3 (amending a ratified ruling or goal is a stop the AI owes); this sensor checks that it was written; D-tw-3
- FEASIBILITY: not applied — two section parses and a folder scan
- CONSUME: applied — the reading (D-tw-6)
- INVOKE: applied — apply, review and archive emits of a change citing a doc

### D-tw-17 — the Touchpoints sensor fires on unpredicted source past a tolerance, outside a configured exempt set
Domain: the unpredicted paths of a change, by kind and by size, and each state of the Touchpoints section
| member | covered by |
|---|---|
| a path under the change's own folder | excluded, as audit-drift's arithmetic already excludes it |
| a path a Touchpoints entry matches | predicted; no firing |
| a path in the exempt set (default `orbit/`, `test/`, `tests/`, `__tests__/`, `*.test.*`, `*.spec.*`, `docs/`, `*.md`) | no firing |
| an unpredicted source file with more than the per-file tolerance changed (default 40 lines) | fires, naming the file and its lines |
| unpredicted source above the share tolerance of the change's source lines (default 20%) | fires, naming the files and the share |
| unpredicted source within both tolerances | no firing; the reading lists the files |
| a malformed Touchpoints entry | excluded from the arithmetic; the reading names the line beside any path it meant to predict |
| no Touchpoints section | "cannot read" (D-tw-3's residual) |
Closure: DERIVED — a path is in the change's folder, predicted, exempt or unpredicted source; unpredicted source is past a tolerance or within both; the section is present or absent, and its entries parse or do not
Moves:
- READ: applied — `touchpoints.actual_unpredicted` and `malformed` on the boot surface; `isPredicted` in `src/core/parsers/touchpoints.ts`; audit-drift's SUGGESTION grade for unpredicted tests and docs
- ENUMERATE: applied — this table
- COHERE: applied — the exempt set and both tolerances are sensor config, read from the config as at the first apply commit (D-tw-3), so widening them mid-run escapes nothing
- EXECUTE: applied — run 2026-11-16 over the 14 latest merged changes against their archived design.md: with the exempt set alone, 8 of 14 fire (11 of the 19 unpredicted source files changed 4 lines or fewer); with the tolerances, 1 of 14 (change-account: `account.ts`, 138 lines, 35.3% of its source lines)
- FALSIFY: applied — drift that spreads across many files in small edits passes the per-file tolerance, which is why the share tolerance exists; drift within both tolerances is a named limit, and it weakens D-tw-11's residual method (a small edit to a file a project sensor reads passes)
- CONFORM: applied — G3 (one firing in fourteen on the record); D-tw-3; supersedes D-tw-4, which the measurement showed would fire on more than half the changes
- FEASIBILITY: not applied — a line count per unpredicted file, from the same diff
- CONSUME: applied — the reading (D-tw-6), audit-drift's unchanged grading
- INVOKE: applied — apply, review and archive emits of a change with a Touchpoints section

## Decisions

- **2026-11-16 — D-tw-1: a tripwire is a sensor behind one contract, and sensors plug in** The user's direction: a
  tripwire is a sensor over aspects of the AI's behaviour and the codebase that decides whether a stop should happen,
  and the architecture should admit further sensors (linters, code-structure evaluators) plugging in. The five charter
  signals become the built-in sensors; nothing about a signal is special-cased outside the contract. A reading (the
  AI's method, settled while recording D-tw-14) carries the sensor's id, its outcome (fired, quiet or cannot read), its
  evidence, its reference, and a key naming the deviation, so a stop and its resolution can name what they answer.
  Kind: rule
- **2026-11-16 — D-tw-2: skill size is held here by a budget sensor; reducing the skills is its own architect work** The
  user's choice (option a, over folding a reduction stage into this program before `driver`). This stage builds a
  size-budget sensor: a byte ceiling per generated skill, with a declared-breach escape in the `## Size` manner, firing
  on growth over its reference; it is also the first non-AI-behaviour sensor, proving D-tw-1's plug-in contract. Shrinking
  the bodies (the engine owning procedure, a body/reference split, the epitome as one shared reference, a provenance
  lint) is separate work started at `/orbit:architect`, because it edits every body and collides with G0's additive
  body clause (R-adf-9, R-adf-12). Measured at HEAD on 2026-11-16: workflow template source 130,916 bytes at `d665f12`
  and 583,038 now; the largest SKILL.md is orbit-address-reviews at 56,996 bytes; the disciplines epitome is about
  3.8 KB in each of 14 bodies.
  Kind: scope

- **2026-11-16 — D-tw-3: a sensor fires on an undeclared deviation from a reference fixed before the run** Confirmed by
  the user: every sensor measures something now, compares it with a reference fixed before the run it watches, and fires
  when they differ and the plan did not declare the difference. Watching deviation, not level, keeps firings rare (G3);
  fixing the reference keeps the run from moving it. The steward pass is the one judgement sensor outside this rule.
  Kind: rule
- **2026-11-16 — D-tw-4: the Touchpoints sensor fires only on unpredicted paths outside a configured exempt set** The
  user's choice (option one, over firing only outside every predicted directory, or firing on anything unpredicted and
  letting first-run's G3 grade it). Unpredicted tests and docs are routine; the exempt set is part of the sensor's
  configuration and fixed with its reference.
  Kind: rule
  Disposition: superseded D-tw-17

- **2026-11-16 — D-tw-17: the Touchpoints sensor fires on unpredicted source past a tolerance, outside a configured
  exempt set** The user's choice, over keeping D-tw-4 as chosen and letting first-run's G3 grade it. Measured, D-tw-4
  would have fired on 8 of the 14 latest changes, almost all on ripple of 4 lines or fewer; with a per-file tolerance
  (default 40 lines) and a share tolerance (default 20% of the change's source lines), on 1 of 14.
  Kind: rule
- **2026-11-16 — D-tw-5: at the defaults a firing is recorded and shown nowhere** The user's choice (record only, over
  a one-line report at the defaults, which would need a named G0 exception, or computing sensors only under a setting,
  which would leave first-run's G6 unable to count firings in supervised stretches). G0 holds with no new exception; the
  brief's Tripwires line lists the readings, as its requirement set aside.
  Kind: rule
- **2026-11-16 — D-tw-6: a reading rides the seam emit; a stop is written only when the sensor's setting says halt**
  Method, settled by the AI while recording D-tw-5: a `tripwire` stop written at the defaults would reach the default-on
  reader and halt any granted chain regardless of the sensor's own setting, so a firing is recorded as a reading in an
  engine-computed field of the seam emit, quiet runs included, and the stop belongs to the halt setting. Settles when
  sensors run: at each seam command's emit write.
  Kind: rule

- **2026-11-16 — D-tw-7: the review sensor fires when the loop circles: one finding regressed in two verifications**
  Confirmed by the user. Orbit's "convergence" is a gate's pass condition, and the idea that a cadence converges when
  reviewers stop finding things was retired (`orbit-engine-gates`, clause (c)); the charter's "review iterations that stop
  converging" is read as the walk-and-verify loop going round twice on one finding. Measured over 68 archives: count
  trends would fire on most changes, one regression is routine, and a second regression of one key never happened.
  Kind: rule

- **2026-11-16 — D-tw-8: the steward is a single-question review by an independent reviewer: is this change still its
  stage?** Confirmed by the user, over architecture mode with a stage filter: that mode's passes judge the doc, never the
  work, and nothing else independent compares a change with its charter. It reads the charter as it stood at the stage's
  first citing propose; its verdict is `on-stage`, `drifted` or `cannot-tell`. The charter's parenthetical
  ("`/orbit:review --as architecture` aimed at one stage") is reworded at the next architect session.
  Kind: rule
- **2026-11-16 — D-tw-9: the steward runs at each cited change's archive, and is off at the defaults** The user's choice
  (2a, over also running at propose, or only at stage completion; off at the defaults confirmed). It runs under its own
  setting or when the user invokes it: the one sensor not computed at the defaults, by cost (G0).
  Kind: rule
- **2026-11-16 — D-tw-10: the steward fires on drift whether or not the account declared it** The user's choice. The
  reading marks declared or undeclared, so a halt setting may halt on undeclared drift only; an after-the-fact account
  is not a declaration in the plan.
  Kind: rule

- **2026-11-16 — D-tw-11: project sensors are declared in the project and run only after the user approves that exact
  set on this machine** The user's answer (A) to the `security-unprecedented` stop `stop-2026-11-16T20-27-14Z.json`, over
  declaring them only in the user's own config (B) or having the AI session run them (C). Argv only; approval by hash of
  the declaration and the repo files its argv names, kept in the user's own config; any edit needs approval again, and
  until then the sensor reads "cannot read". The approval is also D-tw-3's freeze.
  Kind: rule
- **2026-11-16 — D-tw-12: a project sensor reports one count on stdout, compared with its reading when the change was
  proposed** Method, settled by the AI with the user not objecting. The count is read whatever the exit code, because
  linters exit non-zero when they find problems; the reference is taken at propose in the working tree.
  Kind: rule

- **2026-11-16 — D-tw-13: the budget sensor caps committed files' bytes; orbit-spec's generated skills are capped by a
  test** Method, settled by the AI. Refines D-tw-2's mechanism within its scope: a sensor adopters point at their own
  committed files, firing on growth over a maximum; orbit-spec's generated skills are not committed, so a test renders
  them and holds them under a committed table set to today's sizes.
  Kind: rule
- **2026-11-16 — D-tw-14: a declaration written after the fixed point counts only as the user's answer to the stop it
  raised** Method, settled by the AI.
  Kind: rule
- **2026-11-16 — D-tw-15: the capability sensor fires on a delta-spec folder the proposal's capability list does not name**
  Method, settled by the AI. Measured over 40 archives: no firing.
  Kind: rule
- **2026-11-16 — D-tw-16: the ruling sensor fires when a Goals or Rulings-index item changes with no answered
  ruling-amendment stop** Method, settled by the AI. Added items are watched as edits are.
  Kind: rule

## Open questions

- **How the stage divides into changes.** Settled decisions reach at least the emit write gate, the decision records,
  review, archive, the brief, the project config, Touchpoints and change size, past the three-capability ceiling.
  Standing recommendation: three changes — (1) the reading contract, its field on the seam emits, the per-sensor
  setting and the mechanical sensors (Touchpoints, capability, size, ruling, budget); (2) the judgement sensors
  (circling and the steward); (3) project sensors (approval, protocol); the split is propose's to settle against the
  measured size

## Considered & out

- **2026-11-16 — Project sensors declared only in the user's own config:** out (the user, D-tw-11). Sensors could not
  travel with a project, and each machine would need its own.
- **2026-11-16 — Project sensors run by the AI session:** out (the user, D-tw-11). The watched AI would produce its own
  readings.
- **2026-11-16 — A non-zero exit read as "cannot read":** out (D-tw-12). Linters exit non-zero when they find problems.
- **2026-11-16 — A project sensor's reference taken at the base commit:** out (D-tw-12). The checkout's dependencies may
  not be installed.
- **2026-11-16 — The steward as architecture-mode review aimed at one stage:** out (the user, D-tw-8). Its six passes
  judge the doc, never the work.
- **2026-11-16 — The steward also at propose:** out (the user, D-tw-9).
- **2026-11-16 — The steward only at stage completion:** out (the user, D-tw-9). It would judge up to four changes at
  once, after all had landed.
- **2026-11-16 — A deviation the account declared escapes the steward:** out (the user, D-tw-10). A run could excuse any
  drift by confessing it.
- **2026-11-16 — Review convergence as a falling finding count:** out (D-tw-7). The retired clause (c) by another route;
  later passes routinely find more, so it would fire on most changes.
- **2026-11-16 — Review spend over the gate's `budget`:** out (D-tw-7). It makes an expected cost a permitted one
  (R-crc-11(h)).
- **2026-11-16 — A "walk budget":** out (D-tw-7). No such concept exists in the code; repeated walks of one finding are
  what the circling sensor watches.
- **2026-11-16 — A one-line tripwire report at the defaults:** out (the user, D-tw-5). It needs a named G0 exception; a
  setting can add it later under R-adf-12.
- **2026-11-16 — Computing sensors only under a setting:** out (the user, D-tw-5). First-run's G6 could not count firings
  in supervised stretches. The steward is the one exception, off at the defaults by cost (D-tw-9).
- **2026-11-16 — Writing the `tripwire` stop at the defaults (record only, as first framed):** out (D-tw-6). The stop
  reaches the default-on reader and halts any granted chain whatever the sensor's own setting.
- **2026-11-16 — A separate `orbit tripwires` command, or computing readings in `status`:** out (D-tw-6). A command the
  bodies call can be skipped, and a read must not write; the seam emit's write is the one point every seam already passes.

- **2026-11-16 — Touchpoints with the exempt set alone (D-tw-4 as chosen):** out (the user, D-tw-17). It would have fired
  on 8 of the 14 latest changes, almost all on small ripple.
- **2026-11-16 — Touchpoints firing only outside every predicted directory:** out (the user, D-tw-4). Coarser than the
  entries already written, so a source file beside a predicted one would pass unseen.
- **2026-11-16 — Touchpoints firing on anything unpredicted, graded by first-run's G3:** out (the user, D-tw-4). Routine
  test and doc files would make most firings unwarranted before the trial could say so.
- **2026-11-16 — Folding skill-size reduction into this program as a stage before `driver`:** out (the user, D-tw-2).
  It edits every body and collides with G0's additive body clause; it is its own architect work.

## References

- `orbit/architecture/automate-dev-flow.md` — stage `tripwires`, G0, G6, R-adf-3 (condition 5), R-adf-11/12
- `src/core/decision-records.ts` — `STOP_CONDITIONS` with `tripwire`; `PAYLOAD_STOP_CONDITIONS` excludes it
- `orbit/specs/orbit-conventions/spec.md` — the decision-writing table's `tripwire` row (orbit raises it)
- `orbit/specs/orbit-engine-gates/spec.md` — the chain object's `why` rows and their residual; the review `budget`
  ruling (R-crc-11(h): expected cost, never permitted cost; nothing consults it)
- `orbit/specs/orbit-audit-drift/spec.md` — `Touchpoints divergence check` (engine-computed set difference)
- `orbit/specs/orbit-propose-modifications/spec.md` — Touchpoints FROZEN once apply begins; the entry grammar
- `src/core/parsers/touchpoints.ts`, `src/core/boot-render.ts` — predicted/actual arithmetic
- `src/core/change-size.ts` — the four size figures, the ceiling and `## Size` declared breaches (reports only)
- `src/core/program-brief.ts` — `tripwires: 'not-installed'` and its brief text
- `src/core/templates/workflows/review.ts` — architecture mode is doc-wide today; no stage target

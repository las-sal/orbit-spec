# Program: automate-dev-flow

> Position is COMPUTED — run `orbit architecture status`. This doc declares; the engine renders.

## Premise

Sal, 2026-11-07: orbit's flow takes too long, and the user keeps it moving at points where the user adds no value — typing the
next command, clearing context and re-booting with `orbit status --boot`. To use orbit to build really big things,
it must take far less intervention. Every lifecycle transition is user-invoked today (D1's no-chaining contract,
`orbit-conventions`' `No-chaining contract`), so a stage costs one typed command per seam.

This program must produce a flow that can run a whole program with the user present only where the user adds value, in two
regimes, chosen per project or per program at architect:

- **Seam-chained (regime 2):** orbit runs the stretches the user always approves without being asked, and stops at
  named seams.
- **Autonomous (regime 3):** orbit runs the program and stops only on ultra-critical issues, with one sign-off
  before archive, given over a plain-language summary of the program (new definitions, concepts and seams).

Sal's terms: everything between the seams is the AI's domain; every AI judgement that affects the end user or
involves security is recorded (a new decision-tracking layer); none of today's tracking is lost; and the AI may
decide at architect which parts of a program run in parallel with subagents and which run linearly. Two questions
the design must answer: how context is cleared between phases without the user, and how orbit detects that the AI has
gone sideways on a program.

## Goals

Ratified by Sal, 2026-11-07. Each goal names what makes it fail. G0 is graded here, at every
stage; G1–G6 are graded at first-run, on that project's trail and transcripts.

- **G0 — Today's flow is untouched, and nothing is lost.** With every setting at its default, orbit behaves exactly
  as it does now, with the exceptions the user has ratified (R-adf-11): a system review of a change that has decision
  records also has a clean reader check them, which adds review findings and the walk that fixes them; and an archive
  of a change with a pull request names, in one line, each file it commits from the change's folder that git never
  tracked (R-adf-13). Otherwise
  the engine's readouts and gates are unchanged, and a generated body changes only by an addition
  that tells the AI to record something, or by text whose effect depends on a setting and which, with every setting
  at its default, leaves what the AI does unchanged (R-adf-12) — never by a change to what it does at a seam or
  what the user sees at the defaults. Every existing
  test still passes. An existing test is edited only where it enumerates a closed set the stage extends (a command
  list, a hash pin), never to weaken what it asserts about today's behaviour, and each such edit is named in the
  stage's archive. Under any setting, every record today's flow writes is still written. Fails if a default install
  behaves differently, if an existing test's assertion about today's behaviour is weakened, or if a first-run trail
  lacks a record type the supervised flow would have written; a default install behaving differently beyond a
  ratified exception fails it. (Reworded by Sal, 2026-11-07, R-adf-9; exceptions by Sal, 2026-11-09, R-adf-11; setting-dependent text by Sal,
  2026-11-09, R-adf-12; the archive's untracked-file line by Sal, 2026-11-11, R-adf-13.)
- **G1 — The user only shows up where the user adds value.** In first-run, every user turn after the opening architect session
  is one of: answering a stop record, a sign-off, or a voluntary interjection the user makes. Fails on a single turn where
  the user had to type the next command, clear context, or re-boot a session to keep the run moving.
- **G2 — Stops are complete.** Every event in first-run that meets one of R-adf-3's six conditions produced a stop
  record before the run went past it. A closing review classifies the trial's diffs and ledger against the six to
  find any it missed. Fails on one missed stop.
- **G3 — Stops are rare enough to be worth it.** At most one stop record in four is judged unwarranted by the user at the
  stop. Fails above that, since a run that stops for nothing brings back the pain.
- **G4 — Judgements are recorded.** Every AI judgement in first-run that affects the end user or involves security
  has a ledger entry. The same closing review looks for unrecorded ones. Fails on one.
- **G5 — The brief is enough to sign off on.** Reading only the program brief, the user can say what was built, the new
  terms and seams, and every ledger judgement, and signs off or declines without opening another artifact. The user
  grades it. Fails if the user needs another artifact to decide.
- **G6 — Sideways is caught.** Each tripwire fires on a fixture that should trip it and not on a clean one (graded
  here, each shown able to fail). In first-run, no drift that a tripwire covers is found later by the user or a review
  without that tripwire having fired. Fails on either.
- **G7 — Concurrency loses nothing.** In first-run, concurrent lanes' archives preserve every lane's synced
  requirements (base fingerprints verified at each archive), and no lane overwrites another's work. Fails on one
  lost or overwritten requirement.

## Rulings index

- **R-adf-1** (Sal, 2026-11-07) — Three standing rules are formally amended into configuration: D1's no-chaining
  contract (`orbit-conventions`' `No-chaining contract`, with `orbit-lifecycle-consent`), the single-user,
  single-session operating model (concurrency as a non-goal, Sal 2026-08-20), and D6's outward-actions rule
  (`orbit-conventions`' `Residual outward-actions rule`). Rationale (Sal): they were the hooks that kept the flow
  honest while Sal learned how to build with an AI; now each is a config decision. Confirmed by Sal the same day: every
  setting defaults to today's behaviour, so no install or upgrade becomes autonomous silently. The sign-off before
  archive is a setting too, not a floor (Sal, overruling the AI's recommendation): a sensitive project, such as a
  home-control system with authentication, gates archive on it; a sandboxed app can let the AI run without one.
- **R-adf-2** (Sal, 2026-11-07; amended 2026-11-12) — How often the user signs off is its own setting, separate from
  the regime (R-adf-6): at each change's archive, over that change's brief; or once per program, over the program
  brief, holding the program's completion under every `pr:` mode and, under `pr: per-architecture`, the program PR's
  READY flip too. With the setting absent nothing waits for a sign-off (R-adf-1). As first ratified, the frequency
  followed the regime: autonomous once per program before the program PR goes READY, seam-chained at each stage's
  archive. Amended by Sal in the program-brief exploration (D-pb-1, D-pb-3 in `orbit/explore/program-brief/explore.md`);
  recorded as `stop-2026-11-12T23-22-00Z.json` and its resolution in this trail's `decisions/` folder.
- **R-adf-3** (Sal, 2026-11-07) — An autonomous run stops only on a stop condition, and the set is closed:
  (1) a security-relevant choice with no precedent in specs or rulings; (2) an end-user-visible behaviour choice no
  ratified goal covers; (3) amending a ratified ruling or goal; (4) an outward or irreversible act the config has
  not granted; (5) a sideways tripwire firing; (6) a CRITICAL the walk cannot resolve inside the change (the
  redesign route). Every other judgement is the AI's, and is recorded per the judgement ledger.
- **R-adf-4** (Sal, 2026-11-07) — Concurrency is allowed. The AI decides at architect how concurrently a program's
  stages run, from their dependencies; that decision is recorded in the doc.
- **R-adf-5** (Sal, 2026-11-07) — Not dogfooded. orbit-spec is too critical to Sal's development to run under the
  automation it builds, so this program is built in today's supervised flow, and the automation is first proven on
  a big, non-critical project after this program.
- **R-adf-6** (Sal, 2026-11-07) — Settings are granular: each permission (chaining, sign-off, each outward act,
  concurrency, and so on) is its own explicit setting, and no umbrella setting derives them. Rationale (Sal): what is
  allowed must be exactly clear, and a sensitive project can still be highly automated.
- **R-adf-7** (Sal, 2026-11-07) — The program brief is written in every mode, whether or not a sign-off waits on it.
- **R-adf-8** (Sal, 2026-11-07) — Context is cleared by construction: an engine-run driver launches a fresh headless
  session per phase, chosen from the engine's computed next command and booted from file-resident state
  (`orbit status --boot`), rather than a long-lived conductor session spawning subagents.
- **R-adf-9** (Sal, 2026-11-07) — G0 is reworded to its intent (D-dl-9): default behaviour, readouts and gates are
  unchanged; a generated body changes only by an addition that tells the AI to record something; an existing test is
  edited only where it enumerates a closed set the stage extends, never to weaken an assertion about today's
  behaviour, and each such edit is named at archive. The old wording ("generated bodies are unchanged, and the
  existing test suite passes unedited") could not hold for any stage that adds a record type or edits a skill;
  decision-layer broke it twice (a hash pin, an every-command spine test).
- **R-adf-10** (Sal, 2026-11-07) — orbit's text names the person it answers to as "the user", never by name
  (D-dw-4). Text a stage writes says "the user"; this doc's Premise, Goals and stage charters were reworded to it the
  same day, with no change of meaning. Attributions stay as written — "(Sal, <date>)" on a ruling, "Ratified by Sal",
  "Rationale (Sal)", the status log — because each records who acted, not a role.
- **R-adf-11** (Sal, 2026-11-09) — G0 names each default-on behaviour the user has ratified, rather than allowing any
  in general, so G0 stays falsifiable and each later one needs its own amendment. The first: stage decision-reading's
  reader runs by default on every system review of a change with decision records (chosen at its proposal: "orbit
  has one user - me. so i'd prefer to do the best thing here for future users"). Recorded as
  `stop-2026-11-09T16-09-40Z.json` and its resolution in this trail's `decisions/` folder.
- **R-adf-12** (Sal, 2026-11-09) — G0's body clause allows, in general, generated-body text whose effect depends on a
  setting, provided that with every setting at its default the AI does what it did before. The user chose this over
  naming seam-chaining's conditional no-chaining text as a second exception (the AI's recommendation): every
  settings stage rewrites bodies that way, and its defaults test is what keeps it honest. R-adf-11 still governs
  behaviour that runs by default: each such behaviour needs its own named exception. Recorded as
  `stop-2026-11-09T17-52-07Z.json` and its resolution in this trail's `decisions/` folder.
- **R-adf-13** (Sal, 2026-11-11) — G0 names a second default-on exception, under R-adf-11: an archive of a change with a
  pull request names, in one line, each file it commits from the change's folder that git never tracked. The archive's
  requirement (`orbit-archive-modifications`' `PR-attached archive tail`) always promised that line; it first printed
  in seam-chaining-grants, on the user's answer at that change's apply. The user chose to name it (the AI's
  recommendation) over reading the repair of an existing requirement's promise as outside G0, so G0 keeps no "bug fix"
  reading later stages could lean on. Recorded as `stop-2026-11-11T03-17-05Z.json` and its resolution in this trail's
  `decisions/` folder.
- **R-adf-14** (Sal, 2026-11-11) — A program runs on one branch and one pull request: the pull request is opened at the
  program's first architect session, that branch and pull request last for the whole program, orbit commits and pushes
  the work to it throughout, and the user gives the go-ahead for the merge at the end. Committing and pushing are each
  an opt-in setting, defaulting to today's behaviour (R-adf-1, R-adf-6); orbit never commits on its own to the default
  branch, and a commit takes everything uncommitted that `.gitignore` does not exclude, naming each untracked file it
  adds (D-chrc-1 to D-chrc-6 in the `chained-review-commit` change's `explore.md`). New projects get
  `pr: per-architecture` from `orbit init` (D-chrc-7). Stated by Sal during that exploration as true of the entire
  program.

## Program stages

Every stage is built and proven in orbit-spec under today's supervised flow (R-adf-5): its mechanism is held by
tests over fixtures and stubs, never by running orbit-spec autonomously. Concurrency (R-adf-4): this program runs
supervised, one command at a time, so its dependencies decide order only; decision-writing, seam-chaining,
program-brief and tripwires depend only on decision-layer and may be taken in any order; decision-reading follows
decision-writing.

### Stage decision-layer — the judgement ledger and the stop record

Depends-on: (none)
Complete: [x] 2026-11-07 (Sal)

The records everything after consumes. The judgement ledger: one record per AI judgement that affects the end user
or involves security — what was decided, the alternatives, why, and where — with a closed rule for what qualifies.
The stop record: a typed record naming which of R-adf-3's six conditions fired, and on what. Both are written
through `orbit emit`, beside the existing records, never instead of them.

Exit criteria:
- The ledger record and the stop record are emitted and validated by the engine, with tests shown able to fail on
  a malformed record of each kind.
- The qualifying rule for a ledger entry is written in the owning spec, as a closed set with its residual stated.
- G0 holds: with nothing configured, no existing readout, gate or body changes.

Shipped as (2026-11-07; archived as `orbit/changes/archive/2026-11-07-decision-layer/`; the charter stands, with the
two departures below): three records, not two — the ledger entry, the stop record and a resolution (Sal's answer to a
stop, citable as precedent) — written by `orbit emit ledger | stop | resolution` to the `decisions/` folder of a
change's, an exploration's or the architecture trail, where no existing reader looks. `orbit-decision-records` owns
them: the eighteen ledger areas as the closed qualifying set with its residual, what an entry may rely on (a baseline
requirement, a ruling, a goal, a resolution, a live explore decision) or else the stop it raised, the plain-language
rule held by a `defines` list, and that no stop halts anything yet. `src/core/decision-records.ts` checks each record
for form and existence before the write, and every refusal was shown able to fail. The two departures: the instruction
to write the records and the reading step that grades their prose went to a follow-on stage (D-dl-8), so nothing yet
tells the AI to write one; and G0 as written did not hold — two existing test files changed, ratified by Sal at apply
(the `emit-composition.ts` hash pin moved; the every-command spine test now leaves out the three non-run-summary
commands), and that goes to G0's rewording (D-dl-9). The system walk added a no-overwrite publish (an exclusive
temporary file and a link) and named the one-resolution race across concurrent writers as a limit routed to stage
`parallel-lanes`.

### Stage decision-writing — the AI writes the records

Depends-on: decision-layer
Complete: [x] 2026-11-08 (Sal)

A fifth execution discipline in every generated workflow body carrying a disciplines epitome tells the AI when to write a ledger entry (a call in one of
the eighteen areas) and a stop record (one of R-adf-3's conditions), and to write the user's answer as a
resolution. Under supervised settings it still asks the user exactly as today; the record only keeps the moment.
The specs that state the set of disciplines stop stating a count (onboard's names all five), and `orbit-decision-records` says "the user" where it names
the person orbit answers to (R-adf-10). (From decision-layer's D-dl-8; split from the reading step at propose,
`orbit/explore/decision-writing/explore.md` D-dw-6.)

Exit criteria:
- Every generated workflow body carrying a disciplines epitome carries the discipline, held by a parity test against
  one owning statement; onboard, a reference read with no epitome, names it.
- G0 holds.

Shipped as (2026-11-08; archived as `orbit/changes/archive/2026-11-08-decision-writing/`; the charter stands, with the
additions below): the fifth execution discipline, decision-writing, owned by one fence in `orbit-conventions`'
`Decision-writing discipline` and composed in `src/core/disciplines.ts` from the write gate's own lists, carried
byte-equal as the fifth epitome bullet by the fourteen workflow bodies that have an epitome (held by
`test/core/decision-writing-parity.test.ts`); onboard names it. Every one of those skills also ships
`references/decision-records.md` — each record's fields, citations and plain-language rule, with an example the test
submits through the write gate (a proposal-review addition). The epitome headings and the specs that stated a count
say none now, and `orbit-decision-records` says "the user". The system review closed the statement's moments further:
the user-facing stop reads by R-adf-3's goal predicate, an act a directly raised condition describes writes its stop
when nobody asks, a call reached after a clarifying question writes its ledger entry, and a walk of an archived change
writes no record (the engine's existing scope; a named limit). G0, read as R-adf-9 words it, holds: no readout, gate or
emit changed, and with every setting at its default the AI asks the user exactly as today. The body edits that are not
additions are labels only — the fourteen epitome headings and intros, review's three count mentions and onboard's list
heading lose "four" — and the tests that changed enumerate the edited text or files: the skill hash pins, the
relocation markers and reference sets in `orbit-content-fidelity.test.ts` and `orbit-generated-surface.test.ts`, the
sync-specs heading list, `config-profile.test.ts`'s synced fixture and `profile-sync-drift.test.ts`'s reference-less
example, each recorded under the change's task 3.1. Named limit: until a release carrying decision records is
installed, the installed `orbit` refuses these commands here, so records are written with the built CLI (CLAUDE.md).

### Stage decision-reading — a reader checks the records

Depends-on: decision-writing
Complete: [x] 2026-11-09 (Sal)

A reading step, a review pass given only the architecture doc and the records, judges the reader rows of
`orbit-decision-records`' plain-language table: undefined new terms, prose that leans on implementation detail, and
prose that is correct but unclear. orbit renders the reader's brief, so what the reader is given can be checked.
Each problem it finds is a finding, walked like any other; a record the walk fixes is fixed by a new record that
replaces it, since the history is never rewritten, and every check that follows a link between records follows
the replacement. (From D-dl-8, split at propose: D-dw-1, D-dw-2 and D-dw-5 in the decision-writing exploration.)

Exit criteria:
- The reading step runs on a fixture change that carries decision records, and not on one without; its brief is
  shown to carry the architecture doc, the records with what each points at, and a fixed reader's task, and nothing
  else about the work. (Reworded by Sal, 2026-11-09, to what shipped; it said "only the architecture doc and the
  records".)
- A replacement record passes every link check its original passed, and a link to a replaced record is refused
  naming its replacement, each tested.
- G0 holds.

Shipped as (2026-11-09; archived as `orbit/changes/archive/2026-11-09-decision-reading/`; the charter stands, with the
departures below): `orbit decisions brief <change> [--json]` renders the reader's brief — the architecture doc, each
selected record with the text of what it points at, and a fixed reader's task — and the in-context system pass
dispatches it verbatim to a clean-context reader whose findings fold under Coherence as the `reading` pass. A record
counts as read only when a system review lists it in `decision_records_read` (the engine refuses a pass that is
silent, reads without a list, lists without a read, or lists outside the selection), and archive records the count
of unread records in its run record, shown on no screen. A record is fixed by a replacement whose `replaces` names
the latest record of its chain and whose link fields are unchanged; every reader takes the latest in a chain, a
carried link is exempt from the replaced-target check, and a stop chain takes at most one resolution chain. The
system walk ratified one replacement per resolved finding, chained. The first live reading read 17 records and found
ten worth fixing, most of them restatements that shifted what they cite; the walk replaced them, and those ten
replacements (eight chain heads) reach no reader before archive, D-dr-2's named limit. The departures: G0 as written
does not hold — the reading runs by default and adds findings to every system review of a change with records,
which the user chose at propose (the change's design decision 1) — and the exit criterion's "only" is read as no
knowledge of the work beyond the doc and the records, since the brief ends with the fixed reader's task (decision
5); rewording both is the user's, at the next architect session. Closed-set tests that moved (R-adf-9), each
recorded under the change's task 4.4: the skill hash pins (11 skills, the archive's twice), `rc03b`'s
`emit-composition.ts` pin, `schema-references.ts`'s engine-owned keys with `emit-schema-parity`'s archive negative
case, `reference-roundtrip`'s third seeding rule, and `orbit-conventions`' canonical archive example, carried as a
fourth capability (a declared size breach).

### Stage seam-chaining — the granular settings and regime 2

Depends-on: decision-layer
Complete: [x] 2026-11-12 (Sal)

Of the settings R-adf-1 and R-adf-6 name, the one a chain reads: chaining, its own explicit key defaulting to
today's behaviour. D1's no-chaining contract is amended in its owning spec to hold conditionally on it. With
chaining on, a command that ends on a passed gate runs the engine's next command itself, and stops at a configured
seam or on a stop record. Consent provenance gains a value for a transition taken by setting. Sign-off is
program-brief's setting; concurrency, with the single-session model's amendment, is parallel-lanes'; the outward
acts that cross stages are the driver's (the user, 2026-11-09: each setting lives with the stage that reads it).

Exit criteria:
- The amended requirements name each setting, and a test per setting shows today's behaviour at its default.
- With chaining on, a test over a fixture change shows a passed gate followed by the next command, and a stop
  record halting it.
- G0 holds.

Shipped as, first of two changes (2026-11-10; archived as `orbit/changes/archive/2026-11-10-seam-chaining/`; the
stage lands as two changes split by grant, D-sc-19, so it stays open until the second): a `chain` map in
`orbit/config.yaml` grants `review` (in-context and fresh), `review-external` (an external review or a blind pair,
which reach the network and cost money) and `address-reviews`, each only when marked `true`; an absent key, any other
value or an unknown key grants nothing, read silently. `orbit status --change <name> --json` carries a `chain` object —
the next command, whether it may run unasked, and when not, why (`none`, `not-granted`, `open-stop`, `needs-user`,
`no-progress`) — and the propose, ff, apply, review and address-reviews bodies end by running the next command only
when it says so; with no key set they end exactly as before. Each prompt in the review and walk bodies states its
kind (target, routine, decision), held by a tag test. Departures and limits: merging the stage's PR and returning to
the default branch moved to the driver (D-sc-17), and bounding what a run spends is a candidate follow-up program
(D-sc-18); a chained external review on an uncommitted tree stops on `no-progress` rather than committing first,
carried to the second change. The verification walk found that a decision record whose cited decision is later
superseded cannot be replaced (the write gate re-checks a carried decision citation for liveness), so one record is
followed by a new entry instead — a gap a later change of this stage fixes (Sal, 2026-11-10). Tests that moved because they pin body text (R-adf-9):
the propose, ff and apply skill hash pins (re-recorded three times) and the blind pair's row-13 walk sentence.

Shipped as, second change (2026-11-10; archived as `orbit/changes/archive/2026-11-10-replacement-liveness/`; the first
of the three changes D-sga-1 set for finishing the stage, which stays open): on a replacement, the write gate accepts a
carried `decision` citation when the work's `explore.md` holds a Decisions entry with that ID, whatever its
`Disposition:` (the reader's brief's own predicate), so a record whose cited decision was later superseded or assigned
can be replaced. A new citation still needs a live entry, and a carried citation of an ID the file no longer holds is
refused. A carried requirement, ruling or goal citation whose source is renamed or removed mid-flight stays refused, a
named limit (D-rl-2). Every generated `decision-records.md` reference states the exception beside the live rule. Tests
that moved because they pin body text (R-adf-9): eleven skill function-hash pins, re-recorded once. The system review's
reading step found the change's own ledger entry overstating what the baseline's carried-link row says; the walk fixed
it by five chained replacements, which reach no reader before archive (D-dr-2's named limit).

Shipped as, third change (2026-11-11; archived as `orbit/changes/archive/2026-11-11-seam-chaining-grants/`; the second
of D-sga-1's three changes, so the stage stays open for the third, the commit before a chained external review): the
`chain` map gains `apply` and `archive` keys, each granting its command marked or not, and `archive` also granting the
PR tail's push, description rewrite or stage-entry append and per-change ready flip, which its row names; the merge and
the return to the default branch stay the user's (D-sga-4). An arrival at apply or archive the user did not type is
granted exactly when the change status's `chain` object allows that command: it fires no consent prompt and records
`consent: "setting"`, every anomaly prompt still firing (D-sga-5). The emit write gate now checks `consent` on apply and
archive: one of `user-invoked`, `prompted` and `setting`, and `setting` only when the map grants the command (D-sga-6);
a grant withdrawn mid-run writes the emit with no `consent` field. Every prompt in the apply and archive bodies states
its kind, held by the tag test; the sync assessment is the one routine prompt. Departures, each the user's call: the
system walk named as a limit that a granted archive started off the attachment's branch writes locally and its tail
skips (the user chose this over a new decision prompt); and task 6.1 found the PR tail's carried "strays are named"
scenario never true, so `orbit pr tail` now reports `carried_untracked` and the archive names those files — the one
change a default install shows (a line when an archive carries an untracked file), recorded as a stop and its
resolution, and named as G0's second exception at the architect session after the archive (R-adf-13). Tests that moved
(R-adf-9): the propose, ff and apply skill hash pins once and archive's three times, `rc03b`'s `emit-composition.ts`
and `gates.ts` pins, `chain.test.ts`'s resolver and key-table assertions (the closed key set grew), and
`chain-prompt-tags.test.ts`'s routine-tag count and inventory. The system review's reading step found fifteen records
wanting; the walk replaced them, and those replacements reach no reader before archive (D-dr-2's named limit).

Shipped as, fourth change (2026-11-12; archived as `orbit/changes/archive/2026-11-12-chained-review-commit/`; the third
and last of D-sga-1's three changes, which widened in its exploration to R-adf-14's commit throughout): two opt-in
top-level settings, `commit: true` and `push: true` in `orbit/config.yaml`, each granted only by the literal `true`
(D-chrc-4, D-chrc-10). `orbit pr commit <change>` computes a closing commit step and prints it, writing nothing: off
under `pr: never`, with neither setting or on an unattached change; a skip when HEAD is detached, off the attachment's
branch, on the default branch or mid-merge; otherwise the stage (`git add -A`, everything uncommitted that `.gitignore`
does not exclude, each untracked file named), the commit and a push to the resolved remote (D-chrc-2, D-chrc-5,
D-chrc-6). Six bodies (propose, ff, apply, review, address-reviews, archive) carry one `COMMIT_STEP` before the chain
end step, so under `commit: true` a chained external review arrives on a committed tree, and the No-chaining
contract's `no-progress` limit now holds only where the step does not commit (D-chrc-8). At the defaults the step is
one read-only call that prints nothing (R-adf-12). The system cycle added: the step runs nothing once an earlier PR
step of the same command failed, so that failure's recovery still works; it reports a non-zero exit and a dropped push
with nothing else to run; it prints a commit only when staging would change something; and that comparison runs on a
temporary copy of the index, after the verification pass found a working-tree diff rewriting `.git/index`, with the PR
test harness now failing any `orbit pr` call that changes the index. Tests that moved (R-adf-9): the propose, ff, apply
and archive skill hash pins (function and generated file), `chain-prompt-tags.test.ts`'s fresh-reviewer brief strings,
`orbit-content-fidelity.test.ts`'s Step 5.6 slice and its consumption-row prefix with `pr-references.test.ts`'s, and the
recaptured git contract (`add -A`). The system review's reading step found sixteen records wanting; the walk replaced
them, and those replacements reach no reader before archive (D-dr-2's named limit).

### Stage program-brief — the brief and the sign-off seam

Depends-on: decision-layer
Complete: [ ]

The engine composes the program brief from the trail: what was built, the capabilities and requirements added or
changed, new terms and seams, the ledger, stops and tripwires fired, and deviations from the charter — in plain
language. It is written in every mode (R-adf-7). The sign-off seam follows R-adf-2, gated by its setting, which this
stage adds: its own key, defaulting to today's behaviour (R-adf-1, R-adf-6).

Exit criteria:
- A golden test renders the brief for a fixture program, and a second for a program with ledger entries and stops.
- The sign-off seam holds archive (sign-off per change), or the program's completion and, under
  `pr: per-architecture`, the program PR's READY flip (sign-off once per program), when the setting requires it, and
  does not when it does not, each tested. (Reworded 2026-11-12 to follow R-adf-2 as amended; it said "archive
  (seam-chained) or the program PR's READY flip (autonomous)".)
- The sign-off setting's owning requirement names it, and a test shows today's behaviour at its default.
- G0 holds.

### Stage tripwires — detecting that a run has gone sideways

Depends-on: decision-layer
Complete: [ ]

Signals that write stop records: a diff that leaves the change's frozen `## Touchpoints` or touches an undeclared
capability; review iterations that stop converging; size or walk budgets exceeded; an edit to a ratified ruling or
goal; and a steward pass at each stage boundary (`/orbit:review --as architecture` aimed at one stage) asking
whether the work is still the declared stage. In supervised mode each reports without stopping.

Exit criteria:
- G6's first half: each tripwire fires on a fixture trail that should trip it and not on a clean one, each test
  shown able to fail.
- G0 holds.

### Stage driver — regime 3, one fresh session per phase

Depends-on: decision-writing, decision-reading, seam-chaining, program-brief, tripwires
Complete: [ ]

`orbit run <doc>` (R-adf-8): read the engine's computed next command, launch a fresh headless session booted from
`orbit status --boot`, wait, read the emit it wrote, and loop, stopping on a stop record or at the sign-off seam.
It reuses the external runner's launch pattern, keeps a live log the user can watch, and resumes after a stop. Linear:
one stage at a time. Under `pr: per-architecture` every stage lands on the one program branch (R-adf-14), so the
driver moves from stage to stage with no merge and no return to the default branch; the program pull request's merge
stays the user's act at the end. Under `pr: per-proposal` it stops at each stage's end until the user has merged.
The driver opens the program pull request at the program's first architect session (D-chrc-1), an outward act behind
its own setting defaulting to today's behaviour, where the pull request is born at the first citing propose (R-adf-1,
R-adf-6). (The merge and return settings this charter carried until 2026-11-11 are dropped: under R-adf-14 nothing
merges between stages. Recorded as `stop-2026-11-11T17-40-24Z.json` and its resolution in this trail's `decisions/`
folder.)

Exit criteria:
- Against a stub session launcher, a test runs a fixture program from its first stage to the sign-off seam, and a
  second halts on an injected stop record and resumes.
- Against a stub, a test crosses a fixture program's stages on one program branch with no merge, and under
  `pr: per-proposal` the driver stops at the first stage's end.
- The setting that opens the program pull request at the architect session is named in its owning requirement, and
  a test shows today's behaviour at its default.
- The driver never launches a real session against orbit-spec (R-adf-5).
- G0 holds.

### Stage parallel-lanes — concurrent stages

Depends-on: driver
Complete: [ ]

Architect records which stages may run together (R-adf-4), from the `Depends-on` graph. The driver gives each lane
its own worktree and session, and serializes archives, which base fingerprints already guard against the archive
merge data-loss bug. The concurrency setting is this stage's: its own key, defaulting to today's
single-session model, which is amended in its owning spec to hold conditionally on it (R-adf-1, R-adf-6).

Exit criteria:
- Against stubbed lanes, a test runs two independent stages concurrently and archives both with every synced
  requirement preserved (G7's mechanism).
- With concurrency off (its default), the driver runs the same program linearly.
- G0 holds.

### Stage release — a tagged orbit for the trial

Depends-on: parallel-lanes
Complete: [ ]

The program's mechanisms are released as a tagged orbit version, cut by `npm run release:tree`; pushing the tag
stays the user's act unless a setting says otherwise. Before the cut, a small change makes `orbit init` write
`pr: per-architecture` into a new project's config (D-chrc-7, R-adf-14), so the trial project starts on one program
branch; existing projects are unchanged, and an absent `pr:` still means `never`. It changes what a fresh install
writes, so G0 names it as a ratified exception at the architect session after it ships, as R-adf-11 and R-adf-13 did.

Exit criteria:
- The version is tagged and on origin, and the user docs describe the settings, the driver and the brief.
- A fresh `orbit init` writes `pr: per-architecture`, a test holds it, and G0 names the exception.

### Stage first-run — the trial on a big, non-critical project

Depends-on: release
Complete: [ ]

Writes no orbit code. The user starts a new, big, non-critical project at the released version, chooses its settings,
and runs a program in it under the driver. Its trigger is the user starting that project. Afterwards a closing review
of that project's trail, ledger and diffs, read from here, grades the goals.

Exit criteria:
- G1–G7 graded, each Met or Failed, with the evidence, in this doc's status log; G2 and G4 by the closing review's
  classification of the trial's diffs and ledger.
- On a failure, a ruling: fix and re-run, or accept.

## Considered & out

- **2026-11-07 — One sensitivity setting (`stakes: sensitive | sandboxed`) deriving the defaults:** out (Sal,
  R-adf-6). It hides what is allowed behind a label, and sensitivity and automation are independent.
- **2026-11-07 — A conductor session spawning a subagent per phase:** out (R-adf-8). The conductor's own context
  still grows, and subagents cannot ask the user anything.
- **2026-11-09 — G0 allowing, in general, any default-on change the user ratifies at a stage's proposal:** out (Sal,
  R-adf-11). G0 would then hold by whatever was ratified and could not fail; naming each exception keeps it
  falsifiable.
- **2026-11-09 — Naming each setting-dependent body change as its own G0 exception:** out (Sal, R-adf-12, over the
  AI's recommendation for seam-chaining). Every settings stage rewrites bodies to depend on a setting, and the
  defaults test each stage owes already makes that falsifiable.

## Status log

- 2026-11-07 — Doc created at `/orbit:architect automate-dev-flow`. Premise, goals and stages await Sal.
- 2026-11-07 — Sal ratified R-adf-1..5 from the AI's first sketch (regimes, a fresh process per phase driven by the
  engine, sideways tripwires, the judgement ledger, the program brief, six draft stages). Pending at the time, since resolved
  (a, b, c → R-adf-6..8):
  (a) a single per-program sensitivity setting (e.g. `stakes: sensitive | sandboxed`) that sets the defaults for
  sign-off, the security stop conditions and ledger depth, each still overridable — AI recommendation; (b) the
  program brief is written in every mode, even when no sign-off waits on it — AI recommendation; (c) the context
  mechanism: an engine-run driver launching a fresh headless session per phase (`orbit run`), over a conductor
  session spawning subagents — AI recommendation; (d) the six-stage order, and how R-adf-5's trial on another
  project gets a trigger (measure stalled for want of one).
- 2026-11-07 — Sal ratified goals G0–G7 as drafted (G3's one-in-four threshold and G1's single-turn strictness
  included; speed is carried by G1, not measured directly). The seven-stage order (decision-layer, seam-chaining,
  program-brief, tripwires, driver, parallel-lanes, first-run, with a release before first-run) was presented and
  awaits declaration.
- 2026-11-07 — Sal: stages declared as drafted, with a separate `release` stage between parallel-lanes and
  first-run, so the trial runs a tagged orbit: decision-layer, seam-chaining, program-brief, tripwires, driver,
  parallel-lanes, release, first-run.
- 2026-11-07 — Architect session after decision-layer's archive (merged as PR #34). Sal ratified stage
  decision-layer complete; reworded G0 to its intent (R-adf-9, from D-dl-9); declared stage decision-writing from
  D-dl-8, with driver now depending on it, since an autonomous run that writes no records fails G2 and G4 by
  construction. Sal chose decision-writing as the next stage (AI recommendation: every later stage reads or raises
  these records, and nothing writes one yet).
- 2026-11-07 — Architect session after decision-writing's propose stopped on a size breach (six to seven
  capabilities against a ceiling of three; D-dw-6). Sal split the stage: decision-writing keeps its id and becomes
  the fifth discipline alone, so the exploration that cites it proposes directly; a new stage decision-reading
  (depends on decision-writing) takes the replacement chain, the reading step and its rendered brief; driver now
  depends on both (AI recommendation: records unchecked for plain language would put G5 at risk). Sal ratified
  R-adf-10 ("the user", not a name) and chose its scope: role text in the Premise, Goals and charters reworded,
  attributions and this log kept (AI recommendation).
- 2026-11-08 — decision-writing's proposal review: the user accepted, as within G0's intent (R-adf-9), the epitome
  heading, intro and count-word edits that correct the discipline count the fifth discipline makes false; G0's
  wording is unchanged, and the stage's archive names those edits as non-additive (AI recommendation). The stage's
  first exit criterion is read as every workflow body carrying an epitome; onboard names the discipline without
  carrying the statement.
- 2026-11-08 — Architect session after decision-writing's archive: Sal ratified stage decision-writing (both exit
  criteria met; AI recommendation). Its system review added four moments to the statement — the user-facing stop by
  R-adf-3's goal predicate, an act a directly raised condition describes with nobody asked, a call reached after a
  clarifying question, and no record on an archived change's walk — recorded in its Shipped-as paragraph. The walks
  wrote this program's first four ledger entries, in the archived change's `decisions/` folder.
- 2026-11-09 — Architect session after decision-reading's archive: Sal ratified stage decision-reading (exit
  criteria met: the reading runs only on a change with records, each replacement link rule tested, G0 holding as
  reworded; AI recommendation). G0 now names the reader as a ratified default-on exception (R-adf-11, Sal choosing
  to name each exception over a general allowance; AI recommendation), and the stage's first exit criterion now
  says what the brief carries. The stage's first live reading fixed ten records by replacement; eight replacements
  reached no reader before archive (D-dr-2's named limit).
- 2026-11-09 — seam-chaining's exploration: the user moved the sign-off setting to program-brief and the concurrency
  setting, with the single-session model's amendment, to parallel-lanes, so each setting lives with the stage that
  reads it; seam-chaining keeps chaining and the outward acts a chain crosses stages with (AI recommendation, D-sc-4
  in `orbit/explore/seam-chaining/explore.md`). R-adf-1 and R-adf-6 are unchanged: every setting is still its own
  key, defaulting to today's behaviour.
- 2026-11-09 — Architect session during seam-chaining's exploration: G0's body clause now allows generated-body text
  that depends on a setting and leaves the AI's behaviour unchanged at the defaults (R-adf-12; the user chose this
  general rewording over the AI's recommendation, a second named exception). D-sc-8 in the exploration is superseded
  by it. No stage awaited ratification.
- 2026-11-09 — seam-chaining's exploration: the user moved the two outward acts that cross stages (merging the
  stage's PR, returning to the default branch) to the driver, since a seam-chained run ends at archive and nothing
  in seam-chaining reads them (AI recommendation, D-sc-17); seam-chaining now owns chaining alone. The user also
  raised bounding the tokens and money a run spends, internal and external reviews alike: today nothing bounds it
  (a gate counts independent passes and consults the count nowhere); named as a candidate follow-up program
  (D-sc-18 in the exploration).
- 2026-11-10 — Architect session after seam-chaining's first change was archived (merged as PR #37). Stage
  seam-chaining is left unratified (Sal: not yet; AI recommendation): it lands as two changes (D-sc-19), and the
  second is still owed — the apply and archive grants with `consent: "setting"` (D-sc-7 and the apply and archive
  rows of D-sc-5 and D-sc-12), and committing named paths before a chained external review, carried from the first
  change's system walk. Sal folded into that second change the engine gap its verification walk found: a
  replacement record re-checks a carried decision citation for liveness, so a record whose cited decision was later
  superseded cannot be replaced (AI recommendation: one exemption beside the existing carried-link one, and the
  second change will meet it again). Ratification is offered again at that change's archive.
- 2026-11-10 — In the exploration `seam-chaining-grants`, the owed work measured at six capabilities against a
  ceiling of three, so Sal split it into three changes, all citing stage seam-chaining (D-sga-1; AI recommendation):
  the replacement-liveness exemption first, then the consent value with the apply and archive grants (a declared
  breach), then the commit before a chained external review. This revises the earlier entry's fold of the gap into
  the second change, which was made before the size was measured.
- 2026-11-10 — Architect session after `replacement-liveness` was archived (merged as PR #38), the first of
  D-sga-1's three changes: a replacement now keeps its citation of a superseded or assigned decision (the stage's
  second Shipped-as paragraph). No ratification was offered: the exploration `seam-chaining-grants` is live, and two
  changes are still owed — the consent value with the apply and archive grants (a declared breach), then the commit
  before a chained external review. No ruling, goal or stage changed.
- 2026-11-11 — Architect session after `seam-chaining-grants` was archived (merged as PR #39), the second of D-sga-1's
  three changes: the apply and archive keys and `consent: "setting"` (the stage's third Shipped-as paragraph). Stage
  seam-chaining left unratified (Sal: not yet; AI recommendation): the third change, the commit before a chained
  external review, is still owed. G0 now names the archive's untracked-file line as its second ratified exception
  (R-adf-13; Sal chose naming over a "bug fix" reading outside G0, AI recommendation).
- 2026-11-11 — Architect session, nothing new since the last: stage seam-chaining offered again and left unratified
  (Sal: not yet; AI recommendation). Its exit criteria are met, but D-sga-1's third change, the commit before a chained
  external review, has no exploration or change yet. No ruling, goal or stage changed.
- 2026-11-11 — Architect session during the exploration `chained-review-commit` (D-sga-1's third change, which widened
  to an opt-in commit and push at every command's end on the change's pull request branch): Sal's statement of the
  whole program became R-adf-14 (one branch and pull request per program, opened at the first architect session,
  committed to throughout, merged by the user at the end). The driver's charter dropped the merge and return settings,
  since nothing merges between stages on one branch, and took the pull request's opening at the architect session
  (Sal; AI recommendation; a stop and its resolution in this trail). The release stage took the change that makes
  `orbit init` write `pr: per-architecture` (D-chrc-7; Sal; AI recommendation). No stage awaited ratification.
- 2026-11-12 — Architect session after `chained-review-commit` was archived (merged as PR #40), the last of D-sga-1's
  three changes: the `commit` and `push` settings, `orbit pr commit` and the closing commit step in six bodies (the
  stage's fourth Shipped-as paragraph). Sal ratified stage seam-chaining complete: all four citing changes archived,
  every setting it owns named with a test of its default, the chaining fixture tests from its first change, and G0
  holding with the commit step a read-only call that prints nothing at the defaults (R-adf-12; AI recommendation). No
  ruling, goal or other stage changed; program-brief and tripwires are each open to start, depending only on
  decision-layer.
- 2026-11-12 — Architect session during the exploration `program-brief`: R-adf-2 amended at Sal's direction there
  (D-pb-1, D-pb-3): how often the user signs off is its own setting — per change, at its archive, or once per program,
  holding the program's completion under every `pr:` mode and the program PR's READY flip under
  `pr: per-architecture` — no longer following the regime; absent, nothing waits. The program-brief stage's sign-off
  exit criterion was reworded to match. Recorded as a stop and its resolution in this trail. The exploration also
  settled that each change carries an account of what it built, read by the reader only when sign-off is on, so G0
  needs no new exception (D-pb-4, D-pb-5); it will likely split the stage at propose. No stage awaited ratification.

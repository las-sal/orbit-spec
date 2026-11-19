> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: records-by-setting

## Premise

Stage `records-by-setting` of `reduce-orbit-phase1` builds R-rop-17 (the evaluation's D-eval-3): the AI writes ledger
entries, stop records and resolutions only when a setting that reads them is on (chaining, a sign-off setting of
`change` or `program`, the tripwires, and later the autonomous driver). Under every configuration the body is the same
(R-rop-5): the decision-writing bullet shrinks to its basic content (when to check, the command whose result says
whether records are owed, and the link to `decision-records.md`, which takes the rule whole), so an orbit command's
result picks the branch, never the agent's judgement (R-rop-3, R-rop-4). RG0 as amended and `automate-dev-flow`'s G0
(R-adf-17) already carry the exception.

What this exploration has to settle: which command reports that records are owed and what it reads, when a session
runs it, exactly which settings make records owed, what happens to a record written when none is owed, and everything
else the rule's "under every setting" touches (the onboard line, the specs that say it, this repository's CLAUDE.md).

## Mechanism

### D-rbs-1 — records are owed exactly when a reader of them runs
Domain: every setting state of the three settings R-rop-17 names, read at `92132d72`
| member | covered by |
|---|---|
| a chain key granted (`chain.<key>: true`) | owed — the chain's open-stop check runs before a granted next command (`chain.ts` 169-171) |
| a `chain:` map with no key granted, or no `chain:` key | not owed — no command chains, so the open-stop check never runs |
| `signoff: change` or `signoff: program` | owed — the program brief shows the ledger, stops and resolutions to the user who signs off (`takesAccount`) |
| `signoff: off`, absent, or an unrecognized value | not owed — nobody signs off; the saved brief carries no records and nobody is asked to read it |
| a tripwire sensor with `on_fire: halt` | owed — a halting reading writes a `tripwire` stop that waits for the user's answer, written as a resolution (`tripwires.ts` 224-240) |
| every sensor at `on_fire: record`, a `tripwires:` key or none | not owed — no stop is written, and the sensors read only `tripwire` stops (`readCoverage`) |
| the autonomous driver | not a term yet — `automate-dev-flow`'s stage `driver` adds its own when it is built |
| the review's reading step and the walk's replacements | not a term — they read what was written; at the defaults that is nothing, and the step is skipped as when nothing is selected |
Closure: SOURCED — the readers of a `decisions/` folder are the modules in `src/core` that name the folder (D-eval-3's grep, re-run at `92132d72`), each one's gating condition read at its lines
Moves:
- READ: applied — chain.ts 159-171 (the grant is checked before the open stop), project-config.ts `takesAccount`, tripwires.ts 224-240 (halt) and `readCoverage` (only `tripwire`-condition stops and the resolutions answering them)
- ENUMERATE: applied — this table, an on and an off state per setting; the briefing first had D-eval-3's looser "configured" for chain and tripwires, corrected by reading the gates
- COHERE: applied — the three terms read three separate config keys, so the predicate is their OR with no overlap to reconcile
- EXECUTE: not applied — the command that computes it (D-rbs-2) is not built yet; the change's test runs each row
- FALSIFY: applied — a reader added later under a setting not in the table would read an empty folder at the defaults; the closure's grep is where it shows, and the driver's row names the one already declared
- CONFORM: applied — R-rop-17 (its three settings, "the tripwires" made exact as a halting sensor, the only tripwire state with a reader), RG0 as amended, R-adf-17
- FEASIBILITY: not applied — three resolver reads, each already exists
- CONSUME: applied — the gating command consumes the predicate and every body branches on its result; the exit criterion "with each of the three settings on, it reports them owed" takes "on" from this table
- INVOKE: applied — computed when a session runs `orbit decisions status`, at its start and after it edits the settings (D-rbs-3)

### D-rbs-2 — one project-wide command, `orbit decisions status`, says whether records are written
Domain: every kind of session whose body carries the decision-writing bullet, by the work it names
| member | covered by |
|---|---|
| a session on one change (propose, ff, new, continue, apply, verify, review, address-reviews, archive, sync) | runs `orbit decisions status`; the settings are project-wide, so no change name is passed |
| several changes at once (bulk-archive) | the same call, once |
| a named exploration (explore) | the same call; explore runs no `status --change` |
| an architect session (`--doc`) | the same call; architect runs no `status --change` |
| a project-wide session (audit-drift, a project-wide walk, a bare explore) | the same call; with no work named, the rule's "where records go" still writes nothing |
| a dispatched worker (a fresh reviewer, a blind pair's fresh half) | the same call in its own session, from the body it is given |
Closure: SOURCED — the fourteen bodies that interpolate `DECISION_WRITING_DISCIPLINE` (grep over `src/core/templates/workflows` at `92132d72`), grouped by the work each session names
Moves:
- READ: applied — the `decisions` namespace exists (`program.ts` 366, holding `brief <change-name>` and `brief [doc]`); the review emit's `decision_records_owed` already means records owed a READING, so the new fields are `write` and `readers`
- ENUMERATE: applied — this table; the readers listed in `readers` are D-rbs-1's three terms
- COHERE: applied — `write` is D-rbs-1's predicate and `readers` the terms that made it true, so `write` is true exactly when `readers` is non-empty
- EXECUTE: not applied — nothing runs until the change builds it
- FALSIFY: applied — a halt is read by the sensors from the committed config, or from the change's fixed point once apply has begun (`tripwires.ts` 219-240), while this command reads the working tree; they can disagree, on an uncommitted halt change or a halt removed after a change's fixed point, but since D-rbs-8 only about whether new records are written: the sensor's stop is answered under every result (the proposal walk corrected an earlier "only" that missed the uncommitted case). A named limit, chosen over a change argument that would make the call differ by body
- CONFORM: applied — R-rop-4 (the command's result picks the branch), R-rop-5 (one body under every configuration), R-rop-3 (basic content: when, the command, the usual result, the link)
- FEASIBILITY: not applied — three resolver reads and one line of output
- CONSUME: applied — every body's basic content reads `write`; a test holds `write: false` at the defaults and `true` with each reader on (the stage's first exit criterion)
- INVOKE: applied — run at the session's start and again after the session edits `orbit/config.yaml` (D-rbs-3)

### D-rbs-10 — the command runs at each command's first step and after the session edits the settings; write: false forbids only new records
Domain: every way the result a session holds can differ from the settings it works under, and every record a session may owe at write: false
| member | covered by |
|---|---|
| a command starts — typed, chained, or loaded mid-conversation | its first step runs the call, and the result governs that command |
| the session itself edits the project config (`orbit/config.yaml` or `.yml`; an architect session turning on `signoff`, say) | the call is run again after the edit |
| a compaction between commands | covered: the next command's first step runs the call |
| a dispatched worker (a fresh reviewer, a blind pair's fresh half) | its own command, so its own first call |
| a settings edit made outside the session while one command runs, or a compaction during one command | not covered — a named limit; the next command's first call reads afresh |
| a stop already in the trail, awaiting the user's answer (written while a reader was on, or a `tripwire` stop orbit wrote) | its resolution is written whatever the result |
| a record already in the trail that a reading finds wanting | its replacement is written whatever the result |
| a new ledger entry or stop record | written only on `write: true` |
Closure: BOUNDED — each command's start and the session's own edits are enumerable, but edits made from outside it, and a result a compaction drops mid-command, are not
Residual kind: a change to the project config made outside the session while one command runs (by the user's hand, another tool, a branch switch), or a result a compaction drops before the command ends
Residual method: the next command's first call reads the settings afresh; a review of a trail showing records missing under a reader, or written with none, finds one after the fact
Moves:
- READ: applied — `skill_body_convention.md`'s shape for a block acted on once at a moment the body names: the moment and the command in the body, the reference read there
- ENUMERATE: applied — this table
- COHERE: applied — one command, one result, refreshed by the session's own settings edit; a chained command reads its own, so no result outlives the command it governs
- EXECUTE: not applied — the change's tests drive the command, not the moment
- FALSIFY: applied — "before the first record" was the alternative and is circular: without the rule the agent cannot tell that a record is due; the proposal blind pair (fresh F1, codex X1 and X3) falsified D-rbs-3's blanket "write no record": a reading finding on an existing record, a stop stranded by turning the last reader off, and a tripwire stop under a working-tree halt removal each owed a record it forbade
- CONFORM: applied — R-rop-4 (the body names the moment and the read), orbit is single-user and single-session (an outside edit is a named limit, not something to lock against)
- FEASIBILITY: not applied — one call per session, rarely two
- CONSUME: applied — the agent keeps `write` for the session; on `true` it reads `references/decision-records.md` once, and on `false` it reads it only when it answers or fixes a record already in the trail; the walk's replacement step and the reading step consume existing records under every result
- INVOKE: applied — the basic content names the moment in every body that carries it

## Decisions

- **2026-11-18 — D-rbs-1: records are owed exactly when a reader of them runs** Sal's choice (A). Decision records
  are owed when some chain key is granted, OR `signoff` is `change` or `program`, OR some tripwire sensor is set to
  `on_fire: halt`; the driver's stage adds its own term when it is built. A `chain:` map with no key granted, and
  tripwires left at `record` (the default, which runs with or without a `tripwires:` key), owe nothing: no reader
  runs in either. "The tripwires" in R-rop-17 is read as a halting tripwire, the only tripwire state whose stops wait
  for an answer. Chosen over a key being present (B: a project that only tunes a sensor's tolerance would write records
  nothing reads) and over dropping the tripwires from the list (C: it amends R-rop-17, and a halting tripwire's stops
  do wait for a resolution).
  Kind: rule

- **2026-11-18 — D-rbs-2: one project-wide command, `orbit decisions status`, says whether records are written** Sal's
  choice (A). A new `orbit decisions status [--json]` in the existing `decisions` namespace takes no change name and
  reports `write: true | false` and `readers`, the D-rbs-1 terms that are on (e.g. `["chain", "signoff"]`); its human
  line is one sentence, e.g. `Decision records: not written (no setting reads them)`. Every body's basic content runs
  the same call. Named `status` with fields `write` and `readers`, because the review emit's `decision_records_owed`
  already means records owed a reading. Chosen over a field on `orbit status --change --json` (explore, architect and
  audit-drift never run it, and a project-wide session has no change) and over the emit answering "not owed" (the agent
  would still need the whole rule to know when to call it). Named limit: the command reads the working tree's settings,
  while a halting sensor reads the committed ones or the change's fixed point; they can disagree, on an uncommitted
  halt change or a halt removed after a change's fixed point, and since D-rbs-8 only about whether new records are
  written (its Mechanism entry, FALSIFY; corrected at the proposal walk).
  Kind: rule

- **2026-11-18 — D-rbs-3: the command runs once at the session's start, and again after the session edits the settings**
  Sal's choice (A). A session runs `orbit decisions status --json` at its start and keeps the result; it runs it again
  after it edits `orbit/config.yaml` itself. On `write: true` it reads `references/decision-records.md` and follows the
  rule for the rest of the session; on `write: false` it writes no ledger entry, stop record or resolution. A command
  chained into the same session keeps the earlier result; a dispatched worker makes its own call. A settings edit made
  outside the session is a named limit. The basic content, as drafted: *Decision-writing*: at the session's start, and
  again after this session edits `orbit/config.yaml`, run `orbit decisions status --json`. On `write: true`, read
  `references/decision-records.md` and follow its rule for the rest of the session; on `write: false`, write no ledger
  entry, stop record or resolution. Chosen over running it before the first record (circular) and at every designed
  moment (repeated calls for a result that rarely changes).
  Kind: rule
  Disposition: superseded D-rbs-8

- **2026-11-18 — D-rbs-4: the write gate stays as it is; a record written when none is owed is accepted** Sal's
  choice (A). `orbit emit ledger`, `stop` and `resolution` do not read the settings: a stray record at the defaults
  (from habit, a stale instruction, or a hand-run command) is written and checked as today, and the review's reading
  step selects it as it would any record. Nothing relies on records being absent at the defaults, so the engine is
  left untouched, within RG0 as amended and G0. The source of stray records is fixed instead (the ripple question).
  Chosen over the gate refusing such a record (B) and over accepting it with a note (C), each of which changes a gate
  or a readout at the defaults and so would amend G0 and RG0.
  Kind: scope

- **2026-11-18 — D-rbs-5: every text that says records are written under every setting is edited in this change**
  Sal's choice (A). `orbit-conventions`' `Decision-writing discipline` keeps the rule in its fence, now the text of
  `references/decision-records.md`, and gains a second fence for the basic content (D-rbs-3's draft), each held
  byte-equal to its source (R-rop-3), its "Under supervised settings … halts nothing" paragraph reworded; its reference
  requirement's opening line ("says WHEN … says WHAT") is rewritten, since the reference now says both; the
  `tighten-bodies` edit-ledger requirement's clause checks follow the rule into the reference. `orbit-decision-records`'
  `Decision records are written in every mode` is RENAMED to `Decision records are written when a setting reads them`
  and rewritten to D-rbs-1's terms, and `orbit decisions status` is ADDED there as its own requirement. Onboard's
  one-line statement (`onboard.ts` 67), `docs/cli.md` (the decision-records paragraph, and the new command beside
  `decisions brief`) and this repository's CLAUDE.md decision-writing bullet (records written when the command says so,
  run as `node bin/orbit.js decisions status` until a release carries it; here, never) are reworded. Onboard's line is
  edited although phase 1 leaves onboard's own text alone, because it restates the rule and would be false.
  Kind: scope
- **2026-11-18 — D-rbs-6: the rule moves whole except its first clause, which the test names as replaced** Sal's choice
  (A). The stage's exit criterion "keeps every clause of today's bullet" is met by a test that holds every clause of
  today's bullet in `decision-records.md` except "under every setting", the one clause this change exists to alter, which
  the test names as replaced by "when `orbit decisions status` reports `write: true`".
  Kind: scope
- **2026-11-18 — D-rbs-7: this repository stops writing records when this change's apply refreshes its skills** Not at
  archive: once apply rebuilds and runs `node bin/orbit.js update --force`, the local skills carry the basic content and
  `orbit decisions status` reports `write: false` here (no chain, signoff or tripwires key), so this change's own system
  review, walk and archive write no records, and its trail holds records from explore, propose and the proposal review
  only. Correct under D-rbs-1, since nothing here reads them.
  Kind: fact
  Disposition: superseded D-rbs-9

- **2026-11-19 — D-rbs-8: write: false forbids only new records; a record that answers or fixes one already in the trail
  is written whatever the result** Sal's choice (A) at the proposal walk, answering the blind pair's fresh F1 and codex
  X3 (and, with them, codex X1 and fresh F5). D-rbs-3's moment stands: the session runs `orbit decisions status --json`
  at its start and again after it edits `orbit/config.yaml`, keeps the result, and on `write: true` reads
  `references/decision-records.md` and follows its rule. On `write: false` it writes no NEW ledger entry or stop record,
  but it still writes a resolution answering a stop already in the trail (one written while a reader was on, or a
  `tripwire` stop orbit wrote) and a replacement fixing a record a reading found wanting, reading the reference when it
  writes one. The reading step reads what a trail already holds whatever the settings, so records written before this
  rule, or while a setting was on, are still read, answered and fixed at the defaults. Chosen over keeping the blanket
  prohibition with three named limits (B: an unfixable reading finding, a stranded stop, an unanswered tripwire stop)
  and over making the command read the trail (C: the basic content would need a change name, which D-rbs-2 ruled out).
  Kind: rule
  Disposition: superseded D-rbs-10
- **2026-11-19 — D-rbs-9: this repository stops writing new records when this change's apply refreshes its skills**
  Once apply rebuilds and runs `node bin/orbit.js update --force`, the local skills carry the basic content and
  `orbit decisions status` reports `write: false` here (no chain, signoff or tripwires key), so this change's system
  review, walk and archive write no new ledger entry or stop record. The ledger entries already in its trail are still
  read by the system review's reading step, and a finding on one is fixed by a replacement (D-rbs-10).
  Kind: fact

- **2026-11-19 — D-rbs-10: the command runs at each command's first step, and its result governs that command** Sal's
  choice (A) at the proposal walk, answering the fresh reviewer's F4. Each command runs `orbit decisions status --json`
  at its first step, and again after the session edits the project config (`orbit/config.yaml` or `.yml`); on
  `write: true` it reads `references/decision-records.md` and follows the rule for the rest of the command; on
  `write: false` it writes no new ledger entry or stop record, while a resolution answering a stop already in the trail,
  or a replacement fixing a record already there, is still written, reading that reference when it writes one (D-rbs-8,
  kept). A chained command, a command typed later in a conversation, and a command after a compaction each read the
  settings afresh. Chosen over the reviewer's "unless this session already holds the result" (B: the judgement a
  compaction makes unreliable) and over keeping "at the session's start" with two named limits (C).
  Kind: rule

## Open questions

## Considered & out

- **2026-11-18 — Records owed when a setting's key is merely present (D-rbs-1's B):** a `chain:` map with no grant or a
  `tripwires:` map left at `record` has no reader, so records written under it cost a body and a turn for nothing.
- **2026-11-18 — Dropping the tripwires from R-rop-17's list (D-rbs-1's C):** a halting tripwire's stops wait for the
  user's answer, written as a resolution, so the tripwires are a reader; dropping them would also amend the ruling.
- **2026-11-18 — The gating result as a field on `orbit status --change --json` (D-rbs-2's B):** explore, architect and
  audit-drift never run it and a project-wide session has no change, so the basic content could not be one text.
- **2026-11-18 — The emit answering "not owed" (D-rbs-2's C):** the agent needs the whole rule to know when to call
  the emit, so nothing leaves the bodies.
- **2026-11-18 — Running the command before the first record (D-rbs-3's B):** circular, since without the rule the
  agent cannot tell that a record is due.
- **2026-11-18 — Running the command at every designed moment (D-rbs-3's C):** several calls a session for a result
  that changes only when the settings do.
- **2026-11-18 — The write gate refusing a record when none is owed (D-rbs-4's B):** enforces the rule in code, but
  changes a gate at the defaults (amending G0 and RG0), removes writing a record by hand, and stops nothing harmful.
- **2026-11-18 — Accepting such a record with a note (D-rbs-4's C):** a readout change at the defaults, beyond both
  goals' exceptions, for a record that costs one reader at review.

## References

- `orbit/architecture/reduce-orbit-phase1.md` — R-rop-17, RG0 as amended, the stage's charter and exit criteria
- `orbit/architecture/automate-dev-flow.md` — G0 and R-adf-17
- `orbit/explore/evaluation/explore.md` — D-eval-3 and its Mechanism entry (the readers of `decisions/`)
- `src/core/disciplines.ts` — `DECISION_WRITING_DISCIPLINE`, `DECISION_RECORDS_REFERENCE`
- `src/core/project-config.ts` — `resolveChainSetting`, `resolveSignoffSetting`, `resolveTripwiresSetting`
- `src/core/chain.ts` (`earliestOpenStop`, the grant check before it), `src/core/tripwires.ts` (`readCoverage`, the halt
  read at HEAD or the fixed point), `src/core/decision-records.ts` (`selectUnreadRecords`, the write gate)
- `orbit/specs/orbit-conventions/spec.md` — `Decision-writing discipline`, the reference requirement, the
  `tighten-bodies` edit-ledger requirement
- `orbit/specs/orbit-decision-records/spec.md` — `Decision records are written in every mode`
- `src/core/templates/workflows/onboard.ts` 67, `docs/cli.md` 366-372, `CLAUDE.md`'s Decision-writing bullet
- `skill_body_convention.md` — the shape of a block acted on once at a moment the body names

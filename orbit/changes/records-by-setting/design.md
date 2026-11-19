## Context

Fourteen generated workflow bodies carry the decision-writing bullet (`DECISION_WRITING_DISCIPLINE`,
`src/core/disciplines.ts`), a label line and five labelled sub-bullets that `tighten-bodies` gave it, and each ships
`references/decision-records.md` beside it. The bullet opens "under every setting", so every session writes ledger
entries, stop records and resolutions whatever the configuration. The exploration (see explore.md) read every reader
of a `decisions/` folder in `src/core` and found three that run only under a setting:

- the chain end step's open-stop check (`earliestOpenStop`, `src/core/chain.ts`), reached only when a granted key
  covers the next command;
- the program brief shown at sign-off, under `signoff: change` or `program` (`takesAccount`);
- the tripwires, which read only their own `tripwire` stops and the resolutions answering them, written only when a
  sensor is set to `on_fire: halt` (`src/core/tripwires.ts`).

The review's reading step and the walk read whatever a trail already holds, whatever the settings: records written
before this change, or while a setting was on, keep being selected and read at the defaults, and a reading finding on
one is fixed by a replacement record. On a trail that holds none, the step is skipped as when nothing is selected. Onboard carries its own one-line restatement of the rule, and CLAUDE.md, `docs/cli.md`
and `orbit-decision-records`' Purpose all say records are written in every mode.

## Goals / Non-Goals

**Goals:**

- At the defaults the AI writes no new decision record (a resolution answering a stop already in the trail, and a
  replacement fixing a record already there, are still written); under a granted chain key, `signoff: change` or `program`, or a
  halting tripwire it writes them exactly as today (R-rop-17, RG0 as amended, R-adf-17).
- Every body is the same under every configuration (R-rop-5); an orbit command's result picks the branch (R-rop-4).
- The rule keeps every clause of today's bullet but its opening one (the stage's exit criterion, D-rbs-6).
- The bodies shrink by the rule's text, and the budget test's ceilings follow them down (RG3).

**Non-Goals:**

- The write gate does not start reading the settings (D-rbs-4).
- The one-line decision-writing rewording R-rop-7 weighed stays out (phase 2, R-rop-15): the rule moves whole.
- No change to what a record holds, to the reading step, to the brief, or to the account (written under every setting,
  as today).
- The autonomous driver's term is added by `automate-dev-flow`'s stage `driver`, not here.

## Decisions

### Decision 1: one predicate, three terms (D-rbs-1)

`write` is true exactly when some chain key is granted (`resolveChainSetting(...).grants`), OR the sign-off setting is
`change` or `program` (`takesAccount(resolveSignoffSetting(...))`), OR some sensor in `tripwireSensors()` reports
`on_fire: halt` from `resolveTripwiresSetting({ projectRoot })`. Iterating the sensor list, rather than naming
`touchpoints`, keeps a later sensor covered with no edit here. `readers` lists the terms that are on in the fixed order
`chain`, `signoff`, `tripwires`. Chosen over a key's mere presence and over dropping the tripwires (see explore.md,
Considered & out).

### Decision 2: a module of its own, and a command in the `decisions` namespace (D-rbs-2)

The predicate lives in a new `src/core/decision-status.ts`. It cannot live in `decision-records.ts`, which
`tripwires.ts` imports (`readDecisionFolder`), since it needs `tripwireSensors()`. `orbit decisions status [--json]`
joins `orbit decisions brief` in `src/cli/program.ts`: no argument, read-only, exit zero. Human output is one line:
`Decision records: not written (no setting reads them)` or `Decision records: written (read by chain, signoff)`.
`--json` prints `{"write": false, "readers": []}`. The names `write` and `readers` avoid "owed", which the review emit's
`decision_records_owed` already uses for records owed a reading. An unrecognized `signoff` value reads as off with no
warning here, since the holds already print one.

### Decision 3: the basic content, one line in every body (D-rbs-10, which walked D-rbs-3)

A new constant `DECISION_WRITING_BASIC` replaces `${DECISION_WRITING_DISCIPLINE}` in the fourteen templates, keeping the
epitome's fifth-bullet position:

```
- **Decision-writing (call-time)**: at each command's first step, and again after this session edits the project config (`orbit/config.yaml` or `.yml`), run `orbit decisions status --json`. On `write: true`, read `references/decision-records.md` and follow its rule for the rest of the command. On `write: false`, write no new ledger entry or stop record; a resolution answering a stop already in the trail, or a replacement fixing a record already there, is still written — read that reference when you write one.
```

The call runs at each command's first step, so a chained command, a command typed later in a conversation and a
command after a compaction each read the settings afresh; the result governs that command (the proposal walk's D2).
The body names the moment, the command, the usual result (`write: false` at the defaults) and the link: R-rop-3's basic
content. It is a block acted on once, at a moment the body names (`skill_body_convention.md`), so the read happens
there, unconditionally whenever the result is `write: true`. On `write: false` the prohibition covers only NEW records: a
resolution answering a stop already in the trail and a replacement fixing a record already there are written whatever
the result, and the agent reads the reference when it writes one. So turning the last reader off strands no stop, a
`tripwire` stop is answered whatever the working tree says, and a reading finding is fixed at the defaults (the
proposal blind pair's F1, X1 and X3).

### Decision 4: the rule moves whole into the reference (D-rbs-5, D-rbs-6)

`DECISION_WRITING_DISCIPLINE` stays the rule's constant, its label line's opening clause changed from "under every
setting," to "when `orbit decisions status` reports `write: true`,". Every other character, the five sub-bullets
included, is unchanged. That includes the label line's pointer to `references/decision-records.md`, which, read inside
that file, names the file the reader holds. `DECISION_RECORDS_REFERENCE` gains a first section, `## When to write a
record`, holding the rule, and its Contents list gains the entry. Its opening sentence ("The decision-writing discipline
in this skill says WHEN to write a record; this reference says WHAT each one holds.") becomes "Read this reference when
`orbit decisions status` reports `write: true`: its first section says WHEN to write a record, and the rest WHAT each
one holds." The `orbit-conventions` requirement keeps two fences, one per half, each held equal to its constant by the
parity test.

### Decision 5: the edit ledger undoes this change first

`tightened-bodies.test.ts` reconstructs each body's hash from before `tighten-bodies` by undoing its pairs on today's
body. After this change a body carries `DECISION_WRITING_BASIC` where the labelled form stood. The ledger therefore
first replaces the basic content with the labelled form as `tighten-bodies` left it: the rule with "under every
setting," restored, a test-side constant derived from `DECISION_WRITING_DISCIPLINE` by that one substitution. Then it
undoes its own pairs, as before. Its clause check reads the rule in the reference and names the one replaced clause.
This follows text to its new home (RG0, R-adf-15), and its requirement gains the row. A mutation shows the check still
fails on a dropped clause.

### Decision 6: what else is edited (D-rbs-5)

- Onboard's one-line statement says records are written when a setting reads them, naming `orbit decisions status`.
- `docs/cli.md`'s decision-records paragraph says the same, and a section for `orbit decisions status` sits beside
  `orbit decisions brief`, satisfying the command-coverage check (`orbit-user-docs`).
- `docs/customization.md`'s rows for `chain`, `signoff` and `tripwires` each say that turning the setting on, in the
  state D-rbs-1 names, makes the AI write decision records.
- CLAUDE.md's Decision-writing bullet: records are written when `orbit decisions status` says so, run as
  `node bin/orbit.js decisions status` until a release carries it. Here, with no chain, signoff or tripwires key, that
  is never.
- `orbit-decision-records`' Purpose ("The records are written in every mode") is edited in place, since no delta
  carries a Purpose.

### Alternatives considered

Carried from explore.md's Considered & out:

- **Records owed when a setting's key is merely present:** a `chain:` map with no grant, or tripwires left at
  `record`, has no reader.
- **Dropping the tripwires from R-rop-17's list:** a halting tripwire's stops wait for an answer, and dropping them
  would amend the ruling.
- **The result as a field on `orbit status --change --json`:** explore, architect and audit-drift never run it, and a
  project-wide session has no change.
- **The emit answering "not owed":** the agent would still need the whole rule to know when to call it.
- **Running the command before the first record:** circular. **At every designed moment:** repeated calls for a
  result that changes only with the settings. **Once per session, at its start** (D-rbs-3): a command typed later, or
  one after a compaction, could act with no result; **per command unless the session already holds a result**: brings
  back the judgement compaction makes unreliable (the proposal walk's D2).
- **The write gate refusing, or noting, a record when none is owed:** each changes a gate or readout at the defaults,
  amending G0 and RG0, to stop something harmless.

## Risks / Trade-offs

- **[D-rbs-10, BOUNDED] a settings edit made outside the session while one command runs, or a compaction mid-command** → its named limit is stated once, in
  `orbit-conventions`' `Decision-writing discipline`.
- **[Named limit, D-rbs-2] the command reads the working tree, a halting sensor the committed config or the change's
  fixed point** → stated in `orbit-decision-records`' `orbit decisions status says whether decision records are
  written`.
- **[A stray record at the defaults] an agent writing from habit, a stale memory or instruction** → accepted and read as
  any record (D-rbs-4), at one reader's cost at review; CLAUDE.md, onboard and the docs are corrected so no project text
  asks for one.
- **[This change's own trail] this repository stops writing new records once apply runs `update --force` (D-rbs-9)** →
  its system review, walk and archive write no new ledger entry or stop; the ledger entries already in its trail are
  still read by the system review's reading step, and a finding on one is fixed by a replacement, as today.
- **[An agent skipping the call]** → the same exposure as every body-directed read (R-rop-4, D-eval-5); a skip at a
  reading setting leaves a trail without records, visible at sign-off or to the chain's open-stop check.

## Migration Plan

None beyond regenerating skills (`orbit update`): a project with no reading setting stops writing records at its next
session, and its existing records stay where they are and are read as today. Rollback is reverting the change.

## Touchpoints

- `src/core/decision-status.ts` — new: the predicate (D-rbs-1).
- `src/cli/program.ts` — `orbit decisions status` and the `decisions` group's description.
- `src/commands/decisions.ts` — the `status` action, beside `brief`'s.
- `src/core/completions/command-registry.ts` — the new subcommand.
- `src/core/disciplines.ts` — the rule's opening clause, `DECISION_WRITING_BASIC`, the reference's new section.
- `src/core/templates/workflows/*.ts` — the fourteen bodies interpolate the basic content; onboard's line.
- `test/core/decision-status.test.ts` — new: each row of the predicate and the command's output.
- `test/core/decision-writing-parity.test.ts` — two fences, the carriers, the reference carrying the rule.
- `test/core/templates/tightened-bodies.test.ts` — the ledger undoes the swap first.
- `test/core/templates/skill-body-budget.test.ts` — lowered ceilings.
- `test/core/templates/` — content-fidelity and template-parity pins that move with the text.
- `test/core/decision-records.test.ts` — the re-tagged scenario.
- `docs/cli.md` + `docs/customization.md` — the decision-records paragraph, the new command, the three settings.
- `CLAUDE.md` — the Decision-writing bullet.
- `orbit/specs/orbit-decision-records/spec.md` — its Purpose, in place.

## Mechanism → artifacts

The proposing AI's reading of the file; no engine record.

| rule | closure / state | owner's state | destination |
|---|---|---|---|
| D-rbs-1 | SOURCED | live rule | `orbit-decision-records`' `Decision records are written when a setting reads them`, as a TABLE of the three settings' states |
| D-rbs-2 | SOURCED | live rule | `orbit-decision-records`' `orbit decisions status says whether decision records are written`, as a SENTENCE naming the source (the fourteen bodies) with the session kinds in prose |
| D-rbs-3 | — | superseded D-rbs-8 (not carried) | none |
| D-rbs-8 | — | superseded D-rbs-10 (not carried) | none |
| D-rbs-10 | BOUNDED | live rule | `orbit-conventions`' `Decision-writing discipline`, its residual lines verbatim as a named limit; Risks above points at it |
| D-rbs-4 | — | scope (not carried) | none |
| D-rbs-5 | — | scope (not carried) | none |
| D-rbs-6 | — | scope (not carried) | none |
| D-rbs-7 | — | superseded D-rbs-9 (not carried) | none |
| D-rbs-9 | — | fact (not carried) | none |

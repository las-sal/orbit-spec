> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: rc17b-blind-pair-command

## Premise

Stage `rc17b-blind-pair-command` (`clean-up-review-cycle.md`, declared 2026-10-05 from the rc17
exploration's split, D-bpc-9). Charter: `/orbit:review --as <mode> --reviewer blind-pair` runs both
halves in one invocation; the external runner is the USER's, recorded in the per-user global config at
`orbit init`; a recorded and reachable runner launches every external half, single or pair; the
`--reviewer` axis gains `--in-context`, `--external`, `--blind-pair` shorthands. Its rules were settled
in rc17a's archived exploration and ASSIGNED here: D-bpc-1, -2, -3, -4, -11, -13 (rules) and D-bpc-5,
-14 (scope readings). Exit: (1) one invocation, both pass files, each committed alone, no walk between,
pushed; (2) a recorded runner launches with no paste and its return commits without hand edits; (3) an
adopter without a runner gets today's handoff, unchanged.

This exploration does not re-litigate those decisions. It has two jobs: (a) re-read them against what
rc17a actually SHIPPED (its design D2 and D4 changed two of the facts they cite), and (b) measure the
stage's size against R-crc-1 BEFORE propose, as the charter asks.

### Measured 2026-10-06 — what rc17a shipped that the assigned rules predate

- rc17a D2: the pair LAUNCH is the external half's T0 written with `pair: true` — D-bpc-13's rows 2
  (launch record) and 3 (packaging) are ONE act.
- rc17a D4: membership is by ORDER for both classes, revising D-bpc-10's stamp — D-bpc-13 row 6c
  ("its emit stamped with L") is stale; the fresh emit carries no launch token.
- rc17a D6: until this stage ships, the `blind-pair` preference presents the fresh review; switching
  that one row of `orbit-engine-gates`' `The first review slot covers what the user invoked` is this
  stage's edit.

### Measured 2026-10-06 — capabilities whose text the charter makes false or must extend

| capability | why |
|---|---|
| `orbit-review` | the `blind-pair` reviewer value, the three new shorthands (beside `--fresh`), the one-command step order |
| `orbit-review-external` | `Command does not run the review or ingest findings` is false once a recorded runner launches; the handoff/preflight requirements gain the launched branch |
| `orbit-engine-gates` | the `blind-pair` preference's presentation row (rc17a D6 handoff) |
| `orbit-conventions` | `Review mode decision framework`'s class 3 says the external is "reached by a packaged prompt a human carries across vendors" |
| `orbit-onboard` | named by the charter for the setup note (D-bpc-2) |
| init's setup step + the runner record + its `orbit status --json` field | NO baseline capability owns `orbit init`'s prompts or the global config (`src/core/global-config.ts`); this is an ADDED capability |

Six against a ceiling of three. Resolved by D-rc17b-1 (split).

## Mechanism

## Decisions

- **2026-10-06 — D-rc17b-1: rc17b splits into a runner stage and the pair-command stage** — Sal: "yes split", resolving Q-rc17b-1. The measurement (Premise table) found six capabilities against R-crc-1's ceiling of three; the rules divide by dependency. The RUNNER stage carries D-bpc-1's dispatch, D-bpc-2, -5, -11 and -14 — the per-user runner record, init's setup step and its note, the record's `orbit status --json` field, and auto-launch of every external half — across an ADDED runner capability, `orbit-review-external` and `orbit-conventions`; it serves charter exits (2) and (3). The PAIR-COMMAND stage carries D-bpc-3, -4, -13, the three shorthands and the `blind-pair` presentation row across `orbit-review` and `orbit-engine-gates`, depends on the runner stage, and serves exit (1). The setup note lives in init's output, owned by the new capability, so `orbit-onboard` is not touched. R-crc-9's ninth preventive application, caught at exploration. Leaning on ids, for the architect session to settle: the precedent of rc04d split from rc04c — `rc17b` keeps its title and the pair command and gains `Depends-on` the new runner stage (e.g. `rc17d-external-runner`), so this exploration's citation stays valid. Settled at the architect session the same day: `rc17d-external-runner`, declared before rc17b with `Depends-on: (none)`; rc17b depends on it.
  Kind: scope

## Open questions

_(none open)_

## Considered & out

## References

- `orbit/architecture/clean-up-review-cycle.md` — Stage rc17b-blind-pair-command (charter), Stage
  rc17-blind-pair-command (split parent), R-crc-1, R-crc-9.
- `orbit/changes/archive/2026-10-06-rc17a-invoked-coverage/explore.md` — D-bpc-1..17 with Mechanism
  entries for the assigned rules (D-bpc-1, -2, -3, -4, -11, -13).
- `orbit/changes/archive/2026-10-06-rc17a-invoked-coverage/design.md` — D2 (launch = `pair: true` T0),
  D4 (membership by order), D6 (preference presentation interim).
- `orbit/specs/orbit-engine-gates/spec.md` — `The first review slot covers what the user invoked`.
- `orbit/specs/orbit-review-external/spec.md` — `Handoff preflight blocks unusable pull invocations`,
  `Command does not run the review or ingest findings`.
- `orbit/specs/orbit-conventions/spec.md` — `Review mode decision framework` (the three classes).
- `src/core/global-config.ts` — the per-user XDG global config, D-bpc-11's home.
- `src/core/templates/workflows/review.ts` — the `--reviewer` axis and the external-handoff reference.

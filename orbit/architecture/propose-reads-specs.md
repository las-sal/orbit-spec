# Program: propose-reads-specs

> Position is COMPUTED — run `orbit architecture status`. This doc declares; the engine renders.

## Premise

Issue #29. A study on a DevX team found that in about 60% of agent sessions on projects using OpenSpec, the agent
never read the baseline specs before proposing a change; the OpenSpec maintainer's explanation was that the prompt
did not push the agent hard enough to read them. orbit inherits OpenSpec's propose flow.

orbit's own record (the #29 investigation comment, 2026-10-17: a scan of 55 `/orbit:propose` runs across orbit-spec
and overtime) shows a milder form. Agents almost always read SOME spec first: 41 of 55 during the propose run, 13
more earlier in the same session, and the one with none had no baseline yet. But of the 130 capabilities 51
proposals list as modified, 39 (30%) had their spec unread anywhere in the session before `proposal.md` was written,
and 20 of the 51 proposals (39%) modify at least one capability whose spec was not read first. Two incidents on the
record fit it: a rule whose restating specs were missed at propose (rc17a, followed by rc17c), and an invented
precondition about a spec's owner that a fresh review raised as a CRITICAL (rc02b).

The cause is in the instructions. The propose body (`src/core/templates/workflows/propose.ts`) tells the agent to
read the change's own dependency artifacts and nothing of the baseline. The schema's one sentence, "Research existing
specs before filling this in", pointed at `openspec/specs/` until openspec-path-fix (archived 2026-10-17, #30)
corrected the path; it still asks for research, not a read of each capability the proposal modifies.

This program must produce a propose flow in which the agent reads the baseline spec of every capability it lists as
modified before writing `proposal.md`, and a record of that read that a review can check.

## Goals

Ratified by Sal, 2026-10-17. Each goal names what makes it fail.

- **G0 — The instruction is where the failure happens.** The generated propose and ff skills carry three read
  steps, at the point where the modified capabilities are known and before `proposal.md` is written: (1) read the
  whole baseline spec of each modified capability; (2) copy each MODIFIED block whole from the baseline; (3) grep
  `orbit/specs/` for the rule being changed, to find specs that restate it. A surface test holds them, and the fix
  ships as a release. Fails if either generated skill lacks a step, or carries one after the step that writes
  `proposal.md`.
- **G1 — Agents read.** Across the next 8 proposals in Sal's other projects whose loaded propose skill carries the
  fix (read from the transcript itself), no more than 10% of modified capabilities have their spec unread before
  `proposal.md` is written. The baseline is 30% (39 of 130, the #29 scan of orbit-spec and overtime before this
  program). Fails if the share is above 10%.
- **G2 — The costly kind stops.** Across the same 8 proposals, no proposal-review CRITICAL is a baseline
  contradiction: a MODIFIED block that does not match the baseline, a contradiction with an unmodified requirement
  of a modified capability, or a spec that restates the changed rule and is not listed. The measure stage classifies
  each CRITICAL by its title and description, as the probe did, and records each classification. Fails on the first
  such CRITICAL.
- **G3 — It stays an instruction.** The program adds no new section to any artifact and no new validation or emit
  check. Fails if a stage adds either.

G1 or G2 failing is the trigger to reconsider the checked record (Considered & out). G3 failing means the program
drifted into it without deciding to.

## Rulings index

- **R-prs-1** (Sal, 2026-10-17) — The measurement is taken only in Sal's other projects, never in orbit-spec. The AI
  working on orbit-spec stays neutral: it ships the instruction and measures what happens elsewhere, and puts nothing
  about the measurement into those projects (no note in their CLAUDE.md, memory or prompts). Rationale: orbit-spec's
  sessions know the goal, so a read there is not evidence that the instruction works.

## Program stages

### Stage read-obligation — The propose and ff bodies tell the agent to read the baseline

Depends-on: (none)
Complete: [ ]

The fix. The propose body (`src/core/templates/workflows/propose.ts`) and the ff body
(`src/core/templates/workflows/ff-change.ts`) gain G0's three read steps, placed where the modified capabilities
become known and before `proposal.md` is written, and a surface test holds them in the generated skills. The change
carries the specs that own those bodies, and is sized under R-crc-1.

Exit criteria:
- G0 holds: both generated skills carry the three steps before the `proposal.md` write, and the surface test fails
  on a skill missing one (shown able to fail).
- G3 holds for this stage: no artifact section, no validation or emit check added.
- The fix is released as orbit v2.0.2, cut by `npm run release:tree`; pushing the tag stays Sal's act.

### Stage measure — Grade G1 and G2 on Sal's other projects

Depends-on: read-obligation
Complete: [ ]

The check; it writes no code. After 8 proposals in Sal's other projects ran the fixed skill, re-run the probe on
their transcripts and review records, under R-prs-1: read only, and nothing written into a measured project. A
proposal counts only when its transcript shows the loaded propose skill carrying G0's steps. Transcripts come from
both machines; Sal supplies the Mac's.

Exit criteria:
- G1 and G2 graded, each Met or Failed, with the counts, every counted proposal named, and each CRITICAL's
  classification recorded in the status log.
- On a failure, a ruling: reconsider the checked record, re-aim the instruction, or accept the result.
- The probe's method is written down where #32's instrument can reuse it.

## Considered & out

- **2026-10-17 — A checked read record (option C):** an evidence section per modified capability accounting for its
  baseline requirements, with an engine check. Out on the probe's evidence: unread capabilities drew fewer findings,
  the costly misses were caught at proposal review, and the record would add review surface, the cost
  clean-up-review-cycle measured. What the engine can check (titles exist, a list is complete) is what a grep of
  `### Requirement:` produces, so it proves enumeration, not reading. Re-entry: G1 or G2 fails.
- **2026-10-17 — An asserted read list in the propose emit (option B):** a claim, written after `proposal.md`, that
  the engine cannot verify. Out for the same reason gates are computed, never asserted.
- **2026-10-17 — `/orbit:continue` in scope:** it also writes `proposal.md`, one artifact at a time. Out: Sal's flow
  is architect → explore → propose, and G0 names propose and ff.
- **2026-10-17 — Measuring in orbit-spec:** out by R-prs-1; its sessions know the goal.

## Status log

- 2026-10-17 — Doc created from issue #29 at `/orbit:architect propose-reads-specs`; premise from the #29
  investigation comment. Goals and stages await Sal's ratification.
- 2026-10-17 — Probe (Sal asked whether a checked read record, option C, buys better code than a stronger
  instruction, option A): 44 proposals across orbit-spec and overtime, their CRITICAL and WARNING review findings
  attributed to a modified capability by file path, else by the capability's name in the finding (538 of 982
  unattributed). VOLUME: unread capabilities drew FEWER findings, 1.9 per capability against 3.86 for read ones
  (1.03 against 1.63 per modified requirement), and in 10 of the 11 proposals with both kinds the read capabilities
  drew more. KIND: of the 9 CRITICALs on unread capabilities, 6 are baseline-contradiction failures a read would
  have prevented (rc04a's MODIFIED blocks dropping and rewriting baseline scenarios; rc04c contradicting an
  unmodified `orbit-emit-composition` requirement; bridge-retirement conflicting with the input-files state
  machine; delivery-surface-core leaving `profile-loader` requiring `init_run --source`). All were caught at
  proposal review. Not measured: a capability the change should have listed and did not (rc17a's case), since the
  domain is the listed capabilities. Reading: missed reads cost a few CRITICAL-driven review cycles, not code
  quality, and the evidence does not justify a checked record over a well-aimed instruction.
- 2026-10-17 — Sal: the measured proposals happen in other projects on both machines (this Fedora machine and the
  Mac); Sal copies the Mac's `~/.claude/projects/` transcripts over, or gives access, before the measure stage runs.
  On this machine `chat-mover` and `home-env` already use orbit. Draft goals G0–G3 (G1/G2 over the next 8 proposals
  in other projects whose loaded propose skill carries the fix, read from the transcript itself) await ratification.
  Sal raised the wider idea of measuring orbit's effectiveness across all projects over time, outside this program;
  this program's measure stage would be its first consumer. Filed as issue #32.
- 2026-10-17 — Sal ratified the goals G0–G3; stages `read-obligation` and `measure` declared.

## Context

Both propose-shaped bodies carry the same upstream step 4a, and its one read instruction is "Read any completed
dependency files for context" (`src/core/templates/workflows/propose.ts:72`, `ff-change.ts:61`). The proposal
artifact has no dependencies, so nothing in either body sends the agent to `orbit/specs/` before `proposal.md`. The
upstream portion of each body changes only through a named in-place edit (`orbit-conventions`' `Generated-file
disposition`, which lists both `orbit-propose` and `orbit-ff-change`). The probe behind this stage and its goals are
in `orbit/architecture/propose-reads-specs.md`; this change's decisions are in explore.md (D-ro-1 to D-ro-5).

## Goals / Non-Goals

**Goals:**
- G0: both generated bodies carry the two lines at step 4a, held by a test that can fail.
- The fix ships as v2.0.2.

**Non-Goals:**
- Any record or check of the read (G3; Considered & out in the architecture doc).
- `/orbit:continue` and `/orbit:new` (the architecture doc's Considered & out).
- Measuring the effect: the `measure` stage's, in other projects only (R-prs-1).

## Decisions

**D1 — The edit (D-ro-1, D-ro-3).** In each body, the line `      - Read any completed dependency files for context`
is followed by the requirement's two fenced lines, each indented as that line is (six spaces, then `- `). Step 4a
runs once per artifact, so the agent meets the proposal line as it starts the proposal artifact and the specs line as
it starts the specs artifact. The specs line points at the instruction the agent has just fetched (`orbit
instructions specs`, whose MODIFIED requirements workflow says to copy the ENTIRE block, `schema.yaml:54-60`) and
names the consequence; it does not restate the workflow. In the template sources the lines' backticks are escaped
(`` \` ``), as the bodies' other backticks are.

**D2 — The test holds the bodies to the requirement's fence (D-ro-4).** A new test reads the fence from
`orbit/specs/orbit-propose-modifications/spec.md` once the change is archived, and from the change's delta while it is
active, through the `ownerText` helper the other mirror tests use. For each of the two template functions
(`getOrbitProposeSkillTemplate`, `getFfChangeSkillTemplate`) it finds the dependency-read line and asserts that the
next two lines, trimmed, equal the fence's two lines and that `- Create the artifact file using` follows. A failure
names the body and the line. The test is shown able to fail by running it before the edit lands (task 1.3).

**D3 — The standalone requirement admits the both-mode steps.** `Upstream propose behavior preserved in standalone mode`
said the body behaves exactly as upstream without an exploration, which the size brief and the `## Touchpoints` section
already contradicted and this edit would contradict again. Its MODIFIED text excepts the orbit steps that run in both
modes, an open list naming three of them (the baseline read, the Touchpoints section, the size brief): a closed list
would be false today (the base-fingerprint capture and the completion-prompt override run in standalone mode too) and
false again at the next both-mode step. Its one scenario (THEN) says "as upstream, apart from the orbit steps that run
in both modes". The body's own standalone sentence (`propose.ts:279`, "with ONE addition") says the same in its terms
(task 2.1). The scenario has no declaring test today, so the change adds one (task 1.4): carrying a block carries its
scenarios. The capability's Purpose line, which says upstream's propose "is preserved when no exploration exists", is
edited in place in the baseline to say the same (a Purpose is never carried by a delta).

**D4 — The 2.0.2 bump.** `npm version 2.0.2 --no-git-tag-version` moves `package.json` and `package-lock.json`.
`CHANGELOG.md` gains a `## 2.0.2` entry above `## 2.0.1`. The five version sites the version check reads move to
2.0.2: `README.md` lines 64 and 68, and `docs/installation.md` lines 14, 17 and 30. The release tree is cut after
merge by `npm run release:tree` and the tag pushed by Sal, as `orbit-release` requires; installing from the pushed tag
is the user-validation task.

## Alternatives considered

From explore.md's Considered & out: an additions-section step that states its position (the weak-prompt shape the
study found); restating the schema's MODIFIED workflow in the body (two copies drift); one requirement per body (ff's
additions have no owning capability). From the architecture doc: a checked read record, and an asserted read list in
the propose emit.

## Touchpoints

- `src/core/templates/workflows/propose.ts` — step 4a; the standalone section's sentence (D3).
- `src/core/templates/workflows/ff-change.ts` — step 4a.
- `test/core/templates/propose-reads-baseline.test.ts` — the new test (D2, and the standalone scenario's).
- `test/core/templates/skill-templates-parity.test.ts` — the moved hashes.
- `orbit/specs/orbit-propose-modifications/spec.md` — the Purpose line, edited in place (D3).
- `package.json` + `package-lock.json` — the bump.
- `CHANGELOG.md` — the 2.0.2 entry.
- `README.md` + `docs/installation.md` — the version sites.

## Mechanism → artifacts

The proposing AI's reading of the file; no engine record.

| rule | closure / state | owner's state | destination |
|---|---|---|---|
| D-ro-5 | SOURCED | live rule | `orbit-propose-modifications`' `Propose-shaped bodies read the baseline before writing proposal.md` — a SENTENCE naming the source (`orbit-run-summary-emit`'s propose-shaped commands, `/orbit:propose` and `/orbit:ff`) |
| D-ro-1 | not carried | scope | none |
| D-ro-2 | not carried | scope | none |
| D-ro-3 | not carried | scope | none |
| D-ro-4 | not carried | scope | none |

## Risks / Trade-offs

- An instruction can be present and ignored. The goals measure that (G1, G2), in other projects; a failure there is
  the trigger to reconsider a checked record.
- A long body dilutes a two-line edit. Placing it at step 4a, where the agent reads context for the artifact it is
  about to write, is the strongest placement short of a check (D-ro-1).
- The edit moves both bodies' pins in `skill-templates-parity.test.ts`; a pin that moves without the edit landing
  would hide a stale body, so the pins move in the same task as the edit.

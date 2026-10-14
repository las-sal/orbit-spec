## Context

orbit's start surfaces send new work to explore or new: the archive emit's next, the CLI's getting-started hints, the
onboard body, and the architect stance spec's "canonical flow (explore → propose → …) is unchanged". Idle
`orbit status` says nothing at all: on the ladder's rungs 2 and 3 it prints no `Ready when you are:` line. R-rda-1
makes orbit architect-first, and R-rda-2 limits that to suggestions. The exploration (explore.md) measured the
surfaces (D-af-1) and settled each one on Sal's word (D-af-2 to D-af-6).

One correction to D-af-1's sweep, found reading `src/core/init.ts` at propose: `orbit init` prints
`Start your first change: /orbit:propose "your idea"`, not the `/orbit:new` line D-af-1 names. Both lines exist, but
`getProfileWorkflows` always returns every workflow (D15), so the propose branch is the one that runs, and the
`/orbit:new` branch is unreachable. This change replaces the whole getting-started block.

## Goals / Non-Goals

**Goals:**
- G1's engine half (R-rda-4): every strict start surface names `/orbit:architect` and no other start, under test.
- Idle `orbit status` names a next step again, with no fresh judgement beyond one constant.
- The archive emit sends a program's change back to its program's architect session.

**Non-Goals:**
- Requiring an architect session anywhere. Nothing refuses, gates or flags work that skipped one (R-rda-2).
- The per-change strip `explore → propose → review ⟲ → apply → review ⟲ → archive` (D-af-6).
- The user docs (stage `docs-refinement`) and the CLI's OpenSpec wording (stage `cli-says-orbit`). The welcome
  screen's `Welcome to OpenSpec` title is `cli-says-orbit`'s; this change edits only its quick-start list.
- Explore's maturity rungs and address-reviews' REDESIGN route, which continue or reroute existing work (D-af-1).

## Decisions

**1. The idle next line is time-shifted, with one constant fallback (D-af-2).** On rungs 2 and 3 the line renders the
newest emit's `next_recommended` when it begins with `/orbit:`, and otherwise `/orbit:architect <name>`. The newest
emit is chosen by the rule the `--full` LAST band already uses: all four trail locations plus archived trails, with
the same tie-break. The `/orbit:` test is the only reading of the string. A prose next under the eligibility label
would assert an eligibility nothing has, which is the concluded rule's reason. `orbit-orientation`'s sourcing
requirement names the constant as its second exception to "never fresh judgment".
- Rendering whatever was recorded was rejected, because prose would render under the label.
- Computing the next from the program's stage states was rejected. It is live judgement the orientation contract
  forbids, and an architect handoff already records the program's next.

**2. The archive next is composed from the archived metadata (D-af-3).** The emit already resolves the archived
directory before it composes, so `.openspec.yaml` is readable there. The doc file's existence is the one extra check.
- Cited, with the doc present: `/orbit:architect <doc> — change archived; review stage <stage> and take up the
  program's next stage, or run /orbit:audit-drift for a project-wide drift check.`
- Anything else: `/orbit:architect <name> — change archived; plan the next piece of work, or run /orbit:audit-drift
  for a project-wide drift check.`
- The text says "review", not "ratify", because another change may still cite the stage. The architect session's own
  offer decides ratification.
- `<name>` stays literal. It is a placeholder the user fills, and inventing a name would be judgement.
- An unreadable metadata file selects the second form and never refuses the emit.

**3. Strict and prose start surfaces (D-af-4).** `orbit-architect` gains `Start surfaces name the architect workflow
first`, whose table is the surface set.
- The strict rows are asserted by a new test: the archive next for a cited and an uncited change, `orbit init`'s
  getting-started output, and the first line of `orbit update`'s and the welcome screen's lists. They name
  `/orbit:architect` and none of `/orbit:explore`, `/orbit:new` or `/orbit:propose`.
- Idle status is strict only for its fallback: a recorded `/orbit:` command is continuing work and renders as
  recorded (proposal walk).
- The no-active-changes message and the two `--change` no-changes errors in `src/commands/workflow/shared.ts` are a
  strict row (proposal walk). The message becomes `No active changes.` and the errors name `/orbit:architect <name>`;
  `orbit new change` is named on no start surface, because it is not the flow orbit's author uses (Sal).
- The prose rows are the architect stance paragraph, the onboard body and the docs. They describe explore as the
  one-off path, after architect. The docs row is pending stage `docs-refinement`.

**4. The CLI hints (D-af-5).**
- `orbit init`'s `Getting started:` becomes one line naming `/orbit:architect <name>`, and the unreachable
  `/orbit:new` branch goes.
- `orbit update`'s legacy-upgrade list and the welcome screen's quick-start list read `/orbit:architect`,
  `/orbit:explore`, `/orbit:propose`: the canonical flow's order. Those later lines list commands, not where to start.

**5. Onboard (D-af-6).** The canonical-flow diagram reads architect → the per-change phases → architect: the
per-change phases run once per change (a stage may be served by several), and the closing architect session ratifies
the stage (Sal, at the proposal walk). The architect paragraph states that the session is never required. The
explore phase's "Thinking-mode entry" label is reworded, since explore now follows architect. The try-it nudge's concrete-idea recommendation becomes
`/orbit:architect <name>`. The bare-mode `/orbit:explore` nudge for orientation-only users stays: it is a no-commitment
look around, not a start.

**6. Mirrors.** These follow the engine:
- `orbit-conventions`' example payload carries the uncited archive string.
- The archive body's example (`archive-change.ts`) carries the same string.
- `orbit-run-summary-emit` drops "the archive emit" from its list of prose values.
- `orbit-architect`'s Purpose is edited in place to match the restated stance.

### Alternatives considered

- **Changing the per-change strip.** Out (explore.md): the strip tracks one change's lifecycle, below the program
  tier.
- **Clearing the D-arc's five unratified stages here.** Out (explore.md): that is Sal's `/orbit:architect
  d-arc-arbitered-flow` session.
- **Splitting the change by surface.** Rejected at propose (Sal, 2026-10-14). The capabilities breach is declared in
  the proposal.

## Mechanism → artifacts

The proposing AI's reading of the file; no engine record.

| rule | closure / state | owner's state | destination |
|---|---|---|---|
| D-af-1 | — | fact | not carried |
| D-af-2 | SOURCED | live rule | `orbit-orientation` / `Next-recommendation sourcing is time-shifted, never live`, as a SENTENCE naming the source (the LAST record's string, by its `/orbit:` prefix) with the scenarios `Idle next renders the newest recorded command` and `Idle next falls back to architect` |
| D-af-3 | SOURCED | live rule | `orbit-emit-composition` / `Atomic next_recommended — pre-computable and post-write classes`, as a SCENARIO SET (cited; uncited, dangling or unreadable) |
| D-af-4 | BOUNDED | live rule | `orbit-architect` / `Start surfaces name the architect workflow first`, as a normative TABLE; residual named in the requirement |
| D-af-5 | — | scope | not carried |
| D-af-6 | — | scope | not carried |

## Risks / Trade-offs

- **D-af-4's residual** → its named limit lives in `orbit-architect`'s `Start surfaces name the architect workflow
  first`. Task 6.1 runs its method at apply.
- **A stale LAST string can render after its subject moves on.** The idle line shows the newest record verbatim, so an
  archive next naming a program that has since completed still reads `/orbit:architect <doc>`. That session is
  harmless: it renders the doc's state and offers nothing. This is the time-shifted contract's known shape, accepted
  as it is for explore.
- **Pinned template hashes move** (`skill-templates-parity`). Expected; apply re-pins them.
- **Every MODIFIED block carries its scenarios** into the scenario map, and the current validator lists the
  undeclared ones. Apply declares each one, by `@scenario` tag or a ledger entry.

## Touchpoints

- `src/core/orientation.ts` + `src/commands/workflow/status.ts` — the idle next line, text and JSON.
- `src/core/emit-composition.ts` — archive's `next_recommended` from the archived metadata.
- `src/core/init.ts` — the getting-started block.
- `src/commands/workflow/shared.ts` — the two no-changes errors.
- `src/core/update.ts` — the legacy-upgrade getting-started list.
- `src/ui/welcome-screen.ts` — the quick-start list.
- `src/core/templates/workflows/architect.ts` — the stance paragraph.
- `src/core/templates/workflows/onboard.ts` — the flow diagram, phase paragraph and try-it nudge.
- `src/core/templates/workflows/archive-change.ts` — the example payload.
- `test/core/` — the start-surfaces test, the archive next and the pinned strings.
- `test/commands/` — the idle status cases.
- `orbit/scenario-ledger.yaml` — declarations for the carried scenarios.
- `orbit/specs/orbit-architect/spec.md` — the Purpose, edited in place at archive.

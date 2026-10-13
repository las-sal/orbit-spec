# Workflows

This page covers how orbit's workflows fit together: the common patterns, the review cadence around apply, and when
to update a change rather than start a new one. [Commands](commands.md) documents each workflow on its own.

## Actions, not phases

A change is a folder of artifacts, and each workflow is an action on it. Nothing locks a change into a phase: you
can edit the design during apply, add a task after a review, or write the specs before the design when the schema
allows it. What orders the work is the artifact graph (tasks need the specs and the design) and the gates (apply
waits on the proposal review, archive on the system review). Both are computed from the change's files.
[Workflow engine](workflow-engine.md) describes the mechanism.

## Patterns

### One change, start to finish

The usual path, which [Getting started](getting-started.md) walks in full:

```text
/orbit:explore            optional: think it through
/orbit:propose            write the change
/orbit:review --as proposal --fresh
/orbit:address-reviews    walk the findings
/orbit:review --as proposal          confirm the walk
/orbit:apply              implement
/orbit:review --as system --fresh
/orbit:address-reviews
/orbit:review --as system
/orbit:archive            merge the specs, archive the change
```

You do not need to remember it. Each workflow ends with a `Ready when you are:` line naming what is eligible next.

### Step by step

When you want to read and adjust each artifact before the next is written, create the change with `/orbit:new` and
write one artifact at a time with `/orbit:continue`:

```text
/orbit:new add-dark-mode
/orbit:continue           writes proposal.md
/orbit:continue           writes the next ready artifact
/orbit:ff                 or: write everything that remains
```

Each `/orbit:continue` reads the artifacts the next one depends on, writes it, and shows what it unlocked.

### Exploring first

When the problem or the approach is unclear, start with `/orbit:explore`. It reads the code, asks questions and
compares options, and changes nothing. When the conversation settles, it writes `orbit/explore/<name>/explore.md`,
and `/orbit:propose` starts the change from it. An exploration can also end in nothing: deciding not to build is an
outcome.

### Parallel changes

Several changes can be in flight at once, each in its own folder. Each change fingerprints the baseline
requirements its delta specs touch when it is proposed. If one change archives and edits a requirement another
change also touches, archiving the second refuses to overwrite the first's edit and asks you to reconcile, rather
than lose it. `/orbit:bulk-archive` archives several finished changes with the same check.

`orbit status` shows every change in flight; `orbit status --full` adds the architecture view.

### A program of changes

Work too large for one change is declared as a program: an architecture doc under `orbit/architecture/`, authored
with `/orbit:architect`, whose stages each become a change. orbit computes each stage's state from disk, and
`orbit architecture status` shows where the program stands. A single change needs none of this.

## The review cadence

Two of the `spec-driven` schema's gates are **reviewed gates**: `review-proposal` (before apply) and `review-system`
(before archive). Each passes when the reviews its cadence asks for have run and their findings are resolved. The
gate's state is computed from the review records in the change's `.orbit-runs/` trail; no one asserts it.

The cadence of both gates is two slots, in order:

1. **An independent review**: what you invoked. One fresh review covers it, as does one external review, or a blind
   pair once both its halves have landed.
2. **An in-context review** after it: a review by your working session, which has the conversation. Run after a
   walk, it checks that the walk's fixes landed.

Between and after the reviews, `/orbit:address-reviews` walks the findings. A gate passes when both slots are
covered and every CRITICAL and WARNING finding of every review is resolved by a walk. SUGGESTIONs never hold a gate,
but the readout still names the walk of a review nobody has walked.

The readout names the next review to run. By default it presents the blind pair for the first slot. To present a
single fresh or external review instead, set `review_preference` in `orbit/config.yaml`, per gate:

```yaml
review_preference:
  review-proposal: fresh
  review-system: blind-pair
```

The preference only changes what the readout suggests. Any independent review you invoke covers the slot.

The third gate, `apply`, is **tracked**: it passes when every task in `tasks.md` is checked. A task the apply records
as yours to validate does not hold it; archive asks about those tasks.

**Gates report; you decide.** No gate blocks you outright. If you run `/orbit:apply` before the proposal gate passes,
or `/orbit:archive` before the system gate passes, the workflow says so and asks whether to proceed. A decision to
proceed is recorded in the trail with the gate's state at that moment. The rules behind each gate are owned by the
`orbit-engine-gates` capability in this repository's `orbit/specs/`.

## When to update vs. start fresh

You can always edit a change's proposal, design or specs, before implementation or during it. The question is when
refining becomes different work.

### What a proposal captures

A proposal defines three things:

1. **Intent**: what problem you are solving.
2. **Scope**: what is in and out of bounds.
3. **Approach**: how you will solve it.

Which of them changed, and by how much?

### Update the existing change when

**The intent is the same and the execution is refined.**

- You find edge cases you had not considered.
- The approach needs adjusting, but the goal is unchanged.
- Implementation shows the design was slightly off.

**The scope narrows.**

- The full scope is too big, and you want to ship a first version.
- "Add dark mode" becomes "Add a dark mode toggle (system preference later)".

**Learning corrects the plan.**

- The codebase is not structured the way you thought.
- A dependency does not work as expected.

### Start a new change when

**The intent has changed.**

- The problem itself is different now.
- "Add dark mode" becomes "Add a theme system with custom colors, fonts and spacing".

**The scope has grown into different work.**

- The original proposal would be unrecognizable after the updates.
- "Fix the login bug" becomes "Rewrite authentication".

**The original can be finished.**

- The original change can be done as it stands, and the new work stands alone.
- Archive "Add dark mode", then start "Enhance dark mode".

### The tests

| Test | Update | New change |
|---|---|---|
| **Identity** | The same thing, refined | Different work |
| **Overlap** | Most of the scope carries over | Little of it does |
| **Completion** | The original cannot be done without these edits | The original can finish; the new work stands alone |
| **Story** | The edits tell one coherent story | Patches would confuse more than clarify |

Updating preserves context; a new change gives clarity. Choose to update when the history of your thinking is worth
keeping, and a new change when starting fresh would be clearer than patching.

A change that has been reviewed keeps its review trail when you update it. orbit marks a review stale only when an
apply runs after it; an edit by hand or by a walk does not. After a substantive update, run another review yourself
so that the gate is read against what the change now says.

## Practices

- **Keep changes small.** A change should be reviewable in one sitting. A project can set `size_ceiling` in
  `orbit/config.yaml`, and `orbit validate` then reports a change that exceeds it.
- **Explore when unsure.** Ten minutes of `/orbit:explore` costs less than a proposal that reviews badly.
- **Walk every review.** A review generates findings; only a walk resolves them, and the gate counts only resolved
  findings.
- **Name changes for what they do.** `add-dark-mode`, `fix-login-redirect`, `remove-legacy-export`: a kebab-case
  name is the change's folder and its handle in every command.

## Next

- [Commands](commands.md): each workflow, its arguments and its options
- [Workflow engine](workflow-engine.md): the artifact graph and the gates underneath

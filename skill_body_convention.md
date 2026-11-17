# Skill body convention

## Purpose

A skill body a session invokes stays in its context on every turn, and after a compaction Claude Code keeps 5,000
tokens of each skill. A step whose procedure is needed only on an unusual result should not cost every session its whole
text. This convention says where such a step's text goes, so new steps keep the bodies slim (`reduce-orbit-phase1`,
R-rop-3, R-rop-4, R-rop-8). `test/core/templates/skill-body-budget.test.ts` points here when a body outgrows its budget.

## Rules

- **Basic content in the body, procedure in a reference file.** When an orbit command's result decides whether a step's
  procedure is needed, the body keeps the step's BASIC CONTENT and its procedure moves to a reference file beside the
  skill (`references/<name>.md`). The basic content says when the step runs, the command it runs, the usual result it
  handles itself, and the file to read on any other result or a non-zero exit.
- **Detail acted on once is read at its moment.** A block acted on once, at a moment the body names (the session's first
  emit, the end of apply, the end of a walk), keeps that moment, its command and any chat behaviour in the body, and
  tells the agent to read its reference there, every time; the reference decides what the moment calls for, so the body
  carries no condition of its own (`once-per-session-detail`, D-opsd-4, D-opsd-8). The reference holds the block whole.
- **The handoff names the result already in hand.** A basic content that follows a command's result tells the agent to
  follow the reference "from the result you already have", so the command is not run twice.
- **One home per text, composed once in code.** The step's full text is one exported constant in the workflow templates
  (or `src/core/disciplines.ts` for a step several bodies share); the reference file is a one-line title followed by
  that constant, and a basic content carried by several bodies is one constant too.
- **One level deep.** The body names every reference file its skill ships; a reference does not send the agent on to a
  further file the body does not name.
- **The step keeps its heading.** The body keeps the step's heading and number, so citations of the step stay true.
- **Every body stays the same under every configuration.** The body's text never depends on a setting; a setting
  changes only what a command returns.
- **The budget holds.** Each generated body stays under its character ceiling, and under 500 lines (explore under its
  own line ceiling, which only goes down). Fix a breach by moving a step's procedure as above, never by raising a
  ceiling.

## Examples

The commit step, carried by six bodies. The body keeps:

```markdown
## Commit step (the closing commit — `orbit-conventions`' `The commit step closes each carrying body`)

Runs in the invoking session only, never in a dispatched worker, after the run summary (in archive, after the PR-attached tail) and before the position readout (in archive, the completion readout); in apply, once at the session's close. Skip it with no change target, or when this invocation's PR layer has already stopped. Otherwise run `orbit pr commit "<name>" --json`. On `action: off`, print nothing and go on. On any other result, or a non-zero exit, read `references/commit-step.md` and follow it from the result you already have, before the readout.
```

At the defaults `orbit pr commit` returns `action: off`, so the session never opens the reference. With `commit: true`
the agent reads `references/commit-step.md`, which holds the whole step (`COMMIT_STEP`), and acts on the record it
already has.

The run-summary emit step, carried by eleven bodies with one read cue (`RUN_SUMMARY_READ_CUE`). New's body keeps:

````markdown
## Run-summary emit (one-shot at command completion — via the engine emit surface)

At command completion, write the new run summary. Before the session's first emit, read `references/run-summary-emit.md` and follow it to compose the payload: it holds this step whole, with where its fields are documented. Write the payload to a temp file and invoke:

```bash
orbit emit new --change <name> --payload <payload-file>
```
````

`references/run-summary-emit.md` holds the emit section whole, its
field list and what the engine owns included. A body with chat behaviour beside its emit, as apply's, propose's, ff's and
continue's completion-prompt overrides, keeps it in the body.

The account step, in apply. The body keeps the step's heading and one read, with no condition:

```markdown
At the session's end, BEFORE the run-summary emit (or, when the session writes no run summary, before the completion readout), read `references/account-step.md` and follow it: it says whether this session writes the account, a replacement of it, or none, and how.
```

Address-reviews' step 7 reads `references/account-walk-step.md` after the logs are written, the same way.

## Exceptions

No step is exempt by design. Not yet brought under the convention: bulk-archive (its sign-off hold, PR section and
divergence check, and its per-change archive emit), explore (its emit step among them) and onboard, untouched until `reduce-orbit-phase1`'s evaluation decides what follows. The review skill's external-review prompt references
(`mode-sections.md`, `prompt-template.md`) are named by `references/external-handoff.md` rather than by the body, a
two-level chain that predates this convention; stage `tighten-bodies` brings it to one level (RG2).

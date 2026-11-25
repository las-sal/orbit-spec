/**
 * The PR lifecycle references (D-arc Stage D6; rewritten by rc12-body-adoption, D-rba-4), one
 * source for the three generated files: propose/ff, the archive tail, and the architect readout.
 *
 * Since rc12 the engine COMPUTES every PR step through `orbit pr` and performs none (per
 * `orbit-pr-lifecycle`'s `PR actions are workflow-body choreography (zero engine git)`): each
 * reference names the subcommand to call at each step and the judgment the body still owns. The
 * runbook these references carried before `orbit pr` existed is deleted, not kept as a fallback.
 */

/**
 * A CHECKED MIRROR (R-crc-14's mirror corollary) of the consumption table in
 * `orbit-pr-lifecycle`'s `PR actions are workflow-body choreography (zero engine git)`, carried
 * because an installed skill cannot open the owner. `test/core/pr-consumption-parity.test.ts`
 * holds it byte-equal to the requirement as it stands.
 */
export const PR_CONSUMPTION_TABLE = `| the call returns | the body |
|---|---|
| a non-zero exit (a usage error, the only one) | stops the PR layer and reports the error verbatim; the lifecycle continues unattached |
| \`action: off\` | engages no PR step and writes no note of its own, beyond the unattached line \`preflight\`'s requirement assigns it |
| \`action: skip\` | writes ONE line from \`reason.code\` and \`reason.detail\`, runs nothing, and continues unattached |
| \`action: proceed\`, \`degraded: null\` | runs \`segments\` in order; before each segment it authors that segment's \`inputs\`; it runs each step's \`argv\` exactly, substituting only an element equal to an input token, every element shell-quoted |
| \`action: proceed\`, \`degraded: "pr"\` | the same, plus ONE line for the PR-half degradation from \`reason\` |
| \`select\` returns \`off\` or \`skip\`, exits non-zero, or one of its steps fails | ends the PR layer for this invocation: \`publish\` is never called, and generation proceeds on the current branch, unattached; a failed step is named in ONE line with no recovery shown, since running it would attach nothing |
| a \`publish\`, \`tail\` or \`commit\` step fails | stops at that step and writes ONE line naming the completed, the failed and the skipped steps by their \`step\` names, showing the failed step's argv and then each skipped step's, verbatim with every input filled, as the recovery the user runs in that order, and stating the consequence for its seam: at propose and ff the change proceeds unattached until that recovery lands; at the archive tail the archive itself has landed and never rolls back, and the PR stays as the completed steps left it; at the commit step the session's writes stay uncommitted or unpushed until that recovery lands, and nothing the session wrote is undone; no later PR step runs, and the lifecycle's own steps (the emit among them) still do |
| a segment whose \`inputs\` name \`<emit-path>\` | writes the emit between the segments and passes its path |
| \`publish\`'s first segment ends | composes the emit's \`pr_attachment\` as \`observations.attachment\` plus, when the \`open\` step created a PR, \`url\` from that step's standard output and \`state: "draft"\`, or, on adoption, \`url\` and \`state\` from \`observations.adopted_url\` and \`observations.adopted_state\`; after a PR-half degradation the attachment carries neither, and the second segment does not run; after a failed step the emit is still written, its attachment \`observations.attachment\` alone, and stays local, the second segment's argv joining the failure line's recovery with both its inputs filled: \`<emit-path>\` the emit just written, and \`<message-file>\` a record commit message the body authors before writing the line |
| \`tail\` is called | passes every path the archive flow edited at its at-archive steps as \`--include <path>\`, so those edits land in the tail's commit |
| \`human_acts\` non-empty | shows each act's argv verbatim, labelled as the user's own act; never runs one |
| \`observations\` | reads only what the emit or a note needs; never re-decides a step from it |`;

/**
 * A CHECKED QUOTE of the title clause of `orbit-pr-lifecycle`'s `Agent-written landmark
 * descriptions at seams only`, whitespace-collapsed (the parity test compares it so).
 */
export const PR_TITLE_RULE = `\`<change-name>: <summary>\` for per-change PRs, where \`<summary>\` is ONE line the agent writes from proposal.md's Why (the proposal template carries no title line, so the summary is judgment, written once), and \`<doc stem>: <doc title line>\` for program PRs (every architecture doc opens with a \`# \` line) — and no seam rewrites it`;

/**
 * conditional-steps: propose's and ff's PR Position paragraphs, moved byte-equal into this reference's
 * `## Where each phase runs` section (one text is shipped to both skills); each body keeps a one-line pointer.
 */
export const PROPOSE_PR_POSITION = `**Position (NEW Step 0.5 — this section is placed last for reading, not for running).**
Phase 1 (\`orbit pr select\`, then running its switch) runs AFTER Step 0's mode detection and
BEFORE Step 0a / upstream Step 1: generation must land on the target branch, and \`select\` reads
\`orbit/explore/<name>/\` while it is still in place. Phase 2 (generation +
validation, ON that branch) IS upstream Step 1 onward / the consume-mode flow, run exactly as
without the PR layer. Phase 3 (the no-CI note, then \`orbit pr publish\`: its land-and-open
segment, the emit, then its record segment) runs AFTER Step 0d's move, whose moved material and
staging-directory deletions \`publish\` enumerates.`;

export const FF_PR_POSITION = `**Position (this section is placed last for reading, not for running).** Phase 1
(\`orbit pr select\`, then running its switch) runs BEFORE Step 2 (\`orbit new change\`): that
step writes \`orbit/changes/<name>/.openspec.yaml\`, a path a compatible branch already TRACKS,
so a switch attempted after it is exactly the \`git switch\` refusal the ordering exists to
prevent. Phase 2 (generation + validation, ON that branch) IS Steps 2–4; phase 3 (the no-CI
note, then \`orbit pr publish\`: its land-and-open segment, the emit, then its record segment)
runs after Step 5's final status.`;

/** The line that opens \`## Where each phase runs\`: the reference is one text shipped to two workflows. */
export const WHERE_EACH_PHASE_RUNS_SELECTION = 'Follow only the subsection of the workflow you are running.';

/** The reference emitted into the propose and ff skills. */
export const PR_CHOREOGRAPHY_REFERENCE = `# Reference: the PR lifecycle at propose and ff

## Contents

- Where each phase runs
  - In /orbit:propose
  - In /orbit:ff
- Phase 1 — select, before any artifact is written
- Phase 2 — generate and validate, on that branch
- Phase 3 — publish, only after phase 2 succeeds
- Acting on the record

Loaded ONLY when the engine-resolved regime (\`orbit status --json\`, field \`pr\`) is
\`per-proposal\` or \`per-architecture\`. Under \`never\` (also what an absent key and every inert
value resolve to) do not load this file and probe nothing.

The engine computes every PR step and performs none: \`orbit pr\` observes through read-only
\`git\` and \`gh\` and PRINTS each write as an argv. You call it at each phase, act on its record by
the table below, and author only the judgment: the title, the intent body, the commit messages
and the wording of each one-line note. Never re-derive a step the record decided. There is no
hand-run fallback; a body carrying both would run both.

## Where each phase runs

${WHERE_EACH_PHASE_RUNS_SELECTION}

### In /orbit:propose

${PROPOSE_PR_POSITION}

### In /orbit:ff

${FF_PR_POSITION}

## Phase 1 — select, before any artifact is written

\`\`\`bash
orbit pr select <name> --json
\`\`\`

On \`proceed\`, run its one segment: the switch, plus a fast-forward when one is printed. \`off\`,
\`skip\`, a non-zero exit, or a failed step ENDS the PR layer for this invocation: \`publish\` is
never called, generation proceeds on the current branch, and the emit carries no
\`pr_attachment\`. Name \`observations.untracked\` in one line when it is non-empty; on the program
path, note a non-zero \`observations.ahead_by\` (the PR's diff carries that gap until the user
integrates; never merge or rebase it).

## Phase 2 — generate and validate, on that branch

Exactly as without the PR layer. A failure commits, pushes and opens nothing; the note names the
branch phase 1 switched to, and \`git switch <default-branch>\` as the recovery.

## Phase 3 — publish, only after phase 2 succeeds

\`\`\`bash
orbit pr publish <name> --json
\`\`\`

Before segment 1, author the inputs it names: normally \`<message-file>\` (the commit message),
\`<title>\`, and \`<body-file>\` (an adopted program PR names no title or body, and an empty
scope no message file), the INTENT body adapted from proposal.md's Why and What (a program PR: program
intent from the doc's opening prose plus its stage list). The title, quoted from
\`orbit-pr-lifecycle\`'s \`Agent-written landmark descriptions at seams only\`: ${PR_TITLE_RULE}.
When \`observations.ci\` is \`absent\`, note in one line that no CI is configured.

Run segment 1, then write the propose (or ff) emit with \`pr_attachment\` composed per the table's
row for \`publish\`'s first segment, and pass the emit's path as \`<emit-path>\` to segment 2, which
lands the record on the branch. When \`publish\` printed one segment (a PR-half degradation), there
is no segment 2: the emit stays local.

**Worked example.** Segment 1's \`open\` step prints
\`["gh", "pr", "create", "--repo", "acme/widget", "--draft", "--base", "main", "--head",
"add-thing", "--title", "<title>", "--body-file", "<body-file>"]\`. With the title
\`add-thing: Skip the "dirty tree" check\` and the body written to \`/tmp/pr-body.md\`, run:

\`\`\`bash
gh pr create --repo acme/widget --draft --base main --head add-thing --title 'add-thing: Skip the "dirty tree" check' --body-file /tmp/pr-body.md
\`\`\`

The title reaches \`gh\` as ONE argument. A title containing \`'\` closes the quote: write it as
\`'\\''\`.

**No consent prompt.** Propose and ff fire none: the steps ride the user's own invocation, and
the outward write is a DRAFT PR on the change's branch.

## Acting on the record

A CHECKED COPY of \`orbit-pr-lifecycle\`'s consumption table (\`PR actions are workflow-body
choreography (zero engine git)\`), carried because an installed skill cannot open the owner; a
parity test holds it byte-equal. Every shape an \`orbit pr\` call returns has a row:

${PR_CONSUMPTION_TABLE}
`;

/** The reference emitted into the archive skill. */
export const PR_ARCHIVE_TAIL_REFERENCE = `# Reference: the PR-attached archive

## Contents

- Entry observation, before any write
- Preflight, before the move
- Tail, after the move and the emit
- At the close
- Acting on the record

Read at the archive's Step 0.7 when the change's trail carries a \`pr_attachment\`, and at Step 4.9 when
\`orbit pr preflight\` returns anything but \`off\`. The ATTACHMENT recorded at propose
or ff is the only gate: the live \`pr:\` value is not consulted, so \`pr: never\` stops new
attachments and never abandons an open PR. \`orbit pr\` observes through read-only \`git\` and \`gh\`
and PRINTS each write; you act on its record by the table below and author only the judgment.
Never re-derive a step the record decided.

## Entry observation, before any write

Before ANY archive write — before upstream Step 1, before sync (Step 4) and the move (Step 5)
— resolve whether this change is PR-ATTACHED: read \`pr_attachment\` from the LATEST
attachment-bearing PROPOSE or FF emit on the change's trail (the same read the consent
preview in Step 0 uses on the AI-mediated path; Step 4.9's \`orbit pr preflight\` reads the same record). This
step mutates nothing and runs on EVERY provenance path, user-typed included. When attached,
compare HEAD's branch (\`git branch --show-current\`) with \`pr_attachment.branch\`. On mismatch,
SAY SO NOW — in the consent preview when one fires, otherwise as one line before Step 1 (on a
granted arrival that line is the only notice and nobody is asked: the archive proceeds and the tail
skips, a named limit) — naming both branches and the case-specific switch (\`git switch <branch>\` locally; the
tracking form when only the remote has it). The tail's HEAD precondition (Tail, after the move and the emit, below)
remains the GUARD that skips the PR half; this observation is the early warning that lets the
user switch first instead of carrying uncommitted sync, move, and emit writes across a
\`git switch\` afterward. Unattached changes see nothing here.

## Preflight, before the move

\`\`\`bash
orbit pr preflight <name> --json
\`\`\`

It runs while the change is still active (after the move it is a usage error). Its ONE
observation is carried forward to both the emit and the tail, so they cannot disagree:

- \`observations.emit\` supplies the archive emit's \`pr_url\` and \`pr_state\`, copied as given; an
  absent key stays absent.
- \`observations.outcome\` is the tail's \`--outcome\`, passed verbatim.
- \`observations.citation.diverged\` true: one note that the frozen attachment governs, naming
  what \`observations.citation.would_select\` selects now (when the \`pr\` regime reads \`never\`,
  that no PR would be selected now).
- \`degraded: "pr"\`: one note naming the outcome and \`reason.detail\`: \`observed\` is what the PR
  now shows and \`expected\` what it should (for example \`retargeted to\` its \`observed\` base,
  away from the \`expected\` default). The tail's commit and push still run; its PR steps do not.
- \`skip\`: one note from \`reason\`; the emit carries no PR field.

## Tail, after the move and the emit

\`\`\`bash
orbit pr tail <name> --outcome <outcome> --include <path> --json
\`\`\`

Pass \`--include\` once for every path the archive edited at its at-archive steps (a status log,
an arc doc's stage entry, CLAUDE.md), so those edits land in the tail's commit. Before its
segment, author \`<message-file>\` and, when a \`rewrite\` or \`append\` step is printed,
\`<body-file>\`:

- \`rewrite\` (a per-change PR): the ACHIEVEMENT body, replacing the intent: the outcomes, the
  review-cycle story, the decisions ratified along the way.
- \`append\` (a program PR): \`observations.current_body\` with this stage's entry appended, never
  the entry alone. The entry comes from the arc status-log entry written at this archive, else
  from the emit's \`final_assessment\` plus the change name and date; name the source in one line.

A \`skip\` with \`reason.code\` \`head-mismatch\` names both branches and shows
\`reason.detail.recovery\`'s argv; when its \`case\` is \`absent\` (no argv), say plainly that no
switch recovers the branch, naming \`observations.attachment\` as the record of what was expected.
A per-change tail whose \`observations.pr_state\` is \`ready\` prints no \`ready\` step: report in
one line that the PR was already READY and was not re-flipped. Name \`observations.unrelated_staged\`
and \`observations.unrelated_unstaged\` in one line when either is non-empty: those paths stay as
they were, staged or unstaged, and outside the commit. Name \`observations.carried_untracked\` in one
line when it is non-empty: files the move carried along that git never tracked in the change
directory, staged with the archived tree as the change's own material.

## At the close

Show every \`human_acts\` argv verbatim, labelled as the user's own act: the merge, then the return
to the default branch after it. Run none of them. A program PR's tail prints none; its flip and
merge belong to arc-done.

After a program-PR append: the program PR is named and the flip
stays at arc-done. After a tail whose PR half was SKIPPED on positive invalidation (the commit
and push landed; the rewrite/append and flip did not): name the specific reason and that any
action on that pull request is the user's.

## Acting on the record

A CHECKED COPY of \`orbit-pr-lifecycle\`'s consumption table (\`PR actions are workflow-body
choreography (zero engine git)\`), carried because an installed skill cannot open the owner; a
parity test holds it byte-equal. Every shape an \`orbit pr\` call returns has a row:

${PR_CONSUMPTION_TABLE}
`;

/**
 * conditional-steps: the architect body's Step 5.5 arc-done act, moved here byte-equal; the body keeps the arc-done
 * check and a one-line pointer to this reference.
 */
export const ARC_DONE_ACT = `When arc-done, run \`orbit pr program <doc> --json\` and surface the program PR and its human
acts per \`references/pr-resolution.md\` — recommend, NEVER invoke; this body makes no outward
write. The engine locates the PR (the latest URL-bearing record, else the constrained query),
validates it LIVE and falls through on a positive invalidation; the readout is NEVER SUPPRESSED
by any outcome, since a silent readout is indistinguishable from an unfinished program. The
acts (\`human_acts\`: ready, then merge) are the user's; orbit flips nothing here and merges
nothing anywhere. The readout repeats on every later invocation until the PR is no longer
draft. A whole-program body rewrite is OPTIONAL polish available on request, never a required
transition step.`;

/** The reference emitted into the architect skill (the arc-done readout). */
export const PR_RESOLUTION_REFERENCE = `# Reference: the program PR at arc-done

${ARC_DONE_ACT}

\`\`\`bash
orbit pr program <doc> --json
\`\`\`

\`orbit pr program\` locates the program PR, validates it live and falls through to the
constrained query on its own; it observes and never writes. A non-zero exit is a usage error:
report it verbatim. \`off\` means no program-PR attachment names this doc: say nothing. Otherwise
(it never skips) surface:

- \`observations.pr\`: its \`url\` and \`state\`. A \`state\` of \`unverified\` means the observation
  failed: say so in one line and claim nothing more.
- \`observations.invalidated\`: when set, the recorded PR was closed, merged or retargeted, and
  \`observations.pr\` is the open replacement the query found, or null when none exists.
- \`observations.candidates\`: when there are several, name every one.
- \`human_acts\`: show each argv verbatim as the user's act (ready, then merge). Run none of them.

When \`observations.pr\` is null the readout still speaks, from \`observations.outcome\`, and
never confuses not knowing with knowing there is none:

- \`unobserved\` or \`gh-absent\`: the program PR could not be observed; name the cause from
  \`observations.resolution_failure\` or \`observations.query_error\` when present.
- \`none\`: the query ran and found no open program PR.
- a positive-invalidation reason or \`not-found\`: the recorded PR is in that state and no open
  replacement exists.
- \`several\`: the candidates above, with no acts.

The readout repeats on every arc-done invocation until the PR is no longer draft.
`;

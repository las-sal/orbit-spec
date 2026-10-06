## ADDED Requirements

### Requirement: A recorded runner launches the external review

The external branch SHALL launch the user's recorded runner — read through `orbit external runner --json`
(`orbit-external-runner`) — when one resolves and is reachable, and SHALL otherwise print the prompt for paste exactly
as before. It SHALL NOT ingest findings: the saved return is walked by `/orbit:address-reviews`, invoked separately.
The launch runs in the background, in a throwaway `git worktree` added at the handoff commit (per `Handoff preflight
blocks unusable pull invocations`) OUTSIDE the repository directory, with the prompt file on the runner's standard
input unchanged and `{output}` a path outside the repository; the body waits on the run's completion notification,
because an external review outlasts the foreground limit. The return is saved through `orbit external save`, passed
the launch's T0 token as `--launch`.

The record is never parsed by a shell, and the launch keeps it so: `{worktree}` and `{output}` are substituted into
the resolved argv FIRST; the process runs with the worktree as its working directory (so an own argv that names no
`{worktree}` still reads the fixed reviewed state); every element is passed as exactly one argument — on a shell
command line, each element single-quoted with an embedded `'` written `'\''`; and the prompt file arrives by a `<`
redirect. A recorded string is never handed to `sh -c`. On a launched run the prompt's `## Repo` line names the
runner's working directory — a checkout of the handoff commit — never the live checkout's path.

| member | covered by |
|---|---|
| recorded, `argv[0]` resolves on `PATH` | launched in the background in a worktree at the handoff commit; prompt on stdin; return written to `{output}` outside the repository |
| recorded, `argv[0]` does not resolve | the prompt is printed for paste, with the one extra item naming the unresolved command (per `Prompt written to versioned file with chat invocation snippet`) |
| nothing recorded | today's handoff, unchanged |
| launched, exits non-zero or is stopped (including a runner that is not signed in) | no pass file; the failure is reported with its exit status and the paste fallback is printed — the pull invocation when the handoff push landed, the handoff-blocked output when it did not; the T0 stands, so the gate keeps presenting the external half |
| the return opens with lines above `# External Review:` | removed by `orbit external save`, which reports them; the body quotes them in the commit message |
| the return carries no unfenced `# External Review:` heading, names another change, or is rejected by the trail reader | refused by `orbit external save`; treated as a failed run; the raw return stays outside the repository and its path is named |
| an apply landed after the launch | refused by `orbit external save` (`--launch`); treated as a failed run — the return reviewed a superseded state — and the review is re-run |

The failure rows are those observed on one runner (Codex, on rc08b's and rc17a's pairs) plus the absent and
unresolved cases (D-rc17d-1). **Named limit.** Residual kind: a return that opens with the heading and parses yet is not a complete review (a truncated run)
Residual method: running the three external readers over the return and reading its `**Reviewer**:` line at each runner's first recorded use

**Named limit (a writable own runner).** The prompt tells a reviewer that can write files to write, commit and push
its findings. A read-only runner cannot; an own argv that can may write, and commit from a detached head, inside the
worktree. orbit cannot stop it: the worktree is removed with `--force` after the return is read, and the return saved
through `orbit external save` is the only record. A runner whose own commit reaches a remote branch is outside this
requirement.

**Named limit (D-rc17d-7).** The T0 record's `next_recommended` stays the paste/save prose
`orbit-run-summary-emit`'s `Review-external T0 multi-step recommendation` requires: it states the manual fallback
even when a runner launched, and the launch is reported in chat. The T0's `target` field names the runner (the
preset's name, or the basename of `argv[0]`) when one launched.

#### Scenario: A recorded runner launches with no paste

- **WHEN** `/orbit:review <change> --as system --reviewer external` runs with a reachable runner recorded and a clean tree
- **THEN** the runner is launched in a worktree at the handoff commit with the prompt on stdin, no pull invocation is printed, and the saved return is committed without hand edits

#### Scenario: No recorded runner is today's handoff

- **WHEN** the same invocation runs with no `externalRunner` record
- **THEN** the chat output and the files written are those of the handoff before this requirement, byte for byte (the unresolved-runner case adds one item and is not covered by this scenario)

#### Scenario: A failed run falls back to paste

- **WHEN** the launched runner exits non-zero
- **THEN** nothing is committed for the return, the failure is reported with its exit status and the raw return's path, and the paste fallback is printed — the pull invocation when the handoff push landed, the handoff-blocked output (per `Handoff preflight blocks unusable pull invocations`) when it did not

### Requirement: A launched return is committed alone and pushed

When a launched runner returns, the body SHALL save the return through `orbit external save`, commit the saved file
ALONE — `git add` of that one path, then `git commit --only` on it, so work the user staged during the run stays
out — with the removed preamble lines quoted in the commit message, push, and remove the worktree with `--force`. The
handoff commit is made the same way, on the prompt file and the T0 emit.

| member | covered by |
|---|---|
| the prompt file and T0 emit | the handoff commit, pushed before launch (per `Handoff preflight blocks unusable pull invocations`); the worktree's base |
| the saved return | `external-<mode>-<TS>.md`, committed alone, the removed lines quoted in the message, then pushed |
| a failed run | nothing committed; the T0 stands |
| a failed push | reported; the commit stands; no retry |
| the worktree | removed with `--force` after the return is read; a failed removal is reported, never fatal |

Closure: the path writes the packaging pair and at most one pass file; each is a row, plus the push and the worktree
(D-rc17d-6). Committing the return alone keeps the VERIFICATION confirm's residual-check base exact.

#### Scenario: The return is its own commit

- **WHEN** a launched runner returns a well-formed review
- **THEN** exactly one new commit adds the saved `external-<mode>-<TS>.md` and nothing else, and it is pushed

## MODIFIED Requirements

### Requirement: Review-external command available

The system SHALL provide the external-review packaging capability — preparing a review request for an external AI (codex, fresh Claude, GPT, etc.) to perform a second-opinion review — invoked as `/orbit:review --as <mode> --reviewer external <change-name>` (D-arc Stage D5: the reviewer-class axis on the review command; the standalone `/orbit:review-external` launcher and skill are RETIRED from the generated surface, 16 → 15). The packaging behavior itself is UNCHANGED by the merge, and the RECORD VOCABULARY IS FROZEN: the T0 packaging emit keeps `command: "review-external"` and its `review-external-<TS>.json` filename, prompt files keep `external-prompt-<as>-<TS>.md`, and findings files keep `external-<as>-<TS>.md` — the gate reader's cadence slots, the orientation surface's WAITING arithmetic, the report ordinal's shared pass axis, and the address-reviews parser all key on those names and are untouched. Archived trails and historical emits citing the retired invocation form are records, never rewritten.

#### Scenario: Invoke with change name and mode

- **WHEN** the user invokes `/orbit:review <change-name> --as proposal --reviewer external` (or `--as system`)
- **THEN** the command writes a self-contained markdown prompt to `orbit/changes/<change-name>/.orbit-runs/external-prompt-<as>-<TS>.md` and emits a short invocation snippet to chat — with no runner launched, the file path + paste-ready instruction for the external AI + the eventual findings path; with a recorded runner launched, the launch output instead (per `Prompt written to versioned file with chat invocation snippet`); the file is intended to be committed

#### Scenario: Invoke without change name

- **WHEN** the user invokes `/orbit:review --reviewer external` with no positional
- **THEN** the command runs `orbit list --json` and prompts via `AskUserQuestion` to pick a change

#### Scenario: Record vocabulary frozen across the merge

- **WHEN** the external-handoff branch packages a prompt and emits T0
- **THEN** the emit carries `command: "review-external"` in a `review-external-<TS>.json` file — byte-compatible with pre-merge records — and every downstream consumer (gates, orientation, report ordinal, ingest parser) behaves identically to pre-merge behavior

### Requirement: Recommended-session note in chat output

The system SHALL emit a recommendation about which external-AI session the user should paste the invocation into, based on iteration number and prior reviewer history, whenever the prompt is printed for paste. When a recorded runner is launched (per `A recorded runner launches the external review`) there is no session to choose: the runner line takes the note's place, and no recommendation is emitted.

#### Scenario: Recommendation appears in chat

- **WHEN** the chat invocation snippet is emitted for paste
- **THEN** it includes a single short line labeled `Recommended session:` (or equivalent) before the prompt file path, summarizing which fresh session to use — any AI at iteration 1, a different AI at iteration 2, a previously-unused AI from iteration 3 (a continued same-AI session is never recommended: an external pass is REVIEW pass genre, and a continued session carries its prior findings in its own head — `orbit-conventions`' `Review mode decision framework` owns that rule)

#### Scenario: Recommendation logic by iteration

- **WHEN** the command computes the recommendation
- **THEN** it uses this logic:
  - **Iteration 1**: `Fresh session recommended — first external pass; sets independent baseline. Pick any AI (codex / fresh Claude / GPT / etc.).`
  - **Iteration 2**: `Fresh session in a DIFFERENT AI than iter 1's reviewer recommended (model diversity catches different blind spots). If iter 1 was <prior reviewer>, try <suggest different model>.`
  - **Iteration 3+**: `Fresh session in a previously-unused AI recommended (maximum independence); when every available AI has reviewed this change in this mode, a fresh session of the least-recently-used.`
  - Least-recently-used is decided by ONE ordering input: each reviewer's latest `external-<as>-*.md` token in this mode; the reviewer whose latest token is oldest is least-recently-used
  - Prior-reviewer identity is read from the `**Reviewer**:` field of existing `external-<as>-*.md` files in `.orbit-runs/`

#### Scenario: No prior data → iter 1 recommendation

- **WHEN** `.orbit-runs/` contains no prior `external-<as>-*.md` files for the current mode
- **THEN** the iter 1 recommendation is emitted regardless of how many runs exist for other modes

### Requirement: Prompt written to versioned file with chat invocation snippet

The system SHALL write the full handoff prompt to a versioned, committed file in the change's `.orbit-runs/` directory and emit a short invocation snippet to chat that points the user at the file and tells them what to do after.

#### Scenario: Prompt file path

- **WHEN** the command runs
- **THEN** the full prompt is written to `orbit/changes/<change-name>/.orbit-runs/external-prompt-<as>-<TS>.md` where `<TS>` is an ISO timestamp; the file is intended to be committed (not gitignored)

#### Scenario: Prompt file contents

- **WHEN** the file is written
- **THEN** it contains the full self-contained prompt: role description, repo URL or path, project context file pointers (`CLAUDE.md`, `orbit/project.md`, `*_convention.md`, `orbit/lenses/`) — and NO pointer at `.orbit-runs/` for the reviewer to READ (the output path and the commit line it is told to write are destinations, not reads) —, cycle context (the iteration number ONLY; per `Cycle context populated from prior runs`, which points at `orbit-conventions`' review-genre brief rule), mode-specific "what to read" and "what to look for" sections, the one-paragraph severity ladder (per `Output format specification in prompt`), output format specification — whose block carries the REQUIRED `## Direction` section between `## Blocks` and `## Notes` (per the same requirement)

#### Scenario: Chat invocation snippet

- **WHEN** the file is written and no runner is launched (none recorded, or a recorded runner with `reachable: false` — per `A recorded runner launches the external review`)
- **THEN** the chat output contains the following items, in this order:
  - **(optional)** Mode-inference note when `--as` was omitted (per the State-based inference scenario): `Generating external-review prompt as \`<as>\` (inferred from tasks state).`
  - **(required)** Recommended-session note (per the Recommended-session requirement): a single line summarizing which AI session the user should paste into.
  - **(required)** The prompt file path.
  - **(conditional — handoff preflight gate, per the Handoff-preflight requirement)** ONE of: the affirmative committed-and-pushed attestation (`Prompt committed (<short-sha>) and pushed to <remote>/<branch>`, or the local-path equivalent) immediately followed by the copy-paste-ready pull invocation (`Pull <repo URL> and read <prompt-file-path>. Follow its instructions; write findings to the path specified inside.`) when the preflight is satisfied, OR the handoff-blocked output (commit+push action leading; pull text framed as the after-push step) when it is not.
  - **(required)** The eventual findings path the user will pass to `/orbit:address-reviews --from-file` once findings come back.
  - **(conditional — a recorded runner that does not resolve)** `Recorded runner <argv[0]> not found on PATH — printing the prompt for paste.`, after the findings path.

  No other items are emitted; required items are always present in the specified order. With nothing recorded the output is the handoff's before the runner existed, byte for byte.

#### Scenario: Chat output when a runner launches

- **WHEN** the file is written and a recorded, reachable runner is launched (per `A recorded runner launches the external review`)
- **THEN** the chat output contains, in this order: the optional mode-inference note; the runner line `Launching <name> — your recorded external runner; no paste needed` in place of the recommended-session note; the prompt file path; the launch attestation `Prompt committed (<short-sha>); launched <name> at that commit`, followed by `pushed to <remote>/<branch>` only when the push landed (else the push failure, or the local-path note); the raw output path, with the manual recovery `orbit external save <change> --as <mode> --from <output path>` should the session end before the run does; and the findings path as `external-<mode>-<TS>.md`, its token set when the return is saved. When the run ends, the output adds the saved path, `Findings committed (<short-sha>)` followed by `and pushed` only when that push landed, and the count of removed preamble lines, then the return's rendered report; a failed run adds instead the failure (exit status, and the raw return's path when one exists) followed by the paste fallback per `A recorded runner launches the external review`


#### Scenario: Mode-specific sections

- **WHEN** the prompt file is written in `--as proposal` mode
- **THEN** the "what to look for" section enumerates the 9 proposal-mode passes; in `--as system` mode it enumerates the 7 system-mode passes

#### Scenario: Reference prompt template

- **WHEN** an implementer generates the handoff prompt
- **THEN** it follows the reference template structure below (the implementer may adjust phrasing for clarity but MUST preserve the named sections and the output-format block verbatim so external-review parsers ingest cleanly):

````markdown
# External Review: <change-name> (iteration <N>)

You are reviewing an OpenSpec change as a second pair of eyes. Your value is
your independent take — be thorough; flag anything that looks wrong,
inconsistent, or unclear. Don't be charitable to the authoring AI's reasoning.

## Repo

<repo URL or path>

## Project context (read first)

- `CLAUDE.md` — handoff orientation (if present)
- `orbit/project.md` — project goals + stack (if present)
- `*_convention.md` at repo root — naming, error handling, etc. (if present)
- `orbit/lenses/perspectives.md` — named callers worth validating from (if present)
- `orbit/lenses/critical-paths.md` — user flows worth walking end-to-end (if present)

## Cycle context

- Iteration: <N>

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

## What to read for THIS review (<as proposal | system>)

<mode-specific file list>

## What to look for

<mode-specific pass list — 9 passes for proposal mode, 7 for system mode>

## Severity

Grade by `orbit-conventions`' Severity ladder. CRITICAL: a user path breaks or data is lost, AND the finding carries its reproduction — a case the reader can re-execute: the inputs, the rule or command, the expected result, the observed result (a command in system mode; a constructed case in proposal mode). WARNING: an implementation built to the artifact as written could diverge from what it intends. SUGGESTION: everything else. When unsure, grade lower. A condition that must stop apply regardless of consequence — an `orbit validate` failure, an unresolved `@review:` marker — is a BLOCK, not a severity: list it under `## Blocks`.

## Output format — write to:

`orbit/changes/<change-name>/.orbit-runs/external-<as>-<TS>.md`

(Where <TS> is today's timestamp in ISO format. Pick a fresh timestamp so
this file doesn't overwrite prior reviews.)

Use this exact markdown structure:

```markdown
# External Review: <change-name> (iteration <N>)

**Reviewer**: <your model name>
**Date**: <YYYY-MM-DD>

## CRITICAL

### <Finding title>
**File**: <path>:<line>
**Description**: <what's wrong + specific recommendation>
**Reproduction**: <the re-executable case the `## Severity` paragraph above defines>

(For each additional CRITICAL finding, repeat the `### <Title>` + `**File**:` + `**Description**:` + `**Reproduction**:` quadruple — a CRITICAL without a Reproduction is counted and marked unreproduced. Use `None.` as a single-word body if there are no findings at this severity.)

## WARNING

### <Finding title>
**File**: <path>:<line>
**Description**: <what's wrong + specific recommendation>

(Same shape as CRITICAL. Use `None.` if no findings.)

## SUGGESTION

### <Finding title>
**File**: <path>:<line>
**Description**: <what's wrong + specific recommendation>

(Same shape. Use `None.` if no findings.)

## Blocks

<Optional — conditions that must be addressed before apply but name no consequence (an `orbit validate` failure, an unresolved `@review:` marker): one `- <what>` line each. Not severities; never counted. Use `None.` if none.>

## Direction

**Disposition**: <forward | hold>

<REQUIRED — your own recommendation on moving forward, as `orbit-conventions`' External-review findings markdown format defines the section: the first non-blank line is the `**Disposition**:` opener with exactly one of the two tokens; the rest of this section is your reasoning — WHICH WAY and WHY. Never state finding counts, the gate's state, or a next command here; those exist only in the report's engine-computed sections. A return without this section is still a pass, but the report renders it `[no direction]`; a section whose first non-blank line is not exactly the opener (or that has no reasoning under it) renders `[direction malformed]` with no body.>

## Notes

<Optional — rendered VERBATIM into the report's delimited Commentary slot: carry the pattern behind the findings, what you probed, and risk texture; do NOT state finding counts, gate verdicts, or next commands — those exist only in the report's engine-computed sections. Omit the whole `## Notes` section if you have nothing to add.>
```

If your environment doesn't support file writes (chat-only interface), output
the markdown directly and the user will save it.

## After completing the review

1. **Output the full findings markdown in chat** — in addition to writing the
   findings file, output the COMPLETE findings markdown in this chat. Same
   content as the file: every severity section (`## CRITICAL` / `## WARNING`
   / `## SUGGESTION`), every `### Title` entry, every `**File**:`, `**Description**:` and
   `**Reproduction**:` field, every `## Blocks` item, and the `## Direction` section (its `**Disposition**:` opener and body). Do NOT abbreviate or summarize — the chat output
   is the immediately-visible read for the user (they should be able to
   evaluate every finding without opening the file). The file remains the
   canonical record for `--from-file` parsing.

2. **Commit and push the findings file** (if your environment supports git):

   ```bash
   git add orbit/changes/<change-name>/.orbit-runs/external-<as>-<TS>.md
   git commit -m "External review (<as>, iter <N>): <change-name>

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   Then STATE PLAINLY in your chat output that the findings landed —
   `Findings committed (<short-sha>) and pushed` — so the human never has to
   infer whether they reached the repo.

If you don't have git access, just output the findings markdown in this chat
(per the chat-only fallback above), state that you could NOT commit/push, and
the user will commit it manually.
````

#### Scenario: Output-format block must be verbatim

- **WHEN** the prompt is generated
- **THEN** the "Output format" block (the inner markdown showing the expected findings structure) is included verbatim, including section headers `## CRITICAL` / `## WARNING` / `## SUGGESTION` / `## Blocks` / `## Direction` and the `**File**:` / `**Description**:` / `**Reproduction**:` / `**Disposition**:` field labels; deviations would break `--from-file` parsing

#### Scenario: Commit / push instructions in prompt

- **WHEN** the prompt is generated
- **THEN** it includes an "After completing the review" section instructing the external AI to commit and push the findings file if it has git access (with a `git add` / `git commit` / `git push` block showing the path and a one-line summary commit message), AND to STATE PLAINLY in its chat output that the findings file was committed and pushed — `Findings committed (<short-sha>) and pushed` — or to state explicitly that it could not (chat-only fallback: output the markdown for the user to commit manually). The human never has to infer whether the findings landed in the repo

#### Scenario: Commit message format in prompt

- **WHEN** the prompt's commit instructions are generated
- **THEN** the suggested commit message line follows the form `External review (<as>, iter <N>): <change-name>` followed by a blank line and a one-line summary of the findings (severity counts + headline finding if any); this format makes the iteration / mode visible in `git log` and pairs with the file's own iteration counter

#### Scenario: Full findings output to chat in prompt

- **WHEN** the prompt is generated
- **THEN** the "After completing the review" section instructs the external AI to output the FULL findings markdown in chat (every finding's severity section + `### Title` + `**File**:` + `**Description**:` + `**Reproduction**:` where present, every `## Blocks` item, the `## Direction` section with its opener and body, identical content to the findings file — no abbreviation, no summarization) in addition to writing the findings file; the chat output is the immediately-visible read for the user, the file is the canonical record for parsing by `--from-file`

### Requirement: Handoff preflight blocks unusable pull invocations

The system SHALL verify the handoff state before emitting a pull-based invocation: the working tree is clean (`git status --porcelain` empty) AND no local commits are unpushed (`git rev-list @{u}..HEAD --count` is zero, when an upstream exists). When either check fails, the pull invocation is withheld; the chat output instead leads with the required commit-and-push action (naming the just-written prompt file among the pending work) and frames the pull text as the after-push step. A repo with no remote satisfies the preflight via the local-path handoff route.

When a recorded runner resolves and is reachable, the same two facts decide the LAUNCH. A dirty working tree,
read BEFORE the prompt file is written, means the reviewed state is not committed: the runner is NOT launched, NOTHING
is written — no prompt file, no T0 — and the chat output names the dirty-tree cause and says to commit the pending work
and re-run the review, which then launches. A clean tree is satisfied by the launch itself: the body commits the prompt file and the T0 emit — and
nothing else — as the HANDOFF COMMIT, then pushes; unpushed commits already on the branch go with that push. A
failed push is reported and the launch proceeds from the local commit, because the runner reads a worktree and needs
no remote; a repository with no remote launches the same way.

#### Scenario: Dirty working tree blocks the pull invocation

- **WHEN** the command runs and `git status --porcelain` reports uncommitted changes
- **THEN** the chat output does NOT present the pull invocation as immediately usable; it emits a handoff-blocked output naming the dirty-tree cause, instructs the user to commit (including the prompt file) and push, and frames the pull invocation as the step after pushing

#### Scenario: Unpushed commits block the pull invocation

- **WHEN** the working tree is clean but `git rev-list @{u}..HEAD --count` reports N > 0 unpushed commits
- **THEN** the chat output emits the handoff-blocked output naming the N-unpushed-commits cause, with the same commit/push-then-pull framing

#### Scenario: Clean and pushed emits the pull invocation with an affirmative attestation

- **WHEN** the working tree is clean and no unpushed commits exist (or the repo has no remote and the local-path route is used)
- **THEN** the chat output AFFIRMATIVELY STATES the prompt's handoff state with evidence — `Prompt committed (<short-sha>) and pushed to <remote>/<branch>` (or the local-path equivalent naming the path) — and presents the invocation as immediately usable alongside that attestation; the committed-and-pushed state is never implied by the mere absence of a warning

#### Scenario: A clean tree with a runner commits, pushes and launches

- **WHEN** a reachable runner is recorded and `git status --porcelain` is empty before the prompt is written
- **THEN** the body commits only the prompt file and the T0 emit, pushes, and launches the runner at that commit; no pull invocation is printed

#### Scenario: A dirty tree with a runner does not launch

- **WHEN** a reachable runner is recorded and `git status --porcelain` reports uncommitted changes before the prompt is written
- **THEN** the runner is not launched and no prompt file or T0 is written; the chat output names the dirty-tree cause and says the runner launches once the pending work is committed and the review is re-run

## REMOVED Requirements

### Requirement: Command does not run the review or ingest findings
**Reason**: A recorded runner now runs the external review (rc17d-external-runner, D-rc17d-1); the half of the rule
that still holds — findings are never ingested by this branch — moves into `A recorded runner launches the external
review`.
**Migration**: With no `externalRunner` record the branch behaves exactly as before. Ingestion stays
`/orbit:address-reviews`.

# orbit-review-external Specification

## Purpose

The external-review packaging capability — the EXTERNAL-HANDOFF BRANCH of `/orbit:review --as <mode> --reviewer external` (the standalone `/orbit:review-external` command is RETIRED as of D-arc Stage D5; the record vocabulary stays frozen). Packages a review request for an external AI (codex, fresh Claude, GPT, etc.) to perform a second-opinion review: writes a self-contained markdown prompt to `.orbit-runs/external-prompt-<as>-<TS>.md`, emits the T0 packaging record, and prints a short chat invocation snippet gated by the committed-and-pushed handoff preflight. Does NOT run the review or ingest findings; ingestion is `/orbit:address-reviews --from-file`. Includes mode inference, iteration counting per mode, cycle-context population from prior runs, and a recommended-session note tailored to iteration history.
## Requirements
### Requirement: Review-external command available

The system SHALL provide the external-review packaging capability — preparing a review request for an external AI (codex, fresh Claude, GPT, etc.) to perform a second-opinion review — invoked as `/orbit:review --as <mode> --reviewer external <change-name>` (D-arc Stage D5: the reviewer-class axis on the review command; the standalone `/orbit:review-external` launcher and skill are RETIRED from the generated surface, 16 → 15). The packaging behavior itself is UNCHANGED by the merge, and the RECORD VOCABULARY IS FROZEN: the T0 packaging emit keeps `command: "review-external"` and its `review-external-<TS>.json` filename, prompt files keep `external-prompt-<as>-<TS>.md`, and findings files keep `external-<as>-<TS>.md` — the gate reader's cadence slots, the orientation surface's WAITING arithmetic, the report ordinal's shared pass axis, and the address-reviews parser all key on those names and are untouched. Archived trails and historical emits citing the retired invocation form are records, never rewritten.

#### Scenario: Invoke with change name and mode

- **WHEN** the user invokes `/orbit:review <change-name> --as proposal --reviewer external` (or `--as system`)
- **THEN** the command writes a self-contained markdown prompt to `orbit/changes/<change-name>/.orbit-runs/external-prompt-<as>-<TS>.md` and emits a short invocation snippet to chat (file path + paste-ready instruction for the external AI + the eventual findings path); the file is intended to be committed

#### Scenario: Invoke without change name

- **WHEN** the user invokes `/orbit:review --reviewer external` with no positional
- **THEN** the command runs `orbit list --json` and prompts via `AskUserQuestion` to pick a change

#### Scenario: Record vocabulary frozen across the merge

- **WHEN** the external-handoff branch packages a prompt and emits T0
- **THEN** the emit carries `command: "review-external"` in a `review-external-<TS>.json` file — byte-compatible with pre-merge records — and every downstream consumer (gates, orientation, report ordinal, ingest parser) behaves identically to pre-merge behavior

### Requirement: Mode flag with state-based inference default

The external-review packaging branch SHALL accept a `--as proposal|system` flag; when omitted, mode inference is OWNED by `orbit-review`'s `Mode inference when --as omitted` requirement (one voice on one behavior — D-arc Stage D5's merge onto the single `/orbit:review` surface; that requirement additionally covers architecture-never-inferred). The scenarios below record the packaging branch's observable behavior under that shared inference, not a second inference definition.

#### Scenario: All tasks unchecked → infer proposal mode

- **WHEN** `--as` is omitted and ALL task boxes in the change's `tasks.md` are unchecked
- **THEN** the command proceeds as `--as proposal` and the chat output includes "Generating external-review prompt as `proposal` (inferred from tasks state)."

#### Scenario: All tasks checked + code exists → infer system mode

- **WHEN** `--as` is omitted, all tasks in `tasks.md` are checked, and the codebase shows changes consistent with apply having run
- **THEN** the command proceeds as `--as system` with an analogous inference note

#### Scenario: Ambiguous state → prompt user

- **WHEN** the inference cannot determine mode unambiguously — mixed checked/unchecked task boxes (partial implementation), or all boxes checked without visible code changes
- **THEN** the command prompts the user via `AskUserQuestion` to choose proposal or system (mixed state never silently infers either mode)

### Requirement: Prompt written to versioned file with chat invocation snippet

The system SHALL write the full handoff prompt to a versioned, committed file in the change's `.orbit-runs/` directory and emit a short invocation snippet to chat that points the user at the file and tells them what to do after.

#### Scenario: Prompt file path

- **WHEN** the command runs
- **THEN** the full prompt is written to `orbit/changes/<change-name>/.orbit-runs/external-prompt-<as>-<TS>.md` where `<TS>` is an ISO timestamp; the file is intended to be committed (not gitignored)

#### Scenario: Prompt file contents

- **WHEN** the file is written
- **THEN** it contains the full self-contained prompt: role description, repo URL or path, project context file pointers (`CLAUDE.md`, `orbit/project.md`, `*_convention.md`, `orbit/lenses/`), iteration history pointer (`.orbit-runs/`), cycle context (iteration N, prior findings count, resolved-since-last), mode-specific "what to read" and "what to look for" sections, output format specification

#### Scenario: Chat invocation snippet

- **WHEN** the file is written
- **THEN** the chat output contains the following items, in this order:
  - **(optional)** Mode-inference note when `--as` was omitted (per the State-based inference scenario): `Generating external-review prompt as \`<as>\` (inferred from tasks state).`
  - **(required)** Recommended-session note (per the Recommended-session requirement): a single line summarizing which AI session the user should paste into.
  - **(required)** The prompt file path.
  - **(conditional — handoff preflight gate, per the Handoff-preflight requirement)** ONE of: the affirmative committed-and-pushed attestation (`Prompt committed (<short-sha>) and pushed to <remote>/<branch>`, or the local-path equivalent) immediately followed by the copy-paste-ready pull invocation (`Pull <repo URL> and read <prompt-file-path>. Follow its instructions; write findings to the path specified inside.`) when the preflight is satisfied, OR the handoff-blocked output (commit+push action leading; pull text framed as the after-push step) when it is not.
  - **(required)** The eventual findings path the user will pass to `/orbit:address-reviews --from-file` once findings come back.

  No other items are emitted; required items are always present in the specified order.

#### Scenario: Mode-specific sections

- **WHEN** the prompt file is written in `--as proposal` mode
- **THEN** the "what to look for" section enumerates the 9 proposal-mode passes; in `--as system` mode it enumerates the 7 system-mode passes

#### Scenario: Reference prompt template

- **WHEN** an implementer generates the handoff prompt
- **THEN** it follows the reference template structure below (the implementer may adjust phrasing for clarity but MUST preserve the named sections and the output-format block verbatim so external-review parsers ingest cleanly):

```markdown
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
- `orbit/changes/<change-name>/.orbit-runs/` — iteration history; see what's
  already been addressed in prior cycles

## Cycle context

- Iteration: <N>
- Prior internal findings still open: <count + brief list>
- Prior external findings still open: <count + brief list>
- Resolved since last review: <brief list>

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

## What to read for THIS review (<as proposal | system>)

<mode-specific file list>

## What to look for

<mode-specific pass list — 9 passes for proposal mode, 7 for system mode>

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

(For each additional CRITICAL finding, repeat the `### <Title>` + `**File**:` + `**Description**:` triple. Use `None.` as a single-word body if there are no findings at this severity.)

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

## Notes

<Optional — rendered VERBATIM into the report's delimited Commentary slot: carry the pattern behind the findings, what you probed, and risk texture; do NOT state finding counts, gate verdicts, or next commands — those exist only in the report's engine-computed sections. Omit the whole `## Notes` section if you have nothing to add.>
```

If your environment doesn't support file writes (chat-only interface), output
the markdown directly and the user will save it.

## After completing the review

1. **Output the full findings markdown in chat** — in addition to writing the
   findings file, output the COMPLETE findings markdown in this chat. Same
   content as the file: every severity section (`## CRITICAL` / `## WARNING`
   / `## SUGGESTION`), every `### Title` entry, every `**File**:` and
   `**Description**:` field. Do NOT abbreviate or summarize — the chat output
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
```

#### Scenario: Output-format block must be verbatim

- **WHEN** the prompt is generated
- **THEN** the "Output format" block (the inner markdown showing the expected findings structure) is included verbatim, including section headers `## CRITICAL` / `## WARNING` / `## SUGGESTION` and the `**File**:` / `**Description**:` field labels; deviations would break `--from-file` parsing

#### Scenario: Commit / push instructions in prompt

- **WHEN** the prompt is generated
- **THEN** it includes an "After completing the review" section instructing the external AI to commit and push the findings file if it has git access (with a `git add` / `git commit` / `git push` block showing the path and a one-line summary commit message), AND to STATE PLAINLY in its chat output that the findings file was committed and pushed — `Findings committed (<short-sha>) and pushed` — or to state explicitly that it could not (chat-only fallback: output the markdown for the user to commit manually). The human never has to infer whether the findings landed in the repo

#### Scenario: Commit message format in prompt

- **WHEN** the prompt's commit instructions are generated
- **THEN** the suggested commit message line follows the form `External review (<as>, iter <N>): <change-name>` followed by a blank line and a one-line summary of the findings (severity counts + headline finding if any); this format makes the iteration / mode visible in `git log` and pairs with the file's own iteration counter

#### Scenario: Full findings output to chat in prompt

- **WHEN** the prompt is generated
- **THEN** the "After completing the review" section instructs the external AI to output the FULL findings markdown in chat (every finding's severity section + `### Title` + `**File**:` + `**Description**:`, identical content to the findings file — no abbreviation, no summarization) in addition to writing the findings file; the chat output is the immediately-visible read for the user, the file is the canonical record for parsing by `--from-file`

### Requirement: Recommended-session note in chat output

The system SHALL emit a recommendation about which external-AI session the user should paste the invocation into, based on iteration number and prior reviewer history.

#### Scenario: Recommendation appears in chat

- **WHEN** the chat invocation snippet is emitted
- **THEN** it includes a single short line labeled `Recommended session:` (or equivalent) before the prompt file path, summarizing whether to use a fresh session, continue a same-AI prior-iteration session, or pick a previously-unused AI

#### Scenario: Recommendation logic by iteration

- **WHEN** the command computes the recommendation
- **THEN** it uses this logic:
  - **Iteration 1**: `Fresh session recommended — first external pass; sets independent baseline. Pick any AI (codex / fresh Claude / GPT / etc.).`
  - **Iteration 2**: `Fresh session in a DIFFERENT AI than iter 1's reviewer recommended (model diversity catches different blind spots). If iter 1 was <prior reviewer>, try <suggest different model>.`
  - **Iteration 3+**: `Either (a) carry context from a same-AI prior session — lets that reviewer verify its earlier findings were actually addressed (ideal when concerns from that reviewer dominated prior iterations); or (b) fresh session in a previously-unused AI — maximum independence (ideal when looking for net-new issues). For this iter, consider <specific suggestion based on prior-reviewer pattern>.`
  - Prior-reviewer identity is read from the `**Reviewer**:` field of existing `external-<as>-*.md` files in `.orbit-runs/`

#### Scenario: No prior data → iter 1 recommendation

- **WHEN** `.orbit-runs/` contains no prior `external-<as>-*.md` files for the current mode
- **THEN** the iter 1 recommendation is emitted regardless of how many runs exist for other modes

### Requirement: Output format specification in prompt

The system SHALL instruct the external AI to write findings using a defined markdown structure with severity sections.

#### Scenario: Required format

- **WHEN** the prompt is generated
- **THEN** it specifies a markdown structure with `# External Review: <change> (iteration N)` header, `**Reviewer**:` and `**Date**:` fields, and severity sections `## CRITICAL` / `## WARNING` / `## SUGGESTION`, each containing `### <Title>` entries with `**File**: <path>:<line>` and `**Description**: <text>` fields, plus an optional `## Notes` section

#### Scenario: Output file path specified

- **WHEN** the prompt is generated
- **THEN** it instructs the external AI to write findings to `orbit/changes/<change-name>/.orbit-runs/external-<as>-<TS>.md` where `<TS>` is an ISO timestamp

#### Scenario: Chat-only fallback

- **WHEN** the external AI lacks file-write capability
- **THEN** the prompt instructs the AI to output the markdown directly so the user can save it manually

### Requirement: Iteration counting per mode

The system SHALL count iterations separately for proposal-mode and system-mode reviews.

#### Scenario: Iteration N reported

- **WHEN** the command runs and the change's `.orbit-runs/` already contains some `external-<as>-*.md` files for the specified mode
- **THEN** the prompt reports iteration N = (count of matching files) + 1

#### Scenario: First-iteration for mode

- **WHEN** no prior `external-<as>-*.md` files exist for the specified mode
- **THEN** the prompt reports iteration 1 and notes "first external review for this change in <as> mode"

### Requirement: Cycle context populated from prior runs

The system SHALL include a "Cycle context" section in the prompt with iteration number, prior findings (open and resolved), populated from `.orbit-runs/` if it contains prior runs.

#### Scenario: Prior internal review summary exists

- **WHEN** the change has a prior `review-proposal-<TS>.json` or `review-system-<TS>.json` summary in `.orbit-runs/`
- **THEN** the cycle context section includes counts and short titles of those findings

#### Scenario: Prior external review exists

- **WHEN** the change has a prior `external-<as>-<TS>.md` in `.orbit-runs/`
- **THEN** the cycle context section summarizes those findings so the external AI knows what was previously flagged

### Requirement: Handoff preflight blocks unusable pull invocations

The system SHALL verify the handoff state before emitting a pull-based invocation: the working tree is clean (`git status --porcelain` empty) AND no local commits are unpushed (`git rev-list @{u}..HEAD --count` is zero, when an upstream exists). When either check fails, the pull invocation is withheld; the chat output instead leads with the required commit-and-push action (naming the just-written prompt file among the pending work) and frames the pull text as the after-push step. A repo with no remote satisfies the preflight via the local-path handoff route.

#### Scenario: Dirty working tree blocks the pull invocation

- **WHEN** the command runs and `git status --porcelain` reports uncommitted changes
- **THEN** the chat output does NOT present the pull invocation as immediately usable; it emits a handoff-blocked output naming the dirty-tree cause, instructs the user to commit (including the prompt file) and push, and frames the pull invocation as the step after pushing

#### Scenario: Unpushed commits block the pull invocation

- **WHEN** the working tree is clean but `git rev-list @{u}..HEAD --count` reports N > 0 unpushed commits
- **THEN** the chat output emits the handoff-blocked output naming the N-unpushed-commits cause, with the same commit/push-then-pull framing

#### Scenario: Clean and pushed emits the pull invocation with an affirmative attestation

- **WHEN** the working tree is clean and no unpushed commits exist (or the repo has no remote and the local-path route is used)
- **THEN** the chat output AFFIRMATIVELY STATES the prompt's handoff state with evidence — `Prompt committed (<short-sha>) and pushed to <remote>/<branch>` (or the local-path equivalent naming the path) — and presents the invocation as immediately usable alongside that attestation; the committed-and-pushed state is never implied by the mere absence of a warning

### Requirement: Command does not run the review or ingest findings

The system SHALL NOT execute the review itself nor ingest the external AI's findings.

#### Scenario: Out of scope

- **WHEN** the command completes
- **THEN** only a prompt is emitted; no review passes execute and no findings are processed; ingestion is the responsibility of `/orbit:address-reviews --from-file <path>`

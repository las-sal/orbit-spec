## MODIFIED Requirements

### Requirement: Prompt written to versioned file with chat invocation snippet

The system SHALL write the full handoff prompt to a versioned, committed file in the change's `.orbit-runs/` directory and emit a short invocation snippet to chat that points the user at the file and tells them what to do after.

#### Scenario: Prompt file path

- **WHEN** the command runs
- **THEN** the full prompt is written to `orbit/changes/<change-name>/.orbit-runs/external-prompt-<as>-<TS>.md` where `<TS>` is an ISO timestamp; the file is intended to be committed (not gitignored)

#### Scenario: Prompt file contents

- **WHEN** the file is written
- **THEN** it contains the full self-contained prompt: role description, repo URL or path, project context file pointers (`CLAUDE.md`, `orbit/project.md`, `*_convention.md`, `orbit/lenses/`) — and NO pointer at `.orbit-runs/` for the reviewer to READ (the output path and the commit line it is told to write are destinations, not reads) —, cycle context (the iteration number ONLY; per `Cycle context populated from prior runs`, which points at `orbit-conventions`' review-genre brief rule), mode-specific "what to read" and "what to look for" sections, the one-paragraph severity ladder (per `Output format specification in prompt`), output format specification — whose block carries the REQUIRED `## Direction` section between `## Blocks` and `## Notes` (per the same requirement)

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

### Requirement: Cycle context populated from prior runs

The system SHALL include a "Cycle context" section in the prompt carrying the ITERATION NUMBER ONLY, computed from `.orbit-runs/` (the count of prior `external-<as>-*.md` files in this mode, per `Iteration counting per mode`). The section SHALL list no finding — open or resolved, internal or external — and the prompt SHALL carry no pointer at `.orbit-runs/` for the reviewer to read: an external pass is REVIEW pass genre, and a REVIEW-genre brief carries no findings and no pointer at the trail (`orbit-conventions`' `Review mode decision framework` owns that rule and its stated residual; this requirement is how the external prompt honours it). The body still READS the trail to count iterations and to pick the recommended session; the reviewer never does.

#### Scenario: Prior runs exist and the section still lists nothing

- **WHEN** the change has prior `review-<mode>-<TS>.json`, `external-<as>-<TS>.md` or `address-reviews-<TS>.json` records in `.orbit-runs/`
- **THEN** the cycle context section reads `- Iteration: <N>` with N computed from the prior external files of this mode, and carries no count, title or list of findings from any of those records, and the prompt's project-context list carries no `.orbit-runs/` entry

#### Scenario: No prior runs

- **WHEN** `.orbit-runs/` is absent or holds no prior external file for this mode
- **THEN** the section reads `- Iteration: 1` and nothing else, as before

### Requirement: Recommended-session note in chat output

The system SHALL emit a recommendation about which external-AI session the user should paste the invocation into, based on iteration number and prior reviewer history.

#### Scenario: Recommendation appears in chat

- **WHEN** the chat invocation snippet is emitted
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

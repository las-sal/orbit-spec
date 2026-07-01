/**
 * Skill Template Workflow Modules
 *
 * orbit editorial workflow (B3): relocated from the overlay's openspec-review-external skill,
 * orbit-named and scrubbed of overlay-era citations (D-b3-1); persistence prose aligned
 * to the orbit-run-summary-emit baseline where the change's iter-1 review corrected it.
 */
import type { SkillTemplate, CommandTemplate } from '../types.js';

const REVIEW_EXTERNAL_MODE_SECTIONS_REFERENCE = `# Reference: mode-specific sections

Substitute these into the \`## What to read for THIS review\` and \`## What to look for\` sections of the prompt template (\`references/prompt-template.md\`) based on the resolved \`--as\` mode.

## Proposal mode — "What to read for THIS review"

\`\`\`
- orbit/changes/<change-name>/proposal.md
- orbit/changes/<change-name>/design.md
- orbit/changes/<change-name>/tasks.md
- orbit/changes/<change-name>/specs/<capability>/spec.md (every spec under specs/)
- orbit/changes/<change-name>/explore.md (if present)
- orbit/specs/<capability>/spec.md (archived baselines — for delta consistency checks)
\`\`\`

## Proposal mode — "What to look for" (9 passes)

1. **Structure & Delta Integrity** — required artifacts present; ADDED/MODIFIED/REMOVED/RENAMED valid; \`orbit validate\` would pass.
2. **Internal Coherence** — proposal aligns with design aligns with specs aligns with tasks. Count/label consistency. No scope creep.
3. **Cross-Doc Coherence** — \`CLAUDE.md\`, \`project.md\`, \`*_convention.md\` still accurate after this change.
4. **Archive Consistency** — ADDED don't contradict baseline; RENAMED FROM names exist; REMOVED not still referenced.
5. **Codegen Readiness** — no implicit requirements; no decisions left to codegen; no ambiguity.
6. **Gap Hunt** — could a fresh AI implement this from these specs alone? Unstated assumptions? Error paths? State transitions?
7. **Drift Hunt** — old vocabulary lingering; consistency with \`*_convention.md\`.
8. **Inline Review Marker Residue** — any \`@review:\` markers still present (must be addressed before apply)?
9. **Pre-Handoff Sweep** — anything else before shipping?

## System mode — "What to read for THIS review"

\`\`\`
- orbit/changes/<change-name>/proposal.md, design.md, tasks.md, specs/
- The change's commit range: git diff <change-start>..HEAD (estimate <change-start> from git log)
- orbit/specs/<capability>/spec.md (archived baselines — for baseline-compliance check)
- orbit/lenses/perspectives.md, orbit/lenses/critical-paths.md (judgment layer)
- Code paths touched by the change (cohesion + surface walk)
\`\`\`

## System mode — "What to look for" (7 passes)

0. **verify-change-style structural check** — tasks done, spec coverage, design adhered (the external AI runs its own equivalent of upstream verify-change).
1. **Baseline Compliance** — does this change break any archived \`orbit/specs/\` requirement?
2. **Cohesion** — callers/dependents outside the tasks list. Signature drift, ripple effects, side-effect additions.
3. **Surface Walk** — every CLI / MCP / HTTP / public-function surface in \`orbit/specs/\` still coherent? Capabilities ARE surfaces; don't redefine them.
4. **Perspective Reviews** — for each named perspective in \`orbit/lenses/perspectives.md\`, simulate the caller's POV.
5. **Critical-Path Scan** — for each flow in \`orbit/lenses/critical-paths.md\`, walk end-to-end.
6. **Drift / Residue** — vocabulary residue, stale references, archive-coherence misses.
`;

const REVIEW_EXTERNAL_PROMPT_TEMPLATE_REFERENCE = `# Reference: external-review prompt template

This is the canonical template for the file written to \`orbit/changes/<change-name>/.orbit-runs/external-prompt-<as>-<TS>.md\` by \`/orbit:review-external\`.

**The implementer may adjust phrasing for clarity but MUST preserve the named sections and the "Output format" block verbatim** — the section headers (\`## CRITICAL\` / \`## WARNING\` / \`## SUGGESTION\`) and the field labels (\`**File**:\`, \`**Description**:\`) are what \`/orbit:address-reviews --from-file\` parses. Deviating breaks ingestion.

Mode-specific content (the "What to read for THIS review" file list and the "What to look for" pass list) is substituted from \`references/mode-sections.md\`.

## Template

\`\`\`\`markdown
# External Review: <change-name> (iteration <N>)

You are reviewing an OpenSpec change as a second pair of eyes. Your value is
your independent take — be thorough; flag anything that looks wrong,
inconsistent, or unclear. Don't be charitable to the authoring AI's reasoning.

## Repo

<repo URL or path>

## Project context (read first)

- \`CLAUDE.md\` — handoff orientation (if present)
- \`orbit/project.md\` — project goals + stack (if present)
- \`*_convention.md\` at repo root — naming, error handling, etc. (if present)
- \`orbit/lenses/perspectives.md\` — named callers worth validating from (if present)
- \`orbit/lenses/critical-paths.md\` — user flows worth walking end-to-end (if present)
- \`orbit/changes/<change-name>/.orbit-runs/\` — iteration history; see what's
  already been addressed in prior cycles

## Cycle context

- Iteration: <N>
- Prior internal findings still open: <count + brief list>
- Prior external findings still open: <count + brief list>
- Resolved since last review: <brief list>

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

## What to read for THIS review (--as <proposal|system>)

<mode-specific file list — see references/mode-sections.md>

## What to look for

<mode-specific pass list — see references/mode-sections.md (9 passes for proposal mode, 7 for system mode)>

## Output format — write to:

\`orbit/changes/<change-name>/.orbit-runs/external-<as>-<TS>.md\`

(Where <TS> is today's timestamp in ISO format. Pick a fresh timestamp so this
file doesn't overwrite prior reviews.)

Use this exact markdown structure:

\`\`\`markdown
# External Review: <change-name> (iteration <N>)

**Reviewer**: <your model name>
**Date**: <YYYY-MM-DD>

## CRITICAL

### <Finding title>
**File**: <path>:<line>
**Description**: <what's wrong + specific recommendation>

(For each additional CRITICAL finding, repeat the \`### <Title>\` + \`**File**:\` + \`**Description**:\` triple. Use \`None.\` as a single-word body if there are no findings at this severity.)

## WARNING

### <Finding title>
**File**: <path>:<line>
**Description**: <what's wrong + specific recommendation>

(Same shape as CRITICAL. Use \`None.\` if no findings.)

## SUGGESTION

### <Finding title>
**File**: <path>:<line>
**Description**: <what's wrong + specific recommendation>

(Same shape. Use \`None.\` if no findings.)

## Notes

<Optional: overall impression, broader concerns. Omit the whole \`## Notes\` section if you have nothing to add.>
\`\`\`

If your environment doesn't support file writes (chat-only interface), output
the markdown directly and the user will save it.

## After completing the review

1. **Output the full findings markdown in chat** — in addition to writing the
   findings file, output the COMPLETE findings markdown in this chat. Same
   content as the file: every severity section (\`## CRITICAL\` / \`## WARNING\` /
   \`## SUGGESTION\`), every \`### Title\` entry, every \`**File**:\` and
   \`**Description**:\` field. Do NOT abbreviate or summarize — the chat output
   is the immediately-visible read for the user (they should be able to
   evaluate every finding without opening the file). The file remains the
   canonical record for \`--from-file\` parsing.

2. **Commit and push the findings file** (if your environment supports git):

   \`\`\`bash
   git add orbit/changes/<change-name>/.orbit-runs/external-<as>-<TS>.md
   git commit -m "External review (<as>, iter <N>): <change-name>

   <one-line summary: severity counts + headline finding if any>"
   git push
   \`\`\`

   Then STATE PLAINLY in your chat output that the findings landed —
   \`Findings committed (<short-sha>) and pushed\` — so the human never has to
   infer whether they reached the repo.

If you don't have git access, just output the findings markdown in this chat
(per the chat-only fallback above), state explicitly that you could NOT
commit/push, and the user will commit it manually.
\`\`\`\`
`;

export function getReviewExternalSkillTemplate(): SkillTemplate {
  return {
    name: 'orbit-review-external',
    description: "Package a review request for an external AI (codex, fresh Claude, GPT, etc.) to perform a second-opinion review. Writes a versioned prompt file to .orbit-runs/ and emits a short invocation snippet to chat. Use when the user wants cross-AI review.",
    instructions: `Package a review request for an external AI (codex, fresh Claude, GPT, etc.) to perform a second-opinion review of an OpenSpec change. The command emits **two things**: (a) a self-contained markdown prompt written to \`orbit/changes/<change-name>/.orbit-runs/external-prompt-<as>-<TS>.md\` (committed; the external AI reads it from the repo), and (b) a short invocation snippet to chat that tells the user what to paste into the external AI's session.

**Does NOT run the review and does NOT ingest findings.** The external AI does the review work. Ingestion is \`/orbit:address-reviews --from-file <path>\`. This command's job is solely to package the handoff.

**Input**: Optional change name and optional \`--as proposal|system\`. If omitted, change is selected via \`AskUserQuestion\`, mode is inferred from \`tasks.md\` state.

## Three execution disciplines (apply throughout this command)

These three disciplines are embedded in every orbit command as a self-contained reminder. They bracket the authoring lifecycle (authoring-time / modification-time / review-time).

**Read-before-reference (authoring-time)**. The prompt file you generate references project paths (\`CLAUDE.md\`, \`orbit/lenses/perspectives.md\`, etc.) and counts (iteration N, prior open findings, resolved-since-last). Read the actual files before citing them — don't assume \`orbit/lenses/perspectives.md\` exists; check. Don't fabricate iteration history; compute from \`.orbit-runs/\`. A prompt that names files that don't exist degrades the external AI's trust in the handoff.

**Change completeness (modification-time)**. The prompt file is written once per invocation. If you discover mid-generation that a section needs updating (e.g., iteration count was wrong because you missed a prior file), regenerate the whole file rather than partially overwriting. The prompt file becomes the canonical artifact for the external review; partial writes leak inconsistency.

**Pushback (review-time)**. Does not apply directly — this command generates packaging, not findings. But: the prompt instructs the external AI **not** to apply pushback discipline (\`Do not push back on stale findings — pushback discipline is enforced on resolution, not review.\`). This is deliberate: the external AI should flag what it observes; \`/orbit:address-reviews\` applies the pushback when ingesting findings.

## Steps

### 1. Resolve the change

If a change name is provided, use it. Otherwise:
- Run \`orbit list --json\` to get available changes.
- Use **AskUserQuestion** to let the user select.

State \`Using change: <name>\` at the top of the chat output.

### 2. Resolve the mode

Mode comes from \`--as proposal|system\` if specified. If omitted:

1. Read \`orbit/changes/<name>/tasks.md\`.
2. **All unchecked** → infer \`proposal\`.
3. **All checked + code changes visible** (heuristic: \`git log\` shows commits after the change directory was created) → infer \`system\`.
4. **Ambiguous** → use **AskUserQuestion** to let the user pick.

Emit a one-line inference note in chat output when \`--as\` was omitted: \`Generating external-review prompt as \\\`<as>\\\` (inferred from tasks state).\`

### 3. Handoff preflight — committed-and-pushed state

The pull-based handoff only works if the external AI can actually see the reviewed state. Record two facts (used by Step 8):

1. **Working tree**: \`git status --porcelain\` — any output means the reviewed state is not fully committed (and the prompt file written in Step 7 will itself be uncommitted).
2. **Remote sync**: \`git rev-list @{u}..HEAD --count\` (skip if no upstream) — a non-zero count means local commits aren't pushed.

(The external AI pulls the repo, so it only sees what's committed AND pushed. A pull-based invocation emitted against dirty or unpushed state hands the external AI a repo without the change — the handoff silently reviews stale state or fails.)

If the repo has no remote at all, the preflight is satisfied by the local-path handoff route (see Graceful degradation).

### 4. Count iterations (per mode)

In \`orbit/changes/<name>/.orbit-runs/\`, count files matching \`external-<as>-*.md\` (findings files from prior external reviews in this mode — distinct from \`external-prompt-<as>-*.md\` which are prompt files).

- N matching files → this is iteration N+1.
- 0 matching files → iteration 1; note \`first external review for this change in <as> mode\`.

### 5. Load cycle context

For the "Cycle context" section of the prompt, gather:

- **Iteration N** (Step 4).
- **Prior internal review findings** still open: read the most-recent \`review-<mode>-*.json\` summary in \`.orbit-runs/\`; list count + short titles of unresolved findings.
- **Prior external review findings** still open: read existing \`external-<as>-*.md\` files in \`.orbit-runs/\`; cross-reference any prior \`address-reviews-*.json\` to mark resolved-or-not.
- **Resolved since last external review**: if a prior \`address-reviews-*.json\` exists, list its resolved-finding titles.

If \`.orbit-runs/\` is absent or has no prior content: omit the "open findings" sublists; the cycle-context section just shows iteration 1.

### 6. Compute the recommended-session note

Read the \`**Reviewer**:\` field from existing \`external-<as>-*.md\` files in \`.orbit-runs/\` (these record which AI did each prior review). Pick the phrasing:

- **Iteration 1**: \`Fresh session recommended — first external pass; sets independent baseline. Pick any AI (codex / fresh Claude / GPT / etc.).\`
- **Iteration 2**: \`Fresh session in a DIFFERENT AI than iter 1's reviewer recommended (model diversity catches different blind spots). If iter 1 was <prior reviewer>, try <suggest different model>.\`
- **Iteration 3+**: \`Either (a) carry context from a same-AI prior session — lets that reviewer verify its earlier findings were actually addressed (ideal when concerns from that reviewer dominated prior iterations); or (b) fresh session in a previously-unused AI — maximum independence (ideal when looking for net-new issues). For this iter, consider <specific suggestion based on prior-reviewer pattern>.\`

Same-vs-fresh trade-off (mention briefly in the recommendation when relevant): **fresh sessions maximize independence (better at finding net-new issues); same-AI continuation sessions maximize verification (better at checking whether prior findings were actually addressed).**

### 7. Write the prompt file

Compose the full self-contained prompt (per the reference template below) and write to:

\`\`\`
orbit/changes/<change-name>/.orbit-runs/external-prompt-<as>-<TS>.md
\`\`\`

\`<TS>\` is ISO-8601 with hyphens (e.g., \`2026-05-18T14-35-23Z\`). Create \`.orbit-runs/\` if it doesn't exist. The file is **committed**, not gitignored.

Mode-specific content:

- **"What to read for THIS review"** lists files appropriate to the mode (proposal mode emphasizes the change directory artifacts; system mode adds \`git diff\`, codebase paths, lens files).
- **"What to look for"** enumerates the 9 proposal-mode passes or the 7 system-mode passes (see below).

The **"Output format"** block inside the prompt MUST appear verbatim — the section headers (\`## CRITICAL\` / \`## WARNING\` / \`## SUGGESTION\`) and the field labels (\`**File**:\`, \`**Description**:\`) are what \`/orbit:address-reviews --from-file\` parses. Deviating breaks ingestion.

### 8. Emit the chat invocation snippet

Print to chat, in this exact order:

1. **(optional)** Mode-inference note when \`--as\` was omitted: \`Generating external-review prompt as \\\`<as>\\\` (inferred from tasks state).\`
2. **(required)** Recommended-session note: \`Recommended session: <phrasing from Step 6>\`
3. **(required)** The prompt file path: \`Prompt: orbit/changes/<change-name>/.orbit-runs/external-prompt-<as>-<TS>.md\`
4. **(conditional — preflight gate)** ONE of:
   - **Preflight satisfied** (clean tree, no unpushed commits — or local-path route): FIRST affirmatively state the prompt's committed-and-pushed state with evidence — \`Prompt committed (<short-sha>) and pushed to <remote>/<branch>\` (or, on the local-path route, the equivalent naming the path) — NEVER implied by the mere absence of a warning; THEN the copy-paste-ready invocation: \`Pull <repo URL> and read <prompt-file-path>. Follow its instructions; write findings to the path specified inside.\` (Get \`<short-sha>\` from \`git rev-parse --short HEAD\` and \`<remote>/<branch>\` from \`git rev-parse --abbrev-ref --symbolic-full-name @{u}\` after the push.)
   - **Preflight failed** (dirty tree and/or unpushed commits): the pull invocation is WITHHELD. Emit instead: \`Handoff blocked: <dirty tree | N unpushed commit(s)>. Commit the pending work (including the prompt file above) and push, then hand off: Pull <repo URL> and read <prompt-file-path>. ...\` — the commit+push action leads; the pull text is framed as the after-push step, never as an immediately-usable instruction.
5. **(required)** The eventual findings path: \`When findings come back: /orbit:address-reviews --from-file orbit/changes/<change-name>/.orbit-runs/external-<as>-<TS>.md (TS will be set by the external AI when it writes).\`

No other items. Required items always appear in the specified order. (The T0 emit's \`next_recommended\` mirrors the gate: when the preflight failed, it leads with the commit+push action before the paste step.)

## Reference prompt template

The full template for the file written in Step 7 lives at \`references/prompt-template.md\`. Read that file when composing the prompt. The template is verbatim — preserve named sections and especially the "Output format" block (the \`## CRITICAL\` / \`## WARNING\` / \`## SUGGESTION\` headers + \`**File**:\` / \`**Description**:\` field labels) so \`/orbit:address-reviews --from-file\` parses cleanly.

## Mode-specific sections

Mode-specific content (the "What to read for THIS review" file list and the "What to look for" pass list) lives at \`references/mode-sections.md\`. Read that file and substitute the appropriate block (proposal: 9 passes / system: 7 passes) into the template.

## Worked example (chat output, iter 5 proposal-mode review of \`add-review-workflows\`)

\`\`\`
Generating external-review prompt as \`proposal\` (inferred from tasks state).

Recommended session: Iter 5 — either (a) carry context from your iter-3 codex
chat (codex verifies whether its iter-3 findings actually landed after the most recent
substantive edits), or (b) fresh Claude session for maximum independence
(better at catching cleanup-residue from the most recent substantive edits).
For this iter, (b) is the higher-signal choice given how much changed after iter 4.

Prompt: orbit/changes/add-review-workflows/.orbit-runs/external-prompt-proposal-2026-05-18T14-35-23Z.md

To run (handoff preflight satisfied — tree clean, remote in sync): Pull <repo URL> and read
orbit/changes/add-review-workflows/.orbit-runs/external-prompt-proposal-2026-05-18T14-35-23Z.md.
Follow its instructions; write findings to the path specified inside.

When findings come back: /orbit:address-reviews --from-file
orbit/changes/add-review-workflows/.orbit-runs/external-proposal-<TS>.md
(<TS> will be set by the external AI when it writes.)
\`\`\`

## Out of scope

The command does not run the review and does not ingest findings:

- **Running the review**: the external AI does it. This command is packaging.
- **Ingesting findings**: \`/orbit:address-reviews --from-file <path>\` ingests; this command emits the path the user will pass to that command later.

## Graceful degradation

- **No \`.orbit-runs/\`** → create it as part of writing the prompt file; iteration is 1.
- **No prior internal review summary** → cycle-context section omits the "open internal findings" sublist.
- **No prior external review** → recommended-session note uses iter 1 phrasing; cycle context omits "open external findings".
- **No lenses files** → "Project context (read first)" line for those still appears (the \`(if present)\` qualifier handles the absence); external AI will see they're absent when it pulls the repo.
- **No git remote / repo URL unknown** → emit the local path instead of a URL and add a note: \`If you don't have access to this repo, copy it to a shared location and update the invocation.\`

## Run-summary emit (T0 — when prompt is packaged, before findings return)

(Per \`orbit-run-summary-emit\` capability)

\`/orbit:review-external\` writes TWO artifacts during a single invocation:

1. **The prompt file**: \`external-prompt-<as>-<TS>.md\` written per Step 7.
2. **The T0 run-summary JSON**: emitted at command completion (after Step 8's chat invocation snippet), recording that the external pass was packaged and is awaiting findings.

The T0 emit goes to:

\`\`\`
orbit/changes/<name>/.orbit-runs/review-external-<TS>.json
\`\`\`

Where \`<TS>\` is ISO-8601 UTC with hyphens. Create \`.orbit-runs/\` if it doesn't exist. Use a FRESH timestamp distinct from the prompt file's \`<TS>\` (one ISO-second resolution may make them identical; bump by one second if so).

This is the T0 emit. T1 (findings returned and ingested via \`/orbit:address-reviews --from-file\`) is the EXISTING \`address-reviews-<TS>.json\` emit and is unaffected.

### JSON shape

Per the universal spine in \`orbit-conventions\`'s \`Internal-run JSON summary format\` + per-command extensions:

\`\`\`json
{
  "command": "review-external",
  "timestamp": "<ISO-8601 UTC>",
  "change": "<name>",
  "final_assessment": "<narrative, e.g., 'External review prompt packaged for <name> (iter <N>, mode <as>); awaiting findings from <target>.'>",
  "next_recommended": "<multi-step prose; see below>",
  "kind": "editorial",
  "mode": "proposal" | "system",
  "reviewer_class": "external",
  "prompt_path": "orbit/changes/<name>/.orbit-runs/external-prompt-<as>-<TS>.md",
  "target": "<named external AI if user specified; null otherwise>",
  "awaiting_findings": true
}
\`\`\`

\`awaiting_findings: true\` is always set at T0. Future tooling may flip this when findings land; for now it's a flag that downstream consumers can use to identify "T0 emit, not yet completed cycle." \`reviewer_class: "external"\` (C1) describes the intended handoff class for audit readability — but per \`orbit-run-summary-emit\`, a T0 emit is a PACKAGING record, NOT a completed pass: an \`external\` cadence slot is satisfied ONLY when an \`external-<as>-<TS>.md\` findings file exists, so a packaged-but-unreturned external never counts as class coverage.

### \`next_recommended\` — multi-step prose

Per \`orbit-run-summary-emit\`'s \`Review-external T0 multi-step recommendation\` requirement, the recommendation is multi-step prose describing the user action plus the follow-up command (per D14):

\`\`\`
"Paste orbit/changes/<name>/.orbit-runs/external-prompt-<as>-<TS>.md
 into the target AI, save the response as
 orbit/changes/<name>/.orbit-runs/external-<as>-<TS>.md,
 then /orbit:address-reviews <name> --from-file <path>"
\`\`\`

A downstream status reader's tier-1 best-effort parse SHALL find no leading \`/orbit:<verb>\` (because the string leads with "Paste"); \`command\` and \`args\` are left null, and the full verbatim string is surfaced in \`reason\`. This is the expected behavior — multi-step user actions are accurately represented as prose, not collapsed into a single command.
`,
    references: [
      {
        name: 'mode-sections.md',
        content: REVIEW_EXTERNAL_MODE_SECTIONS_REFERENCE,
      },
      {
        name: 'prompt-template.md',
        content: REVIEW_EXTERNAL_PROMPT_TEMPLATE_REFERENCE,
      },
    ],
    license: 'MIT',
    compatibility: "Requires orbit CLI. Findings come back as markdown files under `.orbit-runs/` and are ingested via `/orbit:address-reviews --from-file`.",
    metadata: { author: 'openspec', version: '0.1', capability: 'orbit-review-external' },
  };
}

export function getOrbitReviewExternalCommandTemplate(): CommandTemplate {
  return {
    name: 'ORBIT: Review External',
    description: 'Package a second-opinion review request for an external AI',
    category: 'Workflow',
    tags: ["workflow","review","orbit"],
    content: `Package a review request for an external AI: write a self-contained prompt file to the change’s \`.orbit-runs/\` and emit a chat invocation snippet. Does not run the review or ingest findings.

This command is a thin launcher: invoke the \`orbit-review-external\` skill, passing along any arguments given with the command (e.g., \`/orbit:review-external [<change-name>] [--as proposal|system]\`). The skill carries the complete workflow instructions — upstream openspec behavior plus orbit's additions. Do not improvise the workflow from this file; load the skill.`
  };
}

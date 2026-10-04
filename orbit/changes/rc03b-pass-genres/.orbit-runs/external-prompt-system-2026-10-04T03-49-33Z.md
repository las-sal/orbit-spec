# External Review: rc03b-pass-genres (iteration 1)

You are reviewing an OpenSpec change as a second pair of eyes. Your value is
your independent take — be thorough; flag anything that looks wrong,
inconsistent, or unclear. Don't be charitable to the authoring AI's reasoning.

## Repo

https://github.com/las-sal/orbit-spec (branch `d-arc`)

## Project context (read first)

- `CLAUDE.md` — handoff orientation (if present)
- `orbit/project.md` — project goals + stack (if present)
- `*_convention.md` at repo root — naming, error handling, etc. (if present)
- `orbit/lenses/perspectives.md` — named callers worth validating from (if present)
- `orbit/lenses/critical-paths.md` — user flows worth walking end-to-end (if present)

## Cycle context

- Iteration: 1

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

## What to read for THIS review (--as system)

- orbit/changes/rc03b-pass-genres/proposal.md, design.md, tasks.md, specs/
- The change's commit range: git diff 46a43e00..HEAD -- . ':!orbit/changes/rc03b-pass-genres/.orbit-runs' (46a43e00 is the proposal commit; the apply commit sits on top of it)
- orbit/specs/<capability>/spec.md (archived baselines — for baseline-compliance check)
- orbit/lenses/perspectives.md, orbit/lenses/critical-paths.md (judgment layer)
- Code paths touched by the change (cohesion + surface walk)
- Code paths: src/core/templates/workflows/review.ts (the review skill body and its references — external-handoff, mode-sections, prompt-template), src/core/templates/workflows/propose.ts (one phrase), the new and moved tests under test/core/ and test/core/templates/
- The generated skill as it installs: run `npm install && npm run build && node bin/orbit.js init --tools claude` in a scratch copy (or read `getSkillTemplates()` output) — the body an adopter's agent actually reads

## What to look for

0. **verify-change-style structural check** — tasks done, spec coverage, design adhered (the external AI runs its own equivalent of upstream verify-change).
1. **Baseline Compliance** — does this change break any archived `orbit/specs/` requirement?
2. **Cohesion** — callers/dependents outside the tasks list. Signature drift, ripple effects, side-effect additions.
3. **Surface Walk** — every CLI / MCP / HTTP / public-function surface in `orbit/specs/` still coherent? Capabilities ARE surfaces; don't redefine them.
4. **Perspective Reviews** — for each named perspective in `orbit/lenses/perspectives.md`, simulate the caller's POV.
5. **Critical-Path Scan** — for each flow in `orbit/lenses/critical-paths.md`, walk end-to-end.
6. **Drift / Residue** — vocabulary residue, stale references, archive-coherence misses.

Probes worth running for THIS change (each is a real command, not a reading):
- Run `npx vitest run test/core/templates/review-genre-brief.test.ts test/core/pass-genre-parity.test.ts` and then try to defeat the brief grep: plant a read pointer, a finding-list phrasing, or a prior-pass reference in a place a REVIEW-genre reviewer would read, and see whether the test goes red. Where it stays green, say whether the rule (as `orbit-review`'s ADDED requirement states it) or the test is wrong.
- Construct trail listings (pass records, walk records with and without a readable `source_path`, mode-less walks, a fresh pass landing between an old walk and the in-context pass) and decide each in-context pass's genre by the table in `orbit-conventions`' `Review mode decision framework` (delta under specs/), then by the review body's Step 5 as shipped. Report any case where the two decide differently.
- Run the generated "Dispatching a fresh pass" brief and the external prompt template against the owner's brief rule: does any instruction a reviewer follows lead it to read prior findings — directly, or by following a pointer (a skill it is told to load, a step it is told to run)?
- `git diff 46a43e00..HEAD --stat -- src/core/artifact-graph src/core/emit-composition.ts src/core/report-render.ts schemas` should be empty — confirm.

## Severity

Grade by `orbit-conventions`' Severity ladder. CRITICAL: a user path breaks or data is lost, AND the finding carries its reproduction — a case the reader can re-execute: the inputs, the rule or command, the expected result, the observed result (a command in system mode; a constructed case in proposal mode). WARNING: an implementation built to the artifact as written could diverge from what it intends. SUGGESTION: everything else. When unsure, grade lower. A condition that must stop apply regardless of consequence — an `orbit validate` failure, an unresolved `@review:` marker — is a BLOCK, not a severity: list it under `## Blocks`.

## Output format — write to:

`orbit/changes/rc03b-pass-genres/.orbit-runs/external-system-<TS>.md`

(Where <TS> is today's timestamp in ISO format. Pick a fresh timestamp so this
file doesn't overwrite prior reviews.)

Use this exact markdown structure:

```markdown
# External Review: rc03b-pass-genres (iteration 1)

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
   content as the file: every severity section (`## CRITICAL` / `## WARNING` /
   `## SUGGESTION`), every `### Title` entry, every `**File**:`, `**Description**:` and
   `**Reproduction**:` field, every `## Blocks` item, and the `## Direction` section (its `**Disposition**:` opener and body). Do NOT abbreviate or summarize — the chat output
   is the immediately-visible read for the user (they should be able to
   evaluate every finding without opening the file). The file remains the
   canonical record for `--from-file` parsing.

2. **Commit and push the findings file** (if your environment supports git):

   ```bash
   git add orbit/changes/rc03b-pass-genres/.orbit-runs/external-system-<TS>.md
   git commit -m "External review (system, iter 1): rc03b-pass-genres

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   Then STATE PLAINLY in your chat output that the findings landed —
   `Findings committed (<short-sha>) and pushed` — so the human never has to
   infer whether they reached the repo.

If you don't have git access, just output the findings markdown in this chat
(per the chat-only fallback above), state explicitly that you could NOT
commit/push, and the user will commit it manually.
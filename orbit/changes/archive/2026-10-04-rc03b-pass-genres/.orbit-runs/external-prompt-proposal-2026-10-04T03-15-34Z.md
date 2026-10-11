# External Review: rc03b-pass-genres (iteration 1)

You are reviewing an OpenSpec change as a second pair of eyes. Your value is
your independent take — be thorough; flag anything that looks wrong,
inconsistent, or unclear. Don't be charitable to the authoring AI's reasoning.

## Repo

https://github.com/las-sal/orbit-spec.git — branch `d-arc` (pull the latest; the change directory is `orbit/changes/rc03b-pass-genres/`)

## Project context (read first)

- `CLAUDE.md` — handoff orientation (if present)
- `orbit/project.md` — project goals + stack (if present)
- `*_convention.md` at repo root — naming, error handling, etc. (if present)
- `orbit/lenses/perspectives.md` — named callers worth validating from (if present)
- `orbit/lenses/critical-paths.md` — user flows worth walking end-to-end (if present)
- `orbit/changes/rc03b-pass-genres/.orbit-runs/` — iteration history; see what's
  already been addressed in prior cycles

## Cycle context

- Iteration: 1 (first external review for this change in proposal mode)
- Prior internal findings still open: none — the fresh proposal pass (`review-proposal-2026-10-04T03-01-32Z.json`, 0C/11W/3S) was walked to zero in `address-reviews-2026-10-04T03-13-15Z.json` (a corrective record; the first log `…T03-12-36Z.json` carried mis-keyed file paths and matched nothing by the gate key — both stay on the trail)
- Prior external findings still open: none (no prior external pass)
- Resolved since last review: the fourteen fresh findings — the grep test rewritten as two decidable rules (PHRASE + REGION); the pass-genre table fenced as a production with a parity anchor; the in-context body's one permitted trail read (the `address-reviews-*.json` listing + `source_path`) named; the VERIFICATION row bounded to qualifying walks after the latest independent pass; a "Dispatching a fresh pass" step added to the task list; the hash pin replacing a git-diff pin; the least-recently-used ordering input; the architecture iteration note EXEMPTED (not retired); the owner's sentence permitting the body's one mirror; the brief's content list stated once; the worked example and the pushback epitome added to tasks; the stage charter amended by cascade; "genre" qualified as "pass genre" with the render-genre axis acknowledged by pointer

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

## What to read for THIS review (--as proposal)

- orbit/changes/rc03b-pass-genres/proposal.md
- orbit/changes/rc03b-pass-genres/design.md (incl. `## Mechanism → artifacts` and `## Touchpoints`)
- orbit/changes/rc03b-pass-genres/tasks.md
- orbit/changes/rc03b-pass-genres/specs/<capability>/spec.md — three deltas: `orbit-conventions` (1 MODIFIED, the pass-genre table as a fenced production + the review-genre brief rule with its BOUNDED residual), `orbit-review` (1 ADDED + 1 MODIFIED), `orbit-review-external` (3 MODIFIED, one of them the 186-line prompt requirement edited in a handful of lines)
- orbit/changes/rc03b-pass-genres/explore.md — the exploration this was consumed from: two live rules with Mechanism entries (D-rc03-2 DERIVED, D-rc03-3 BOUNDED), D-rc03-4 assigned to the sibling stage rc03c, D-rc03-12 the edit table
- orbit/specs/orbit-conventions/spec.md, orbit/specs/orbit-review/spec.md, orbit/specs/orbit-review-external/spec.md — the baselines the MODIFIED blocks copy; diff each block against its baseline
- The prose the deltas describe, so you can EXECUTE claims rather than read them: src/core/templates/workflows/review.ts (the review body, its external-handoff reference, the prompt template, mode-sections — this very prompt was built from them), src/core/artifact-graph/gates.ts (`canonicalNextForReviewed`, `commandForClass`), src/core/artifact-graph/trail.ts (`TrailPass`, `TrailResolution`), the generated surface under .claude/skills/orbit-review/ (run `npm run build && node bin/orbit.js update --force` after pulling if it is absent), test/helpers/owner-text.ts (`ownerText`, `fencedProduction`), test/core/severity-ladder-parity.test.ts
- orbit/architecture/clean-up-review-cycle.md — `### Stage rc03b-pass-genres`, `### Stage rc03c-verification-record`, `### Stage rc03-review-genres` (the split parent), rulings R-crc-1, R-crc-4, R-crc-10, R-crc-13, R-crc-14; CLAUDE.md (root)

## What to look for

1. **Structure & Delta Integrity** — required artifacts present; ADDED/MODIFIED/REMOVED/RENAMED valid; `orbit validate rc03b-pass-genres --strict` would pass; `orbit fingerprint rc03b-pass-genres --check` verifies.
2. **Internal Coherence** — proposal aligns with design aligns with specs aligns with tasks. Count/label consistency. No scope creep. In particular: do the three statements of the pass-genre decision (the owner's fence, design D1, the proposal) agree on the QUALIFYING-WALK bound and on the mode-less row?
3. **Cross-Doc Coherence** — `CLAUDE.md`, the stage charter, `*_convention.md` still accurate after this change.
4. **Archive Consistency** — the MODIFIED blocks carry their baselines whole (diff them); the ADDED requirement does not contradict `orbit-review`'s `Pushback discipline on stale findings` or `Iteration note when prior runs exist`; the deleted iteration-3+ option is not still referenced elsewhere in the baseline or the body.
5. **Codegen Readiness** — can the two grep rules (PHRASE, REGION) be implemented as written and do they partition the real generated surface? Construct the cases: a `.orbit-runs/` mention in `external-handoff.md`'s iteration count (should NOT be a hit), the prompt template's project-context list (SHOULD be), the body's Step 5 for a VERIFICATION pass. Can the in-context body decide its own pass genre from the listing rule alone?
6. **Gap Hunt** — could a fresh AI implement this from these specs alone? What does the "Dispatching a fresh pass" step look like when no subagent facility exists (an adopter on another tool)? What happens to a `blind-pair` member when the brief rule and the gate's blindness predicate disagree?
7. **Drift Hunt** — "genre" unqualified where "pass genre" is meant; "readable walk" where "qualifying walk" is meant; the exploration's wording surviving in live artifacts; the charter's amended paragraph vs the delta.
8. **Inline Review Marker Residue** — any `@review:` markers still present?
9. **Pre-Handoff Sweep** — anything else before apply? The user-validation task 3.5 reads the NEXT external prompt — is its measure well-defined?

## Severity

Grade by `orbit-conventions`' Severity ladder. CRITICAL: a user path breaks or data is lost, AND the finding carries its reproduction — a case the reader can re-execute: the inputs, the rule or command, the expected result, the observed result (a command in system mode; a constructed case in proposal mode). WARNING: an implementation built to the artifact as written could diverge from what it intends. SUGGESTION: everything else. When unsure, grade lower. A condition that must stop apply regardless of consequence — an `orbit validate` failure, an unresolved `@review:` marker — is a BLOCK, not a severity: list it under `## Blocks`.

## Output format — write to:

`orbit/changes/rc03b-pass-genres/.orbit-runs/external-proposal-<TS>.md`

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
   git add orbit/changes/rc03b-pass-genres/.orbit-runs/external-proposal-<TS>.md
   git commit -m "External review (proposal, iter 1): rc03b-pass-genres

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   Then STATE PLAINLY in your chat output that the findings landed —
   `Findings committed (<short-sha>) and pushed` — so the human never has to
   infer whether they reached the repo.

If you don't have git access, just output the findings markdown in this chat
(per the chat-only fallback above), state explicitly that you could NOT
commit/push, and the user will commit it manually.

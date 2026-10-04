# External Review: rc04b-forward-recommendation (iteration 1)

You are reviewing an OpenSpec change as a second pair of eyes. Your value is
your independent take — be thorough; flag anything that looks wrong,
inconsistent, or unclear. Don't be charitable to the authoring AI's reasoning.

## Repo

https://github.com/las-sal/orbit-spec.git (branch `d-arc`)

## Project context (read first)

- `CLAUDE.md` — handoff orientation (if present)
- `orbit/project.md` — project goals + stack (if present)
- `*_convention.md` at repo root — naming, error handling, etc. (if present)
- `orbit/lenses/perspectives.md` — named callers worth validating from (if present)
- `orbit/lenses/critical-paths.md` — user flows worth walking end-to-end (if present)
- `orbit/changes/rc04b-forward-recommendation/.orbit-runs/` — iteration history; see what's
  already been addressed in prior cycles

## Cycle context

- Iteration: 1 (first external review of this change in proposal mode)
- Prior internal findings still open: 0 — the fresh internal pass (`.orbit-runs/review-proposal-2026-10-03T22-29-59Z.json`, 0 CRITICAL / 7 WARNING / 5 SUGGESTION) was walked to zero in `.orbit-runs/address-reviews-2026-10-03T22-40-17Z.json`
- Prior external findings still open: none (no prior external review)
- Resolved since last review (the twelve, by title): the gates.ts `isIndependent` export versus the zero-diff claims (option A — the export stays, the measurement was restated); exit (2)'s grep restated as a column-0 grep; the prompt fence's chat-echo step and two scenarios now name `## Direction`; the content contract given ONE owner (`orbit-report-rendering`'s ADDED Direction requirement) and the shape ONE owner (`orbit-emit-composition`'s ADDED requirement), other sites pointing; the external normalizer sets `reviewerClass: "external"`; task 1.5's nested-allowlist wording; five external `## Direction` edge cases decided in the conventions format; an unrecognised `reviewer_class` refused at the write gate; the golden count corrected (one independent golden, not fourteen); the foreclosed external × architecture clause added; `### Blocks` named in the report grammar's numbered order; a trail.ts line citation corrected.

Context the artifacts assume: this is stage rc04b of the `clean-up-review-cycle` program. The change gives every INDEPENDENT review pass (reviewer class `fresh` or `external`) a forward-recommendation slot — `direction: {disposition, reasoning}` with `disposition` ∈ {forward, hold} — refused at the write gate when absent on an internal independent emit, MARKED (`[no direction]` / `[direction malformed]`) at render when absent or malformed on an external file, rendered as its own `### Direction` section between Suppressed and Commentary, and carried by the external prompt as a `## Direction` section. Five capabilities were DECLARED against the program's three-capability ceiling by the user. Note: the shipped output format you are asked to write in BELOW is today's format — it has no `## Direction` section yet; this change adds one. Do not write a `## Direction` section in your findings file; the current parser would ignore it.

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

## What to read for THIS review (--as proposal)

```
- orbit/changes/rc04b-forward-recommendation/proposal.md
- orbit/changes/rc04b-forward-recommendation/design.md
- orbit/changes/rc04b-forward-recommendation/tasks.md
- orbit/changes/rc04b-forward-recommendation/specs/<capability>/spec.md (every spec under specs/ — five capabilities)
- orbit/changes/rc04b-forward-recommendation/explore.md (the exploration this change was promoted from; its Mechanism section carries the four rules' domain tables)
- orbit/specs/<capability>/spec.md (archived baselines — for delta consistency checks: orbit-emit-composition, orbit-report-rendering, orbit-conventions, orbit-review-external, orbit-review)
- orbit/architecture/clean-up-review-cycle.md — the program doc: R-crc-1, R-crc-9, R-crc-10, R-crc-11(f)/(g), R-crc-13, R-crc-14 and the `### Stage rc04b-forward-recommendation` charter
- The code the artifacts name (read it, do not trust the artifacts' description of it): src/core/emit-composition.ts, src/core/report-render.ts, src/core/artifact-graph/trail.ts and gates.ts, src/core/templates/workflows/review.ts and address-reviews.ts, test/core/severity-ladder-parity.test.ts, test/core/emit-schema-parity.test.ts, test/fixtures/report-golden/
```

## What to look for

1. **Structure & Delta Integrity** — required artifacts present; ADDED/MODIFIED/REMOVED/RENAMED valid; `orbit validate` would pass.
2. **Internal Coherence** — proposal aligns with design aligns with specs aligns with tasks. Count/label consistency. No scope creep.
3. **Cross-Doc Coherence** — `CLAUDE.md`, `project.md`, `*_convention.md` still accurate after this change.
4. **Archive Consistency** — ADDED don't contradict baseline; RENAMED FROM names exist; REMOVED not still referenced. A MODIFIED block must reproduce its baseline's full content plus the stated change — a block that silently drops a baseline scenario is the failure mode this repo has been bitten by.
5. **Codegen Readiness** — no implicit requirements; no decisions left to codegen; no ambiguity. Would two implementers building from these specs produce the same `direction` slot, the same `## Direction` parse, the same render?
6. **Gap Hunt** — could a fresh AI implement this from these specs alone? Unstated assumptions? Error paths? State transitions? Execute cheap checks against the real code rather than trusting the design's claims about it.
7. **Drift Hunt** — old vocabulary lingering; consistency with `*_convention.md`. Is any rule stated in more than one spec (R-crc-14 — one owner, pointers everywhere else)?
8. **Inline Review Marker Residue** — any `@review:` markers still present (must be addressed before apply)?
9. **Pre-Handoff Sweep** — anything else before shipping?

## Severity

Grade by `orbit-conventions`' Severity ladder. CRITICAL: a user path breaks or data is lost, AND the finding carries its reproduction — a case the reader can re-execute: the inputs, the rule or command, the expected result, the observed result (a command in system mode; a constructed case in proposal mode). WARNING: an implementation built to the artifact as written could diverge from what it intends. SUGGESTION: everything else. When unsure, grade lower. A condition that must stop apply regardless of consequence — an `orbit validate` failure, an unresolved `@review:` marker — is a BLOCK, not a severity: list it under `## Blocks`.

## Output format — write to:

`orbit/changes/rc04b-forward-recommendation/.orbit-runs/external-<as>-<TS>.md`

(Where <TS> is today's timestamp in ISO format. Pick a fresh timestamp so this
file doesn't overwrite prior reviews.)

Use this exact markdown structure:

```markdown
# External Review: rc04b-forward-recommendation (iteration 1)

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
   `**Reproduction**:` field, and every `## Blocks` item. Do NOT abbreviate or summarize — the chat output
   is the immediately-visible read for the user (they should be able to
   evaluate every finding without opening the file). The file remains the
   canonical record for `--from-file` parsing.

2. **Commit and push the findings file** (if your environment supports git):

   ```bash
   git add orbit/changes/rc04b-forward-recommendation/.orbit-runs/external-<as>-<TS>.md
   git commit -m "External review (<as>, iter 1): rc04b-forward-recommendation

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   Then STATE PLAINLY in your chat output that the findings landed —
   `Findings committed (<short-sha>) and pushed` — so the human never has to
   infer whether they reached the repo.

If you don't have git access, just output the findings markdown in this chat
(per the chat-only fallback above), state explicitly that you could NOT
commit/push, and the user will commit it manually.

# External Review: bounded-closure-semantics (iteration 1)

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
- `orbit/changes/bounded-closure-semantics/.orbit-runs/` — iteration history; see what's
  already been addressed in prior cycles

## Cycle context

- Iteration: 1 — first external review for this change in system mode. This is the EXTERNAL
  half of the `review-system` gate's blind pair; a fresh in-repo pass runs blind to you. Do
  not read any `review-system-*.json` or `address-reviews-*.json` written after the two
  `apply-2026-09-25T*.json` emits, if any exist when you pull.
- Prior internal findings still open: 0 — the proposal cadence (one in-context pass, one
  fresh pass) produced 7 + 7 findings, all walked to zero before apply
  (`address-reviews-2026-09-25T13-41-16Z.json`, `address-reviews-2026-09-25T13-47-56Z.json`).
  No system-mode pass has run yet.
- Prior external findings still open: 0 (none in this mode).
- Resolved since last review: n/a — no prior review of the applied state.

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

## Change-specific context (what shipped, and where to press)

This change is stage `rc13a-explore-mechanism-convention` of the program in
`orbit/architecture/clean-up-review-cycle.md` (second attempt; the first archived without
syncing at `orbit/changes/archive/2026-09-15-rc13-explore-mechanism/`). It ships NO engine
code. The mechanism is PROSE in ONE workflow body — `src/core/templates/workflows/explore.ts`
(the `# Orbit additions` half) — plus generated-surface assertions in
`test/core/templates/orbit-generated-surface.test.ts` and two re-pinned hashes in
`test/core/templates/skill-templates-parity.test.ts`. The generated `.claude/` surface is
gitignored; run `npm run build && node bin/orbit.js init --tools claude` in a scratch copy if
you want to read the rendered `SKILL.md`, or read the template literal directly.

What the body now claims, and what the two delta specs say it must:

- `explore.md` has SIX sections (Premise, Mechanism, Decisions, Open questions, Considered &
  out, References) and TWO status tokens; three productions are stated ONCE in the body (the
  status-header regex, the Decisions entry production, the Mechanism grammar) and every other
  mention is supposed to POINT (ruling R-crc-14: a rule is stated once, in the spec that owns
  it). Press on this: find any second statement of a rule — in the body, across the two delta
  specs, or between spec and body — that could diverge.
- Closure is ACCOUNTED, not CLOSED: DERIVED/SOURCED mean closed; BOUNDED means open-declared
  and REQUIRES `Residual kind:` + `Residual method:`. Check the body, the specs and the shipped
  exemplar agree on every token and slot name, byte for byte.
- The exemplar in the body is D-bcs-3's Mechanism entry copied verbatim from
  `orbit/changes/bounded-closure-semantics/explore.md`; the test parses the exemplar's lines
  against the grammar. Check whether the test's regexes and the grammar's prose actually agree
  (they are two extensions of one grammar — design D-bcs-11), and whether the test would still
  pass on a NON-conforming exemplar (a hollow instrument).
- One known grammar edge found at apply, recorded for the successor stage rc13b: D-bcs-8's
  Domain table row carries a GFM-escaped pipe (`\|`) inside a cell. The grammar says "two
  `member | covered by` columns"; a naive `[^|]+` cell pattern rejects that legal row. Say
  whether the grammar text or the spec should name escape semantics now, or whether leaving it
  to rc13b's parser is sound.
- Re-entry is one six-cell table (staging dir × concluded × active change), two cells refused.
  The body's Mode B table row and the re-entry subsection must not restate each other's guards
  inconsistently; the `orbit-explore-modifications` delta's `Three invocation modes supported`
  requirement points at the table. Check the three surfaces agree.
- Conclude flow: residency sweep → CONCLUDED entry (`Kind: scope`, `Re-entry:`) → header token
  → final boundary emit; NOTHING written to `.openspec.yaml` (the proposal measured that the
  change-metadata helpers strip unknown keys — `ChangeMetadataSchema` in
  `src/core/artifact-graph/types.ts`; verify that claim yourself); directory stays in place. Three KNOWN limits are
  stated with owners (Q-crc-11, rc13b, a proposed rc13c). Check the limits are real limits and
  not hidden defects — e.g. what `orbit status`, `orbit architecture status`, the explore
  counter (`src/core/parsers/explore-counter.ts`) and `orbit emit explore` actually do with a
  concluded file. Execute, don't assume: scaffold a staging dir with a concluded header and run
  the CLI against it.
- The retained requirement TITLES still say "five-section" by design (a deferred rename; the
  proposal's Risks explains why). Task 3.1 asserts zero `five-section|five sections` hits in
  `explore.ts` and lists five exemptions elsewhere in `src/` (`propose.ts:154/156`,
  `emit-composition.ts:1127`, `explore-counter.ts:12`, `audit-drift.ts:302`). Verify the
  exemption list is complete and that each exempted site is genuinely a pointer or a declared
  handoff rather than a stale restatement.
- At apply, task 6.2 (architect-tier edits at the archive tail) was converted from a checkbox
  to an AT-ARCHIVE NOTE, following the repo's convention (rc04d's tasks.md 2.3). Judge whether
  that conversion was legitimate form-correction or a quiet narrowing of what the apply gate
  counts. Task 6.1 is the one declared user-validation handoff.
- The proposal's own stated residual: no independent pass has stood on the FINAL proposal tree
  (the fresh proposal pass preceded 23 walk edits). You are the first independent read of the
  applied tree.

## What to read for THIS review (--as system)

- orbit/changes/bounded-closure-semantics/proposal.md, design.md, tasks.md, specs/
  (`specs/orbit-conventions/spec.md`, `specs/orbit-explore-modifications/spec.md`)
- orbit/changes/bounded-closure-semantics/explore.md — the exploration that is also the
  change's own conformance artifact (task 5.1)
- The change's commit range: `git diff 5e81e4b2..HEAD` (5e81e4b2 is the propose commit; the
  apply commit lands after it. If `HEAD` is still `2e975ab4`, the apply work is NOT committed —
  stop and say so rather than reviewing the proposal state.)
- orbit/specs/orbit-conventions/spec.md and orbit/specs/orbit-explore-modifications/spec.md
  (archived baselines — for baseline-compliance and delta-sync checks), plus any baseline that
  names the retained titles: orbit/specs/orbit-audit-drift, orbit-emit-composition,
  orbit-propose-modifications
- orbit/lenses/perspectives.md, orbit/lenses/critical-paths.md (judgment layer; absent in
  this repo — skip passes 4 and 5 and say so)
- Code paths touched by the change: `src/core/templates/workflows/explore.ts`,
  `test/core/templates/orbit-generated-surface.test.ts`,
  `test/core/templates/skill-templates-parity.test.ts`; readers of the format the body
  changes: `src/core/parsers/explore-counter.ts`, `src/core/emit-composition.ts` (explore
  emit), `src/core/orientation.ts`, `src/core/architecture/state.ts`, and the propose body
  `src/core/templates/workflows/propose.ts` (consume mode)

## What to look for

0. **verify-change-style structural check** — tasks done, spec coverage, design adhered (the external AI runs its own equivalent of upstream verify-change).
1. **Baseline Compliance** — does this change break any archived `orbit/specs/` requirement?
2. **Cohesion** — callers/dependents outside the tasks list. Signature drift, ripple effects, side-effect additions.
3. **Surface Walk** — every CLI / MCP / HTTP / public-function surface in `orbit/specs/` still coherent? Capabilities ARE surfaces; don't redefine them.
4. **Perspective Reviews** — for each named perspective in `orbit/lenses/perspectives.md`, simulate the caller's POV.
5. **Critical-Path Scan** — for each flow in `orbit/lenses/critical-paths.md`, walk end-to-end.
6. **Drift / Residue** — vocabulary residue, stale references, archive-coherence misses.

## Output format — write to:

`orbit/changes/bounded-closure-semantics/.orbit-runs/external-system-<TS>.md`

(Where <TS> is today's timestamp in ISO format. Pick a fresh timestamp so this
file doesn't overwrite prior reviews.)

Use this exact markdown structure:

```markdown
# External Review: bounded-closure-semantics (iteration 1)

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
   content as the file: every severity section (`## CRITICAL` / `## WARNING` /
   `## SUGGESTION`), every `### Title` entry, every `**File**:` and
   `**Description**:` field. Do NOT abbreviate or summarize — the chat output
   is the immediately-visible read for the user (they should be able to
   evaluate every finding without opening the file). The file remains the
   canonical record for `--from-file` parsing.

2. **Commit and push the findings file** (if your environment supports git):

   ```bash
   git add orbit/changes/bounded-closure-semantics/.orbit-runs/external-system-<TS>.md
   git commit -m "External review (system, iter 1): bounded-closure-semantics

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   Then STATE PLAINLY in your chat output that the findings landed —
   `Findings committed (<short-sha>) and pushed` — so the human never has to
   infer whether they reached the repo.

If you don't have git access, just output the findings markdown in this chat
(per the chat-only fallback above), state explicitly that you could NOT
commit/push, and the user will commit it manually.

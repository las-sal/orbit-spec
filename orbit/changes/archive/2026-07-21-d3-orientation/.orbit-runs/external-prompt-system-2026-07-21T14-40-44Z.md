# External Review: d3-orientation (iteration 1, SYSTEM mode)

You are reviewing an OpenSpec change POST-APPLY as a second pair of eyes — the whole product
state, not just the artifacts. Your value is your independent take; don't be charitable to the
authoring AI's reasoning, and verify the implementation against the specs rather than trusting
either.

## Repo

https://github.com/las-sal/orbit-spec.git — branch `d-arc`

## Project context (read first)

- `CLAUDE.md` — handoff orientation
- `orbit/architecture/d-arc-arbitered-flow.md` — this change is **Stage D3 of the D-arc
  program**; run `node bin/orbit.js architecture show d-arc-arbitered-flow d3-orientation` for
  the charter + TWO exit criteria; rulings R-d-1..10 constrain the design. The status log's
  2026-07-20 entry records the post-apply state.
- `orbit/lenses/` — ABSENT in this repo
- `orbit/changes/d3-orientation/.orbit-runs/` — full iteration history

## Cycle context

- Iteration: 1 in SYSTEM mode (first external system pass). The change is APPLIED: 17/17
  tasks, 1742 tests green (baseline 1712 + 30 new).
- Proposal-phase history: 8 passes (in-context 1/5/6, fresh 2/3/4, external GPT-5 Codex ×2),
  24 findings, ALL resolved; apply proceeded via a recorded `gate_overridden` (R-d-10's
  sanctioned interim path — the strict predicate wanted the clean pass independent).
- System iter 1 (in-context, `review-system-2026-07-20T19-41-49Z.json`): 0 CRITICAL /
  2 WARNING / 2 SUGGESTION, all resolved (`address-reviews-2026-07-21T13-35-45Z.json`):
  pending review chips gained the `review ⟲` text identity; the WAITING phrase now carries
  the spec literal with the mode outside it (`2 external review(s) packaged, 1 returned
  (proposal)`); an unused import dropped; CLAUDE.md's stale deferred line cleaned.
- TWO record-only corrections are on the audit record (never edited retroactively): the
  proposal iter-6 emit's "Gate review-proposal PASSED" was a hand-authored verdict (the
  engine computed unpassed — the latest independent pass was iter 4, which carried findings),
  and two emits' `next_recommended` diverged from the engine's computed `nextCommand`. Both
  corrections are noted in the system iter-1 emit's iteration note.
- Historical CRITICAL classes across seven orbit cycles: (a) un-delta'd live-baseline text
  contradicting a delta, (b) a delta requirement with no task carrier, (c) a triggered
  live-baseline obligation with no carrier, (d) two same-cadence resolutions contradicting
  each other. In SYSTEM mode add: (e) implementation diverging from a normative scenario
  literal — BOTH system iter-1 WARNINGs were class (e), caught by rendering against the live
  repo. Render the real views yourself; don't trust fixtures alone.

Do not push back on stale findings — pushback discipline is enforced on resolution, not
review. Just flag what you observe.

## What the change shipped (orientation)

D-arc Stage D3 — orientation (status absorption). NEW `src/core/orientation.ts` (pure
composition: continuity predicate with same-second tie-break — token, then workstream name,
then filename, SHARED by sprint anchoring and global LAST; count-based WAITING per change+mode
with spine-invalid emits excluded; fault isolation — unreadable/JSON-invalid/spine-invalid
emits skipped with next-older-valid fallback, broken workstreams render degraded rows, exit 0;
archived changes' trails feed global LAST ONLY). Bare `orbit status` = the sprint view (the
former "Missing required option --change" error path claimed; `--change` output and the
no-changes message byte-identical, regression-asserted); `orbit status --full` = the arc view
(PROGRAM band from the architecture buckets, workstreams nested under cited stages, uncited →
standalone, EVERY entry carrying its full orientation tuple — the arc's cold-start exit
criterion; flat fleet with zero parseable docs). `--json` both tiers via ONE discriminated
workstream-entry shape: healthy `{name, kind, stage?, strip, position, last, next, status?}`
(keys CLOSED; change entries NEST the per-change payload under `status` — `status.gates` the
single source, no entry-level gates key; explore entries have no `status` and
`position: "exploring"`; degraded `{name, kind, degraded: true, error}` + trustworthy fields;
absent fields omitted, never null; `strip` = ordered `{phase, glyph, detail?}` chip array —
text render derived, never a pre-rendered string in JSON). The explore BEGIN emit ships
mode-aware in the generated template (Mode B zero counts + Early canonical; Mode C back-fills
FIRST then fires with back-filled counts; same-second bump-forward collision; no retro-fire);
explore parity hashes re-pinned. CLAUDE.md carries the cold-start pointer; issue #3 closed.
Spec deltas: 16 requirements (9 ADDED + 7 MODIFIED) across 5 files (orbit-orientation ADDED;
orbit-run-summary-emit ×3, orbit-explore-modifications, orbit-engine-gates ×2, orbit-architect
MODIFIED — the baseline sync lands at archive). 17 tasks in 5 groups, all checked.

## What to read for THIS review (--as system)

- The implementation: `git diff e29f03d..HEAD` (the apply + system-fix commits: b40ad03,
  50146f5, 8318892, ec9fe09) — principally `src/core/orientation.ts`,
  `src/commands/workflow/status.ts`, `src/cli/index.ts`,
  `src/core/templates/workflows/explore.ts`, `test/core/orientation.test.ts`,
  `test/commands/status-orientation.test.ts`
- The specs the implementation must satisfy: all 5 delta files under
  `orbit/changes/d3-orientation/specs/` (orbit-orientation is the core — 15 requirements of
  render grammar, predicate, shapes, fault isolation)
- proposal.md / design.md / tasks.md (17/17 checked — verify honestly)
- Live baselines `orbit/specs/*/spec.md` (does the shipped behavior break any baseline
  requirement? especially orbit-engine-gates' `--change` contract and orbit-run-summary-emit)
- The generated surface: `.claude/skills/orbit-explore/SKILL.md` (gitignored — regenerate via
  `npm install && npm run build && node bin/orbit.js init --tools claude` in a scratch copy,
  or read the template source directly)

Useful commands: `npm install && npm run build`, `npm test` (expect 1742 — if your workspace
path contains a SPACE, ~24 command tests fail on unquoted path interpolation; that class is
environmental, not evidence), `node bin/orbit.js status` / `status --full` / `status --json` /
`status --full --json` / `status --change d3-orientation` (render ALL of these against the
repo itself and against a scratch fixture; compare to the spec's scenario literals),
`node bin/orbit.js validate d3-orientation --strict`,
`node bin/orbit.js fingerprint d3-orientation --check` (expect 7/7).

## What to look for (system-mode passes)

1. **Verify-change** — every task genuinely done? every spec requirement implemented and
   scenario-covered? design adhered to (pure composition, no artifact inference, READ-ONLY)?
2. **Baseline Compliance** — does the shipped behavior break ANY archived baseline
   requirement (not just the delta'd ones)? The `--change` gate surface especially.
3. **Cohesion** — callers/dependents outside the tasks: anything else reading `statusCommand`,
   `printStatusText`, trail files, or the templates that drifted?
4. **Surface Walk** — every CLI surface still coherent (status flags, architecture commands,
   fingerprint, validate)? No surface removed or accidentally repurposed?
5. **Critical-Path / Render Fidelity** — walk the real renders end-to-end against the spec
   grammar: strip literals, WAITING literals, `also` line, degraded rows, ladder rungs, JSON
   shapes both tiers (incl. explore-sprint and degraded variants), tie-breaks, archived-LAST.
   Class (e) lives here.
6. **Drift / Residue** — stale vocabulary, overlay-era leakage, unused imports/exports, test
   assertions that contradict spec literals.
7. **Pre-Archive Sweep** — anything that must be fixed before the baseline sync lands
   (the 7 MODIFIED blocks merge into live baselines at archive).

## Output format — write to:

`orbit/changes/d3-orientation/.orbit-runs/external-system-<TS>.md`

(Where <TS> is today's timestamp in ISO format with hyphens. Pick a fresh timestamp.)

Use this exact markdown structure:

```markdown
# External Review: d3-orientation (iteration 1, system)

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

<Optional: overall impression, broader concerns. Omit the whole `## Notes` section if you have nothing to add.>
```

If your environment doesn't support file writes (chat-only interface), output the markdown
directly and the user will save it.

## After completing the review

1. **Output the full findings markdown in chat** — every severity section, every entry, no
   abbreviation. The file remains the canonical record for `--from-file` parsing.

2. **Commit and push the findings file** (if your environment supports git):

   ```bash
   git add orbit/changes/d3-orientation/.orbit-runs/external-system-<TS>.md
   git commit -m "External review (system, iter 1): d3-orientation

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   Then STATE PLAINLY in your chat output that the findings landed —
   `Findings committed (<short-sha>) and pushed`.

If you don't have git access, output the findings markdown in this chat, state explicitly that
you could NOT commit/push, and the user will commit it manually.

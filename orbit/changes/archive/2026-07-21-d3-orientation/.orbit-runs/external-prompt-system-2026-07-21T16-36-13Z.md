# External Review: d3-orientation (iteration 2, SYSTEM mode)

You are reviewing an OpenSpec change POST-APPLY as a second pair of eyes — the whole product
state, not just the artifacts. This is the FINAL external pass before archive: the
review-system gate is engine-computed PASSED after a six-pass system cadence, so your job is
adversarial confirmation — find what everyone missed, and verify the latest resolutions
actually landed. Don't be charitable to the authoring AI's reasoning; render the real views
rather than trusting either the artifacts or the tests.

## Repo

https://github.com/las-sal/orbit-spec.git — branch `d-arc`

## Project context (read first)

- `CLAUDE.md` — handoff orientation
- `orbit/architecture/d-arc-arbitered-flow.md` — this change is **Stage D3 of the D-arc
  program**; run `node bin/orbit.js architecture show d-arc-arbitered-flow d3-orientation`
  for the charter + TWO exit criteria; the status log's 2026-07-20 entry records the
  post-apply state.
- `orbit/lenses/` — ABSENT in this repo
- `orbit/changes/d3-orientation/.orbit-runs/` — full iteration history

## Cycle context

- Iteration: 2 in SYSTEM mode (iter 1 was GPT-5 Codex, `external-system-2026-07-21T15-04-46Z.md`).
  The change is APPLIED: 17/17 tasks, **1753 tests green** expected.
- Whole-change history: 14 review passes, **53 findings, ALL resolved, none re-opened**
  (proposal: 8 passes / 24 findings; system: 6 passes / 29 findings).
- System cadence so far: in-context iter 1 (4 findings: `review ⟲` chip identity; WAITING
  spec literal with the mode outside; unused import; stale CLAUDE.md line) → **your iter 1**
  (1 CRITICAL: swallowed metadata failures + missing projectRoot; 6 WARNING: ready-gate glyph,
  spine-valid ⟲N counting, tie-break direction, architecture-bucket reuse, pluralization,
  frontier also-phase — ALL resolved, incl. NEW `src/core/architecture/buckets.ts` consumed by
  both surfaces) → fresh iter 2 (3 W: degraded-explore `next` kept via user fork A;
  one-line degraded rows; the ⟲N spec letter aligned to spine-valid counting; 2 S: malformed
  docs' quiescent siblings reach WAITING; kind+name identity) → in-context iter 3 confirm
  (clean; gate flipped PASSED) → fresh iter 4, adversarial (2 W + 1 S, the LATEST batch —
  resolved at HEAD, scrutinize hardest):
  1. The FOURTH kind+name comparison site: `--full`'s text `citedNames` filter was name-only
     and silently dropped an uncited twin-named workstream → now `citedKeys` keyed
     `kind:name`, with a cited-change/uncited-explore twin fixture.
  2. FOUR generated-body sites (apply-change.ts ×3, archive-change.ts ×1) still directed bare
     `orbit status --json` for per-change gate payloads — post-D3 that returns the orientation
     shape and possibly a DIFFERENT change's sprint → all scoped to
     `orbit status --change <name> --json`, surface regenerated, 4 parity hashes re-pinned.
  3. Two spec phrasings for one empty-`last` render → unified on `no emits yet` (the shared
     empty-trail line) before the archive sync.
- Record-only corrections on the audit record (do not re-flag): one hand-authored proposal-
  phase gate verdict and three emit `next_recommended` divergences from the engine's computed
  `nextCommand` — all corrected; verdicts and next-lines are now read from the engine.
- Dominant finding classes across this change: (e) implementation vs normative scenario
  literal (caught by RENDERING, not fixtures); change-completeness residue in a LAYER the
  sweep missed (specs swept, templates not — your iter-1 CRITICAL and fresh iter-4's W2 were
  both this genre). Hunt both again.

Do not push back on stale findings — pushback discipline is enforced on resolution, not
review. Just flag what you observe.

## What the change shipped (orientation)

D-arc Stage D3 — orientation (status absorption). NEW `src/core/orientation.ts` (pure
composition: continuity predicate with the shared same-second tie-break — token, then
workstream name, then filename, earlier wins, ONE direction for per-trail newest / sprint
anchor / global LAST; count-based WAITING per change+mode — singular `1 external review
packaged, 0 returned` / plural `N external review(s) packaged, M returned`, mode OUTSIDE the
phrase, spine-invalid excluded; fault isolation — unreadable/JSON-invalid/spine-invalid emits
skipped (recency, WAITING, and ⟲N chip counts alike), ONE validated
`readChangeMetadata(ws.dir, projectRoot)` inside the boundary so invalid metadata degrades
BOTH workstream kinds, degraded explores keep trustworthy `next` (trail-recorded or the Early
canonical), degraded changes keep none, degraded text rows are one-line with full errors in
JSON; archived changes' trails feed global LAST ONLY; kind+name workstream identity
everywhere compared; WAITING clause (a) scans parseable + malformed buckets). Bare
`orbit status` = the sprint view (the "Missing required option --change" error path claimed;
`--change` and no-changes outputs byte-identical); `--full` = the arc view (PROGRAM band via
the SHARED `src/core/architecture/buckets.ts` builder + renders — `architecture status` must
stay byte-identical and its `--json` must deep-equal `--full`'s `program`; per-workstream
orientation tuples — the arc's cold-start exit criterion; flat fleet at zero parseable docs).
`--json` both tiers via ONE discriminated workstream-entry shape
`{name, kind, stage?, strip, position, last, next, status?}` (keys CLOSED; change payload
NESTS under `status`, `status.gates` the single source, no entry-level gates key; explore
`position: "exploring"`, no `status`; degraded `{name, kind, degraded: true, error}` +
trustworthy fields; absent OMITTED never null; `strip` = ordered `{phase, glyph, detail?}`
chip array — text render derived: `review ⟲` pending identity, `review ⟲6 ✓`,
`apply ▶ 0/N` entry form). Explore BEGIN emit mode-aware in the generated template (Mode B
zero counts + Early canonical; Mode C back-fills FIRST then back-filled counts; same-second
bump-forward; no retro-fire). Spec deltas: 16 requirements (9 ADDED + 7 MODIFIED) across 5
files — they SYNC INTO LIVE BASELINES AT ARCHIVE, so any letter/behavior mismatch you find is
a pre-archive fix. 17 tasks in 5 groups, all checked.

## What to read/run for THIS review (--as system)

- The implementation: `git log --oneline e29f03d..HEAD`; principally src/core/orientation.ts,
  src/commands/workflow/status.ts, src/core/architecture/buckets.ts,
  src/commands/architecture.ts, src/cli/index.ts, src/core/templates/workflows/explore.ts,
  src/core/templates/workflows/apply-change.ts + archive-change.ts (the iter-4 scoping),
  test/core/orientation.test.ts, test/commands/status-orientation.test.ts.
- The 5 delta spec files under orbit/changes/d3-orientation/specs/ (the normative letter that
  syncs at archive) and the live baselines orbit/specs/*/spec.md (contradiction sweep).
- RUN: `npm install && npm run build`; `npm test` (expect 1753; ~24 space-path command-test
  failures are environmental if your workspace path contains a SPACE); render EVERYTHING —
  `node bin/orbit.js status`, `--full`, `--json`, `--full --json`,
  `--change d3-orientation` (+ --json), `architecture status` (+ --json); scratch fixtures
  for the edges (degraded change AND explore sprints, twin names cited/uncited, flat fleet,
  singular WAITING, same-second ties, malformed doc with a well-formed sibling, ladder rungs).
- `node bin/orbit.js validate d3-orientation --strict` (valid);
  `node bin/orbit.js fingerprint d3-orientation --check` (7/7 verified).
- The generated surface: regenerate in a scratch copy (`node bin/orbit.js init --tools
  claude`) or read the template sources; verify the apply/archive bodies' scoped
  `orbit status --change <name> --json` references and the explore body's mode-aware BEGIN
  emit block.

## What to look for (system-mode passes)

1. **Verify-change** — tasks genuinely done; every spec requirement implemented with scenario
   coverage; design adherence (pure composition, no artifact inference, READ-ONLY).
2. **Baseline Compliance** — does shipped behavior break ANY baseline requirement?
3. **Cohesion** — callers/dependents outside the tasks; the buckets refactor's consumers; the
   template scoping's parity tests.
4. **Surface Walk** — every CLI surface coherent; `architecture status` byte-identical;
   nothing removed or repurposed.
5. **Render Fidelity** (class (e)) — every scenario literal against the real renders.
6. **Drift / Residue** — stale vocabulary; any OTHER layer (docs, templates, references,
   tests) still directing bare `orbit status` where the per-change payload is meant; unused
   exports; assertions contradicting spec literals.
7. **Pre-Archive Sweep** — the 7 MODIFIED blocks sync verbatim: any remaining
   letter/behavior mismatch; anything else before archive.

## Output format — write to:

`orbit/changes/d3-orientation/.orbit-runs/external-system-<TS>.md`

(Where <TS> is today's timestamp in ISO format with hyphens. Pick a fresh timestamp.)

Use this exact markdown structure:

```markdown
# External Review: d3-orientation (iteration 2, system)

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
   git commit -m "External review (system, iter 2): d3-orientation

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   Then STATE PLAINLY in your chat output that the findings landed —
   `Findings committed (<short-sha>) and pushed`.

If you don't have git access, output the findings markdown in this chat, state explicitly that
you could NOT commit/push, and the user will commit it manually.

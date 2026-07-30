# External Review: d4-review-consistency (iteration 1, SYSTEM mode)

You are reviewing an OpenSpec change POST-APPLY as a second pair of eyes — the whole product
state, not just the artifacts. The review-system cadence's external slot is yours: two
internal system passes ran (one clean in-context, one fresh with 5 findings — all resolved);
your job is adversarial confirmation against the REAL surfaces. Don't be charitable to the
authoring AI's reasoning; render everything yourself.

## Repo

https://github.com/las-sal/orbit-spec.git — branch `d-arc`

## Project context (read first)

- `CLAUDE.md` — handoff orientation
- `orbit/architecture/d-arc-arbitered-flow.md` — this change is **Stage D4 of the D-arc
  program**; run `node bin/orbit.js architecture show d-arc-arbitered-flow
  d4-review-consistency` for the charter + TWO exit criteria; the status log's 2026-07-29
  entry records the post-apply state and the R-d-9 seam audit.
- `orbit/lenses/` — ABSENT in this repo
- `orbit/changes/d4-review-consistency/.orbit-runs/` — full iteration history (12+ review
  passes; the newest three emits are the first D4-generation records)

## Cycle context

- Iteration: 1 in SYSTEM mode for externals (proposal mode had two external passes, both
  GPT-5 Codex). The change is APPLIED: 18/18 tasks, **1787 tests green** expected.
- Whole-change history: 17 review passes, 74 findings, ALL resolved, none re-opened.
- System phase so far: in-context iter 1 (CLEAN — and the first pass to run under the shipped
  contract: persist-first D4-generation emit, then `orbit status --change <name> --report`
  pasted verbatim) → fresh iter 2 (5 findings, 1 CRITICAL — all resolved, the LATEST batch,
  least-reviewed):
  1. CRITICAL (class d): the change's own first-run iteration-note scenario keyed on internal
     emits while the render axis counts externals → the scenario pair aligned to the shared
     pass axis (either genre counts).
  2. Single-line grammar slots (finding `title`, `stale_suppressed[].title`/`evidence`,
     `reviewer_class`, `depth`) accepted embedded newlines — record text could forge column-0
     report grammar → FAIL-LOUD rejection added to `normalizeInternalPass` (user chat-ratified
     under the new decision-lane protocol), the spec letter names the rule, three forging
     fixtures added.
  3. Task 5.1's claimed cross-source equivalence test didn't exist → it does now
     (test/core/report-render-hardening.test.ts): same finding through both genres, equal
     section sequence, byte-identical tails.
  4. A `[discuss]` worked-example heading in address' run-summary-schema reference → renamed.
  5. A `..` typo → fixed.
  That address walk was ALSO the arc's required observed cycle for exit criterion 2: the
  obvious-fix lane preview fired before any fix; the forging finding got a prose briefing; the
  user's chat directive ("fail loud") was the ratification with NO AskUserQuestion; the
  resolution log carries entry-level `ratified_via`/`resolution`.
- Dominant finding classes: (e) implementation-vs-scenario-literal (caught by RENDERING);
  (d) same-change literals contradicting each other; layer residue (a swept spec layer's
  counterpart in templates/references unswept). All three have hit this change; hunt them
  again over the LATEST resolutions.

Do not push back on stale findings — pushback discipline is enforced on resolution, not
review. Just flag what you observe.

## What the change shipped

(1) NEW `src/core/report-render.ts` + `orbit status --change <name> --report [<TS>]`: the
pure engine render of review passes — normative contract in
orbit/changes/d4-review-consistency/specs/orbit-report-rendering/spec.md (7 requirements) and
design.md D2b (the canonical line-level example ALL goldens are transcribed from). Grammar:
genre-conditional header (internal: change/mode/reviewer_class/depth from the emit; external:
change from argument, mode from filename, `external (<name>, <date>)`, no Depth); as-of
iteration/trend under ONE total pass order (token, then earlier-full-filename-more-recent;
internal emits AND external findings files count); internal-only scorecard table (Dimension ×
severity counts); findings by severity with blockquote-contained recommendations (`  > `),
single-line option bodies; Suppressed; the delimited Commentary slot (internal `commentary` /
external `## Notes`, content contract at the source in both genres); `---`-fenced engine tail
with each line only-when-computed (ungated = the rule alone). Strict per-genre validation:
internal = full spine (incl. `kind`) + mode/reviewer_class/depth + scorecard +
dimension-carrying findings + cell-rollup consistency (mismatch fails naming the cell) +
single-line slot enforcement + the D4-GENERATION BOUNDARY (both real earlier emit generations
fail with a clean `pre-capability emit` error; error fixtures byte-copied from the real
B2/D3 archives); external = confident fence-aware parse with mandatory unique Reviewer/Date.
Surface: raw resolution over ALL trail emits → tie-break → genre dispatch (spine `command`) →
normalize → render; zero-passes/`--json`/non-renderable/bare clean errors; READ-ONLY.
(2) The four generated bodies rewrote: review (persist-first; deterministic spine facts —
counts sentence + self-pointer/report-pointer; commentary contract; run-and-paste + greppable
hand-rendering prohibition, architecture exempt; the final-assessment branch machinery and
synthetic pass DELETED), address-reviews (three-lane walk; entry-level ratified_via/resolution;
`[discuss]` retired; delegation_directive; both reference docs updated), review-external
(Notes contract at template + instructions), onboard (both retired models re-taught).
Deltas: 26 requirements (8 ADDED + 18 MODIFIED) across 7 files; 18 tasks; fingerprints 18/18;
`--strict` valid; baseline 17 → 18 at archive; surface unchanged (16).

## What to read/run for THIS review (--as system)

- Implementation commits: `git log --oneline b306f79..HEAD` — principally
  src/core/report-render.ts, src/commands/workflow/status.ts, src/cli/index.ts, the four
  templates, test/core/report-render*.test.ts, test/commands/status-report.test.ts,
  test/fixtures/report-golden/.
- The 7 delta spec files (the letter that syncs at archive) vs the implementation AND vs the
  live baselines (nothing NEW un-delta'd; the pre-sync window on the 18 MODIFIED blocks is a
  known suppression, not a finding).
- RUN EVERYTHING: `npm install && npm run build`; `npm test` (expect 1787; ~24 space-path
  command failures are environmental if your workspace path contains a SPACE);
  `node bin/orbit.js status --change d4-review-consistency --report` (renders the newest
  D4-generation emit; explicit-TS a pre-D4 emit for the boundary error; try the error paths);
  bare `orbit status` / `--full` / `--change` (D3 regressions); scratch fixtures for external
  render, mismatch, forging (should fail loud), ungated tail, equal tokens;
  `node bin/orbit.js validate d4-review-consistency --strict`;
  `node bin/orbit.js fingerprint d4-review-consistency --check` (18/18).
- The generated surface on disk or via a fresh `init` in scratch: the run-and-paste + lane
  vocabulary; zero retired vocabulary outside marked retirement notes.

## What to look for

1. **Verify-change** — tasks honest (incl. the newly-added equivalence test and forging
   fixtures)? every renderer requirement scenario-covered? design adherence (pure render, no
   template imports, gate reader untouched)?
2. **Baseline Compliance** — shipped behavior vs ALL 18 baselines.
3. **Cohesion** — the --report branch vs the D3 orientation paths; status.ts callers.
4. **Surface Walk** — every CLI surface; `architecture status`; the gate model reading the
   new emit shape.
5. **Render Fidelity** (class e) — line-level D2b comparison on real renders; golden honesty.
6. **Drift/Residue** — retired vocabulary; the newest resolutions' own ripples.
7. **Pre-Archive Sweep** — anything to fix before the 18 MODIFIED blocks sync.

## Output format — write to:

`orbit/changes/d4-review-consistency/.orbit-runs/external-system-<TS>.md`

(Where <TS> is today's timestamp in ISO format with hyphens. Pick a fresh timestamp.)

Use this exact markdown structure:

```markdown
# External Review: d4-review-consistency (iteration 1, system)

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

<Optional — rendered VERBATIM into the report's delimited Commentary slot: carry the pattern behind the findings, what you probed, and risk texture; do NOT state finding counts, gate verdicts, or next commands — those exist only in the report's engine-computed sections. Omit the whole ## Notes section if you have nothing to add.>
```

If your environment doesn't support file writes (chat-only interface), output the markdown
directly and the user will save it.

## After completing the review

1. **Output the full findings markdown in chat** — every severity section, every entry, no
   abbreviation. The file remains the canonical record for `--from-file` parsing.

2. **Commit and push the findings file** (if your environment supports git):

   ```bash
   git add orbit/changes/d4-review-consistency/.orbit-runs/external-system-<TS>.md
   git commit -m "External review (system, iter 1): d4-review-consistency

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   Then STATE PLAINLY in your chat output that the findings landed —
   `Findings committed (<short-sha>) and pushed`.

If you don't have git access, output the findings markdown in this chat, state explicitly
that you could NOT commit/push, and the user will commit it manually.

# External Review: relocate-modified-upstream-workflows (iteration 1)

You are reviewing an OpenSpec change as a second pair of eyes. Your value is
your independent take — be thorough; flag anything that looks wrong,
inconsistent, or unclear. Don't be charitable to the authoring AI's reasoning.

## Repo

https://github.com/las-sal/orbit-spec (branch `main`; if you have local access,
the repo is at `/Users/sal/code/orbit-spec`)

## Project context (read first)

- `CLAUDE.md` — handoff orientation: orbit-spec is a self-contained hard fork of
  `@fission-ai/openspec@1.3.1` (vendored as the root commit `d665f12`); orbit's
  editorial layer is being relocated INTO the fork's source templates. Read this
  first — it frames everything below.
- `orbit/explore/fork-and-orbify/explore.md` — the live design exploration; the
  decisions D1–D13 it records (esp. D9 six-phase program, D11
  mechanism-neutrality, D13 inline-TS) are the change's normative context. This
  change has no `design.md`; the D-decisions play that role.
- `orbit/architecture/openspec-1.3.1-architecture.md` — verified deep-dive of
  the vendored codebase (the template→generation→adapter pipeline this change
  edits).
- `orbit/changes/relocate-modified-upstream-workflows/.orbit-runs/` — iteration
  history (this prompt is the first persisted artifact; see Cycle context).
- NOT present in this repo (don't go looking): `orbit/lenses/`,
  `orbit/project.md`, `*_convention.md` at root. `orbit/specs/` is empty —
  this change establishes the first baseline capabilities when it archives.

## Cycle context

- Iteration: 1 (first external review for this change in system mode)
- Prior internal findings still open: 3 SUGGESTIONs from a fresh-context
  internal system review run 2026-06-10 (predates the emit layer, so it is not
  persisted as a `review-*.json`):
  1. explore's crystallization warning (consequence #4) carries a qualifier the
     `orbit-run-summary-emit` spec scenario lacks (template vs spec wording).
  2. `archive-change.ts` cites "per D11 in the bootstrap design" — predecessor-
     repo provenance label that collides with this repo's D11.
  3. `test/core/templates/orbit-content-fidelity.test.ts` per-workflow assertion
     is one disjunctive regex; a workflow losing one orbit section can still pass.
- Resolved since that review (commits `5dd5eee`, `661f03a`, `ddc932e`,
  `f6fd415`, `947272f` — all 9 WARNINGs): proposal/tasks record drift (disciplines
  9-of-11 not 11, emitters 8 not 9); mechanical-edit text corruption in
  propose/ff/apply bodies; onboard's stale upstream guided-tour descriptions +
  command table claiming non-generated B3 commands; dangling
  `orbit/specs/orbit-conventions/spec.md` pointer in 5 bodies (replaced with an
  inlined disciplines block); ~20 dangling orbit-status references (genericized
  to "downstream status reader"; absorption tracked as issue #3); README-facing
  requirements dependency on issue #1 (noted in proposal Impact); sync-specs
  cross-delta contradiction (now: match upstream exactly, no lifecycle claims).
  Verify these actually landed — that's part of your job.

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

## Scope facts (calibration, not suppression)

This change is phase B1 of a six-phase program: *relocate* the overlay-era
editorial content into the fork. The six spec deltas intentionally contain
forward-looking requirements for capabilities scheduled later and NOT yet
implemented: per-skill `references/` file generation (B2, tracked as issue #4)
and the net-new editorial workflows review / audit-drift / review-external /
address-reviews plus the run-summary emit layer (B3). The README is still
upstream's pending a comprehensive docs rewrite (issue #1; see the dependency
note in proposal.md Impact). Do NOT flag the mere absence of those future
capabilities — DO flag spec claims about *current* repo state that the code
contradicts, and anything else genuinely wrong.

## What to read for THIS review (--as system)

- `orbit/changes/relocate-modified-upstream-workflows/proposal.md`, `tasks.md`,
  and all six deltas under `specs/` (orbit-conventions, orbit-run-summary-emit,
  orbit-{explore,propose,archive}-modifications, orbit-onboard)
- The change's commit range: `git log 0c68b8c..HEAD` (10 commits);
  `git diff 0c68b8c..HEAD` is the full implementation surface
- Code paths touched: `src/core/templates/workflows/*.ts` (the 11 workflow
  template modules), `src/core/shared/skill-generation.ts` (registration),
  `test/core/templates/orbit-content-fidelity.test.ts` and
  `skill-templates-parity.test.ts`
- Baseline compliance input: `orbit/specs/` is empty (first change), so Pass 1
  reduces to internal consistency; lenses are absent, so Passes 4–5 have no
  input — note that and move on

## What to look for

0. **verify-change-style structural check** — tasks done, spec coverage, design
   adhered (run your own equivalent of upstream verify-change; `npm test` and
   `node bin/orbit.js validate relocate-modified-upstream-workflows --strict`
   are the claimed-green gates).
1. **Baseline Compliance** — no archived baseline exists yet; check instead that
   the six ADDED deltas don't contradict each other or the vendored engine's
   actual behavior.
2. **Cohesion** — callers/dependents outside the tasks list. Did the template
   edits ripple anywhere untracked (generation, configurators, command
   transforms, tests)?
3. **Surface Walk** — every generated skill/command surface: do the 11 skills +
   11 commands the generator registers match what the deltas and onboard's
   command table claim? Is `orbit init --tools claude` / `--tools codex` output
   coherent with the specs?
4. **Perspective Reviews** — `orbit/lenses/perspectives.md` is absent; skip.
5. **Critical-Path Scan** — `orbit/lenses/critical-paths.md` is absent; skip.
6. **Drift / Residue** — vocabulary residue from the predecessor overlay model
   (overlay/pegging/`opsx`/`.claude/` coupling/`openspec-*` naming), stale
   references, dangling pointers, claims about files that don't exist. The
   change's history includes several mechanical sweeps — hunt for what they
   missed.

## Output format — write to:

`orbit/changes/relocate-modified-upstream-workflows/.orbit-runs/external-system-<TS>.md`

(Where <TS> is today's timestamp in ISO format with hyphens, e.g.
`2026-06-11T15-30-00Z`. Pick a fresh timestamp so this file doesn't overwrite
prior reviews.)

Use this exact markdown structure:

```markdown
# External Review: relocate-modified-upstream-workflows (iteration 1)

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

If your environment doesn't support file writes (chat-only interface), output
the markdown directly and the user will save it.

## After completing the review

1. **Output the full findings markdown in chat** — in addition to writing the
   findings file, output the COMPLETE findings markdown in this chat. Same
   content as the file: every severity section (`## CRITICAL` / `## WARNING` /
   `## SUGGESTION`), every `### Title` entry, every `**File**:` and
   `**Description**:` field. Do NOT abbreviate or summarize — the chat output
   is the immediately-visible read for the user. The file remains the canonical
   record for `--from-file` parsing.

2. **Commit and push the findings file** (if your environment supports git):

   ```bash
   git add orbit/changes/relocate-modified-upstream-workflows/.orbit-runs/external-system-<TS>.md
   git commit -m "External review (system, iter 1): relocate-modified-upstream-workflows

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

If you don't have git access, just output the findings markdown in this chat
and the user will commit it manually.

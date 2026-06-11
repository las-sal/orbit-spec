# External Review: relocate-modified-upstream-workflows (iteration 2)

You are reviewing an OpenSpec change as a second pair of eyes. Your value is
your independent take — be thorough; flag anything that looks wrong,
inconsistent, or unclear. Don't be charitable to the authoring AI's reasoning.

## Repo

https://github.com/las-sal/orbit-spec (branch `main`; if you have local access,
the repo is at `/Users/sal/code/orbit-spec`)

## Project context (read first)

- `CLAUDE.md` — handoff orientation: orbit-spec is a self-contained hard fork of
  `@fission-ai/openspec@1.3.1` (vendored as the root commit `d665f12`).
- `orbit/explore/fork-and-orbify/explore.md` — design decisions D1–D15. Three
  were ratified DURING iteration-1 remediation and are in scope for this review:
  **D14** (commands are thin launchers; skills are the single behavioral
  source), the **D11 refinement** (Claude primacy bounds mechanism-neutrality —
  upstream's named-tool idiom stays by design), and **D15** (every
  init/update installs the full 11-workflow surface; profile gating is inert,
  `delivery` honored).
- `orbit/architecture/openspec-1.3.1-architecture.md` — engine deep-dive.
- `orbit/changes/relocate-modified-upstream-workflows/.orbit-runs/` — full
  iteration history: iter-1 prompt, iter-1 findings
  (`external-system-2026-06-11T02-35-57Z.md`, reviewer GPT-5 Codex), and the
  address-reviews T1 emit recording the resolutions.
- NOT present in this repo: `orbit/lenses/`, `orbit/project.md`,
  `*_convention.md` at root. `orbit/specs/` is empty — this change establishes
  the first baselines when it archives. README is still upstream's (tracked
  docs rewrite, issue #1; dependency note in proposal.md Impact).

## Cycle context

- Iteration: 2 (iter-1 reviewer: GPT-5 Codex)
- Prior external findings still open: 0 — all 10 iter-1 findings
  (1 CRITICAL / 5 WARNING / 4 SUGGESTION) were walked. Most were fixed; the
  Codex-mechanism-neutrality warning was ratified-as-designed (D11 refinement:
  upstream's named-tool idiom is deliberately kept — Claude primacy), and the
  profile-gating warning was resolved by changing reality (D15) rather than
  qualifying docs.
- Prior internal findings still open: 0 (the three internal-review suggestions
  were fixed in the closing pass).
- Resolved since last review — the remediation wave, commits
  `0976c0c..fcf9655`:
  1. All 11 command literals rewritten as thin launchers; skills are the single
     source (D14); completion-prompt overrides added to propose/ff/continue/
     apply `# Orbit additions`
  2. End-to-end generated-surface test (real default init, claude + codex,
     on-disk assertions)
  3. Next-artifact selection: `artifacts[]` `status: "ready"` instead of
     `applyRequires`; new's emit example made scaffold-only
  4. D11 refinement recorded; proposal D11 bullet rewritten
  5. `getProfileWorkflows` always returns ALL_WORKFLOWS (D15); 18 gating tests
     reframed; e2e test asserts a DEFAULT init yields the full surface
  6. Canonical JSON examples completed; crystallization wording aligned;
     archive D11 cite localized; verify's dangling `orbit-review/spec.md` cite
     removed; address-reviews T1 emit written (one timestamp later corrected)

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

## Scope facts (calibration, not suppression)

B1 = relocation phase. The six spec deltas intentionally contain
forward-looking requirements for later phases: per-skill `references/`
generation (B2, issue #4) and the net-new editorial workflows
review/audit-drift/review-external/address-reviews + the emit layer (B3).
orbit-status absorption is planned post-parity (issue #3); its spec cites were
genericized to "a downstream status reader" on purpose. Do NOT flag the mere
absence of future capabilities, the kept upstream named-tool idiom (D11
refinement), or the inert profile machinery (D15) — those are ratified
decisions. DO flag anything those decisions were applied incompletely or
inconsistently to, and anything genuinely new.

## What to read for THIS review (--as system)

- `orbit/changes/relocate-modified-upstream-workflows/proposal.md`, `tasks.md`,
  all six deltas under `specs/`
- The remediation diff: `git diff 28512ae..HEAD` (the post-iter-1 commits) on
  top of the change's full range `git log 0c68b8c..HEAD`
- `src/core/templates/workflows/*.ts`, `src/core/profiles.ts`,
  `src/core/shared/skill-generation.ts`
- Tests: `test/core/templates/` (fidelity, parity, generated-surface) and the
  D15-reframed suites (`test/core/profiles.test.ts`, `test/core/init.test.ts`,
  `test/core/update.test.ts`, `test/commands/config-profile.test.ts`)

## What to look for

0. **verify-change-style structural check** — `npm test` (claimed 1459/1459)
   and `node bin/orbit.js validate relocate-modified-upstream-workflows
   --strict` are the claimed-green gates; run your own equivalent.
1. **Resolution verification** — for each of the 10 iter-1 findings (read
   `external-system-2026-06-11T02-35-57Z.md`), confirm the claimed resolution
   actually landed, completely. Partial fixes and missed instances are the
   highest-value findings this iteration.
2. **Net-new issues from the remediation wave** — the launcher conversion,
   completion-prompt overrides, profiles.ts change, and 18 test rewrites were
   substantial edits made quickly; hunt for what they broke or missed.
3. **Coherence** — do proposal, tasks, the six deltas, the templates, and
   explore.md D14/D15/D11-refinement now tell ONE consistent story? (e.g., does
   any artifact still describe fat commands, profile-gated installs, or
   strict mechanism-neutrality?)
4. **Perspective / Critical-path passes** — `orbit/lenses/` absent; skip.
5. **Surface walk** — does a default `orbit init` (both tools) produce exactly
   what the deltas + onboard claim? Are launcher commands coherent for a user
   who only ever sees the command file?
6. **Drift / Residue** — overlay-era vocabulary, stale references, dangling
   pointers, future-dated or out-of-order `.orbit-runs/` timestamps, claims
   about files that don't exist.

## Output format — write to:

`orbit/changes/relocate-modified-upstream-workflows/.orbit-runs/external-system-<TS>.md`

(Where <TS> is today's timestamp in ISO format with hyphens, e.g.
`2026-06-11T05-30-00Z`. Pick a fresh timestamp so this file doesn't overwrite
the iteration-1 findings.)

Use this exact markdown structure:

```markdown
# External Review: relocate-modified-upstream-workflows (iteration 2)

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
   content as the file: every severity section, every `### Title` entry, every
   `**File**:` and `**Description**:` field. Do NOT abbreviate or summarize.
   The file remains the canonical record for `--from-file` parsing.

2. **Commit and push the findings file** (if your environment supports git):

   ```bash
   git add orbit/changes/relocate-modified-upstream-workflows/.orbit-runs/external-system-<TS>.md
   git commit -m "External review (system, iter 2): relocate-modified-upstream-workflows

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

If you don't have git access, just output the findings markdown in this chat
and the user will commit it manually.

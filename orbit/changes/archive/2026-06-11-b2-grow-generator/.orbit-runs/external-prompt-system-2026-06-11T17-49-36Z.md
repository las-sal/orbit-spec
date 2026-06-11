# External Review: b2-grow-generator (iteration 1, system mode)

You are reviewing an OpenSpec change as a second pair of eyes — POST-APPLY: the
implementation exists and your job is code-vs-spec verification. Be thorough;
flag anything that looks wrong, inconsistent, or unclear. Don't be charitable
to the authoring AI's reasoning.

## Repo

https://github.com/las-sal/orbit-spec (branch `main`; if you have local access,
the repo is at `/Users/sal/code/orbit-spec`)

## Project context (read first)

- `CLAUDE.md` — handoff orientation (self-contained hard fork; B1 archived with
  six live baselines; B2 = this change: grow the skill generator — multi-file
  `references/` emission + metadata pass-through).
- `orbit/changes/b2-grow-generator/` — proposal.md, design.md, tasks.md (all 19
  checked), explore.md (decisions D-b2-1-as-amended…6), and the two deltas
  under `specs/`.
- `orbit/specs/` — the six B1 baselines (delta-consistency input).
- NOT present: `orbit/lenses/`, `orbit/project.md`, `*_convention.md`. NOTE:
  `.claude/` is gitignored in this repo — the self-host surface won't be in
  your clone; generate your own with `node bin/orbit.js init --tools claude`
  in a scratch copy if you want to inspect real output.

## Cycle context

- Iteration: 1 in SYSTEM mode (prior cycles were proposal-mode).
- Five completed review cycles, 31 findings, all resolved — full audit trail in
  `.orbit-runs/` (internal proposal; external proposal ×2 — GPT-5 Codex;
  fresh-context proposal; in-context system iter 1 which found 2 wiring gaps:
  init preflight ordering vs the workspace scaffold, and unreported
  legacy-path removals — both fixed in commits `486e21c`/`52c6289`).
- The implementation landed in commits `afb0754..HEAD` (6 commits: three apply
  chunks + system-review fixes). `git diff afb0754..HEAD` is the
  implementation surface.
- High-value work for THIS pass: (a) independently walk every scenario of the
  two deltas against the actual code — the orbit-skill-generation capability
  has 5 requirements / ~24 scenarios specifying preflight atomicity,
  write-before-prune ordering, declared-path collision replacement, symlink
  containment, root-shape drift detection, metadata serialization; (b) hunt
  net-new implementation bugs the spec walk doesn't surface (reconciler edge
  cases, `yamlScalar`, drift-check wiring, the two update generation paths);
  (c) verify the in-context system review's 2 resolutions actually landed.

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

## Scope facts (calibration, not suppression)

Ratified decisions are calibration, not findings: D13 (inline-TS), D14 (thin
launcher commands), D15 (full surface installs), D-b2-1-as-amended
(shared-writer reconciliation on init + both update paths), D-b2-2
(disciplines stay inline), content-tamper of declared references deliberately
outside drift detection (restored on regeneration only). The `feedback`
template is intentionally not generated. README is upstream's (issue #1).

## What to read for THIS review (--as system)

- The change directory artifacts + both deltas
- `git diff afb0754..HEAD` — the implementation
- Implementation files: `src/core/templates/types.ts`,
  `src/core/shared/skill-generation.ts` (validation, reconciler, drift check,
  metadata emission), `src/core/init.ts` (preflight at execute() top + skill
  loop), `src/core/update.ts` (BOTH generation paths + reporting),
  `src/core/profile-sync-drift.ts` (reference drift),
  `src/core/templates/workflows/archive-change.ts` (the reference literal)
- Tests: `test/core/shared/skill-references.test.ts` (26 unit tests),
  `test/core/templates/` (fidelity + parity + e2e surface),
  `test/core/init.test.ts` / `test/core/update.test.ts` /
  `test/core/profile-sync-drift.test.ts` (integration)
- Gates: `npm test` (claimed 1496/1496 across 69 files) and
  `node bin/orbit.js validate b2-grow-generator --strict` (claimed pass)

## What to look for

0. **verify-change structural check** — tasks all done; every spec scenario
   covered by implementation + test; run the gates yourself.
1. **Baseline Compliance** — does the implementation break any of the six
   archived baselines (esp. orbit-conventions' distribution/disposition
   requirements, orbit-archive-modifications)?
2. **Cohesion** — callers/dependents outside the tasks list: anything else
   that touches skill dirs, generation, migration, legacy cleanup, delivery
   switches that the reference mechanism should have rippled into?
3. **Surface Walk** — generated surface still coherent: 11 skills + 11
   commands + exactly one reference file, identical across claude/codex;
   reference-less skills get no references/ dir.
4. **Perspective Reviews** — lenses absent; skip.
5. **Critical-Path Scan** — lenses absent; skip.
6. **Drift / Residue** — stale vocabulary, dangling cites, spec/impl
   mismatches left by five rounds of remediation; `.orbit-runs/` timestamp
   ordering.

## Output format — write to:

`orbit/changes/b2-grow-generator/.orbit-runs/external-system-<TS>.md`

(Where <TS> is today's timestamp in ISO format with hyphens. Pick a fresh
timestamp so this file doesn't overwrite prior reviews.)

Use this exact markdown structure:

```markdown
# External Review: b2-grow-generator (iteration 1, system mode)

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

1. **Output the full findings markdown in chat** — every severity section,
   every entry, every field; do NOT abbreviate. The file remains the canonical
   record for `--from-file` parsing.

2. **Commit and push the findings file** (if your environment supports git):

   ```bash
   git add orbit/changes/b2-grow-generator/.orbit-runs/external-system-<TS>.md
   git commit -m "External review (system, iter 1): b2-grow-generator

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

If you don't have git access, just output the findings markdown in this chat
and the user will commit it manually.

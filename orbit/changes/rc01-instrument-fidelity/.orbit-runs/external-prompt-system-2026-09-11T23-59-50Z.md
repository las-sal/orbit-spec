# External Review: rc01-instrument-fidelity (iteration 1)

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
- `orbit/changes/rc01-instrument-fidelity/.orbit-runs/` — iteration history
- `orbit/architecture/clean-up-review-cycle.md` — the program this change serves. READ
  `## Premise` (the measured evidence: findings per change grew 41 → 131 across the prior
  program; later passes landed 60–100% of findings on files the prior walk had just edited),
  the rulings **R-crc-1** (size ceiling), **R-crc-3** (method delegated to the authoring AI),
  **R-crc-4** (the canonical cadence), and stage **rc01-instrument-fidelity**'s charter.

## Cycle context

- Iteration: 1 in SYSTEM mode (pass 3 on the shared axis). Prior passes: a FRESH proposal
  review (1C/4W/4S — `review-proposal-2026-09-11T21-49-43Z.json`, all nine resolved in
  `address-reviews-2026-09-11T21-58-45Z.json`) and an IN-CONTEXT system pass (0C/1W/1S —
  `review-system-2026-09-11T23-52-55Z.json`, both resolved in
  `address-reviews-2026-09-11T23-57-29Z.json`). This is the FIRST independent look at the
  implementation.
- Prior internal findings still open: 0. Prior external findings still open: 0 (none yet).
- **This change is the program's first stage, and its thesis is about REVIEW ITSELF**: the
  cycle's own instruments must reject what the real tools reject. Two `gh` grammar defects
  survived five review passes in the prior program because the test stub accepted commands
  the real CLI rejects. rc01 makes the stub and the docs-sweep derive from ONE contract
  captured from the real binary, and adds a parity test between the emit payload tables and
  their schema references.

**What to verify (the resolutions landed after the passes that found them):**
1. `test/integration/pr-lifecycle/gh-contract.json` — captured from gh 2.91.0 by
   `scripts/capture-gh-contract.mjs` (`npm run capture:gh`). Seven commands with usage
   shapes, flag entries `{long, short, takes_value}`, both error-rule strings verbatim, an
   `availability_probe`, plus two ORBIT-SIDE rules the real CLI does not enforce
   (`pr_verbs_require_repo`, `repo_view_requires_positional`).
2. `test/integration/pr-lifecycle/gh-contract-validate.cjs` — the ONE validator the stub
   process (`require`) and the docs-sweep (`createRequire`) both load. argv excludes `gh`.
3. `test/integration/pr-lifecycle/harness.ts` `installGhStub` — now a validator over the
   contract; five hand-written branches deleted.
4. `test/core/templates/orbit-content-fidelity.test.ts` — the sweep validates every
   invocation-shaped snippet in the three PR references through that validator, plus five
   negative fixtures.
5. `test/core/emit-schema-parity.test.ts` — derives each schema reference's AI-supplied field
   set (union over EVERY full-record JSON block, minus an explicit engine-owned list) and
   asserts the command's `payloadFields` accepts it; ALSO derives `## Field notes` bullets
   and asserts none names a key no block carries.
6. Three MIRROR CORRECTIONS in `src/` the parity test forced (template constants that render
   into generated `references/*.md`; no engine behavior): the audit-drift schema reference
   (six keys its table rejects → the table's set, plus its field notes), the review
   reference's architecture-mode block (`findings_summary` → `scorecard`), and the
   address-reviews block (gained `delegation_directive`, which its notes already documented).
7. `src/core/emit-composition.ts` — one new read-only export `payloadFieldsFor(command)`.

Known NON-defects (do not re-flag unless you find them WRONG):
- `orbit/lenses/` does not exist — passes 4 and 5 are skips.
- The change deliberately touches `src/` despite being a "tests" stage; the non-goal is
  engine BEHAVIOR change, and the three corrections are mirror edits (see design D6 and the
  proposal's Impact).

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

## What to read for THIS review (--as system)

- `orbit/changes/rc01-instrument-fidelity/` — proposal.md, design.md, tasks.md, explore.md,
  and the two delta specs (`specs/orbit-pr-lifecycle/`, `specs/orbit-emit-composition/`).
- The change's diff: everything listed above is UNCOMMITTED in the working tree at HEAD
  `6a5e3b6` — `git status` and `git diff` show it; `git diff --stat` is the fastest map.
  (If you receive this as a pushed commit, diff that commit instead.)
- `orbit/specs/<capability>/spec.md` — the archived baselines, especially
  `orbit-pr-lifecycle`, `orbit-emit-composition`, `orbit-run-summary-emit`,
  `orbit-audit-drift`, `orbit-review`, `orbit-address-reviews`.
- `npm test` should report 2036 passing across 93 files.

## What to look for

0. **verify-change-style structural check** — 13/13 tasks checked; trace every scenario in
   the two delta specs to executing test code. Are any checked tasks not actually done?
1. **Baseline Compliance** — do the three mirror corrections CONTRADICT any archived
   requirement? Specifically: does any baseline spec state that the audit-drift emit carries
   `context`/`caller`/`depth`/`flags`/`categories_skipped`/`findings_summary`, or that an
   architecture-mode review emit carries `findings_summary`? (The authoring AI checked
   `orbit-run-summary-emit` and believes the corrections moved the mirrors TOWARD the specs
   — verify that independently, and check the capabilities it may not have checked.)
2. **Cohesion** — the validator is loaded by two very different consumers (a standalone Node
   script written to a temp dir; a vitest module). Probe the seams: does the stub still work
   when `installGhStub` copies the files? Is the `createRequire` path in the sweep robust to
   the working directory vitest runs from? What happens if `gh-contract.json` is malformed or
   absent? Does the validator's tokenizer mis-handle any real invocation in the references
   (e.g. `--flag=value`, repeated flags, `--` terminator, a value that looks like a flag)?
3. **Surface Walk** — capabilities ARE surfaces. The generated surface should be 15 skills +
   15 commands, and `node bin/orbit.js update --force` should change ONLY the three corrected
   `references/*.md` files. Verify the corrected references read coherently END TO END (the
   block, the extensions sentence, and the field notes telling one story).
4. **Perspective Reviews** — absent lenses; note the skip.
5. **Critical-Path Scan** — absent lenses; note the skip. In their place: run
   `npm run capture:gh` yourself if you have `gh` installed and diff the result against the
   committed contract — does the capture script reproduce it? Then run the suite with `gh`
   absent from PATH. Then try to DEFEAT the instruments: craft a snippet or stub invocation
   that is wrong but passes, or one that is right but fails. That adversarial probe is the
   single highest-value thing you can do here, because the whole stage is an instrument.
6. **Drift / Residue** — vocabulary residue, stale references, half-applied edits. The
   authoring AI's own in-context pass found that a text replacement had silently missed a
   wrapped line, leaving field notes describing removed fields; look for more of that shape.

## Output format — write to:

`orbit/changes/rc01-instrument-fidelity/.orbit-runs/external-system-<TS>.md`

(Where <TS> is today's timestamp in ISO format, e.g. `2026-09-12T14-00-00Z`. Pick a fresh
timestamp so this file doesn't overwrite prior reviews.)

Use this exact markdown structure:

```markdown
# External Review: rc01-instrument-fidelity (iteration 1)

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

**Severity guidance for THIS pass** (the program's own rule, R-crc-4/rc02): CRITICAL means a
user path breaks, data is lost, or an instrument passes something it must reject — and the
finding carries a REPRODUCTION (a command you ran, a case you wrote). WARNING means an
implementer could diverge from the spec as written. Everything else is SUGGESTION. A number
or ordering restated in prose that disagrees with its source is ONE suggestion naming the
source, not one per site. Signal over volume.

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
   git add orbit/changes/rc01-instrument-fidelity/.orbit-runs/external-system-<TS>.md
   git commit -m "External review (system, iter 1): rc01-instrument-fidelity

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   Then STATE PLAINLY in your chat output that the findings landed —
   `Findings committed (<short-sha>) and pushed` — so the human never has to
   infer whether they reached the repo.

If you don't have git access, just output the findings markdown in this chat
(per the chat-only fallback above), state explicitly that you could NOT
commit/push, and the user will commit it manually.

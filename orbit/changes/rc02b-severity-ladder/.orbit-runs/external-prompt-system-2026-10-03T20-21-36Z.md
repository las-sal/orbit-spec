# External Review: rc02b-severity-ladder (iteration 1)

You are reviewing an OpenSpec change as a second pair of eyes. Your value is
your independent take — be thorough; flag anything that looks wrong,
inconsistent, or unclear. Don't be charitable to the authoring AI's reasoning.

This is the EXTERNAL half of a BLIND PAIR (`spec-driven` v4, `review-system` cadence
`[blind-pair, in-context]`): a fresh Claude session reviews the same commit independently.
You must not read any `review-system-*.json` emit or walk log that may appear on the trail
after this prompt was packaged — review the pushed apply commit and nothing that came after.
You are also the FIRST external reviewer to receive this prompt in its new shape: the
`## Severity` paragraph and the `**Reproduction**:` field below are what this change ships.
Use them as written — your findings file is the change's first live measurement of them.

## Repo

https://github.com/las-sal/orbit-spec.git — branch `d-arc`. The apply commit under review is
the FIRST commit after `a8ad6c97` (the proposal-cycle close: walk 3) — `git log --oneline
a8ad6c97..origin/d-arc` names it; it carries this prompt file. The whole change is every
commit on `d-arc` whose message names `rc02b-severity-ladder` (the exploration began
2026-10-01; `git log --oneline -- orbit/changes/rc02b-severity-ladder/`).

## Project context (read first)

- `CLAUDE.md` — handoff orientation (read the "ACTIVE program" section; the rulings R-crc-1, R-crc-10, R-crc-13 and R-crc-14 bear on this change, and its last paragraph is the apply's own account of what shipped)
- `orbit/architecture/clean-up-review-cycle.md` — the program doc; `### Stage rc02b-severity-ladder` is the charter with its exit criteria (Goal G1)
- `orbit/project.md` — project goals + stack (if present)
- `*_convention.md` at repo root — naming, error handling, etc. (if present)
- `orbit/lenses/perspectives.md` — named callers worth validating from (if present)
- `orbit/lenses/critical-paths.md` — user flows worth walking end-to-end (if present)
- `orbit/changes/rc02b-severity-ladder/.orbit-runs/` — iteration history; see what's
  already been addressed in prior cycles (the proposal cycle: three passes, three walks)

## Cycle context

- Iteration: 1 (first external review for this change in system mode)
- Prior internal findings still open: none — the proposal cycle's findings (fresh pass; external GPT-6 Codex 2C; in-context confirm 0C/5W/4S) were all walked to zero before apply across three walk logs; no system-mode pass has run yet
- Prior external findings still open: none in system mode (the proposal-mode external pass's two CRITICALs — the field-line rule the trail reader did not follow, and a present non-string `reproduction` the gate would persist but the normalizer refuse — were both resolved at walk 2 and are now mechanism: `descOpen` in `trail.ts`, the type check at any severity in `validateReviewEvidence`)
- Resolved since last review: everything in the three walk logs (`address-reviews-2026-10-03T16-15-25Z`, `-16-45-02Z`, `-16-56-30Z.json`); the apply then shipped 24 of 25 tasks, 5.4 the declared user-validation handoff — which is YOUR return: whether you wrote `**Reproduction**:` bodies, and whether the render marks none `[unreproduced]` on a CRITICAL that carries one

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

## What to read for THIS review (--as system)

- orbit/changes/rc02b-severity-ladder/proposal.md, design.md, tasks.md, specs/ (six delta files, sixteen requirement blocks — 13 MODIFIED, 3 ADDED; every task carries its measurement appended at apply, and 5.4's line gained the `(User-validation` marker at apply with a dated note saying why)
- orbit/changes/rc02b-severity-ladder/explore.md — the exploration (six sections; three Mechanism entries, all SOURCED)
- The apply commit: `git diff a8ad6c97..<apply-commit>` (17 files: three engine modules, two template modules, six test files incl. two new, two goldens, tasks.md, CLAUDE.md) — and `git diff a8ad6c97 -- src/ test/` reads the same without naming the sha
- orbit/changes/rc02b-severity-ladder/.orbit-runs/apply-2026-10-03T17-22-26Z.json and apply-2026-10-03T17-24-00Z.json — the apply emits (the first carries the full account in `final_assessment`; the second is a CORRECTIVE emit written after the 5.4 marker fix — read why, and judge whether a second emit was the right record)
- orbit/specs/orbit-conventions/spec.md, orbit-review/spec.md, orbit-review-external/spec.md, orbit-emit-composition/spec.md, orbit-report-rendering/spec.md, orbit-address-reviews/spec.md (baselines — the deltas MODIFY thirteen of their requirements and ADD three, synced at archive, so compare the DELTA text against the code and bodies, and the baseline against anything the deltas do not touch)
- Engine: `src/core/emit-composition.ts` (`validateReviewEvidence`, called from `validatePayload`; `blocks` in `COMMANDS.review.payloadFields`), `src/core/report-render.ts` (`NormalizedFinding.reproduction`, `NormalizedReviewPass.blocks`, both normalizers, `renderReviewReport`), `src/core/artifact-graph/trail.ts` (`parseExternalMarkdown`'s `descOpen`), `src/core/artifact-graph/gates.ts` (UNTOUCHED — the counting rule and `isSubstantive` must be unchanged)
- Generated surface: `src/core/templates/workflows/review.ts` (the two pass references, the body's Step 6.3 / Step 9 / flags table / Step 11 gist / Pushback bias, `references/run-summary-schema.md`, the prompt template, `references/external-handoff.md` Step 7, `references/flags-detail.md`), `src/core/templates/workflows/address-reviews.ts` (both format references, `references/run-summary-schema.md`, Step 2 triage, Step 3a step (0))
- Tests: `test/core/emit-composition.test.ts` (the two rc02b describes at the end), `test/core/report-render.test.ts` (three rc02b describes at the end; the golden doc comment), `test/core/trail-rc02b.test.ts` (NEW — the finding KEY through both readers), `test/core/severity-ladder-parity.test.ts` (NEW — the checked mirror), `test/core/emit-schema-parity.test.ts` (the nested allowlist + the rc02b describe), `test/core/templates/orbit-content-fidelity.test.ts` (the rc02b describe at the end), `test/fixtures/report-golden/*.golden.md` (two lines moved)
- The regenerated skill is gitignored; regenerate it (`npm run build && node bin/orbit.js init --tools claude` in a scratch checkout, or `update --force`) and read `.claude/skills/orbit-review/` and `.claude/skills/orbit-address-reviews/` as an adopter would — this prompt IS one of its outputs

## What to look for

0. **verify-change-style structural check** — tasks done, spec coverage, design adhered (the external AI runs its own equivalent of upstream verify-change). 24 of 25 tasks are checked; 5.4 is the user-validation handoff. Does every task's appended measurement hold on the tree? Does every ADDED/MODIFIED requirement's scenario have a test or a body sentence that implements it — in particular `orbit-emit-composition`'s "Architecture mode is checked the same way", `orbit-report-rendering`'s "Blocks section is collected, never counted", and `orbit-conventions`' "Field lines are recognised only before the Description body opens — in BOTH readers"? Does the design's Mechanism → artifacts table name a destination that did not land, or did something land with no row?
1. **Baseline Compliance** — does this change break any archived `orbit/specs/` requirement? R-crc-14 (a rule stated ONCE; every other surface NAMES it and points): the apply re-pointed fourteen per-pass sites plus the bias line, Step 6.3, Step 9 and the flags row — does any of them RESTATE the ladder's definition beside its pointer (the rc16 disease), and does the one-paragraph `## Severity` mirror in the prompt template say what it is? R-crc-10 / D-rc02b-6 (never re-grade): is there ANY path — the gate, `isSubstantive`, the counter, the renderer, R-crc-4's extra-pass rule — where a CRITICAL without a reproduction is counted or weighed differently from one with? `orbit-engine-gates`' counting rule and `orbit-report-rendering`'s strict generation boundary: do prior-generation emits (no `reproduction`, no `blocks`) still render and gate exactly as before, with ONLY the `[unreproduced]` prefix added? The conventions baseline still says README has a "Choosing a review mode" section and README does not — the apply declared that pre-existing drift out of scope; is that declaration sound?
2. **Cohesion** — callers/dependents outside the tasks list. `validateReviewEvidence` runs inside `validatePayload` BEFORE the mode/scope checks: does any existing caller or test depend on a different first error for a malformed review payload? `normalizeInternalPass` now rejects a non-string `reproduction` and a malformed `blocks`: the write gate calls it for proposal/system — can an emit the gate ACCEPTED ever fail the normalizer on read (the two checks must agree exactly; find a shape they disagree on)? `renderReviewReport`'s Blocks slot sits between the scorecard and `### Findings` — does any consumer of the rendered report (the hardening test's `sections()` helper, the orientation strip, address-reviews' pasted-report reading) assume `### Findings` follows the scorecard directly? `trail.ts`'s `descOpen`: the trail reader's `**Description**:` regex still requires non-empty SAME-LINE text while the render parser accepts an empty same-line body — construct an external file where the two readers disagree on `hasDescription` and say what the gate does with it (this divergence predates the change; is it widened, narrowed, or untouched?).
3. **Surface Walk** — every CLI / MCP / HTTP / public-function surface in `orbit/specs/` still coherent? Run: `orbit emit review` with a CRITICAL lacking `reproduction` (exit non-zero, message names `findings[<i>]` and the title, EMPTY stdout, no file — check stdout, the body's claim rests on `src/commands/emit.ts`); the same under `--doc`; a WARNING with `"reproduction": 42`; `blocks: ["a\nb"]`; then `orbit status --change <x> --report` over an emit with `blocks` and a reproduction, and over an external file with `## Blocks` + `None.`; `orbit validate rc02b-severity-ladder --strict`; `orbit fingerprint rc02b-severity-ladder --check` (13 verified); `orbit validate --sources`. Capabilities ARE surfaces; don't redefine them. The `[unreproduced]` prefix: copy a marked line's title and confirm a walk record keyed on it resolves at the gate (Q-crc-17) — then check the ORIENTATION strip and any other reader of finding lines for a parser that would now see `[unreproduced]` as part of the file ref.
4. **Perspective Reviews** — for each named perspective in `orbit/lenses/perspectives.md`, simulate the caller's POV (the lens files are absent in this repo; use these instead). YOU, the external reviewer: is the `## Severity` paragraph enough to grade by without the spec, and does the output-format block's quadruple note make the Reproduction body's placement (after Description, ended by the next heading) unambiguous — would you have put it somewhere the parser drops? An ADOPTER whose installed skills have neither our specs nor our tests: do the re-pointed pass rules still tell them WHAT grade to give (the pointer form carries the condition and consequence — does each site actually carry both)? A WALKER running `/orbit:address-reviews --from-file` on your own findings file: does Step 3a step (0) tell them what to do with a reproduction they cannot run, and does the triage's blocks-first rule tell them what to do with a `## Blocks` item (the answer must be: read it, do not walk it)?
5. **Critical-Path Scan** — for each flow in `orbit/lenses/critical-paths.md`, walk end-to-end (absent; walk these). (a) The full review cycle on this very change: your findings file → `readTrail` (counts; the `(title, file)` key) → `orbit status --report` (the render) → the walk record → the gate's resolution match — put a `**File**:` line inside one of your Reproduction bodies and a `### `-shaped line inside your `## Blocks` section and confirm both readers agree. (b) The archive flow this change heads into: six deltas, sixteen blocks synced into six baselines — diff each delta block against its baseline block and list every changed line; is every changed line in the proposal's "What Changes"? (c) The conventions canonical review-emit example (the `Internal-run JSON summary format` requirement) now carries `reproduction` on its CRITICAL: would the write gate accept that exact payload? (d) The checked mirror: change one byte of the `## Severity` paragraph in the template and confirm `severity-ladder-parity.test.ts` fails naming the owner — then change one byte in the conventions delta's fence and confirm it fails the other way.
6. **Drift / Residue** — vocabulary residue, stale references, archive-coherence misses. `grep -rn "CRITICAL when\|CRITICAL on\|CRITICAL for\|classify as CRITICAL\|must address before apply" src/ test/ orbit/specs orbit/changes/rc02b-severity-ladder README.md docs/` — partition the hits: pointer-with-reading, baseline awaiting sync, or a site the fourteen missed (the exploration counted sixteen and seventeen before the proposal measured fourteen — is fourteen right?). The retired `review-external` command vocabulary and `findings_summary` must not have crept back. Check the design's touchpoint list against the apply emit's `files_touched` (CLAUDE.md and the two goldens were not in it). Check `tasks.md`'s appended notes for any claim the tree does not bear out — in particular 5.2's "0 grep lines" and 5.3's "47 new" (count them).

## Severity

Grade by `orbit-conventions`' Severity ladder. CRITICAL: a user path breaks or data is lost, AND the finding carries its reproduction — a case the reader can re-execute: the inputs, the rule or command, the expected result, the observed result (a command in system mode; a constructed case in proposal mode). WARNING: an implementation built to the artifact as written could diverge from what it intends. SUGGESTION: everything else. When unsure, grade lower. A condition that must stop apply regardless of consequence — an `orbit validate` failure, an unresolved `@review:` marker — is a BLOCK, not a severity: list it under `## Blocks`.

## Output format — write to:

`orbit/changes/rc02b-severity-ladder/.orbit-runs/external-system-<TS>.md`

(Where <TS> is today's timestamp in ISO format. Pick a fresh timestamp so this
file doesn't overwrite prior reviews.)

Use this exact markdown structure:

```markdown
# External Review: rc02b-severity-ladder (iteration 1)

**Reviewer**: <your model name>
**Date**: <YYYY-MM-DD>

## CRITICAL

### <Finding title>
**File**: <path>:<line>
**Description**: <what's wrong + specific recommendation>
**Reproduction**: <a command you ran, or a constructed case — inputs, rule, expected, observed>

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
   git add orbit/changes/rc02b-severity-ladder/.orbit-runs/external-system-<TS>.md
   git commit -m "External review (system, iter 1): rc02b-severity-ladder

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   Then STATE PLAINLY in your chat output that the findings landed —
   `Findings committed (<short-sha>) and pushed` — so the human never has to
   infer whether they reached the repo.

If you don't have git access, just output the findings markdown in this chat
(per the chat-only fallback above), state explicitly that you could NOT
commit/push, and the user will commit it manually.

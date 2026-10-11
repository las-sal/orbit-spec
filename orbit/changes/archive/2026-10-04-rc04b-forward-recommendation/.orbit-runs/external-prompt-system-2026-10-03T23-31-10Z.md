# External Review: rc04b-forward-recommendation (iteration 1)

You are reviewing an OpenSpec change as a second pair of eyes. Your value is
your independent take — be thorough; flag anything that looks wrong,
inconsistent, or unclear. Don't be charitable to the authoring AI's reasoning.

This is the EXTERNAL half of a BLIND PAIR (`spec-driven` v4, `review-system` cadence
`[blind-pair, in-context]`): a fresh Claude session reviews the same commit independently.
You must not read any `review-system-*.json` emit or walk log that may appear on the trail
after this prompt was packaged — review the pushed apply commit and nothing that came after.
You are also the FIRST external reviewer to receive this prompt with the `## Direction`
section below: that section is what this change ships. Write it as instructed — your
findings file is the change's first live measurement of the slot (task 4.5, the declared
user-validation handoff), and whether the report renders your return marked or unmarked is
part of what the in-context reaction will read.

## Repo

https://github.com/las-sal/orbit-spec.git — branch `d-arc`. The apply commit under review is
the FIRST commit after `0e183d93` (the proposal-cycle close: walk 3) — `git log --oneline
0e183d93..origin/d-arc` names it; it carries this prompt file. The whole change is every
commit on `d-arc` whose message names `rc04b-forward-recommendation` (`git log --oneline --
orbit/changes/rc04b-forward-recommendation/`; the exploration and the proposal cycle all landed 2026-10-03).

## Project context (read first)

- `CLAUDE.md` — handoff orientation (read the "ACTIVE program" section; the rulings R-crc-10, R-crc-11(f)/(g), R-crc-13 and R-crc-14 bear on this change, and the paragraph beginning "`rc04b-forward-recommendation` is APPLIED" is the apply's own account of what shipped — read it as a claim to check, not a fact)
- `orbit/architecture/clean-up-review-cycle.md` — the program doc; `### Stage rc04b-forward-recommendation` is the charter with its three exit criteria (Goal G1) and the Q-rc04-c question it resolves
- `orbit/project.md` — project goals + stack (if present)
- `*_convention.md` at repo root — naming, error handling, etc. (if present)
- `orbit/lenses/perspectives.md` — named callers worth validating from (if present)
- `orbit/lenses/critical-paths.md` — user flows worth walking end-to-end (if present)
- `orbit/changes/rc04b-forward-recommendation/.orbit-runs/` — iteration history; see what's
  already been addressed in prior cycles (the proposal cycle: three passes, three walks)

## Cycle context

- Iteration: 1 (first external review for this change in system mode)
- Prior internal findings still open: none — the proposal cycle's findings (fresh 0C/7W/5S; external GPT-6 Codex 0C/3W/0S; in-context confirm 0C/2W/2S) were all walked to zero before apply across three walk logs; no system-mode pass has run yet
- Prior external findings still open: none in system mode (the proposal-mode external pass's three WARNINGs — the `blocks`-style nested-allowlist hazard for `direction`, the pre-D4 boundary the mark must never relax, and the architecture interim shape's uncontained second line — were resolved at walk 2 and are now mechanism: `NESTED_NOTE_SUBJECTS` in the parity test, the retained boundary test, and the `> `-contained example in the review body's architecture section)
- Resolved since last review: everything in the three walk logs (`address-reviews-2026-10-03T22-40-17Z`, `-22-54-51Z`, `-23-03-44Z.json`); the apply then shipped 18 of 19 tasks in one session, 4.5 the declared user-validation handoff — which is YOUR return: whether you wrote `## Direction` with a conforming `**Disposition**:` opener, and whether the render marks it neither `[no direction]` nor `[direction malformed]`

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

## What to read for THIS review (--as system)

- orbit/changes/rc04b-forward-recommendation/proposal.md, design.md, tasks.md, specs/ (five delta files, ten requirement blocks — 8 MODIFIED, 2 ADDED; every closure task carries its measurement appended at apply, and 2.4 records two prior tests that moved by design)
- orbit/changes/rc04b-forward-recommendation/explore.md — the exploration (six sections; four Mechanism entries, every one SOURCED or DERIVED; D-rc04b-5/6/7 are `Kind: scope`)
- The apply commit: `git diff 0e183d93..<apply-commit>` (18 files: three engine modules, two template modules, seven test files incl. one new, three golden/fixture files incl. two new, tasks.md, CLAUDE.md) — and `git diff 0e183d93 -- src/ test/` reads the same without naming the sha
- orbit/changes/rc04b-forward-recommendation/.orbit-runs/apply-2026-10-03T23-27-39Z.json — the apply emit (its `final_assessment` is the full account; `files_touched` has 23 entries — compare against the design's `## Touchpoints` list and the engine's divergence fields)
- orbit/specs/orbit-conventions/spec.md, orbit-emit-composition/spec.md, orbit-report-rendering/spec.md, orbit-review/spec.md, orbit-review-external/spec.md (baselines — the deltas MODIFY eight of their requirements and ADD two, synced at archive, so compare the DELTA text against the code and bodies, and the baseline against anything the deltas do not touch; `orbit-address-reviews` and `orbit-engine-gates` carry NO delta by design — check that nothing in them is now false)
- Engine: `src/core/artifact-graph/gates.ts` (ONLY the `export` keyword on `isIndependent` — confirm with `git diff 0e183d93 -- src/core/artifact-graph/`; `trail.ts` must show NO diff), `src/core/emit-composition.ts` (`validateReviewDirection` beside `validateReviewEvidence`, both called from `validatePayload`; `direction` in `COMMANDS.review.payloadFields`), `src/core/report-render.ts` (`ReviewDirection`, `NormalizedReviewPass.direction` and the narrowed `reviewerClass: ReviewerClass`, both normalizers, the external parser's `direction` section state, `renderReviewReport`'s Direction block between Suppressed and Commentary)
- Generated surface: `src/core/templates/workflows/review.ts` (Step 8 "Author the direction and the commentary", Step 9's enumeration, the schema reference's intro list + block + field note, the `## Direction` section of the prompt template and the three section enumerations around it, the chat-output item, the architecture-mode interim shape), `src/core/templates/workflows/address-reviews.ts` (the expected-file-format block only — no triage change)
- Tests: `test/core/emit-composition.test.ts` (the rc04b describe at the end), `test/commands/emit.test.ts` (the CLI-surface case), `test/core/report-render.test.ts` (three rc04b describes at the end; the golden doc comment; the rc02b transcription that gained `reviewerClass`), `test/core/report-render-hardening.test.ts` (the cross-genre equivalence test's internal half became `fresh` — judge whether changing the test was the right act), `test/core/trail-rc04b.test.ts` (NEW — the three readers), `test/core/emit-schema-parity.test.ts` (the hoisted `NESTED_NOTE_SUBJECTS` + the rc04b describe), `test/core/severity-ladder-parity.test.ts` (UNCHANGED — it holds the two output-format blocks byte-equal, and it was RED on the proposal commit until 3.2 installed the section FROM the delta), `test/core/templates/orbit-content-fidelity.test.ts` (the rc04b describe at the end), `test/fixtures/report-golden/external-pass.golden.md` (gained the marked section), `nearmiss-direction.json` + `nearmiss-direction.golden.md` (NEW)
- The regenerated skill is gitignored; regenerate it (`npm run build && node bin/orbit.js init --tools claude` in a scratch checkout, or `update --force`) and read `.claude/skills/orbit-review/` and `.claude/skills/orbit-address-reviews/` as an adopter would — this prompt IS one of its outputs, and its `## Direction` section is the thing under review

## What to look for

0. **verify-change-style structural check** — tasks done, spec coverage, design adhered (the external AI runs its own equivalent of upstream verify-change). 18 of 19 tasks are checked; 4.5 is the user-validation handoff. Does every task's appended measurement hold on the tree (4.3 names review.ts line numbers — do they still point where it says)? Does every ADDED/MODIFIED requirement's scenario have a test or a body sentence that implements it — in particular `orbit-emit-composition`'s "Unrecognised reviewer class refused" and "Prior-generation emits are untouched", `orbit-report-rendering`'s "The section is read wherever it sits, case-insensitively" and "A near-miss reasoning cannot forge the tail", `orbit-conventions`' "Direction section is read by the renderer, ignored by the counters, never walked", and `orbit-review`'s "Architecture-mode fresh pass prints its direction"? Does the design's Mechanism → artifacts table name a destination that did not land, or did something land with no row — the reviewer-class refusal (fresh S1) was added at walk 1; which row carries it?
1. **Baseline Compliance** — does this change break any archived `orbit/specs/` requirement? R-crc-14 (a rule stated ONCE; every other surface NAMES it and points): the shape (`forward` | `hold`, non-empty `reasoning`) and the content contract (which way and why; never counts, gate state, a command token) now appear in Step 8, the schema field note, the prompt template's section, the walk's format copy and five delta requirements — the design permits the reviewer-facing form at the two authoring sources; is every OTHER site a pointer, or did the apply write a restatement beside its pointer (the rc16 disease, found four times there)? R-crc-13 (a gate REPORTS, never RULES): is there ANY path — `readTrail`, `gates.ts`, `isSubstantive`, the trend counter, `countConfidentExternalPasses`, the orientation strip — where the direction's presence, absence or token changes a count, a state or a next command? R-crc-10 (presence and shape only): does any check read the reasoning's content? `orbit-engine-gates`' cadence vocabulary: `isIndependent` is now imported by the emit surface and the renderer — does exporting it change any statement in that baseline? `orbit-report-rendering`'s strict generation boundary: do prior-generation emits still render and gate exactly as before, with ONLY the `### Direction` / `[no direction]` section added on independent passes?
2. **Cohesion** — callers/dependents outside the tasks list. `validateReviewDirection` runs inside `validatePayload` BEFORE composition and the mode-scoped strict normalizer, and it now refuses a MISSING or non-string `reviewer_class` naming the three values: did any existing caller or test depend on a different first error for a review payload with no class (`missing or mistyped field 'reviewer_class'` from the normalizer)? `NormalizedReviewPass.reviewerClass` narrowed from `string` to `ReviewerClass` and the external normalizer now sets it — does any consumer compare it, print it, or assume it absent on the external genre (the header line, the hardening test's `sections()` helper, `buildReportContext`, the orientation strip)? The write gate refuses `{disposition, reasoning}` shapes and the read-side normalizer refuses the same set — find a shape they DISAGREE on (a `direction` with extra keys; `reasoning` of whitespace plus a newline; a `disposition` with trailing space). The external parser keeps only the FIRST `## Direction` section's lines and flags a second as malformed — but `closeCurrent()` fires on the heading: can a `## Direction` placed INSIDE a severity section's finding (between `**File**:` and `**Description**:`) truncate that finding into a rejection the trail reader would not make? The `## Direction` heading regex is case-insensitive and anchored `\s*$` — does `## Direction:` or `## Direction (reasoning)` fall to `other`, and is that what the conventions text says?
3. **Surface Walk** — every CLI / MCP / HTTP / public-function surface in `orbit/specs/` still coherent? Run: `orbit emit review` with `reviewer_class: "fresh"` and no `direction` (exit non-zero, message names `direction` and the class, EMPTY stdout, no file — the body's claim rests on `src/commands/emit.ts`); the same under `--doc` with a `handoff`; `"direction": "forward"`; `{"disposition": "ship"}`; `{"disposition": "forward", "reasoning": ""}`; `reviewer_class: "Fresh"` in both modes; an in-context payload WITH a well-shaped direction (writes verbatim); then `orbit status --change <x> --report` over a fresh D4-generation emit with no `direction` (`[no direction]`), over an external file with `## Direction` + `**Disposition**: hold` + a two-paragraph body (the label line, a blank line, the `> ` body), with `Disposition: hold` (`[direction malformed]`, no body), with the section BEFORE `## CRITICAL`, with `## direction` lower-case, with two sections, and with a pre-D4 fresh emit (`pre-capability emit`, unchanged); `orbit validate rc04b-forward-recommendation --strict`; `orbit fingerprint rc04b-forward-recommendation --check` (8 verified); `orbit validate --sources`. Capabilities ARE surfaces; don't redefine them. The report's `Disposition: <token>` line sits at column 0 by design (an engine-printed label from the closed set) — confirm no reader of rendered reports treats a column-0 `Disposition:` line as structure.
4. **Perspective Reviews** — for each named perspective in `orbit/lenses/perspectives.md`, simulate the caller's POV (the lens files are absent in this repo; use these instead). YOU, the external reviewer: is the `## Direction` instruction inside the fence enough to write the section without the spec — does it say what `forward` and `hold` MEAN (the design says `hold` covers "route to architecture" too; does the prompt?), and is the opener's exact form unambiguous (bold label, colon, one token, nothing after)? An ADOPTER whose installed skills have neither our specs nor our tests: Step 8 tells them the surface REFUSES — does it tell them enough to compose the object correctly, and does Step 9's enumeration agree with Step 8 and the schema reference on when it is owed? A WALKER running `/orbit:address-reviews --from-file` on your own findings file: the format copy says the section is never walked — does anything tell the walker to READ it (D6 declined listing it at triage; is "never walked" alone a usable instruction)? The ARCHITECTURE-mode fresh reviewer: the interim hand-rendered shape prints `Direction:` with contained reasoning — does the example's final line (the readout) come AFTER the containment as the spec requires, and would an adopter hand-render it that way from the prose alone? The READINESS AUTHOR at archive: `formed_against` cites pass tokens — can they find each cited pass's direction without re-rendering every report (Q-crc-24 is named, not built; say whether the named deferral is honest)?
5. **Critical-Path Scan** — for each flow in `orbit/lenses/critical-paths.md`, walk end-to-end (absent; walk these). (a) The full review cycle on this very change: your findings file → `readTrail` (counts; the `(title, file)` key) → `orbit status --report` (the render) → the walk record → the gate's resolution match — put a `**File**:` line, a `### `-shaped line and a `**Disposition**: forward` line INSIDE your `## Direction` reasoning and confirm all three readers agree and the render shows them contained. (b) The archive flow this change heads into: five deltas, ten blocks synced into five baselines — diff each delta block against its baseline block and list every changed line; is every changed line in the proposal's "What Changes"? (c) The checked mirror: change one byte of the template's `## Direction` section in `review.ts` and confirm `severity-ladder-parity.test.ts` fails — then change one byte in the review-external delta's fence and confirm it fails the other way; then do the same for the `## Severity` paragraph to confirm the two mirrors are independent. (d) The near-miss golden `nearmiss-direction.golden.md`: its tail reads `Gate review-proposal: unpassed — cadence class 'in-context' has no fresh pass` for a fresh pass whose uncovered slot is `in-context` — the golden transcribes the engine's actual string; is that string RIGHT for that state (the word "fresh" on an in-context slot predates this change in `gates.ts`), and if it is wrong, whose stage is it? (e) The adopter's regenerated surface: diff the regenerated `.claude/skills/orbit-review/references/prompt-template.md` against the review-external delta's fence (the output-format block must be byte-equal) and against THIS prompt file's block.
6. **Drift / Residue** — vocabulary residue, stale references, archive-coherence misses. `grep -rn "Author the commentary\|(Change modes) Author\|no render surface covers\|review-external" src/ test/ orbit/specs orbit/changes/rc04b-forward-recommendation README.md docs/` — partition the hits: live pointer, baseline awaiting sync, retired-but-frozen vocabulary (the `review-external` RECORD vocabulary is frozen by design), or residue. `grep -rn "direction" orbit/specs/` must hit NOTHING yet (the baselines are untouched until archive) — and `grep -rn "reviewerClass" src/` must show every consumer handling the narrowed type. Check the design's touchpoint list against the apply emit's `files_touched` (CLAUDE.md, the goldens and `report-render-hardening.test.ts` — which were predicted, which not?). Check `tasks.md`'s appended notes for any claim the tree does not bear out — 2.4's "2455 passed, 8 failed" and the eight named, 4.3's seven enumeration line numbers, 4.4's 2463. Check the CLAUDE.md paragraph's claims: "2429 → 2463", "one golden gained the marked section", "two prior tests moved by design" — count them.

## Severity

Grade by `orbit-conventions`' Severity ladder. CRITICAL: a user path breaks or data is lost, AND the finding carries its reproduction — a case the reader can re-execute: the inputs, the rule or command, the expected result, the observed result (a command in system mode; a constructed case in proposal mode). WARNING: an implementation built to the artifact as written could diverge from what it intends. SUGGESTION: everything else. When unsure, grade lower. A condition that must stop apply regardless of consequence — an `orbit validate` failure, an unresolved `@review:` marker — is a BLOCK, not a severity: list it under `## Blocks`.

## Output format — write to:

`orbit/changes/rc04b-forward-recommendation/.orbit-runs/external-system-<TS>.md`

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

## Direction

**Disposition**: <forward | hold>

<REQUIRED — your own recommendation on moving forward, as `orbit-conventions`' External-review findings markdown format defines the section: the first non-blank line is the `**Disposition**:` opener with exactly one of the two tokens; the rest of this section is your reasoning — WHICH WAY and WHY. Never state finding counts, the gate's state, or a next command here; those exist only in the report's engine-computed sections. A return without this section is still a pass, but the report renders it `[no direction]`.>

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
   `**Reproduction**:` field, every `## Blocks` item, and the `## Direction` section (its `**Disposition**:` opener and body). Do NOT abbreviate or summarize — the chat output
   is the immediately-visible read for the user (they should be able to
   evaluate every finding without opening the file). The file remains the
   canonical record for `--from-file` parsing.

2. **Commit and push the findings file** (if your environment supports git):

   ```bash
   git add orbit/changes/rc04b-forward-recommendation/.orbit-runs/external-system-<TS>.md
   git commit -m "External review (system, iter 1): rc04b-forward-recommendation

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   Then STATE PLAINLY in your chat output that the findings landed —
   `Findings committed (<short-sha>) and pushed` — so the human never has to
   infer whether they reached the repo.

If you don't have git access, just output the findings markdown in this chat
(per the chat-only fallback above), state explicitly that you could NOT
commit/push, and the user will commit it manually.

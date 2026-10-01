# External Review: rc16-retirement-sweep (iteration 1)

You are reviewing an OpenSpec change as a second pair of eyes. Your value is
your independent take — be thorough; flag anything that looks wrong,
inconsistent, or unclear. Don't be charitable to the authoring AI's reasoning.

This is the EXTERNAL half of a BLIND PAIR (`spec-driven` v4, `review-system` cadence
`[blind-pair, in-context]`): a fresh Claude session reviews the same commit independently.
You must not read any `review-system-*.json` emit or walk log that may appear on the trail
after this prompt was packaged — review the pushed apply commit and nothing that came after.

## Repo

https://github.com/las-sal/orbit-spec.git — branch `d-arc`. The apply commit under review is
`0bc97a37` (its parent `c0608912` is the proposal-cycle close). The whole change is
`f3bfd0e2^..0bc97a37` (the exploration commit is `f3bfd0e2`).

## Project context (read first)

- `CLAUDE.md` — handoff orientation (read the "ACTIVE program" section; the rulings R-crc-1, R-crc-9, R-crc-12 and R-crc-14 bear on this change)
- `orbit/architecture/clean-up-review-cycle.md` — the program doc; `### Stage rc16-retirement-sweep` is the charter with three exit criteria, and Q-crc-28 in its Open questions section is the ledger this stage exists to close
- `orbit/project.md` — project goals + stack (if present)
- `*_convention.md` at repo root — naming, error handling, etc. (if present)
- `orbit/lenses/perspectives.md` — named callers worth validating from (if present)
- `orbit/lenses/critical-paths.md` — user flows worth walking end-to-end (if present)
- `orbit/changes/rc16-retirement-sweep/.orbit-runs/` — iteration history; see what's
  already been addressed in prior cycles (the proposal cycle: two passes, two walks)

## Cycle context

- Iteration: 1 (first external review for this change in system mode)
- Prior internal findings still open: none — the proposal cycle's 13 findings (fresh 1C/3W/6S; in-context 0C/3W/0S) were all walked to zero before apply; no system-mode pass has run yet
- Prior external findings still open: none (no external pass has run on this change in either mode)
- Resolved since last review: the fresh CRITICAL (the enumeration missed three in-set sites — a third delta, a fifth conventions block and two body pairs added; three capabilities at R-crc-1's ceiling, which the charter budgeted, so exit (2) grades as written); the design's A3 row now quotes the delta verbatim; task ids and count corrected; B3 qualified under `--full`; the A2 pointer form unified with A1; the Mechanism record's SOURCED closure now names the widened grep as its source and attributes it to the two passes that ran it; task 1.3's body text made verbatim; both `orientation.ts` comments named out; A4 repointed INTERNALLY at `orbit-conventions`' own grammar requirement (the maturity requirement does not state the never-entered-rule limit); A5 repointed at the claim `orbit-emit-composition`'s one-source requirement actually owns, the fixture clause dropped

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

## What to read for THIS review (--as system)

- orbit/changes/rc16-retirement-sweep/proposal.md, design.md, tasks.md, specs/ (three delta files, six MODIFIED requirement blocks; the design's repair table — fourteen rows A1–A5, A1'–A5'', B1–B3 — is the task list's source of truth; every task carries its measurement appended at apply)
- orbit/changes/rc16-retirement-sweep/explore.md — the exploration (six sections; D-rc16-2's `Closure: SOURCED` names a source the proposal cycle superseded — the file travels unchanged as history, by rule)
- The apply commit: `git diff c0608912..0bc97a37` (5 files) — and `git diff f3bfd0e2^..0bc97a37` for the whole change
- orbit/changes/rc16-retirement-sweep/.orbit-runs/apply-2026-10-01T18-03-47Z.json — the apply emit (its `final_assessment` carries the exit-criterion measurements and the two things the apply found)
- orbit/specs/orbit-conventions/spec.md, orbit/specs/orbit-explore-modifications/spec.md, orbit/specs/orbit-orientation/spec.md (baselines — the deltas MODIFY six of their requirements and are synced at archive, so compare the DELTA text against the body, and the baseline against anything the deltas do not touch; the baseline still carries the eight retired sentences by design until the sync)
- The OWNERS the repaired sentences now point at — read each named requirement and check it actually states the claim the pointer attributes to it: `orbit/specs/orbit-run-summary-emit/spec.md` (`Named-mode explore recommendation by maturity`), `orbit/specs/orbit-propose-modifications/spec.md` (`Mechanism section consumption`, `Consume mode when staging directory exists`), `orbit/specs/orbit-architecture-engine/spec.md` (`Computed stage state with completion-as-ratification`), `orbit/specs/orbit-emit-composition/spec.md` (`The explore grammar has one source in code`), and `orbit-conventions`' own `Mechanism entry grammar and accounted closure` (the A4 internal pointer)
- Code paths touched: `src/core/templates/workflows/explore.ts` (six sentences at lines 472, 504, 534, 606, 610, 657 of the parent commit), `test/core/templates/skill-templates-parity.test.ts` (two pins, one dated note), `test/core/templates/orbit-generated-surface.test.ts` (the mirror assertion's owner lookup — the ONE edit outside the design's touchpoints)
- `test/helpers/owner-text.ts` (untouched; the single-active-owner lookup the mirror fix now calls per anchor) and `test/core/explore-grammar-parity.test.ts`, `test/core/templates/orbit-content-fidelity.test.ts` (untouched callers of the same helper — do they share the shape that failed?)
- The regenerated skill is gitignored; regenerate it (`npm run build && node bin/orbit.js init --tools claude` in a scratch checkout, or `update --force`) and read `.claude/skills/orbit-explore/SKILL.md`'s conclude and composition sections as an adopter would

## What to look for

0. **verify-change-style structural check** — tasks done, spec coverage, design adhered (the external AI runs its own equivalent of upstream verify-change). 11 of 11 executable tasks are checked; 3.3 was converted at apply from a checkbox to an `AT-ARCHIVE NOTE` paragraph (exit 3 runs in the archive flow). Does every task's appended measurement hold on the tree? Does the body's KNOWN-paragraph replacement match the delta's "Owned, since shipped" paragraph BYTE-FOR-BYTE after unescaping (task 1.3 claims it does)? Does every one of the fourteen repair-table rows have a landed edit, and does any landed edit have no row?
1. **Baseline Compliance** — does this change break any archived `orbit/specs/` requirement? In particular: R-crc-14's rule (a rule is stated ONCE in the owning spec; every other surface NAMES it and points) — does any repaired sentence RESTATE the owner's claim instead of pointing, and does any pointer name an owner that does NOT state the claim (the proposal cycle caught two of these; look for a third)? D-rc16-2's rule that no repaired sentence names a STAGE ID — the regenerated skill's exemplar fence still says "rc13b" four times inside two verbatim-quoted entries, declared out of the set at apply as quoted history: is that declaration sound, or is a quoted exemplar living prose an adopter reads as current? `orbit-orientation`'s B1/B2/B3 repairs — does the qualified THEN clause still describe what `src/core/orientation.ts` actually does (the module parses no artifact content; the architecture state scan it consumes reads `explore.md` headers)? Read `src/core/orientation.ts` lines 22 and 50 and `src/core/architecture/state.ts` and say whether the two module comments the design names OUT are in fact true of the module.
2. **Cohesion** — callers/dependents outside the tasks list. The mirror-test fix: the old lookup silently compared `orbit-explore-modifications`' nine-move table against BASELINE while the delta is its owner-to-be — did the new per-anchor lookup change what any OTHER assertion in that test or in the two untouched helper callers compares against? Is there any remaining caller that resolves one capability's owner by a single anchor and reads several blocks from the result? Does the dated comment at the fix site describe the failure accurately (the claim: the delta holds the Mechanism-grammar block without the status-header block, so the shared lookup returned a text the status fence is not in)?
3. **Surface Walk** — every CLI / MCP / HTTP / public-function surface in `orbit/specs/` still coherent? No engine code changed; the surfaces to walk are the GENERATED ones: `orbit-explore`'s SKILL.md (conclude section, composition section, the `Kind:` bullet, the exemplar preamble, the VISIBILITY paragraph) and the parity/fidelity test suite that pins it. `orbit validate rc16-retirement-sweep --strict`, `orbit fingerprint rc16-retirement-sweep --check` (6 verified), `orbit validate --sources` (the three marked counts did not move — confirm). Capabilities ARE surfaces; don't redefine them.
4. **Perspective Reviews** — for each named perspective in `orbit/lenses/perspectives.md`, simulate the caller's POV (the lens files are absent in this repo; use these instead). An ADOPTER whose installed `orbit-explore` skill has neither our specs nor our parser: after this change the body names `orbit-run-summary-emit`'s and `orbit-propose-modifications`' requirements by title — can that adopter act on a pointer to a spec they do not have, and is that worse or better than the "until <stage> lands" prose it replaced? A FUTURE AUTHOR of the next retirement sweep: does the apply's record (tasks 1.7, 3.2, the emit) leave a grep they can re-run, or a count they must trust?
5. **Critical-Path Scan** — for each flow in `orbit/lenses/critical-paths.md`, walk end-to-end (absent; walk these). (a) The archive flow this change is heading into: sync six MODIFIED blocks into three baselines — do the delta blocks carry the WHOLE requirement text so that nothing outside the repaired sentences moves (the design's risk row says the byte-diff against baseline is the check — run it: diff each delta block against its baseline block and list every changed line; is every changed line in the repair table?). (b) Exit (1) at archive: the eleven quoted sentences grep to zero on the archived tree — will they, given the baseline currently holds eight and the deltas carry the replacements? (c) Exit (3): the post-archive project-wide audit-drift raises no Category 3 finding on the set — read the audit-drift body's Category 3 definition and say whether anything the sweep left (the exemplar fence, CLAUDE.md:413's historical line, the two `orientation.ts` comments) would trip it. (d) A reader following the conclude flow in the regenerated skill from "Concluding an exploration" through the "Owned, since shipped" paragraph to `/orbit:propose` — does every pointer resolve to a section or requirement that exists?
6. **Drift / Residue** — vocabulary residue, stale references, archive-coherence misses. Run the widened grep yourself over the whole tree (`maturity-signal stage`, `propose-consumption`, `until .* lands`, `keys on location`, `never from the file`, `artifact-content parsing`, `reads no file`, and an UNANCHORED `maturity-signal`) over `git ls-files` minus archives and trails, and partition the hits as the design's Mechanism record did (14 IN, 16 OUT at the proposal) — does the partition still hold after apply, and is any OUT member actually a living limit rather than a record? Check the design's touchpoint list against the apply emit's `files_touched` (the emit records one unpredicted file). Check the tasks.md records for any claim the tree does not bear out (task 2.1's note says the task text said "four" sites; the design says six).

## Output format — write to:

`orbit/changes/rc16-retirement-sweep/.orbit-runs/external-system-<TS>.md`

(Where <TS> is today's timestamp in ISO format. Pick a fresh timestamp so this
file doesn't overwrite prior reviews.)

Use this exact markdown structure:

```markdown
# External Review: rc16-retirement-sweep (iteration 1)

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
   git add orbit/changes/rc16-retirement-sweep/.orbit-runs/external-system-<TS>.md
   git commit -m "External review (system, iter 1): rc16-retirement-sweep

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   Then STATE PLAINLY in your chat output that the findings landed —
   `Findings committed (<short-sha>) and pushed` — so the human never has to
   infer whether they reached the repo.

If you don't have git access, just output the findings markdown in this chat
(per the chat-only fallback above), state explicitly that you could NOT
commit/push, and the user will commit it manually.

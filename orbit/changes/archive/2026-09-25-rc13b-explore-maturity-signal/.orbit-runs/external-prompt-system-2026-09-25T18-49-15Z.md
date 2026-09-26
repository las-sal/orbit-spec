# External Review: rc13b-explore-maturity-signal (iteration 1)

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
- `orbit/changes/rc13b-explore-maturity-signal/.orbit-runs/` — iteration history; see what's
  already been addressed in prior cycles

## Cycle context

- Iteration: 1 (first external review for this change in `system` mode)
- Prior internal findings still open: 0 — no system-mode pass has run yet. The proposal cadence
  (one fresh pass 2C/11W/5S, one external GPT-5 Codex pass 1C/4W/2S, one in-context confirm
  0C/2W/5S) was walked to zero and the `review-proposal` gate computed PASSED before apply.
- Prior external findings still open: 0 in system mode. The proposal-mode external pass's seven
  findings (headline: one array carrying open live rules AND key defects had no correct predicate;
  the opener rule stated in its consumer with no owner) were all resolved before apply.
- Resolved since last review: the whole apply — 17 of 18 tasks; task 6.4 is a user-validation
  handoff to the first independent pass (see the Notes instruction below).

**This is the EXTERNAL half of a BLIND PAIR** (spec-driven v4 `review-system` cadence:
`[blind-pair, in-context]`). A fresh clean-context Claude pass runs on the same state, blind to
you. Do NOT read any `review-system-*.json` emit or any walk record written after this prompt;
do not look for the other half's findings. Both halves must return before EITHER is walked.

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

## What the change shipped (orientation, not a substitute for reading)

The explore readout's maturity grid used to fire "ready to formalize" on heading count. This
change makes the engine READ the rc13a explore convention: a form parse over `explore.md`
(`src/core/parsers/explore-rules.ts`) computes five engine-owned emit fields — `rules_total`,
`rules_open` (live rules only, five disjoint states, its length is K), `key_defects` (orphans and
duplicates, by line), `residuals`, `status` (the header token) — through ONE grammar module
(`src/core/explore-grammar.ts`, whose production strings a parity test holds byte-equal to the
owning spec fences, and which the explore body template interpolates with the skill's hash pin
UNCHANGED). The grid (`maturityRecommendation` in `src/core/parsers/explore-counter.ts`) gained
six rungs: Concluded read FIRST, Early/Mid/Stalled byte-identical prefixes, Unaccounted and
Accounted with a bounded three-ID render and one identifier rule. Orientation
(`src/core/orientation.ts`, `src/commands/workflow/status.ts`) renders a concluded staging explore
as chip `■`, position `concluded`, and a BARE next line — all read from the newest spine-valid
emit's `status.token`, never from the file. Both parsers now use the engine's one CommonMark fence
tracker (the counter's local scanner is gone).

Four capability deltas (one over the R-crc-1 ceiling, declared in `design.md`), seven requirement
blocks. 2312 tests green (2254 before).

## What to read for THIS review (--as system)

```
- orbit/changes/rc13b-explore-maturity-signal/proposal.md, design.md, tasks.md, specs/
- orbit/changes/rc13b-explore-maturity-signal/explore.md (the mechanism record: 9 decisions, 7 rules with Mechanism entries)
- The change's commit range: git diff 99b51afc..HEAD (99b51afc is the propose commit; the apply lands in the commit(s) after d701dd60)
- orbit/specs/orbit-conventions/spec.md, orbit/specs/orbit-emit-composition/spec.md, orbit/specs/orbit-run-summary-emit/spec.md, orbit/specs/orbit-orientation/spec.md (baselines the four deltas modify)
- orbit/lenses/perspectives.md, orbit/lenses/critical-paths.md (judgment layer)
- Code paths touched: src/core/explore-grammar.ts (NEW), src/core/parsers/explore-rules.ts (NEW), src/core/parsers/explore-counter.ts, src/core/emit-composition.ts (the `explore` case + ENGINE_OWNED_EXTRA), src/core/orientation.ts, src/commands/workflow/status.ts (renderNextLine), src/core/templates/workflows/explore.ts, src/core/markdown-fence.ts (unchanged; both parsers import it)
- Tests: test/core/parsers/explore-rules.test.ts (NEW), test/core/explore-grammar-parity.test.ts (NEW), test/helpers/owner-text.ts (NEW — the single-active-owner lookup lifted out of the surface test), test/core/parsers/explore-counter.test.ts, test/core/emit-composition.test.ts, test/core/orientation.test.ts, test/commands/status-orientation.test.ts, test/core/templates/orbit-generated-surface.test.ts
- The archived exemplar the parser treats as a fixture: orbit/changes/archive/2026-09-25-bounded-closure-semantics/explore.md
```

## What to look for

0. **verify-change-style structural check** — tasks done, spec coverage, design adhered (the external AI runs its own equivalent of upstream verify-change). Every scenario in the four deltas should be executed by the shipped code — RUN the parser and the grid against the scenario inputs rather than reading the tests' word for it.
1. **Baseline Compliance** — does this change break any archived `orbit/specs/` requirement? In particular: `orbit-orientation`'s closed data-source rule (the row must read the TRAIL, never `explore.md`); `orbit-emit-composition`'s engine-owned refusal; `orbit-conventions`' Mechanism grammar (the parser's MALFORMED list vs. the spec's); the `orbit-run-summary-emit` shape requirement's "best-effort parse (if present)" for the Concluded rung's prose.
2. **Cohesion** — callers/dependents outside the tasks list. `maturityRecommendation`'s signature changed (a fourth required argument); `collectSections` is now exported with a new shape; `EmitRecord` gained an optional `status`, which surfaces in `last` on every JSON tier; orientation's `EXPLORE_EARLY_CANONICAL` still duplicates the Early string. Signature drift, ripple effects, side-effect additions.
3. **Surface Walk** — every CLI / MCP / HTTP / public-function surface in `orbit/specs/` still coherent? Capabilities ARE surfaces; don't redefine them. The explore emit gained five fields: do the boot render, the report renderer, the address-reviews auto-discovery, audit-drift, and the archived-trail readers tolerate them? Does anything read `next_recommended` expecting a leading `/orbit:` token?
4. **Perspective Reviews** — for each named perspective in `orbit/lenses/perspectives.md`, simulate the caller's POV.
5. **Critical-Path Scan** — for each flow in `orbit/lenses/critical-paths.md`, walk end-to-end. The conclude flow (header flip → CONCLUDED entry → emit → orientation row) is the path this change completes; walk it with a real `orbit emit explore` against a scratch staging directory.
6. **Drift / Residue** — vocabulary residue, stale references, archive-coherence misses. Known and DECLARED (not findings): the "until the maturity-signal stage lands" clauses in `orbit-conventions`' concluded-outcome requirement and the explore body's KNOWN paragraph are deferred to a later sweep per `design.md` Risks. The `five-section format` requirement TITLE is retained by design. Anything ELSE that still says the row is count-derived, or that the Mature rung exists, is a finding.

Probe the parser hard with inputs the tests did not think of: CRLF files, a `## Mechanism` section that appears twice, an H3 entry whose `Domain:` table is preceded by a blank line, a `Closure:` line inside a fenced block within an entry, a move line indented by two spaces, an ID with uppercase letters, a Decisions entry whose `Kind:` slot sits inside a fenced example, a `Re-entry:` carrier whose Disposition is `superseded`. The engine judges FORM only — but where it judges form WRONGLY, say so with the input that shows it.

## Output format — write to:

`orbit/changes/rc13b-explore-maturity-signal/.orbit-runs/external-system-<TS>.md`

(Where <TS> is today's timestamp in ISO format. Pick a fresh timestamp so this
file doesn't overwrite prior reviews.)

Use this exact markdown structure:

```markdown
# External Review: rc13b-explore-maturity-signal (iteration 1)

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

**One thing this change asks of you in `## Notes` (task 6.4, a user-validation handoff from
the rc13a stage):** state how many of YOUR CRITICAL findings are READ, ENUMERATE or COHERE
failures of the shipped mechanism (a fact it cites that is false / a member of its input domain
it missed / a contradiction between its own parts) — as a plain count, zero included, e.g.
`READ/ENUMERATE/COHERE CRITICALs: 0 of 0.` This is a classification of your own findings, not a
finding count of the report; it is recorded so the program can measure whether exploring a
mechanism under the convention actually removed that failure class.

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
   git add orbit/changes/rc13b-explore-maturity-signal/.orbit-runs/external-system-<TS>.md
   git commit -m "External review (system, iter 1): rc13b-explore-maturity-signal

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   Then STATE PLAINLY in your chat output that the findings landed —
   `Findings committed (<short-sha>) and pushed` — so the human never has to
   infer whether they reached the repo.

If you don't have git access, just output the findings markdown in this chat
(per the chat-only fallback above), state explicitly that you could NOT
commit/push, and the user will commit it manually.

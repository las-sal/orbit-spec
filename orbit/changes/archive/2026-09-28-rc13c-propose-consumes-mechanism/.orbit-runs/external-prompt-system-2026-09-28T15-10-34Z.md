# External Review: rc13c-propose-consumes-mechanism (iteration 1)

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
- `orbit/changes/rc13c-propose-consumes-mechanism/.orbit-runs/` — iteration history; see what's
  already been addressed in prior cycles

## Cycle context

- Iteration: 1 (first external review for this change in system mode). This is one half of a
  BLIND PAIR: a fresh clean-context internal pass runs on the same pushed tree; neither reads the
  other. Do not look for a `review-system-*.json` from it and do not wait for one.
- Prior internal findings still open: 0 in system mode (none yet). The proposal-mode cadence ran
  three passes before apply — fresh 2C/6W/6S, external (GPT-5 Codex) 2C/4W/2S, in-context 0C/4W/6S —
  all 32 walked to zero in three `address-reviews-*.json` logs; the `review-proposal` gate computed
  PASSED. The proposal-mode findings you may recognise from the trail were about ARTIFACTS; this
  review is about the SHIPPED BODY and its tests.
- Prior external findings still open: 0 in system mode (none yet).
- Resolved since last review: the proposal-mode walks (see the three logs) — headline items: the
  consume-time explore emit DESCOPED (it contradicted `orbit-run-summary-emit`'s one-shot rule), then
  its optional mtime-keyed cross-check removed (git keeps no mtime); the decision table made a
  PARTITION twice (first the closure-token/open-state overlap, then the duplicate-ID second entry
  that "not in `rules_open`" admitted); Step 0 precedence stated (conflict → concluded refuse →
  consume); the refuse text carries the `Re-entry:` slot verbatim; pointer discipline on the re-entry
  row, the identifier rule, the `rules_open` state set and the Decision-opener production.

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

## What to read for THIS review (--as system)

```
- orbit/changes/rc13c-propose-consumes-mechanism/proposal.md, design.md, tasks.md, specs/
- The change's commit range: git diff af4b7c52..HEAD (af4b7c52 is "rc13c proposed"; the apply commit follows it — the body, two test files, the artifacts as revised by the walks, and the trail)
- orbit/specs/<capability>/spec.md (archived baselines — for baseline-compliance check; the delta MODIFIES five blocks of orbit-propose-modifications and ADDS one; it POINTS at orbit-conventions, orbit-explore-modifications, orbit-run-summary-emit and orbit-emit-composition)
- orbit/lenses/perspectives.md, orbit/lenses/critical-paths.md (judgment layer — absent in this repo; note it and move on)
- Code paths touched by the change (cohesion + surface walk):
  - src/core/templates/workflows/propose.ts — the shipped body: Mode detection (Step 0: live-only inference, the Regenerate sentence, the resolve-mode refuse), Step 0a (the six-section mirror), Step 0b (the interpolated entry form; the Mechanism read after the last file write), Step 0c (the Mechanism row), NEW Step 0c.6 (the partition table, the four shapes, the record, the pre-move grep), Graceful degradation, and the PR lifecycle Position paragraph the refuse's "never reached" claim depends on
  - src/core/explore-grammar.ts — EXPLORE_DECISION_ENTRY_PRODUCTION, now interpolated into the propose body as well as the explore body
  - src/core/parsers/explore-rules.ts — the parser whose states the partition claims to cover (rules_total, rules_open's five states, key_defects' orphan/duplicate, residuals)
  - test/core/templates/orbit-content-fidelity.test.ts — the propose marker row and the NEW `rc13c propose consume-mode integrity` block (position, pointer-not-restated, residue, section-list parity, decision-table parity, four-shape parity, interpolated form)
  - test/core/templates/skill-templates-parity.test.ts — the two orbit-propose pins, moved once with a dated comment
  - test/helpers/owner-text.ts — the single-active-owner lookup the parity assertions reuse
  - .claude/skills/orbit-propose/SKILL.md is GITIGNORED; regenerate it with `npm run build && node bin/orbit.js update --force` if you want to read the rendered body rather than the template literal
```

## What to look for

0. **verify-change-style structural check** — tasks done, spec coverage, design adhered (the external AI runs its own equivalent of upstream verify-change). Note: task 4.4 is a declared user-validation handoff (unchecked by design); 4.5 was converted to an AT-ARCHIVE NOTE per the repo's convention — neither is a gap.
1. **Baseline Compliance** — does this change break any archived `orbit/specs/` requirement? In particular: `orbit-run-summary-emit`'s one-shot scenario for propose (the body must fire NO extra emit); `orbit-explore-modifications`' re-entry table and `orbit-conventions`' concluded outcome (pointed at, never restated — the program's R-crc-14); `orbit-explore-modifications`' boundary-residency-sweep rule (no explore emit is fired from propose, so it must not be implicated); the generated-file disposition and the shared PR choreography byte-identity tests.
2. **Cohesion** — callers/dependents outside the tasks list. The explore body and the ff body share idioms with propose: does the ff body (`src/core/templates/workflows/ff-change.ts`) also consume explorations, and if so does it now diverge from propose on the concluded refuse or the Mechanism read? Does anything else read `orbit/explore/*/` and count directories (orientation, audit-drift's explore cross-check, the architecture state reader) in a way the "live-only" inference rule should agree with?
3. **Surface Walk** — every CLI / MCP / public-function surface in `orbit/specs/` still coherent? Capabilities ARE surfaces; don't redefine them.
4. **Perspective Reviews** — for each named perspective in `orbit/lenses/perspectives.md`, simulate the caller's POV (absent here — skip and say so).
5. **Critical-Path Scan** — for each flow in `orbit/lenses/critical-paths.md`, walk end-to-end (absent here — skip and say so; but DO walk the propose consume-mode flow itself end-to-end as a proposing AI would follow it: Step 0 → phase 1 → 0a → 0b → 0c → 0c.5 → 0c.6 → 0d → fingerprint → emit).
6. **Drift / Residue** — vocabulary residue, stale references, archive-coherence misses. The body's `(five|5)[- ]sections?` residue must be zero (a test asserts it); `orbit-conventions`' retained requirement TITLE still says "five-section" by design (a deferred retirement-class sweep) — pointers to it by TITLE are legitimate, restated COUNTS are not.

Places worth starting, because they are where this change is most likely to be wrong: whether the
partition in Step 0c.6 really covers every entry the parser can produce, cell by cell against
`explore-rules.ts` (rows tested in order; "accounted" = counted in `rules_total` AND not in
`rules_open`; a duplicate second entry is in `key_defects` and excluded from `rules_total`; an
orphan has no owner at all — does row 1's "any owner state" read correctly for it?); whether the
refuse in the resolve-mode sub-step is REALLY unreachable by the PR layer's phase 1 on every path,
including the conflict prompt's Regenerate branch that now says the resolve-mode check runs next;
whether the parity assertions in the new test block actually pin what they claim (read the regexes
against the owning spec text — a normalization that silently passes on divergence is the failure
mode); whether the body's mirrored table would drift undetected if the ADDED requirement is edited
after archive (the `ownerText` lookup falls back to the baseline once the delta is synced — is the
anchor string `a PARTITION of the entries and live rules` going to survive sync?); whether the
interpolated `EXPLORE_DECISION_ENTRY_PRODUCTION` fence renders correctly inside the propose body
(the template literal escapes backticks); and whether the three exit criteria in the stage charter
(`### Stage rc13c-propose-consumes-mechanism` in `orbit/architecture/clean-up-review-cycle.md`)
are met by what shipped — (1) the Mechanism row and the pointer-not-number scenario, (2) the BOUNDED
exemplar's two residual slots verbatim in the delta and the design's Risks pointing at it, (3) the
refuse grep-tested and the re-entry requirement pointed at, not restated. Classify each CRITICAL you
raise as READ / ENUMERATE / COHERE (or none of those) in your Notes — the program tracks that count.

## Output format — write to:

`orbit/changes/rc13c-propose-consumes-mechanism/.orbit-runs/external-system-<TS>.md`

(Where <TS> is today's timestamp in ISO format. Pick a fresh timestamp so this
file doesn't overwrite prior reviews.)

Use this exact markdown structure:

```markdown
# External Review: rc13c-propose-consumes-mechanism (iteration 1)

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
   git add orbit/changes/rc13c-propose-consumes-mechanism/.orbit-runs/external-system-<TS>.md
   git commit -m "External review (system, iter 1): rc13c-propose-consumes-mechanism

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   Then STATE PLAINLY in your chat output that the findings landed —
   `Findings committed (<short-sha>) and pushed` — so the human never has to
   infer whether they reached the repo.

If you don't have git access, just output the findings markdown in this chat
(per the chat-only fallback above), state explicitly that you could NOT
commit/push, and the user will commit it manually.

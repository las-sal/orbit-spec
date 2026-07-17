# External Review: d2-architect (iteration 1 — system mode)

You are reviewing an OpenSpec change as a second pair of eyes AFTER its implementation landed.
Your value is your independent take — be thorough; flag anything that looks wrong, inconsistent,
or unclear. Don't be charitable to the authoring AI's reasoning.

## Repo

https://github.com/las-sal/orbit-spec.git — branch `d-arc`

## Project context (read first)

- `CLAUDE.md` — handoff orientation
- `orbit/architecture/d-arc-arbitered-flow.md` — this change is **Stage D2 of the D-arc program**
  AND the doc itself is part of the change's output (retrofitted in place as the first parseable
  instance); §Stage d2-architect's FOUR exit criteria are the acceptance tests; rulings
  R-d-1..10 constrain the design.
- `orbit/lenses/` — ABSENT in this repo (Passes 4–5 degrade)
- `orbit/changes/d2-architect/.orbit-runs/` — full iteration history (6 proposal-mode internal
  passes + 2 proposal-mode externals + 1 system-mode internal, all findings resolved)

## Cycle context

- Iteration: 1 in SYSTEM mode (first post-apply external; proposal mode saw 2 externals by
  GPT-5 Codex, iters 1–2, all findings resolved pre-apply).
- Prior internal findings still open: 0 — the in-context system pass (2026-07-16) found 2
  WARNINGs (stale prose in CLAUDE.md's D15 bullet + the arc doc's Sequencing bullet), both
  resolved via address-reviews.
- Prior external findings still open: 0.
- Apply provenance worth knowing: the change was applied via a RECORDED gate override
  (`gate_overridden` in `apply-2026-07-16T17-59-35Z.json`: review-proposal unpassed — trailing
  in-context slot uncovered; arc ruling R-d-10's sanctioned interim path after a
  suggestion-only tail). The proposal cadence history: 39 findings found and resolved across
  6 internal + 2 external passes.

Do not push back on stale findings — pushback discipline is enforced on resolution, not review.
Just flag what you observe.

## What the change shipped (orientation)

D-arc Stage D2: a THIRD engine declaration tier — architecture (cross-change program) above
schema (per-change flow). Shipped surfaces:

- `src/core/architecture/{parser,state,validate}.ts` — fence-aware parser with the NEAR-MISS
  rule (a heading starting `### Stage ` failing the exact grammar, or a bad slot line, is a
  named violation → doc classes MALFORMED, never silently legacy; LEGACY = zero stage-prefixed
  headings outside fences); computed stage state (in-change > exploring > quiescent > premised;
  `complete` ONLY when quiescent AND ratified; ratified mark on any non-quiescent observation
  renders INCONSISTENT); structure validation + the citation-resolution helper.
- `orbit architecture status|show|validate` (all `--json`; status buckets
  parseable/legacy/malformed; show slices ONE stage section; malformed docs error toward
  validate) — registered in `src/cli/index.ts`, implemented in `src/commands/architecture.ts`.
- `architecture: {doc, stage}` optional citation in change/explore metadata
  (`ChangeMetadataSchema`); `orbit validate <change>` owns two-level dangling resolution
  (doc vs stage; archive-depth roots handled) — `src/core/validation/validator.ts`.
- The arc doc RETROFITTED in place (six kebab stage headings, `Depends-on:`/`Complete:` slots,
  D1's mark ratified `[x] 2026-07-13 (Sal)`, ALL hand-maintained state paragraphs deleted);
  the archived D1 change's metadata backfilled with its citation; this change stamps the first
  live citation; CLAUDE.md's position pointer now names `orbit architecture status`.
- The 16th generated workflow `/orbit:architect` (`src/core/templates/workflows/architect.ts`,
  registered in six registries) + body edits: review (`--as architecture`, six passes, NO gate,
  never inferred, emits to `orbit/architecture/.orbit-runs/` with `handoff`), audit-drift
  (architecture staleness checks (a)–(d)), onboard (program-architecture layer + table rows),
  address-reviews (four-location audit-trail OUT set + architecture-scoped logs), explore
  (minimal `.openspec.yaml`: `schema: spec-driven` + `created` placeholders + optional citation),
  propose (staged-metadata MERGE before the bulk move), archive (stage-line garnish).
- Tests: `test/core/architecture/{engine,live-arc}.test.ts` (+ 15→16 pins across suites;
  parity hashes re-pinned). 1707 passing at apply completion.

The change directory: 34 delta requirements (16 ADDED + 18 MODIFIED) across 11 delta files;
20 tasks; baseline stays 14 capabilities until archive syncs it to 16.

## What to read for THIS review (--as system)

- orbit/changes/d2-architect/proposal.md, design.md, tasks.md, specs/ (all 11 delta files)
- The change's commit range: `git diff ad2d58e..HEAD` (~80 commits; the apply groups are
  `6a74971`, `6ddaf92`, `4165bf6`, `c00b942`, `852be04`)
- orbit/specs/<capability>/spec.md (live baselines — for baseline-compliance checks; note the
  deltas reconcile enumerations at archive-time sync, so body-ahead-of-baseline is expected
  mid-change, but body-CONTRADICTS-baseline is a finding)
- orbit/architecture/d-arc-arbitered-flow.md (the retrofitted doc — run
  `node bin/orbit.js architecture status` and compare against reality)
- Code paths: src/core/architecture/, src/commands/architecture.ts, src/cli/index.ts,
  src/core/validation/validator.ts, src/core/artifact-graph/types.ts, src/utils/change-metadata.ts,
  src/core/templates/workflows/{architect,review,audit-drift,onboard,address-reviews,explore,propose,archive-change}.ts,
  src/core/shared/{skill-generation,tool-detection}.ts, src/core/profiles.ts,
  src/core/profile-sync-drift.ts

Useful commands: `npm install && npm run build`, `npm test` (expect 1707 — note: if your
workspace path contains a SPACE, some command tests fail on unquoted path interpolation; that
failure class is environmental, not evidence), `node bin/orbit.js architecture status --json`,
`node bin/orbit.js architecture validate d-arc-arbitered-flow`,
`node bin/orbit.js validate d2-architect --strict` (passes),
`node bin/orbit.js fingerprint d2-architect --check` (expect 18/18 verified).

## What to look for

0. **verify-change-style structural check** — 20/20 tasks genuinely done? Every one of the 34
   delta requirements implemented (16 ADDED especially — the engine grammar, omission semantics,
   near-miss rule, state precedence, completion composition, CLI scenarios, citation round-trip,
   trail location, architect body behaviors, review third mode, staleness checks)? Design D1–D7
   adhered?
1. **Baseline Compliance** — do the landed bodies/engine break any LIVE `orbit/specs/`
   requirement? (e.g., D1's eligibility phrasing + no-imperative rule in NEW engine output; the
   review body's exact stock phrasings; emit-scope/timing baselines; the four-disciplines echo.)
2. **Cohesion** — callers/dependents outside the tasks list: `validateChangeDeltaSpecs` callers
   (validate direct/bulk, change show, archive preflight), metadata helpers' consumers,
   commander registration interactions, `getSkillTemplates` filter consumers.
3. **Surface Walk** — CLI surfaces coherent (new `architecture` group + all pre-existing);
   generated surface exactly 16 skills + 16 commands for claude AND codex; no accidental
   removals.
4. **Perspective Reviews** — skipped (no lenses); note if you disagree that they're absent.
5. **Critical-Path Scan** — skipped (no lenses).
6. **Drift / Residue** — 15→16 residue anywhere (docs, comments, tests, README); stale
   "hand-maintained/until D2" tense outside the append-only status log; the retrofit's own
   consistency (heading grammar vs prose references to "D1"/"D2" shorthand); dangling or
   missing citations. Independent-take probes: (a) does `orbit architecture status` output
   actually match reality right now? (b) does the near-miss rule hold on adversarial inputs
   (try a doc with a mistyped heading)? (c) do the explore/propose/archive body edits agree
   with each other on the staged-metadata lifecycle?

## Output format — write to:

`orbit/changes/d2-architect/.orbit-runs/external-system-<TS>.md`

(Where <TS> is today's timestamp in ISO format with hyphens. Pick a fresh timestamp so this
file doesn't overwrite prior reviews.)

Use this exact markdown structure:

```markdown
# External Review: d2-architect (iteration 1 — system mode)

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

If your environment doesn't support file writes (chat-only interface), output the markdown
directly and the user will save it.

## After completing the review

1. **Output the full findings markdown in chat** — every severity section, every entry, no
   abbreviation. The file remains the canonical record for `--from-file` parsing.

2. **Commit and push the findings file** (if your environment supports git):

   ```bash
   git add orbit/changes/d2-architect/.orbit-runs/external-system-<TS>.md
   git commit -m "External review (system, iter 1): d2-architect

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   Then STATE PLAINLY in your chat output that the findings landed —
   `Findings committed (<short-sha>) and pushed`.

If you don't have git access, output the findings markdown in this chat, state explicitly that
you could NOT commit/push, and the user will commit it manually.

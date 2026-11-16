> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: tripwire-sensors

## Premise

Stage `tripwires` of `automate-dev-flow`, the second of its four changes (D-tw-19): the computed sensors the first
change does not build — review circling, the byte budget (with orbit-spec's own skill budget test), the undeclared
capability, the ruling or goal edit, and the size breach. Each writes through the first change's contract: its reading
(D-tw-1), its reference fixed before the run and "cannot read" (D-tw-3), the readings field and the halt setting
(D-tw-5, D-tw-6) and late declarations (D-tw-14). Capabilities measured at the division: `orbit-tripwires` and
`orbit-skill-generation`. A bare `D-tw-<n>` here names a decision in `orbit/explore/tripwires/explore.md` (once that change is
archived, the `explore.md` in its `orbit/changes/archive/` folder); the decisions below are restated from that
exploration, each naming its source.

## Mechanism

### D-tsn-1 — the review sensor fires when the loop circles: one finding regressed in two verifications
Domain: what the verifications of one change say about one finding key (trimmed title, repo-relative file)
| member | covered by |
|---|---|
| never verified, or verified `landed` every time | no firing |
| `regressed` in exactly one verification pass | no firing: routine (37 of the 40 archives with verification carry one) |
| `regressed` in two or more verification passes | fires, naming the key, the two passes and the walks between them |
| `regressed`, then `landed` in a later verification | no firing: the second fix held |
Closure: BOUNDED — the four rows are closed over one key's verdict sequence, but the key is not the finding
Residual kind: a loop circling on one problem that the key cannot see — a finding re-titled between passes; a walk record unreadable to the gate, which owes no verdict; fixes repeated without an in-context verification between them
Residual method: first-run's closing review reading each change's walks for one file fixed in two or more walks of one gate
Moves:
- READ: applied — `orbit-emit-composition`' `A VERIFICATION-genre payload carries its verdicts and its findings link to the walk record` (`landed` \| `regressed`, keyed by the gate's resolution tuple); `orbit-engine-gates`' convergence criterion and its retired clause (c)
- ENUMERATE: applied — this table
- COHERE: applied — D-tw-3's reference here is the loop's normal shape, one verification per gate's walks; a second regression of one key is the deviation, and nothing can declare it
- EXECUTE: applied — run over the 68 archives with review emits on 2026-11-16: no key regressed twice, so the sensor fires on none
- FALSIFY: applied — a count trend (the latest pass found no fewer CRITICAL plus WARNING than the one before) would fire on most changes, since later passes routinely find more (2→10, 3→7, 1→5); review spend over `budget` would make an expected cost a permitted one (R-crc-11(h)); this reads neither
- CONFORM: applied — clause (c)'s retirement (no claim that a cadence converges); R-crc-11(h); G3 (zero firings on the record); D-tw-3; D-tw-6 (a reading on the review emit)
- FEASIBILITY: not applied — a pass over verdicts the trail reader already parses
- CONSUME: applied — the reading's evidence lists the key and both passes, so the user answering a halt sees the circle
- INVOKE: applied — the write of each review emit carrying `verification` (D-tw-6)

### D-tsn-2 — the budget sensor caps committed files' bytes; orbit-spec's generated skills are capped by a test
Domain: each state of a file a budget's paths match, and orbit-spec's own case
| member | covered by |
|---|---|
| a matched file at or under its maximum | no firing |
| a matched file over its maximum and larger than at the change's first apply commit | fires, naming the file, its bytes and its maximum |
| a matched file over its maximum and no larger than at that commit (already over before the change) | no firing; the reading notes it |
| a file new in the change, over its maximum | fires |
| a budget whose paths match no file | "cannot read" (D-tw-3's residual) |
| a maximum raised during the change | not seen: the budget is read from the config as at the first apply commit, so a raise applies to later changes |
| orbit-spec's generated skills (`.claude/` is gitignored, so not committed) | a test renders each skill in-process (`getSkillTemplates`, `generateSkillContent` in `src/core/shared/skill-generation.ts`) and holds its bytes at or under a committed table, first set to today's sizes; lowering an entry is free, raising one is a reviewed edit |
Closure: DERIVED — a matched file is at or under its maximum or over it; if over, larger than at the fixed point or not; new or not; a budget matches files or does not; plus orbit-spec's one uncommitted surface
Moves:
- READ: applied — `getSkillTemplates` (line 68) and `generateSkillContent` (line 147) in `src/core/shared/skill-generation.ts`; `.claude/` gitignored (CLAUDE.md); the sizes measured for D-tw-2
- ENUMERATE: applied — this table
- COHERE: applied — refines D-tw-2's mechanism and keeps its scope: a sensor an adopter can point at its own files must read committed files, and orbit's own generated skills are not committed, so the stage builds both halves
- EXECUTE: not applied — nothing is built yet
- FALSIFY: applied — firing on every file already over its maximum would fire on every change that touches one; comparing with the first apply commit fires only on growth
- CONFORM: applied — D-tw-2 (scope); D-tw-3 (reference at a fixed point; config read there too); R-adf-5 (orbit-spec is not run under the automation, so its guard is a test, not a sensor run)
- FEASIBILITY: not applied — a byte count per matched file
- CONSUME: applied — the reading (D-tw-6); for orbit-spec, `npm test` and CI
- INVOKE: applied — each seam the budget names; orbit-spec's test on every `npm test`

### D-tsn-3 — the capability sensor fires on a delta-spec folder the proposal's capability list does not name
Domain: each delta-spec folder and each listed capability, against the proposal as at the change's first apply commit
| member | covered by |
|---|---|
| a folder under the change's `specs/` whose name is listed | no firing |
| a folder whose name is not listed | fires, naming the folder |
| a capability listed with no folder | no firing; the reading notes it (the plan overshot, as Touchpoints' unsatisfied entries are read) |
| a heading holding `None.` | an empty list |
| no `## Capabilities` section, or no list under it that parses | "cannot read" |
Closure: DERIVED — the list is the backticked leading names under `### New Capabilities` and `### Modified Capabilities`; a folder is listed or not; a listed name has a folder or not
Moves:
- READ: applied — the section's shape in archived proposals (`orbit/changes/archive/2026-11-16-program-signoff/proposal.md`); no engine parser reads it today
- ENUMERATE: applied — this table
- COHERE: applied — the proposal's list freezes when apply begins, as Touchpoints does; before that, proposal review may revise it
- EXECUTE: applied — run over the 40 latest archives on 2026-11-16: every proposal has the section, no folder is unlisted, no listed name lacks a folder; the sensor fires on none
- FALSIFY: applied — code that changes a capability's behaviour with no delta folder is invisible here (no map from files to capabilities); the Touchpoints sensor watches code paths
- CONFORM: applied — D-tw-3; G3 (zero firings on the record)
- FEASIBILITY: not applied — a directory listing and one section parse
- CONSUME: applied — the reading (D-tw-6)
- INVOKE: applied — apply, review and archive emits of a change with delta folders

### D-tsn-4 — the ruling sensor fires when a Goals or Rulings-index item changes with no answered ruling-amendment stop
Domain: each Goals and Rulings-index item of the doc a change cites, as at the change's first apply commit against now
| member | covered by |
|---|---|
| no item changed, removed or added | no firing |
| an item changed, removed or added, with a `ruling-amendment` stop answered by a resolution written after the reference, in the change's trail or the doc's | no firing; the reading names the items and the stop |
| an item changed, removed or added, with no such stop | fires, naming the items |
| such a stop written but not answered | fires: an open amendment is not an approved one |
| the change cites no doc | does not run |
| the doc's `## Goals` or `## Rulings index` cannot be parsed | "cannot read" |
Closure: DERIVED — items are the anchors the ledger's `goal` and `ruling` citations already match (`**<id>` opening a Goals item, `**<id>**` under the Rulings index); each is unchanged, changed, removed or added; a covering stop is answered, open or absent
Moves:
- READ: applied — the ledger citation anchors (`orbit-decision-records`' `A ledger entry names what it relies on`); R-adf-13 recorded with a stop and its resolution in the doc's trail; R-adf-14 cites no stop
- ENUMERATE: applied — this table
- COHERE: applied — rulings are amended at architect sessions, whose records go to the doc's trail, so the search covers the change's trail and the doc's
- EXECUTE: applied — read against the Rulings index: R-adf-14's addition cites no stop, so it would have fired once; its answer would have been its declaration (D-tw-14)
- FALSIFY: applied — an added ruling is watched as an edit is, since an AI adding a permissive ruling is as sideways as one rewording a restrictive one. Named limit: a stop names no item, so one answered stop covers every edit in its window
- CONFORM: applied — R-adf-3 condition 3 (amending a ratified ruling or goal is a stop the AI owes); this sensor checks that it was written; D-tw-3
- FEASIBILITY: not applied — two section parses and a folder scan
- CONSUME: applied — the reading (D-tw-6)
- INVOKE: applied — apply, review and archive emits of a change citing a doc

### D-tsn-5 — the size sensor fires when the change grows a size figure past its maximum and the plan did not declare it
Domain: each of the four size figures, against the ceiling, the `## Size` declarations and the figure at the change's first apply commit
| member | covered by |
|---|---|
| no ceiling configured | the sensor does not run |
| a figure at or under its maximum | no firing |
| over its maximum, declared in `## Size` as at the first apply commit | no firing |
| over its maximum, undeclared, and larger than at the first apply commit | fires, naming the dimension, the figure and the maximum |
| over its maximum, undeclared, and no larger than at the first apply commit | no firing; the reading notes it (an undeclared breach present when building began is the propose size brief's and `validate --strict`'s to report) |
| a figure that could not be computed | "cannot read" (D-tw-3) |
Closure: DERIVED — the ceiling is configured or not; a figure is at or under its maximum or over it; if over, declared at the fixed point or not, and larger than there or not; or not computable
Moves:
- READ: applied — `SIZE_DIMENSIONS`, the breach comparison (strictly greater) and the `## Size` production in `src/core/change-size.ts`
- ENUMERATE: applied — this table
- COHERE: applied — the same growth rule as the budget sensor (D-tsn-2): a figure already over before the run fires nothing
- EXECUTE: not applied — nothing is built yet
- FALSIFY: applied — a `## Size` line written after the fixed point escapes nothing on its own (D-tw-14)
- CONFORM: applied — D-tw-3's size row; `orbit-change-size` keeps size out of every gate, and a reading moves no gate (a halt stops a chain, never a gate)
- FEASIBILITY: not applied — the figures are already computed for `orbit status`
- CONSUME: applied — the reading (D-tw-6)
- INVOKE: applied — apply, review, address-reviews and archive emits

## Decisions

- **2026-11-16 — D-tsn-1: the review sensor fires when the loop circles: one finding regressed in two verifications** Restated from D-tw-7 at the division (D-tw-19).
  Confirmed by the user. Orbit's "convergence" is a gate's pass condition, and the idea that a cadence converges when
  reviewers stop finding things was retired (`orbit-engine-gates`, clause (c)); the charter's "review iterations that stop
  converging" is read as the walk-and-verify loop going round twice on one finding. Measured over 68 archives: count
  trends would fire on most changes, one regression is routine, and a second regression of one key never happened.
  Kind: rule
- **2026-11-16 — D-tsn-2: the budget sensor caps committed files' bytes; orbit-spec's generated skills are capped by a
  test** Restated from D-tw-13 at the division (D-tw-19). Method, settled by the AI. Refines D-tw-2's mechanism within its scope: a sensor adopters point at their own
  committed files, firing on growth over a maximum; orbit-spec's generated skills are not committed, so a test renders
  them and holds them under a committed table set to today's sizes.
  Kind: rule
- **2026-11-16 — D-tsn-3: the capability sensor fires on a delta-spec folder the proposal's capability list does not name** Restated from D-tw-15 at the division (D-tw-19).
  Method, settled by the AI. Measured over 40 archives: no firing.
  Kind: rule
- **2026-11-16 — D-tsn-4: the ruling sensor fires when a Goals or Rulings-index item changes with no answered
  ruling-amendment stop** Restated from D-tw-16 at the division (D-tw-19). Method, settled by the AI. Added items are watched as edits are.
  Kind: rule
- **2026-11-16 — D-tsn-5: the size sensor fires when the change grows a size figure past its maximum and the plan did
  not declare it** Method, settled by the AI at the division (D-tw-19): D-tw-3's size row made a rule of its own, with the
  budget sensor's growth rule.
  Kind: rule

## Open questions

## Considered & out

- **2026-11-16 — Review convergence as a falling finding count:** out (D-tsn-1). The retired clause (c) by another route;
  later passes routinely find more, so it would fire on most changes.
- **2026-11-16 — Review spend over the gate's `budget`:** out (D-tsn-1). It makes an expected cost a permitted one
  (R-crc-11(h)).
- **2026-11-16 — A "walk budget":** out (D-tsn-1). No such concept exists in the code; repeated walks of one finding are
  what the circling sensor watches.

## References

- `orbit/explore/tripwires/explore.md` — the parent exploration: the contract, the reference model, the record, and D-tw-19's division
- `orbit/architecture/automate-dev-flow.md` — stage `tripwires`, G0, G3, G6
- `src/core/change-size.ts` — the four figures, the ceiling, `## Size` declarations and the breach comparison
- `orbit/specs/orbit-emit-composition/spec.md` — `A VERIFICATION-genre payload carries its verdicts and its findings link to the walk record`
- `src/core/shared/skill-generation.ts` — `getSkillTemplates`, `generateSkillContent` (the skill budget test renders through them)
- `orbit/specs/orbit-decision-records/spec.md` — `A ledger entry names what it relies on` (the Goals and Rulings-index anchors)

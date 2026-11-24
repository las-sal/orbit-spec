# Cut lists: orbit-explore, orbit-propose, orbit-archive-change, orbit-onboard

Measured 2026-11-23 on a surface generated from `db4becf9`, tokens as `npm run size:report` estimates them. Each move
keeps the step's basic content in the body (about 40 tokens) and moves its procedure to a reference read at the moment
named (`skill_body_convention.md`). Every entry is a move or a light rewording, none postulated major, so none is
replayed (D-inv-1). "Tighten" is a rewording of the prose that stays, no step removed, about 10%.

## orbit-explore (11,816 → about 4,926 on these cuts; about 4,430 tightened) — D-inv-16

| # | cut | kind | read when | net saving |
|---|---|---|---|---|
| D-inv-5 | the Mechanism-entry grammar, closure outcomes, nine moves and exemplar → `references/mechanism-entries.md`; concluding → `references/concluding.md` | move | a rule is captured; the user's word to conclude | 3,890 |
| E1 | crystallization: the Mode C flow, its four-consequence warning and the "substantive decision" test → `references/crystallization.md` | move | a bare session reaches two substantive decisions, or the user asks to name it | 587 |
| E2 | emit timing: the residency sweep, engine-owned fields, BEGIN emit, boundary detection, bare non-emission → `references/run-summary-emit.md` | move | before the session's first emit (the BEGIN emit, right after the scaffold) | 878 |
| E3 | minimal `.openspec.yaml` and the citation offer → `references/new-exploration.md` | move | a new named exploration is scaffolded | 219 |
| X1 | upstream "Handling Different Entry Points": all four dialogues; the ASCII box under "Visualize"; "Ending Discovery"'s summary template (its one-line point kept); Guardrails' restatements of the opening and the stance | REMOVED (D-inv-16, Sal's G0 ruling, R-rop2-4) | — | about 1,095 |
| R2 | "Composition with `/orbit:propose`": one sentence | reword | — | 221 |
| R3 | tighten what stays | reword | — | ~550 |

It now fits on its cuts alone; R3 adds margin. Kept in the body: the stance (upstream), the epitome, the three modes and
the re-entry table (read on every named invocation), the status header and Decisions-entry productions (every named
session), the capture types, offer-don't-auto, sibling captures.

## orbit-propose (8,127 → about 4,510 after moves; about 4,059 tightened)

| # | cut | kind | read when | net saving |
|---|---|---|---|---|
| P1 | consume mode's Steps 0a, 0b, 0c, 0c.6 and 0d (structure check, open questions, section mapping, the Mechanism carry table, the staged-metadata merge and move) → `references/consume-mode.md` | move | mode detection resolves consume | 3,222 |
| P2 | graceful degradation (its cases are consume mode's) → the same reference | move | as P1 | 148 |
| D-inv-2 | the chain end step's chained-prompt paragraph | move | a chain end step reports `configured` | 247 |

Kept in the body: upstream's standalone steps, the epitome, mode detection, Step 0c.5 (Touchpoints, both modes), the
base-fingerprint capture, the size brief, the PR lifecycle gate, the run-summary emit, the commit and chain end steps.
Step 0b's mirrors of explore's Decisions-entry and Mechanism productions move with it, the same bytes as D-inv-5's.

## orbit-archive-change (6,963 → about 5,047 after moves; about 4,542 tightened)

| # | cut | kind | read when | net saving |
|---|---|---|---|---|
| A1 | consent at entry's AI-mediated and granted paths → `references/consent-at-entry.md` (apply's Step 0 likewise) | move | the arrival is not user-typed | 514 |
| A2 | the user-validation closure's dispositions and DEFERRAL REFUSALS production → `references/user-validation.md` (bulk-archive's likewise, D-inv-3) | move | `tasks.md` holds an unchecked `(User-validation` task | 489 |
| A3 | the brief save's outcome table → `references/brief-save.md` | move | the save exits non-zero | 268 |
| A4 | the PR-attachment entry observation, the preflight detail and the outward-acts echo → `references/pr-archive-tail.md` (exists) | move | the trail carries a `pr_attachment` | 541 |
| R1 | the readiness line: drop its justification paragraph | reword | — | 104 |
| R2 | tighten what stays | reword | — | ~505 |

## orbit-onboard (5,575 → about 4,879 after moves; about 4,391 tightened)

| # | cut | kind | read when | net saving |
|---|---|---|---|---|
| O1 | the two PR-layer paragraphs → `references/pr-layer.md` | move | the project sets `pr:`, or the user asks about pull requests | 474 |
| R1 | the identity statement's execution-disciplines list: one line each, pointing at `orbit-conventions` | reword | — | 222 |

## Steps shared across bodies, decided once (the stage's third exit criterion)

| step | bodies | decision |
|---|---|---|
| the chain end step's chained-prompt paragraph | address-reviews, apply, ff, propose, review | moves to `references/chain-end-step.md` (D-inv-2) |
| the epitome's decision-writing bullet | every body with an epitome | shortened, same three branches (D-inv-2) |
| the commit step | apply, address-reviews, archive, ff, propose, review | stays whole (D-inv-2) |
| the sweep CHECK SCOPE / PATH production | address-reviews, review | moves to each skill's own reference, same bytes (M6, V1) |
| explore's Decisions-entry and Mechanism productions | explore, propose | the Mechanism grammar moves in both (D-inv-5, P1); the Decisions-entry production stays in explore's body |
| consent at entry | apply, archive | the AI-mediated and granted paths move in both (A1) |
| the user-validation closure | archive (bulk-archive removed, D-inv-14) | moves (A2) |

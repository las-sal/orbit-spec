## Why

Stage `decision-writing` of `automate-dev-flow` (from decision-layer's D-dl-8). decision-layer built the three
decision records — ledger entry, stop record, resolution — and their write-gate checks, but nothing tells the AI to
write one: `orbit-decision-records`' every-mode requirement says so as a named limit, and until it is lifted no run
leaves the record G2, G3 and G4 are graded from. This change adds the instruction, as a fifth execution discipline
every workflow body carrying a disciplines epitome carries (see explore.md, D-dw-3). The reading step that judges the records' prose was split off
to stage `decision-reading` at propose (D-dw-6).

## What Changes

- A fifth execution discipline, **decision-writing**, owned by one statement in `orbit-conventions` and carried
  byte-equal by every generated workflow body that carries a disciplines epitome (fourteen; onboard, which has
  none, names it). It names the moments: write the stop record BEFORE asking the user a
  question one of the five AI-raised stop conditions describes; write a resolution with the user's answer; write a
  ledger entry after any call in the eighteen ledger areas, naming the stop it raised when nothing approved covers it
  (a stop left OPEN where today's flow asks nothing); and write nothing at a designed prompt (a consent, inflection or
  closure prompt), a seam, unless a stop condition also describes it. Under supervised settings the AI still asks exactly as today.
- The statement interpolates the stop-condition and area ids from `src/core/decision-records.ts`, so an adopter's
  skill carries what it points at; a parity test holds the generated statement byte-equal to the owning spec's fence.
- What a record holds — its fields, its citations, the plain-language rule, one example each, executed by a test — ships as a
  shared reference, `references/decision-records.md`, beside every statement-carrying skill; the statement points at
  it. Its fields are composed from the write gate's lists and its examples pass the write gate.
- The epitome heading and intro in every body lose their count ("Execution disciplines (epitome)"; "The disciplines
  from `orbit-conventions`"), so a later discipline does not repeat this sweep; the onboard body names the fifth.
- The specs that state the set of disciplines stop saying "four": `orbit-conventions`' `No-chaining contract` and
  `Generated-file disposition`, `orbit-architect`'s `Architect workflow available`, and `orbit-onboard`'s `Identity
  statement section`.
- `orbit-decision-records`: the every-mode named limit is retired (the discipline is what tells the AI); the reading
  step's pointers name stage `decision-reading`; and the person orbit answers to is "the user", never a name
  (R-adf-10, D-dw-4). Attributions of who acted stay as written.
- `CLAUDE.md`'s execution disciplines list gains the fifth.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `orbit-conventions`: ADDED `Decision-writing discipline` (the owning statement) and `Decision-record reference ships
  beside the statement`; MODIFIED `No-chaining contract` and
  `Generated-file disposition` to state the epitome without a count.
- `orbit-decision-records`: MODIFIED six requirements — the every-mode named limit retired, the reading step pointed
  at stage `decision-reading`, and "the user" for the person orbit answers to.
- `orbit-architect`: MODIFIED `Architect workflow available` — "the execution disciplines block", no count.
- `orbit-onboard`: MODIFIED `Identity statement section` — the disciplines named, decision-writing among them.

## Impact

- `src/core/disciplines.ts` (new): the statement, composed from `LEDGER_AREAS` and `PAYLOAD_STOP_CONDITIONS`, and the
  shared decision-record reference, composed from `DECISION_PAYLOAD_FIELDS` and the write gate's citation shapes.
- Every workflow template under `src/core/templates/workflows/` carrying the epitome (fourteen), plus `onboard.ts`
  and three count mentions in `review.ts`.
- Tests: a new parity test; the generated-skill hash pins in `skill-templates-parity.test.ts`, the onboard marker in
  `orbit-content-fidelity.test.ts`, the sync-specs heading list in `verify-scenario-map.test.ts`, and the per-skill
  reference lists (`orbit-generated-surface.test.ts`, `config-profile.test.ts`, and `profile-sync-drift.test.ts`'s
  reference-less example) change because they enumerate the text and files this change edits (G0 as reworded, R-adf-9; each named at archive).
- `orbit-decision-records`' Purpose is edited in place ("the user").
- No engine readout, gate or emit changes; with every setting at its default the AI asks the user exactly as today.

## Size

- capabilities: four, one over the ceiling — orbit-architect and orbit-onboard each change one sentence that says "four disciplines", which the fifth discipline makes false on day one; splitting them out would ship a change whose specs contradict its bodies.

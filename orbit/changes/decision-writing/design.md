## Context

decision-layer shipped the three decision records and the write gate that checks them
(`src/core/decision-records.ts`, `orbit emit ledger | stop | resolution`), and stopped there (D-dl-8): no generated
skill tells the AI to write one, which `orbit-decision-records`' `Decision records are written in every mode` states as
a named limit. This change is the first half of stage `decision-writing` as split at propose (explore.md, D-dw-6): the
instruction. The reading step that judges the records' prose, and the replacement records it needs, are stage
`decision-reading`'s (D-dw-1, D-dw-2, D-dw-5, all `Disposition: assigned decision-reading`).

Today every generated workflow body carries a four-bullet "Four execution disciplines (epitome)" section, written by
hand per body: the bullets differ between bodies (each names where its discipline fires), and the fourth is always
no-chaining. Fourteen workflow templates carry it; `onboard.ts` carries a descriptive list of the four instead; and
four baseline sentences state the count (`orbit-conventions` twice, `orbit-architect`, `orbit-onboard`).

## Goals / Non-Goals

**Goals:**
- One owning statement of the fifth discipline in `orbit-conventions`, carried byte-equal as the fifth epitome bullet
  of every workflow body that has an epitome, held by a parity test (the stage's first exit criterion).
- The statement names the stop conditions and ledger areas itself, because an adopter's generated skill has neither
  this repository's specs nor its parser.
- No baseline sentence states a discipline count that the fifth discipline makes false.
- G0 as reworded (R-adf-9): with every setting at its default, the AI asks the user exactly as today; the only body
  change is an addition telling the AI to record something.

**Non-Goals:**
- The reading step, its brief, and replacement records (stage `decision-reading`).
- Any setting that makes a stop halt a run (stage `seam-chaining`), and orbit-raised `tripwire` stops (stage
  `tripwires`).
- Checking that a record was written when one was owed: that is first-run's closing review (G2, G4).

## Decisions

**D1 — The statement is composed in code from the write gate's own lists.** A new module `src/core/disciplines.ts`
exports `DECISION_WRITING_DISCIPLINE`, a one-line bullet built from `PAYLOAD_STOP_CONDITIONS` and `LEDGER_AREAS`
(`src/core/decision-records.ts`) plus a typed gloss per payload stop condition (a `Record` keyed by the condition, so a
new condition without a gloss fails to compile). Every template interpolates it. A parity test reads the owning fence
through the active-owner lookup (`test/helpers/owner-text.js`, as `explore-grammar-parity.test.ts` does) and asserts
equality. Alternatives: a hand-written bullet in each of fourteen templates (fourteen copies to drift; rejected); a
bullet that points at `orbit-decision-records` without the ids (an adopter cannot follow the pointer; rejected per
"generated bodies ship what they point at").

**D2 — One line, appended after no-chaining.** The bullet is the epitome's fifth item, so no-chaining stays the fourth
entry the D1 fidelity test reads, and each body's four existing bullets are untouched. It is one long line because the
byte-equality check is then a substring test with no indentation question.

**D3 — The epitome heading and intro lose their count.** `## Four execution disciplines (epitome)` becomes
`## Execution disciplines (epitome)`, and "The four disciplines from `orbit-conventions`" becomes "The disciplines from
`orbit-conventions`"; the two count mentions in `review.ts` (the external-handoff note and the `--parallel` subagent
note) say "the execution disciplines". The spec sentences that state the count are reworded the same way (no count),
except `orbit-onboard`'s, which names all five. Rationale: a count in fifteen headings is what made this change touch
four capabilities; a sixth discipline should not repeat it (D-dw-6's size breach).

**D4 — The onboard body names the discipline, it does not carry the statement.** Onboard is a reference read that
writes nothing (`orbit-onboard`'s non-emission requirement) and has no epitome; its list of disciplines gains a fifth
descriptive item, and its list heading loses its count. The parity test covers the fourteen epitome bodies; onboard
is held by its Identity scenario.

**D5 — `orbit-decision-records` says "the user" (D-dw-4, R-adf-10).** Six requirements are carried for it: "Sal" as
the person orbit answers to becomes "the user"; the every-mode named limit is replaced by a pointer at the new
discipline; and the two pointers at "the follow-on stage (explore.md, D-dl-8)" name stage `decision-reading`. The
`The ledger's eighteen areas` limit ("the list is Sal's choice of what matters") is an attribution of who chose and
stays. The spec's Purpose is edited in place at apply (no delta carries `## Purpose`).

**D6 — Carried scenarios are declared, not left.** Seven baseline scenarios ride in the MODIFIED blocks with no
declaration today (four in `No-chaining contract`, two in `Architect workflow available`, one in `Generated-file
disposition`), plus the four new ones. Each gets a `@scenario` tag on a test that asserts what its THEN is about, or an
`orbit/scenario-ledger.yaml` entry; scenarios about the AI's conduct in a live session (a stop record precedes its
question; a seam prompt writes nothing) are `untestable`, their evidence being first-run's trail.

**D7 — Tests edited because they enumerate what this change edits (G0, R-adf-9).** The generated-skill hash pins in
`skill-templates-parity.test.ts` (every body changes); the onboard marker `'Four execution disciplines'` in
`orbit-content-fidelity.test.ts`; and the sync-specs additions heading list in `verify-scenario-map.test.ts`. Each is
named in the archive. No assertion about today's behaviour is weakened.

## Alternatives considered

From explore.md's Considered & out:
- Editing a record in place, the reading step as its own review mode, and the reading step at archive — all stage
  `decision-reading`'s questions, recorded there for it.
- The reading step's brief against the review-genre brief rule — out of this change at propose; its standing
  recommendation is kept in explore.md for `decision-reading`.

## Risks / Trade-offs

- [The statement is long — about 1,600 characters, in fourteen bodies] → It is one line per body, read once per
  session; the alternative, a pointer, does not work for an adopter. Measure the body-size cost at apply and record it.
- [An AI may not follow the discipline] → Nothing mechanical can show it does; the scenario ledger says so, and
  first-run's closing review grades G2 and G4 from the trail. Under supervised settings an unwritten record changes
  nothing the user sees.
- [A gloss drifts from the spec's event table] → The fence owns the glosses and the parity test holds the code to it;
  the event table in `orbit-decision-records` is the source the glosses were written from, and both are named in the
  fence's requirement.

## Mechanism → artifacts

the proposing AI's reading of the file; no engine record

| rule | closure / state | owner's state | destination |
|---|---|---|---|
| D-dw-1 | BOUNDED | `Disposition: assigned decision-reading` | not carried (history) |
| D-dw-2 | SOURCED | `Disposition: assigned decision-reading` | not carried (history) |
| D-dw-3 | DERIVED | live rule | `orbit-conventions`' `Decision-writing discipline` — a normative TABLE (the moments and what each writes), the `Closure:` justification as the sentence after it |
| D-dw-5 | no entry | `Disposition: assigned decision-reading` | not carried (history) |

## Touchpoints

- `src/core/disciplines.ts` — new: `DECISION_WRITING_DISCIPLINE` and the condition glosses.
- `src/core/templates/workflows/*.ts` — the epitome heading, intro and fifth bullet in fourteen bodies; onboard's list; review's two count mentions.
- `test/core/decision-writing-parity.test.ts` — new: fence parity, composition, every body carries it.
- `test/core/templates/skill-templates-parity.test.ts` + `test/core/templates/orbit-content-fidelity.test.ts` + `test/core/templates/verify-scenario-map.test.ts` — the enumerations named in D7.
- `orbit/scenario-ledger.yaml` — entries for the scenarios no test can run.
- `orbit/specs/orbit-decision-records/spec.md` — the Purpose, edited in place.
- `CLAUDE.md` — the fifth discipline in its execution disciplines list.

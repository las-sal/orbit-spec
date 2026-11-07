> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: decision-writing

## Premise

Stage `decision-writing` of `automate-dev-flow` (from decision-layer's D-dl-8). decision-layer built the three
decision records (ledger entry, stop record, resolution) and their write-gate checks, but nothing tells the AI to
write one, and the reader half of `orbit-decision-records`' plain-language rule is covered by no step. This
exploration settles two things: the fifth execution discipline that tells the AI when to write each record, and the
reading step that judges the records' prose for a reader who knows only the architecture doc.

## Mechanism

## Decisions

## Open questions

- **How is a decision record fixed when the reading step finds a problem?** The walk cannot edit it: records live
  under `.orbit-runs/`, an audit-trail path the walk's ripple cascade excludes by policy, and trail files are never
  rewritten. Options: (a) a new record of the same kind carrying `replaces: <filename>`, the trail staying
  append-only and readers taking the latest in a chain; (b) edit records in place.
  Standing recommendation: (a) — one optional field and one check (`replaces` names a record of the same kind in the same folder that no other record already replaces).
- **Where does the reading step run?** The reader must know only the architecture doc and the records, which no
  existing reviewer class does. Options: (A) an added pass in system review that the invoking session dispatches to
  a clean subagent with that brief alone, folding its findings into the review emit so the walk works unchanged,
  skipped when the change has no records; (B) its own review mode (`--as records`) with its own trail genre and gate
  slot; (C) a step at archive (too late for a walk unless archive grows one).
  Standing recommendation: (A), riding the system cadence's in-context slot, since an external reviewer cannot dispatch it.
- **What exactly triggers each record?** The owning requirement for the fifth discipline needs observable triggers.
  Standing recommendation: four lines — write the stop record BEFORE putting to Sal a question one of the five payload conditions describes; write a resolution with Sal's answer; write a ledger entry after any call in the eighteen areas made without asking; consent, gate and sync prompts are seams, not stops, and write nothing. The epitome bullet in each body: "when a call or a stop arises, write its record per `orbit-decision-records`".

## Considered & out

## References

- `orbit/architecture/automate-dev-flow.md` — stage decision-writing's charter and exit criteria; G0 as reworded (R-adf-9)
- `orbit/specs/orbit-decision-records/spec.md` — the three records, the eighteen areas, and the plain-language table's reader rows
- `orbit/changes/archive/2026-11-07-decision-layer/explore.md` — D-dl-1..9, especially D-dl-6 (the reader) and D-dl-8 (this stage's scope)

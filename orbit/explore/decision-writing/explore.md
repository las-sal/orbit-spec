> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: decision-writing

## Premise

Stage `decision-writing` of `automate-dev-flow` (from decision-layer's D-dl-8). decision-layer built the three
decision records (ledger entry, stop record, resolution) and their write-gate checks, but nothing tells the AI to
write one, and the reader half of `orbit-decision-records`' plain-language rule is covered by no step. This
exploration settles two things: the fifth execution discipline that tells the AI when to write each record, and the
reading step that judges the records' prose for a reader who knows only the architecture doc.

## Mechanism

### D-dw-1 — a record is fixed by appending a replacement, and every link follows the chain
Domain: every place a decision record is named by another record or counted, which a replacement must not break
| member | covered by |
|---|---|
| the `replaces` field itself | names a record of the same kind in the same `decisions/` folder that no other record already replaces; refused otherwise |
| the link fields of the replaced record (`area`, `condition`, `relies_on`, `raised_stop`, `stop`) | a replacement carries them unchanged — it rewords, it never changes what happened; refused naming the first field that differs (Case 1) |
| the at-most-one-resolution check | counts a stop's resolutions with each chain collapsed to its latest, so a replacement of the one resolution is not a second (Case 2) |
| a new `raised_stop` or resolution `stop` naming a replaced stop | refused, naming the replacement to cite instead |
| a new `relies_on` citation of a replaced resolution | refused, naming the replacement to cite instead (Case 3) |
| a link written before its target was replaced | stays as written (the trail is never rewritten); a reader follows the chain forward from it |
| the run-summary readers (`orbit status`, the reviewed gates, the report) | read nothing in `decisions/` (`orbit-decision-records`' `Where decision records are kept`) |
| readers a later stage adds (the program brief, tripwires, G3 grading) | not yet built: each reads the latest record in every chain — a named limit carried into the requirement text |
Closure: BOUNDED — today's readers are the write gate's link checks in `src/core/decision-records.ts`, a closed set; the readers later stages add are not yet written
Residual kind: a reader of `decisions/` that a later stage adds and that reads a replaced record as current
Residual method: when a stage adds a reader of `decisions/`, its proposal checks it against this table; the requirement's named limit says so
Moves:
- READ: applied — the link checks read in `src/core/decision-records.ts` (the `raised_stop`/`stop` lookup, the `{change, token}` resolution citation, the one-resolution refusal); the walk's audit-trail exclusion read in `orbit-address-reviews` (OUT — audit trail)
- ENUMERATE: applied — this table; the 2026-11-07 standing recommendation named one check and missed the three link sites
- COHERE: applied — keeping link fields unchanged is what lets every link resolve through a chain without re-checking it: a chain is one event, reworded
- EXECUTE: applied — Cases 1 to 3, traced against the current checks by hand; run as fixtures at apply
- FALSIFY: applied — editing in place would pass every check and destroy the record of what the reader was first shown; the chain keeps both
- CONFORM: applied — records are true when written and never rewritten (`orbit-public-repository`, `orbit-source-lint`); R-crc-10 (form only)
- FEASIBILITY: not applied — a chain is a folder scan, as the one-resolution check already does
- CONSUME: applied — the walk resolves a finding on a record by writing its replacement (D-dw-2's CONSUME), since cascade cannot edit the trail
- INVOKE: applied — fires when the walk resolves a reading-step finding, or when the AI corrects its own record

### D-dw-2 — the reading step is a system-review pass the invoking session dispatches to a clean reader
Domain: the review contexts a change can be in, and what the reading step does in each
| member | covered by |
|---|---|
| system review, in-context pass, the change has records | the invoking session dispatches a clean subagent given only the brief (the architecture doc and the records); its findings fold into the pass's review emit |
| system review, the change has no records | the pass is skipped and the emit says so |
| system review, fresh pass | not run there: the fresh reviewer is itself a subagent; the in-context pass of the same cycle covers it |
| system review, external pass | not run there: the external runner cannot dispatch a subagent |
| proposal review | not run: records made while exploring travel into the change and are read at system review with the rest |
| architecture-mode review (records an architect session writes, naming the doc) | not covered in this stage — a named limit carried into the requirement text |
| archive | not a site: too late for a walk (Considered & out) |
Closure: SOURCED — the three review modes and three reviewer classes are `orbit-review`'s and `orbit-run-summary-emit`'s `reviewer_class`; archive is the only later step
Moves:
- READ: applied — `reviewer_class` values in `orbit-run-summary-emit`; the stage's exit criteria (runs with records, not without; brief shown to carry only the doc and records)
- ENUMERATE: applied — this table
- COHERE: applied — folding into the in-context emit means the gate, cadence and walk read the findings unchanged; no new trail genre
- EXECUTE: not applied — no pass exists yet; the exit criteria's two fixtures are its first execution
- FALSIFY: applied — an in-context reviewer has read the work and cannot not-know its internal names; hence a clean subagent, never the session itself
- CONFORM: applied — R-crc-10 (the reader judges meaning, orbit judges form); D11's Claude primacy (subagent dispatch is a Claude affordance, kept)
- FEASIBILITY: applied — the brief is the architecture doc plus a change's records, both small; one subagent per system cycle
- CONSUME: applied — the walk takes each finding; a record cannot be cascade-edited (audit trail), so its resolution is a replacement per D-dw-1
- INVOKE: applied — fires at every system review's in-context pass on a change whose `decisions/` folder holds a record

### D-dw-3 — the fifth discipline triggers on four observable moments
Domain: the moments in a session where the AI faces a question for the user or makes a call
| member | covered by |
|---|---|
| the AI is about to ask the user a question one of the five conditions the AI raises describes | write the stop record first, then ask exactly as today |
| the user answers that question | write a resolution naming the stop, with the answer |
| a call in the eighteen areas, made without asking, with something approved to rely on | write a ledger entry citing it |
| a call in the eighteen areas with nothing approved to rely on | it is a stop condition (`security-unprecedented` or `user-facing-uncovered`): stop record, then after the answer the ledger entry naming the stop |
| a consent, gate or sync prompt (a designed seam) | nothing: a seam is not a stop |
| a question to the user that matches no condition (a clarification) | nothing |
| a call outside the eighteen areas | nothing |
| a `tripwire` stop | not the AI's: orbit raises it (stage `tripwires`); the payload refuses it |
Closure: DERIVED — a moment is either a question to the user (a stop condition, a seam, or neither) or a call the AI makes (in the areas with or without precedent, or outside them); every branch is a row
Moves:
- READ: applied — the event table in `orbit-decision-records`' `Three decision records, one job each`; the `tripwire` refusal in `src/core/decision-records.ts`
- ENUMERATE: applied — this table
- COHERE: applied — supervised settings ask the user exactly as today (D-dl-7); the record only keeps the moment, so writing one never changes what the user sees
- EXECUTE: not applied — no skill carries the discipline yet; the parity test and first-run are its execution
- FALSIFY: applied — a trigger worded as "when a decision arises" would leave a call made without asking unrecorded; the ledger row names that moment explicitly
- CONFORM: applied — D1 no-chaining (seams stay consent prompts and write nothing); R-adf-3's closed condition set; G0 as reworded (R-adf-9)
- FEASIBILITY: not applied — one bullet per body, one owning requirement
- CONSUME: applied — the write gate is the consumer of every record the discipline writes, and already checks each record's form
- INVOKE: applied — the epitome bullet in every generated body is the trigger, held by a parity test against the owning statement in `orbit-conventions`

### Case 1 — a replacement that changes a link field
A resolution names `stop-A`; its `answer` is found unclear. A replacement carrying `replaces: resolution-B.json` and
`stop: stop-C.json` is refused naming `stop`: rewording an answer cannot move it to another stop.

### Case 2 — replacing the one resolution of a stop
`stop-A` has `resolution-B`. A replacement `resolution-D` (`replaces: resolution-B.json`, `stop: stop-A.json`) is
written: collapsed, `stop-A` still has one resolution. A third record `resolution-E` naming `stop-A` with no
`replaces` is refused, naming `resolution-B` and `resolution-D`'s chain.

### Case 3 — citing a replaced resolution
`resolution-B` is replaced by `resolution-D`. A new ledger entry whose `relies_on` cites `resolution-B`'s token is
refused naming `resolution-D`; an entry written before the replacement keeps its citation, and a reader follows it to
`resolution-D`.

## Decisions

- **2026-11-07 — D-dw-1: a record is fixed by appending a replacement, and every link follows the chain** A record
  the reading step finds unclear is fixed by a new record of the same kind carrying `replaces: <filename>`; the trail
  stays append-only and readers take the latest in each chain. A replacement keeps every link field of the record it
  replaces, and the write gate's three link checks (one resolution per stop, the stop lookup, the resolution citation)
  collapse chains before checking. Rationale: records are never rewritten, the walk cannot edit the trail, and keeping
  links fixed makes a chain one event reworded. Cost: one field plus a chain lookup at three sites, not one.
  Kind: rule
  Disposition: assigned decision-reading
- **2026-11-07 — D-dw-2: the reading step is a system-review pass the invoking session dispatches to a clean
  reader** An added pass in system review: the in-context session dispatches a clean subagent given only the
  architecture doc and the change's records, and folds its findings into the review emit so the walk works unchanged;
  skipped, and said so, when the change has no records. Not run on fresh or external passes, which cannot dispatch.
  Rationale: no existing reviewer knows only the architecture; a separate mode would add a trail genre and a gate slot
  for one pass.
  Kind: rule
  Disposition: assigned decision-reading
- **2026-11-07 — D-dw-3: the fifth discipline triggers on four observable moments** Write the stop record BEFORE
  asking the user a question one of the five AI-raised conditions describes; write a resolution with the user's
  answer; write a ledger entry after any call in the eighteen areas made without asking; consent, gate and sync
  prompts are seams, not stops, and write nothing. The epitome bullet in each body: "when a call or a stop arises,
  write its record per `orbit-decision-records`". Rationale: each trigger is an act the AI can see itself about to do.
  Kind: rule
- **2026-11-07 — D-dw-4: orbit's text says "the user", not a person's name** (the user, in session) Text this stage
  writes — the discipline, the reading-step brief, and the spec text it adds or changes — names the person orbit
  answers to as "the user". The normative uses of a name in `orbit-decision-records` (16) are reworded in this change,
  which modifies that spec anyway. Attributions stay as written: a `(Sal, <date>)` on a ruling or a `ratified … by Sal`
  is a fact about who acted, not a role. The architecture doc's prose is the user's to reword at an architect session.
  Kind: scope
- **2026-11-07 — D-dw-5: orbit renders the reading step's brief** (the user, at propose) The reading step's brief —
  the architecture doc and the change's records, nothing else — is rendered by orbit for a change, and the reviewing
  session passes it to the reader verbatim; a test inspects the rendered brief. Rationale: the exit criterion needs
  the brief shown, not asserted, and a brief the engine composes is one the body cannot add context to.
  Kind: rule
  Disposition: assigned decision-reading
- **2026-11-07 — D-dw-6: the stage splits in two, the discipline first, the reader second** (the user, at propose)
  The change exceeds the size ceiling (3 capabilities, 12 requirements): it touches six to seven specs and about
  fifteen requirements. It splits. The FIRST child is the discipline: D-dw-3 and D-dw-4 — the fifth discipline in
  every generated body; its owning statement in `orbit-conventions`; the "four execution disciplines" statements in
  `orbit-architect` and `orbit-onboard`; and `orbit-decision-records`' every-mode named limit retired and its prose
  reworded to "the user" (four capabilities, a declared breach). The SECOND child is the reader: D-dw-1, D-dw-2 and
  D-dw-5 — the replacement chain, the reading step and its rendered brief (`orbit-decision-records`,
  `orbit-emit-composition`, `orbit-review`; within the ceiling). Rationale: the discipline makes records exist, and
  the reader has nothing to read until they do. Declaring the two stages is the user's, at
  `/orbit:architect automate-dev-flow`; each child then proposes from this exploration, renamed or copied to its id.
  Kind: scope

## Open questions

- **(For the reader child) How does the reading step's brief sit with `orbit-conventions`' rule that a REVIEW-genre
  brief names no path under `.orbit-runs/` to read?** The records live in `.orbit-runs/decisions/`. The rule exists
  to keep reviewers blind to prior findings, and records are not findings, but the rule as written does not say so.
  Options: (a) the reading-step requirement states that the reader is not a review-genre reviewer and that its brief,
  rendered by orbit, carries the records' content and never a path; (b) amend the conventions rule with a named
  exemption (a MODIFIED block carrying all its scenarios). Related: the reading step could be a perspective inside
  system Pass 4 (Perspective reviews), so `System mode runs verify-change + six system-wide passes` keeps its count.
  Standing recommendation: (a), and the reading step as a Pass 4 perspective — both keep existing requirements true without editing them.

## Considered & out

- **2026-11-07 — Editing a record in place** (from Q1, option b) — breaks the rule that trail files are never
  rewritten, and loses what the reader was first shown.
- **2026-11-07 — The reading step as its own review mode (`--as records`)** (from Q2, option B) — a new trail genre
  and gate slot for one pass.
- **2026-11-07 — The reading step at archive** (from Q2, option C) — too late for a walk unless archive grows one.

## References

- `orbit/architecture/automate-dev-flow.md` — stage decision-writing's charter and exit criteria; G0 as reworded (R-adf-9)
- `orbit/specs/orbit-decision-records/spec.md` — the three records, the eighteen areas, and the plain-language table's reader rows
- `orbit/changes/archive/2026-11-07-decision-layer/explore.md` — D-dl-1..9, especially D-dl-6 (the reader) and D-dl-8 (this stage's scope)
- `src/core/decision-records.ts` — the write gate's link checks D-dw-1 must collapse chains in
- `orbit/specs/orbit-address-reviews/spec.md` — "OUT — audit trail": why the walk cannot edit a record
- `orbit/specs/orbit-conventions/spec.md` — owner of the four disciplines today; the fifth's owning statement goes here; its pass-genre requirement holds the review-genre brief rule
- `orbit/specs/orbit-review/spec.md` — `System mode runs verify-change + six system-wide passes` (Pass 4, Perspective reviews)
- `orbit/specs/orbit-emit-composition/spec.md` — the decision-record payload-field table `replaces` joins

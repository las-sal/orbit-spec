> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: decision-reading

## Premise

Stage `decision-reading` of `automate-dev-flow` (split from decision-writing at its propose, D-dw-6). decision-writing
made the AI write decision records; nothing yet reads them for the reader half of `orbit-decision-records`' `The
plain-language rule is held by structure and by a reader` (a new term left off `defines`, a plain field leaning on
implementation detail, a plain field that is correct and still unclear), whose named limit says those rows are covered
by no step until this stage ships. The charter: a reading step, a review pass given only the architecture doc and the
records, whose brief orbit renders; each problem it finds is a finding, walked like any other; a record the walk fixes
is fixed by a new record that replaces it, and every link check follows the replacement. Three of decision-writing's
decisions were assigned here (D-dw-1, D-dw-2, D-dw-5); this exploration re-measures them against today's review flow
before adopting them.

## Mechanism

### D-dr-2 — the reader runs in the system in-context pass, over the records new since the last reading
Domain: every point in a change's life at which decision records are written, and which reading step sees them
| member | covered by |
|---|---|
| w1 — explore, propose and apply sessions, and the proposal-review walks | the first system in-context pass's reading |
| w2 — the walk of the invoked system pass | the same reading: the in-context slot follows that walk by the cadence's ordering rule |
| a second system in-context pass (after a redesign, or a re-review) | its reading selects only records written after the last pass that carried a reading, the latest in each chain |
| w3 — the walk of the in-context pass, written only when that pass had a CRITICAL or WARNING | no reading before archive — a named limit in the requirement's text; archive records the count (D-dr-3); the program brief reaches the user when sign-off is on (G5) |
| the archive session itself | after every reading by construction: inside D-dr-3's count |
| a proposal-review in-context pass | no reading (D-dw-2); its records are w1 and are read at system review |
| an architect session's records (the architecture trail) | not covered — the named limit D-dw-2 carried |
Closure: BOUNDED — the change-level sites follow from the spec-driven cadence (`[invoked, in-context]` before archive), but the set of skills that write records grows as stages add them
Residual kind: a record written in work no system review cycle reaches, or at a step a later stage adds after the last reading
Residual method: when a stage adds a step that writes records, its proposal places it against this table; the archive emit's unread count surfaces any that reach archive unread
Moves:
- READ: applied — cadence `[invoked, in-context]` and `confirm: findings-resolved` in `schemas/spec-driven/schema.yaml`; the ordering constraint and clause (b) in `orbit-engine-gates`' `Reviewed-gate pass condition`; all four real records written during walks (the decision-writing trail)
- ENUMERATE: applied — this table; D-dw-2's table enumerated review contexts, not write points, and missed w3
- COHERE: applied — selecting by timestamp against the last reading uses the same token ordering the gate already uses (`v1 freshness rule`), so the reader and the gate agree on what is new
- EXECUTE: not applied — no reading exists; the exit criteria's two fixtures are its first run
- FALSIFY: applied — a reader of every record each time would pass every check and re-raise judged suggestions forever; a reader at the invoked pass would miss w2, which is where the real records were
- CONFORM: applied — D-dw-2 (kept); R-crc-10 (the reader judges meaning, orbit selects by form); G0 (no gate or readout changes: the reading folds into the in-context emit)
- FEASIBILITY: applied — one subagent per system cycle over a handful of records (the probe: four records, two tool uses)
- CONSUME: applied — the walk takes the findings (D-dr-4); D-dr-3's count consumes the same "since the last reading" selection
- INVOKE: applied — fires at every system in-context pass on a change with records new since the last reading; skipped, and said so, when there are none

### D-dr-4 — reader findings are walked like any finding, and the record is the unit of repair
Domain: what a reading step's finding can be, and what the walk does with it
| member | covered by |
|---|---|
| a finding on a record's plain wording, resolved | the record is replaced (D-dw-1's chain), its link fields unchanged |
| several resolved findings on one record | ONE replacement carrying all of them |
| a finding the walk marks stale, deferred or escalated | the walk's own disposition; no replacement |
| a reading with only SUGGESTIONs | needs no walk (clause (b), EXISTENCE FIRST); a walk may still resolve them |
| a finding that is a gap in the brief (cited text, the area list, when and in what work) | resolved against the brief (Q1), never by a replacement |
| a finding that a record cites the wrong thing (a link, not wording) | outside the reader rows: a replacement cannot change link fields; escalated — a named limit |
Closure: BOUNDED — the walk's dispositions are a closed set (resolved, stale, deferred, escalated), but what a reader can find is not: Q2 may add a row
Residual kind: a reader finding about something other than a record's wording or the brief
Residual method: classify each reading's findings against this table at its walk; a finding that fits no row is a finding against this rule
Moves:
- READ: applied — clause (b) of `Reviewed-gate pass condition` (suggestion-only passes need no walk); the four dispositions the gate's readability predicate recognises
- ENUMERATE: applied — this table
- COHERE: applied — one replacement per record is what D-dw-1's chain expects: a chain is one event reworded, so its rewordings belong together
- EXECUTE: applied — the probe's ten findings fall on three records, so three replacements (`sketches/probe-2026-11-08.md`)
- FALSIFY: applied — one replacement per finding would pass every check and leave a chain of half-fixed versions, each needing its own reading
- CONFORM: applied — `orbit-address-reviews`' audit-trail exclusion (records are never edited); D-dw-1
- FEASIBILITY: not applied — one emit per record with findings
- CONSUME: applied — the next reading (D-dr-2) selects the latest in each chain, so it reads the replacement and never the replaced
- INVOKE: applied — fires at the walk of any pass whose findings came from a reading

### D-dr-6 — the rendered brief carries what each record points at, as part of the record
Domain: every field of a record that points at something outside its own prose, and what the brief renders for it
| member | covered by |
|---|---|
| `relies_on` — a `ruling` or `goal` citation | already in the architecture doc the brief carries; rendered as the id, the reader looks it up there |
| `relies_on` — a `requirement` citation | the requirement's text from the baseline spec, up to its first scenario, under its capability and title |
| `relies_on` — a `resolution` citation | the cited resolution's `answer` and `effect`, the latest in its chain |
| `relies_on` — a `decision` citation (a live explore decision) | that Decisions entry's text, from the exploration or change it belongs to |
| a ledger entry's `area` | its row of `The ledger's eighteen areas`: the area's name and what it covers |
| a stop's `condition` | the condition as R-adf-3 words it, from the doc, beside its id |
| a resolution's `stop` / a ledger entry's `raised_stop` | the named stop's `about` and `question` |
| when and in what work the record was written | the record's timestamp and its change (or exploration) name |
| `replaces` | not rendered: the brief carries only the latest in each chain, so the reader never meets a replaced record |
| `detail` | rendered, marked as not bound |
Closure: SOURCED — the pointing fields are the payload tables in `src/core/decision-records.ts` (`DECISION_PAYLOAD_FIELDS`, `CITATION_SHAPES`'s five kinds) plus the two fields orbit adds (time, work) and the one D-dw-1 adds (`replaces`)
Moves:
- READ: applied — `CITATION_SHAPES` (requirement, ruling, goal, resolution, decision); `DECISION_PAYLOAD_FIELDS`; the areas table with its `area` and `covers` columns in `orbit-decision-records`
- ENUMERATE: applied — this table; the probe named three gaps and the table found seven pointing fields
- COHERE: applied — rendering only the latest in each chain (D-dr-2) is why `replaces` needs no rendering
- EXECUTE: applied — the probe's three gaps (cited requirement text, the area, when and in what work) each map to a row; rendered, record 3's apparent contradiction and "this change" resolve
- FALSIFY: applied — a brief of the doc and the bare records passes the exit criterion's "carries only the doc and the records" and still leaves a reader unable to check a citation; hence the pointed-at text is stated to be part of the record, in the requirement
- CONFORM: applied — D-dw-5 (orbit renders, the session adds nothing); `orbit-decision-records`' reader is still one who knows only the architecture: what is rendered is the record's own content, not outside knowledge
- FEASIBILITY: applied — a requirement's text up to its first scenario; some baseline requirements are long, still one brief per cycle
- CONSUME: applied — the reader (D-dr-7's fourth row) needs the cited text to judge a restatement
- INVOKE: applied — fires whenever orbit renders a reading brief (D-dr-2)

### D-dr-7 — a fourth reader row: a restatement that shifts what it cites
Domain: the ways a record can fail its plain-language rule, and what catches each
| member | covered by |
|---|---|
| a plain field left empty | the write gate (existing) |
| a `defines` term with no definition | the write gate (existing) |
| a new term used and left off `defines` | the reader (existing row) |
| a plain field that relies on implementation detail | the reader (existing row) |
| a plain field that is correct and still unclear | the reader (existing row) |
| a plain field that restates something the record cites, so that its meaning shifts | the reader, holding the cited text (D-dr-6) — NEW |
Closure: BOUNDED — the rows came from the decision-layer design and one probe, not a structure
Residual kind: a way a record misleads its reader that none of the six rows names
Residual method: classify each reading's findings against the rows at its walk; a finding that fits none adds a row, as a change to the requirement
Moves:
- READ: applied — the five rows of `The plain-language rule is held by structure and by a reader`; the probe's one WARNING (record 2's "an outward act" dropping R-adf-3 (4)'s qualifier)
- ENUMERATE: applied — this table
- COHERE: applied — the row is about wording, so D-dr-4's repair (a replacement with links unchanged) fixes it; a wrong citation stays outside (D-dr-4's escalated row)
- EXECUTE: applied — the probe's record 2 WARNING and record 1's "nothing approved backs it" both classify to the new row, not to "unclear"
- FALSIFY: applied — filed as "unclear", a clear but wrong restatement reads as a style note and is the likeliest to be deferred, though it misstates what the call relied on
- CONFORM: applied — R-crc-10 (a reader's judgement, never a check orbit runs on the prose)
- FEASIBILITY: not applied — one more row for the reader to judge
- CONSUME: applied — the walk takes it like any reader finding (D-dr-4); its severity is the ladder's, by consequence
- INVOKE: applied — fires at every reading over a record with a citation

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

### D-dr-8 — the reading is a Pass 4 perspective in either genre, and its brief carries content, never a path
Domain: the in-context system pass's genres and the rules each places on a brief or a finding, and how the reading meets each
| member | covered by |
|---|---|
| REVIEW-genre in-context pass (no walk of its mode before it) | the reading runs inside Pass 4 as a perspective; its findings join the pass's findings like any perspective's |
| VERIFICATION-genre in-context pass (the usual case) | the reading still runs inside Pass 4, over the records D-dr-2 selects, not the walks' sweep scope; its findings carry no `walk_entry` and render `[outside the walk record]`, as any unlinked finding does |
| the review-genre brief rule (no `.orbit-runs/` path, no finding, no pass token) | the reader is stated not to be a review-genre reviewer; its brief, rendered by orbit (D-dr-6), carries the records' content and no path |
| Pass 4 with no perspectives defined (skipped today) | the reading is not a lens perspective: it runs when D-dr-2 selects records, whether or not `perspectives.md` exists |
| `System mode runs verify-change + six system-wide passes` | unchanged: no seventh pass |
Closure: SOURCED — the genres are `orbit-conventions`' `Review mode decision framework` table (REVIEW, VERIFICATION); the brief rule and Pass 4's skip are `orbit-review`'s
Moves:
- READ: applied — `Review-genre passes read the artifacts and the code, never the trail's findings`; `Verification-genre passes grade the walk record` (its unlinked-finding mark); Pass 4's scenarios (lenses, and the skip when none are defined)
- ENUMERATE: applied — this table; the carried recommendation named the brief rule and the pass count, not the verification genre's scope or Pass 4's skip
- COHERE: applied — the reading's subject is the selected records, never a file set, so the verification genre's sweep-scope narrowing does not apply to it
- EXECUTE: not applied — no reading exists; the stage's fixtures run it in both genres at apply
- FALSIFY: applied — tied to Pass 4's lens skip, the reading would silently never run in a project without `perspectives.md`; hence its own trigger
- CONFORM: applied — the pass-count requirement; the brief rule (the reader is outside it by statement, not by exception); D11 (subagent dispatch kept)
- FEASIBILITY: not applied — one subagent inside a pass that already runs
- CONSUME: applied — the walk reads unlinked findings unchanged (D-dr-4); the gate counts them like any finding
- INVOKE: applied — fires at Pass 4 of every system in-context pass with records selected (D-dr-2)

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

- **2026-11-08 — D-dr-1: a reader given only the doc and the records catches real defects, mostly small** The probe
  (`sketches/probe-2026-11-08.md`) ran a clean subagent over the program's four real ledger entries: 1 WARNING and 9
  SUGGESTIONs over three of the four; every record was still restatable from its bound fields. The one WARNING, and
  three of the suggestions, are a PARAPHRASE OF A CITED RULING THAT SHIFTS ITS MEANING (R-adf-3's conditions losing a
  qualifier) — caught only because the reader holds the ruling's text. Three of the reader's gaps were the brief's,
  not the records': cited requirement text, the area list, and when and in what work each record was written.
  Kind: fact
- **2026-11-08 — D-dr-2: the reader runs in the system in-context pass, over the records new since the last reading**
  (the user, in session) D-dw-2 is kept, with one refinement: orbit selects the records written since the last pass
  that carried a reading, the latest in each chain, so a re-run reads only what is new. Records written while walking
  the in-context pass's own findings are read by no step before archive; that is a named limit in the requirement's
  text, the same shape the gate already accepts for the last walk's edits. Rationale: the in-context pass is in every
  system cadence and is the only pass after the walks, where the real records were written.
  Kind: rule
- **2026-11-08 — D-dr-3: archive accounts for records no reading saw, in this stage** (the user, in session) Archive
  counts the records written after the last reading (D-dr-2's selection) and records it. Rationale: it turns D-dr-2's
  named limit into something seen, and a later tripwire or the program brief can read it. Where the count appears is
  D-dr-5.
  Kind: scope
- **2026-11-08 — D-dr-5: the unread count lives in archive's run record, never its readout** (the user, answering
  stop `stop-2026-11-08T20-48-08Z.json`) The count D-dr-3 adds is an engine-computed field of the archive emit; no
  readout shows it, so G0 holds as worded. The program brief and tripwires read it from there. Rationale: a readout
  line under default settings would change what the user sees today.
  Kind: scope
- **2026-11-08 — D-dr-4: reader findings are walked like any finding, and the record is the unit of repair** (the
  user, in session) The walk gives each reader finding its own disposition by its usual rules; every resolved finding
  on one record lands in ONE replacement; a finding that is the brief's gap is resolved against the brief, never by a
  replacement. Rationale: suggestions already never gate, and one replacement per record keeps a chain one event.
  Kind: rule
- **2026-11-08 — D-dr-6: the rendered brief carries what each record points at, as part of the record** (the user,
  adopting the standing recommendation) Beside the architecture doc and the records, orbit renders, per record: the
  text of each cited requirement, resolution and explore decision; its area's row; its stop condition's wording; the
  stop a resolution or ledger entry names; and when and in what work it was written. The requirement says these are
  the record's own content, so the reader still knows only the architecture. Rationale: three of the probe's gaps were
  the brief's, and a citation a reader cannot read cannot be checked.
  Kind: rule
- **2026-11-08 — D-dr-7: a fourth reader row — a restatement that shifts what it cites** (the user, adopting the
  standing recommendation) `The plain-language rule is held by structure and by a reader` gains the row "a plain
  field that restates something the record cites, so that its meaning shifts", caught by a reader holding the cited
  text. Rationale: the probe's one WARNING was this, and "unclear" undersells a record that is clear and wrong.
  Kind: rule
- **2026-11-08 — D-dr-8: the reading is a Pass 4 perspective in either genre, and its brief carries content, never a
  path** (the user, adopting Q6's standing recommendation) The requirement states that the reader is not a
  review-genre reviewer and that its orbit-rendered brief carries the records' content and never a path; the reading
  runs inside system Pass 4 in both genres, over the records D-dr-2 selects, triggered by those records rather than by
  `perspectives.md`; on a verification pass its findings render `[outside the walk record]`. Rationale: keeps the
  six-pass count and the brief rule, and sits in the one pass that already judges for a reader.
  Kind: rule
- **2026-11-07 — D-dw-1: a record is fixed by appending a replacement, and every link follows the chain** A record
  the reading step finds unclear is fixed by a new record of the same kind carrying `replaces: <filename>`; the trail
  stays append-only and readers take the latest in each chain. A replacement keeps every link field of the record it
  replaces, and the write gate's three link checks (one resolution per stop, the stop lookup, the resolution citation)
  collapse chains before checking. Rationale: records are never rewritten, the walk cannot edit the trail, and keeping
  links fixed makes a chain one event reworded. Cost: one field plus a chain lookup at three sites, not one.
  Kind: rule
  (Carried from `orbit/changes/archive/2026-11-08-decision-writing/explore.md` on 2026-11-08, the user's word; its Mechanism entry and Cases 1–3 with it. D-dw-2's CONSUME, cited in its move lines, is D-dr-4 here.)
- **2026-11-07 — D-dw-2: the reading step is a system-review pass the invoking session dispatches to a clean
  reader** An added pass in system review: the in-context session dispatches a clean subagent given only the
  architecture doc and the change's records, and folds its findings into the review emit so the walk works unchanged;
  skipped, and said so, when the change has no records. Not run on fresh or external passes, which cannot dispatch.
  Rationale: no existing reviewer knows only the architecture; a separate mode would add a trail genre and a gate slot
  for one pass.
  Kind: rule
  Disposition: superseded D-dr-2
- **2026-11-07 — D-dw-5: orbit renders the reading step's brief** (the user, at propose) The reading step's brief —
  the architecture doc and the change's records, nothing else — is rendered by orbit for a change, and the reviewing
  session passes it to the reader verbatim; a test inspects the rendered brief. Rationale: the exit criterion needs
  the brief shown, not asserted, and a brief the engine composes is one the body cannot add context to.
  Kind: rule
  Disposition: superseded D-dr-6

## Open questions

## Considered & out

- **2026-11-08 — The unread count as a line in archive's readout** (from Q5) — changes a readout at default
  settings, so it would need G0 reworded; the program brief already brings the count to the user.
<!-- The four 2026-11-07 entries below are carried from decision-writing's exploration; their "Q1"/"Q2" are that file's questions. -->
- **2026-11-07 — The reading step's brief and the review-genre brief rule** (from the open question, out of this
  change at propose: it is stage decision-reading's) The records live in `.orbit-runs/decisions/`, and
  `orbit-conventions`' pass-genre requirement forbids a REVIEW-genre brief to name a path under `.orbit-runs/` to read.
  Standing recommendation, kept for decision-reading: the reading-step requirement states that the reader is not a
  review-genre reviewer and that its brief, rendered by orbit, carries the records' content and never a path; and the
  reading step runs as a perspective inside system Pass 4, so `System mode runs verify-change + six system-wide
  passes` keeps its count.
- **2026-11-07 — Editing a record in place** (from Q1, option b) — breaks the rule that trail files are never
  rewritten, and loses what the reader was first shown.
- **2026-11-07 — The reading step as its own review mode (`--as records`)** (from Q2, option B) — a new trail genre
  and gate slot for one pass.
- **2026-11-07 — The reading step at archive** (from Q2, option C) — too late for a walk unless archive grows one.

## References

- `orbit/architecture/automate-dev-flow.md` — stage decision-reading's charter and exit criteria; G0 (R-adf-9), G5
- `orbit/changes/archive/2026-11-08-decision-writing/explore.md` — origin of D-dw-1, D-dw-2, D-dw-5 (carried here 2026-11-08) and Cases 1–3; the Considered & out entry on the review-genre brief rule
- `orbit/specs/orbit-decision-records/spec.md` — the reader rows and their named limit; `Where decision records are kept`
- `src/core/decision-records.ts` — the write gate's link checks (`checkDecisionLinks`, `readNamedStop`, `checkResolutionCitation`)
- `orbit/specs/orbit-review/spec.md` — `Review-genre passes read the artifacts and the code, never the trail's findings`; `Verification-genre passes grade the walk record`; system Pass 4
- `orbit/changes/archive/2026-11-08-decision-writing/.orbit-runs/decisions/` — the program's first four ledger entries, written during walks: a real corpus to probe a reader on
- Size estimate at the end of exploration (2026-11-08, unmeasured, for propose to measure): about five capabilities —
  `orbit-decision-records` (reader rows, `replaces`, named limits), `orbit-emit-composition` (`replaces`, the rendered
  brief, archive's unread count), `orbit-review` (the Pass 4 reading), `orbit-address-reviews` (one replacement per
  record), and the archive emit's owner for the count — against a ceiling of three.

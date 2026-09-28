> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: rc13c-propose-consumes-mechanism

## Premise

rc13a made a rule's domain ACCOUNTED inside the exploration: every live rule owes a Mechanism entry
with a `Closure:` token, and a BOUNDED entry names its residual's KIND and METHOD in two slots.
D-bcs-3 settled what happens next — an OPEN-DECLARED residual never blocks; it TRAVELS. Its domain
table names the carriers: the spec delta's requirement text is the OWNER (only spec text survives
archive), `design.md`'s Risks is a POINTER, proposal and tasks are not carriers. rc13b then made the
readout READ the form: `parseExploreRules` computes `rules_open`, `residuals` (`{id, kind, method}`
per BOUNDED entry), `key_defects` and the header `status`, and the Accounted rung reports "M live
rules accounted, K bounded residuals named".

The layer downstream of both is `/orbit:propose`'s consume mode, and it has not moved:

- `orbit-propose-modifications`' `Section-to-artifact mapping` has rows for Premise, Decisions, Open
  questions, Considered & out and References, plus the Touchpoints seed — and NO row for Mechanism.
  The propose body's Step 0c table is the same six rows. A residual reaches the spec delta and the
  design's Risks only because the proposing AI remembered D-bcs-3 from the explore body's prose
  ("until a propose-consumption stage lands, that transfer is an instruction the proposing AI follows
  from the authoritative file, not a checked mapping").
- `Validate explore.md structure before consuming` still says "all five expected sections (Premise /
  Decisions / Open questions / Considered & out / References)", and the body's Step 0a checks "the
  five-section structure". `orbit-conventions`' format requirement has been SIX sections since rc13a
  (its retained title still says five — a pointer target, deliberately). rc13a's design listed
  `propose.ts:154/156` as a justified exemption from its residue sweep, naming this stage as the seam.
- `/orbit:propose <name>` keys on `explore.md`'s PRESENCE. It reads no header token. A staging
  directory whose first line is `> **Status**: concluded <date>.` is promoted exactly like a live
  one: the change is scaffolded, the directory is moved, and the conclusion's `Re-entry:` slot travels
  into a change directory as history nobody asked for. D-bcs-7's third row (staging, concluded, no
  change → state the conclusion and its trigger; REOPEN only on the user's word) is the shape the
  explore side already agrees with; propose is the one transition that table cannot see.

So the failure D-bcs-1 forbids at the exploration — a domain left open SILENTLY — reappears one layer
down: the exploration accounted honestly, and the account dies at the seam where the work becomes a
change. The charter (program doc, stage rc13c) asks for three things, and the stage touches ONE
capability, `orbit-propose-modifications`, which is why it is a stage and not a fold:

1. The consume-mode mapping gains a MECHANISM ROW with a destination per closure token: a CLOSED
   entry (DERIVED / SOURCED) informs the requirement it derives — the domain table is the requirement's
   scenario set, or points at what is; a BOUNDED entry's two residual slots land in the owning spec
   delta's requirement text, with the design's Risks POINTING at that row. The structure check reads
   SIX sections, the Mechanism section's absence warning like any other — and the count is stated by
   POINTER to the conventions' format requirement, never as a restated number (R-crc-14; the five-vs-six
   drift is exactly what a restated number produced).
2. The concluded-name seam: propose against a concluded staging directory does NOT scaffold silently.
   The exploration chooses between REFUSE (name the conclusion and its `Re-entry:` trigger, stop) and
   TREAT-AS-REOPEN (on the user's word, run the reopen edit — header back, dated entry, prior CONCLUDED
   entry superseded, a boundary emit — then continue). Whichever it is must agree with D-bcs-7's third
   row and `orbit-explore-modifications`' re-entry requirement, which it POINTS at rather than restates.
3. Propose consumes FORM, as rc13b renders form. Whether an enumeration is TRUE stays the reviewer's
   (R-crc-10). The open question this raises is HOW propose reads the form: from the file by prose
   instruction (today's shape), or from an engine surface that already computes it — the explore emit's
   `residuals` array exists, but nothing PRINTS it for a body to read at propose time (the Q-crc-24
   shape: engine-computed, no consumer surface, so bodies reconstruct by hand).

Exit criteria, from the charter: (1) the mapping names a Mechanism row with a destination per closure
token, and the validation scenario's section count matches the conventions' format requirement by
pointer; (2) a BOUNDED exemplar consumed at propose lands its two residual slots in a spec delta and its
pointer in design Risks — measured on THIS stage's own proposal, so this exploration must carry at
least one BOUNDED entry; (3) `/orbit:propose <name>` against a concluded staging directory does not
scaffold a change silently: the body's step is grep-tested for the refuse-or-reopen branch, and the
re-entry requirement is pointed at, not restated.

Things to settle here: the destination per closure token, concretely enough to be a decision table
(what does "informs the requirement it derives" mean when a CLOSED domain's members are not one
requirement's scenarios?); what happens to an entry whose Decisions owner is `Kind: fact` or
`Disposition: superseded` (history, not carried — but where is that stated?); refuse versus reopen at
the concluded seam, and whether "on the user's word" can be given inside propose at all under the
no-chaining contract; how the body reads the form (file parse by instruction versus an engine print);
what the Step 0a warning says when the Mechanism section is absent on a pre-rc13a file that is otherwise
ready (a format note, per the conventions' "read, not rejected" scenario — but Step 0a's warning
prompts proceed-anyway, and the two must agree); and the size — one capability, but the requirement
count inside it and the body edits are what R-crc-1 measures.

## Mechanism

### D-rc13c-1 — propose REFUSES a concluded staging directory; it neither reopens nor offers to
Domain: the ways `/orbit:propose` can meet a concluded record (the propose body's Step 0 inputs)
| member | covered by |
|---|---|
| `/orbit:propose <name>`, staging dir present, header token `concluded` | halt IN STEP 0's resolve-mode sub-step: "this exploration concluded on <date>"; nothing written, nothing moved, no prompt — and no branch cut, because the PR layer's phase 1 (select + switch) runs AFTER Step 0 and a refused promotion must never reach it |
| `/orbit:propose` with no name — naming inference over `orbit/explore/*/` | concluded directories are NOT candidates; "exactly one" counts live directories only |
| staging dir concluded AND `orbit/changes/<name>/` exists | the existing conflict halt fires first (both dirs is refused before any header is read); unchanged |
| `orbit/changes/<name>/explore.md` with a concluded header (promoted before this stage) | not a propose input — consume mode reads the STAGING file only; explore's re-entry table owns that row |
| staging dir with no `explore.md`, or a header that is neither token | not concluded (the conventions' status-header production); consume mode proceeds as today |
Closure: SOURCED — the propose body's Mode detection step (Step 0, three sub-steps) is the closed list of places propose looks before it reads a file
Moves:
- READ: applied — Step 0 checks `explore.md` presence only, and the PR section's Position paragraph places phase 1 between Step 0 and Step 0a, which is why the refuse is a Step 0 outcome and not a Step 0a one; `orbit-conventions`' concluded-outcome requirement names this seam as "the propose-consumption follow-on's to specify"; the reopen scenario is owned there and executed by the explore body
- ENUMERATE: applied — this table; the naming-inference member was found only by asking where else propose reads `orbit/explore/`
- COHERE: applied — refuse agrees with D-bcs-7's third row (state the conclusion; nothing else) and keeps ONE executor of the reopen edit (explore), so R-crc-14 holds
- EXECUTE: not applied — no concluded staging directory exists on disk today; exit (3)'s grep test is the executed form
- FALSIFY: applied — a propose that reopened on its own word would make a "build nothing" record reversible by the one command the conclusion guards against; Sal ruled no avenue is needed
- CONFORM: applied — no-chaining (propose invokes no explore act), the arc's rules of engagement (nothing written on inferred intent), R-crc-14 (the re-entry requirement is pointed at, not restated)
- FEASIBILITY: not applied — one first-line read and one branch
- CONSUME: applied — the halt message is prose the user reads; `explore.md persists as historical record` is honoured because nothing is touched
- INVOKE: applied — fires on every consume-mode entry and every naming-inference scan

### D-rc13c-2 — propose reads the Mechanism section from the FILE, and checks its reading against one final explore emit
Domain: what propose consumes from a live exploration's Mechanism section, and where each datum comes from
| member | covered by |
|---|---|
| the entry set (which live rules have entries) | the file — the `### D-…` headings under `## Mechanism`, read as Decisions are read |
| each entry's `Closure:` token | the file — the token selects the mapping row (D-rc13c-3) |
| a BOUNDED entry's `Residual kind:` / `Residual method:` | the file, VERBATIM — the two lines travel as written, never paraphrased |
| the live rules whose domain is open, and key defects | the engine — `rules_open` / `key_defects` on the explore emit propose fires at consume time (`orbit emit explore --change <name>`), computed from the file as it stands |
| the residual list the engine counted | the engine — the same emit's `residuals`; the AI's file reading is checked against it, and a disagreement is reported before generation, never silently resolved |
| the header token | the file's first non-blank line (D-rc13c-1) |
Closure: SOURCED — the parser's output shape (`ExploreRules` in `src/core/parsers/explore-rules.ts`: `rules_total`, `rules_open`, `key_defects`, `residuals`, `status`, `notes`) is the closed set of engine-computed facts; everything else is file text
Moves:
- READ: applied — `orbit status --change <staging-name>` refuses a staging name (measured 2026-09-26), so the emit surface is the ONLY engine computation reachable at propose time; the propose body already reads `explore.md` whole
- ENUMERATE: applied — this table, one row per parser field plus the two file reads
- COHERE: applied — the consume-time emit is a READ of the file, not an explore boundary: "no emit without sweep" guards conversation content, and at propose there is no explore conversation to sweep; its `final_assessment` says it was fired by propose
- EXECUTE: not applied — exit (2) executes it on this stage's own proposal
- FALSIFY: applied — two readers of one grammar (engine parser, AI eyes) can disagree on a malformed entry; the emit check turns that disagreement into a report instead of a silent carry or drop
- CONFORM: applied — R-crc-10 (the check keys on engine-observable form; truth stays the reviewer's), R-crc-1 (one capability — no new engine surface), Q-crc-24 named as the home of the print this declines
- FEASIBILITY: not applied — one emit and one comparison
- CONSUME: applied — the emit lands on the staging trail, which Step 0d moves with the directory, so the last engine record before promotion travels with the change
- INVOKE: applied — fires in consume mode, after Step 0a's structure check and before generation

### D-rc13c-4 — the Mechanism row is a decision table over (closure token × owner state)
Domain: the cells of (the entry's `Closure:` token, or no usable entry) × (the owning Decisions entry's live-rule status)
| member | covered by |
|---|---|
| DERIVED or SOURCED · live rule | the spec delta requirement the rule derives: the domain table lands as one of the CLOSED shapes (D-rc13c-5) and the `Closure:` justification as the sentence naming the source; the design's `Mechanism → artifacts` record names the requirement |
| BOUNDED · live rule | `Residual kind:` and `Residual method:` VERBATIM in that requirement's text as a named limit (the OWNER); one `design.md` Risks entry naming the rule ID and POINTING at the requirement; the record names both |
| any token · owner `Kind: fact` or `Kind: scope`, or `Disposition: superseded` / `assigned` | not carried — permitted history; `explore.md` travels unchanged, so nothing is lost |
| no usable entry (`absent`, `open`, `bounded-incomplete`, `no-closure`, `malformed-entry`) · live rule | one `design.md` Risks entry naming the ID as an UNACCOUNTED domain, with the engine's state word; the spec delta carries nothing for it; never blocking (D-bcs-3) |
| an orphan or duplicate entry (`key_defects`) | reported in chat at Step 0a beside the structure warnings; not a carrier row — a key with no owner has nowhere to land |
Closure: DERIVED — `CLOSURE_TOKENS` is three, the open states are the parser's five, the owner status is two-valued by the entry-identity requirement (live rule, or not), and key defects are the parser's third array; every cell is a row
Moves:
- READ: applied — D-bcs-3's carrier table (spec owns, design points, proposal and tasks are not carriers); `OpenRuleState` and `KeyDefect` in `explore-rules.ts`; the entry-identity requirement's live-rule predicate
- ENUMERATE: applied — this table; the first sketch (2026-09-25, chat) had three rows and no key-defect row
- COHERE: applied — the "no usable entry" row is the same row a Step 0b resolve-now answer that is a rule lands in (D-rc13c-7), so propose never authors a Mechanism entry
- EXECUTE: not applied — exit (2) executes the BOUNDED row on this stage's own proposal (D-rc13c-5 is the exemplar)
- FALSIFY: applied — a mapping with only a BOUNDED row would carry residuals and lose the CLOSED account, which is the larger half of every exploration on record
- CONFORM: applied — R-crc-7 (a decision table), R-crc-10 (the record is authored; only the BOUNDED verbatim check is mechanical), R-crc-14 (the residual is stated once, in the spec; design points)
- FEASIBILITY: not applied — one table row per Mechanism entry in the design record
- CONSUME: applied — the archive syncs the spec text, so the OWNER survives; design is never synced, which is why it only points
- INVOKE: applied — fires in consume mode for every entry under `## Mechanism`

### D-rc13c-5 — a CLOSED domain lands as one of the shapes a requirement can carry
Domain: the shapes a CLOSED entry's domain table has taken in a spec delta, on the record
| member | covered by |
|---|---|
| a normative TABLE in the requirement text | D-bcs-7's nine-cell table IS `orbit-explore-modifications`' re-entry table |
| a GRAMMAR or production block | D-bcs-8's parser-key table became the Mechanism-grammar requirement's fenced productions |
| a SCENARIO SET — one `#### Scenario` per member | rc13b's rung grid became `orbit-run-summary-emit`'s maturity scenarios, one per cell |
| a SENTENCE naming the source | D-bcs-6's reader set became the concluded-outcome requirement's "keys on location" sentence — the members named in prose, the authority (a grep over `src/core`) cited |
Closure: BOUNDED — two archived explorations carry Mechanism sections and their spec deltas are the whole evidence; a fifth shape may exist and nothing derives the set
Residual kind: a destination shape for a CLOSED domain table that none of the four names
Residual method: classify the spec deltas of the next archived change that consumed a Mechanism section (this stage's own is the first through the mapping) against the four; a delta whose domain landed in none is a fifth row and a revision of this table
Moves:
- READ: applied — the four members were read from the two archives' `explore.md` and the baseline requirements their synced deltas produced (`orbit-explore-modifications`' re-entry table, `orbit-conventions`' grammar fences and concluded-outcome text, `orbit-run-summary-emit`'s maturity scenarios), not remembered
- ENUMERATE: applied — this table, with its residual declared rather than "there may be others"
- COHERE: applied — the four are shapes, not places: every one lives in the requirement text, which is where D-rc13c-4's CLOSED row already sends the entry
- EXECUTE: not applied — no proposal has yet run the mapping; this stage's is the first
- FALSIFY: applied — a mapping that named ONE shape ("the table becomes scenarios") would have misfiled three of the four entries on record
- CONFORM: applied — R-crc-7 (specify as decision tables — the shape choice is the author's, the record of it is the table), R-crc-10 (which shape is right is judgment; the record says which was chosen)
- FEASIBILITY: not applied — one word per entry in the design record
- CONSUME: applied — the design's `Mechanism → artifacts` record names the shape per CLOSED entry, so a reviewer can check the delta against the domain without re-deriving where to look
- INVOKE: applied — fires per CLOSED entry at generation

### D-rc13c-6 — the structure check reads the sections the conventions' format requirement lists, by pointer, and Mechanism is one of them
Domain: the outcomes of Step 0a's structure check
| member | covered by |
|---|---|
| every listed section present | proceed |
| one or more listed sections absent — Mechanism included | warn naming them; AskUserQuestion proceed-anyway (default proceed); an absent Mechanism section additionally means every live rule is UNACCOUNTED (D-rc13c-4's fourth row) and the design record says so |
| the file cannot be read or parsed | halt; user fixes and re-invokes (unchanged) |
| the header token | read in Step 0, not here (D-rc13c-1) |
Closure: SOURCED — the existing `Validate explore.md structure before consuming` requirement's three scenarios plus the one input Step 0 took from it
Moves:
- READ: applied — the scenario says "all five expected sections" and names them; `orbit-conventions`' format requirement has been six since rc13a and its retained title still says five; rc13a's design lists `propose.ts:154/156` as the exemption this stage closes
- ENUMERATE: applied — this table
- COHERE: applied — "read, not rejected" (the conventions' pre-rc13a scenario) and "warn, proceed by default" (Step 0a) are one behaviour: a missing Mechanism section is a format note that proceeds, and its consequence is a Risks entry, never a block
- EXECUTE: not applied — exit (1) measures the pointer; the grep test is the executed form
- FALSIFY: applied — a restated number is what drifted; the spec scenario names the OWNER and the body carries a checked mirror of the list (D-rc13c-3), so the next section added to the format breaks a test instead of a promotion
- CONFORM: applied — R-crc-14 and its mirror corollary (the body cannot resolve the owning spec at runtime for an adopter)
- FEASIBILITY: not applied — six heading greps
- CONSUME: applied — the warning's proceed-anyway path feeds generation unchanged; the record names the absence
- INVOKE: applied — fires on every consume-mode entry

### D-rc13c-7 — a Step 0b resolve-now writes a conforming Decisions entry, and a rule answer is an open domain, not a Mechanism entry authored at propose
Domain: what Step 0b writes into `explore.md` per resolution path
| member | covered by |
|---|---|
| resolve now | a Decisions entry in the entry-identity requirement's form — dated ID opener, `Kind:` per the answer's normative force, `Disposition: live` — appended to Decisions; the open question moves out (change completeness) |
| resolve now, and the answer is a rule | no Mechanism entry is authored at propose; the rule lands in D-rc13c-4's "no usable entry" row (state `absent`) and the design's Risks names it — the user is told this at the prompt |
| defer | `@review:` marker in the artifacts; the question tagged deferred in `explore.md` (unchanged) |
| abandon | moved to Considered & out with rationale (unchanged) |
Closure: SOURCED — the `Open question handling` requirement's three resolution paths, with the rule case split out of the first
Moves:
- READ: applied — Step 0b today says "appended to the Decisions section" with no format; rc13a's entry-identity requirement owns the opener and `Kind:` defaults to rule
- ENUMERATE: applied — this table
- COHERE: applied — a rule answered at propose owes a Mechanism entry under rc13a; propose does not author nine-move entries (that is explore's sitting), so the honest outcome is the visible open domain D-rc13c-4 already carries
- EXECUTE: not applied — no proposal has run Step 0b under the convention
- FALSIFY: applied — an entry appended without the opener has no ID, parses as `open` (line-only), and the consume-time emit (D-rc13c-2) would report an open rule nobody can name
- CONFORM: applied — R-crc-14 (the form is pointed at, never restated in the body beyond the mirror the explore body already carries), the entry-identity requirement's "opting out is written"
- FEASIBILITY: not applied — one opener line and two slot lines
- CONSUME: applied — the appended entry is what the consume-time emit counts; `explore.md persists as historical record` is unchanged because Step 0b already writes to the file before the move
- INVOKE: applied — fires per open question resolved now

## Decisions

- **2026-09-26 — D-rc13c-1: propose REFUSES a concluded staging directory; it neither reopens nor offers to** (Sal, in chat: "we need no avenue to reopen it, it is done"). When the staging `explore.md`'s header token is `concluded`, `/orbit:propose <name>` halts stating the conclusion date and stops — no prompt, nothing written, nothing moved; naming inference never proposes a concluded directory. The reopen path stays where rc13a put it (the conventions' reopen scenario, executed by the explore body) and propose does not mention it; removing that path outright would be a separate change against `orbit-conventions`, outside this stage. Options B (offer the reopen inside propose) and C (treat the invocation as the reopen) go to Considered & out.
  Kind: rule
  Disposition: live

- **2026-09-26 — D-rc13c-2: propose reads the Mechanism section from the file, checked against one final explore emit** (Sal: "go with that"). No new engine surface: the proposing AI reads entries, tokens and residual slots off `explore.md` as it reads Decisions, and fires `orbit emit explore --change <name>` at consume time so the engine's `rules_open` / `key_defects` / `residuals` stand beside its reading; a disagreement is reported before generation. The engine print (a staging-aware `orbit status --change --json` carrying the parsed form) is Q-crc-24's shape and stays there.
  Kind: rule
  Disposition: live

- **2026-09-26 — D-rc13c-3: one capability — the propose body's section list is a checked mirror held by a parity test, not a shared constant** (Sal: "a"). The spec scenario points at `orbit-conventions`' format requirement; the body carries the six names marked as a mirror of it, and a test holds the list byte-equal to the requirement's stated order. The shared-constant shape (rc13b's one-grammar handoff) would pull the explore body and `orbit-explore-modifications` into scope; declined for this stage.
  Kind: scope
  Disposition: live

- **2026-09-26 — D-rc13c-4: the Mechanism row is a decision table over (closure token × owner state).** CLOSED entries land in the requirement they derive (shape per D-rc13c-5, the justification as the sourcing sentence); BOUNDED entries land their two residual slots verbatim in the requirement text with a design Risks pointer; non-live owners are history and are not carried; a live rule with no usable entry lands in Risks as UNACCOUNTED with the engine's state word; key defects are reported and carry nowhere. The design carries a `Mechanism → artifacts` record naming, per entry, its token and destination. Settled under R-crc-3.
  Kind: rule
  Disposition: live

- **2026-09-26 — D-rc13c-5: a CLOSED domain lands as one of four shapes — a normative table, a grammar block, a scenario set, or a sentence naming the source — and the set is BOUNDED.** Read from the only two archives that carry Mechanism sections. This is the stage's own BOUNDED exemplar: exit (2) is measured by its two residual slots landing in `orbit-propose-modifications`' mapping requirement text with the design's Risks pointing there. Settled under R-crc-3.
  Kind: rule
  Disposition: live

- **2026-09-26 — D-rc13c-6: Step 0a checks the sections the conventions' format requirement lists, by pointer; an absent Mechanism section warns like any other and makes every live rule UNACCOUNTED in the record.** The "five sections" scenario and body line are the drift this stage closes (rc13a's declared exemption). Settled under R-crc-3.
  Kind: rule
  Disposition: live

- **2026-09-26 — D-rc13c-7: a Step 0b resolve-now writes a conforming Decisions entry (ID opener, `Kind:`, `Disposition:`), and a rule answer is an open domain in the record, never a Mechanism entry authored at propose.** Settled under R-crc-3.
  Kind: rule
  Disposition: live

- **2026-09-26 — D-rc13c-8: the consume-time explore emit is told apart by prose, not by a field** (resolved at propose, Step 0b; Sal took the standing recommendation). Its `final_assessment` opens with "Fired by /orbit:propose at consume time"; no payload field is added, because no engine reader distinguishes emits by origin and the record's position on the moved trail (the last explore emit before the propose emit) is enough for a human. Resolved from Q-rc13c-1. Per D-rc13c-7 this rule gets NO Mechanism entry authored at propose: it stands as a visible open domain in the design record.
  Kind: rule
  Disposition: live

## Open questions

## Considered & out

- **2026-09-26 — offering the reopen inside propose (AskUserQuestion: reopen and continue / stop).** Makes propose a second executor of the reopen edit and writes the reopen's "why" from a prompt instead of an explore session. Declined with D-rc13c-1.
- **2026-09-26 — treating the propose invocation as the reopen word.** The charter allowed it; declined because it makes a "build nothing" record reversible by the command the conclusion guards against, and Sal wants no avenue at all.

- **2026-09-26 — a new engine print of the parsed form for propose to read.** The right long-term shape (Q-crc-24: engine computes, body reads) but a second capability and engine code in a stage chartered at one; the consume-time explore emit gives the engine's reading through an existing surface. Deferred to Q-crc-24's owner.

- **2026-09-26 — a shared section-list constant interpolated into both bodies.** rc13b's one-grammar pattern, correct in the long run; declined here because it pulls `orbit-explore-modifications` into a stage chartered at one capability (D-rc13c-3).

## References

- `orbit/architecture/clean-up-review-cycle.md` — stage rc13c's charter (declared 2026-09-25), the
  proposal text kept under rc13a's stage section, Q-crc-11 (rc15's input) and Q-crc-24 (the
  engine-computes / body-reads hole, the shape question 3 above inherits).
- `orbit/specs/orbit-propose-modifications/spec.md` — `Consume mode when staging directory exists`,
  `Section-to-artifact mapping`, `Validate explore.md structure before consuming` (the "five sections"
  scenario), `Move staging directory to changes` (the metadata MERGE), `Naming inference fallback`.
- `src/core/templates/workflows/propose.ts` — Mode detection (Step 0), Step 0a validate, Step 0b open
  questions, Step 0c mapping table, Step 0c.5 Touchpoints, Step 0d move; Graceful degradation.
- `orbit/specs/orbit-conventions/spec.md` — `explore.md five-section format` (the SIX-section owner and
  the pointer target), `Mechanism entry grammar and accounted closure`, `Decision entry identity and
  classification`, `Concluded exploration outcome` (its KNOWN paragraph names this stage's seam).
- `orbit/specs/orbit-explore-modifications/spec.md` — `Re-entry resolution and the conclude verb` (the
  four-fact table this stage must agree with and point at), `Nine moves applied per rule`.
- `orbit/changes/archive/2026-09-25-bounded-closure-semantics/explore.md` — D-bcs-3 (the carriers),
  D-bcs-6 (concluded stays in place), D-bcs-7 (re-entry), D-bcs-8 (grammar), D-bcs-12 (BOUNDED exemplar).
- `orbit/changes/archive/2026-09-25-bounded-closure-semantics/design.md` — Risks: "Propose does not
  consume Mechanism content"; the `propose.ts:154/156` exemption in the five-section residue sweep.
- `orbit/changes/archive/2026-09-25-rc13b-explore-maturity-signal/design.md` — Risks: the handoffs
  (stale "until rc13b lands" clauses deferred to a retirement-class sweep; `concluded` vocabulary shared
  with rc15).
- `src/core/parsers/explore-rules.ts` — `parseExploreRules` / `parseExploreRulesFile`; the `Residual`
  `{id, kind, method}` and `ExploreStatus` `{token, date, re_entry}` shapes.
- `src/core/explore-grammar.ts` — the one grammar module (productions, `CLOSURE_TOKENS`, `MOVE_NAMES`).
- `src/core/emit-composition.ts` — the rc13b form-parse extension on the explore emit (`rules_open`,
  `residuals`, `status`).
- `test/core/templates/orbit-content-fidelity.test.ts`, `test/core/templates/orbit-generated-surface.test.ts`
  — the pins on the propose body (marker set, the shared PR choreography reference).
